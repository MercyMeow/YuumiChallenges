import { convexTest } from 'convex-test';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { api, internal } from './_generated/api';
import schema from './schema';
import { modules } from './test.setup';

const ADMIN_PASSWORD = 'correct-horse';
const ADMIN_LOGIN_BRIDGE_SECRET = 'test-admin-login-bridge-secret';
const LOGIN_SOURCE_A = 'a'.repeat(64);
const LOGIN_SOURCE_B = 'b'.repeat(64);
const previousAdminLoginBridgeSecret = process.env.ADMIN_LOGIN_BRIDGE_SECRET;

beforeAll(() => {
  process.env.ADMIN_LOGIN_BRIDGE_SECRET = ADMIN_LOGIN_BRIDGE_SECRET;
});

afterAll(() => {
  if (previousAdminLoginBridgeSecret === undefined) {
    delete process.env.ADMIN_LOGIN_BRIDGE_SECRET;
  } else {
    process.env.ADMIN_LOGIN_BRIDGE_SECRET = previousAdminLoginBridgeSecret;
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

async function bootstrapAdmin(t: ReturnType<typeof convexTest>) {
  return await t.mutation(internal.auth.createAdminUser, {
    username: 'admin',
    password: ADMIN_PASSWORD,
  });
}

async function requestLogin(
  t: ReturnType<typeof convexTest>,
  {
    username = 'admin',
    password = ADMIN_PASSWORD,
    sourceId = LOGIN_SOURCE_A,
    secret = ADMIN_LOGIN_BRIDGE_SECRET,
  }: {
    username?: string;
    password?: string;
    sourceId?: string;
    secret?: string;
  } = {}
) {
  return await t.mutation(api.auth.login, {
    secret,
    sourceId,
    username,
    password,
  });
}

async function loginAdmin(
  t: ReturnType<typeof convexTest>,
  sourceId = LOGIN_SOURCE_A
) {
  const login = await requestLogin(t, { sourceId });
  if (!login.ok) {
    throw new Error('Expected admin login to succeed');
  }
  return login;
}

function legacySimpleHash(value: string): string {
  let hash = 0;
  for (const character of value) {
    hash = (hash << 5) - hash + character.charCodeAt(0);
    hash &= hash;
  }
  const salted = `yuumi_${hash}_guide`;
  let finalHash = 0;
  for (const character of salted) {
    finalHash = (finalHash << 5) - finalHash + character.charCodeAt(0);
    finalHash &= finalHash;
  }
  return Math.abs(finalHash).toString(16);
}

describe('admin authentication', () => {
  it('allows one internal bootstrap and rejects a second admin', async () => {
    const t = convexTest(schema, modules);
    await expect(bootstrapAdmin(t)).resolves.toMatchObject({
      message: 'Admin user created successfully',
    });
    await expect(
      t.mutation(internal.auth.createAdminUser, {
        username: 'second-admin',
        password: 'another-password',
      })
    ).rejects.toThrow('Admin user already exists');
  });

  it('rejects login calls that do not carry the server bridge secret', async () => {
    const t = convexTest(schema, modules);
    await bootstrapAdmin(t);

    await expect(
      requestLogin(t, { secret: 'wrong-bridge-secret' })
    ).rejects.toThrow('Unauthorized bridge call');
    await expect(
      requestLogin(t, { sourceId: 'not-a-source-hmac' })
    ).rejects.toThrow('Unauthorized bridge call');

    const attempts = await t.run(
      async (ctx) => await ctx.db.query('adminLoginAttempts').collect()
    );
    expect(attempts).toHaveLength(0);
  });

  it('blocks repeated failures by source without locking the account', async () => {
    const t = convexTest(schema, modules);
    const { userId } = await bootstrapAdmin(t);

    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(
        requestLogin(t, {
          password: 'wrong-password',
        })
      ).resolves.toEqual({ ok: false });
    }

    const state = await t.run(async (ctx) => {
      const user = await ctx.db.get(userId);
      const attempts = await ctx.db.query('adminLoginAttempts').collect();
      return { user, attempts };
    });
    expect(state.user?.failedLoginAttempts).toBeUndefined();
    expect(state.user?.lockoutUntil).toBeUndefined();
    expect(state.attempts).toHaveLength(1);
    expect(state.attempts[0]).toMatchObject({
      attemptKey: `${LOGIN_SOURCE_A}:admin`,
      failedAttempts: 5,
    });
    expect(state.attempts[0]?.blockedUntil).toBeGreaterThan(Date.now());

    await expect(requestLogin(t)).resolves.toEqual({ ok: false });
    await expect(loginAdmin(t, LOGIN_SOURCE_B)).resolves.toMatchObject({
      ok: true,
    });
  });

  it('restarts a source counter after its failure window expires', async () => {
    const t = convexTest(schema, modules);
    await bootstrapAdmin(t);
    const expiredFailureWindow = Date.now() - 16 * 60 * 1_000;

    for (let attempt = 0; attempt < 4; attempt++) {
      await requestLogin(t, { password: 'wrong-password' });
    }
    await t.run(async (ctx) => {
      const loginAttempt = await ctx.db
        .query('adminLoginAttempts')
        .withIndex('by_attemptKey', (q) =>
          q.eq('attemptKey', `${LOGIN_SOURCE_A}:admin`)
        )
        .unique();
      if (!loginAttempt) throw new Error('Expected a login-attempt record');
      await ctx.db.patch(loginAttempt._id, {
        windowStartedAt: expiredFailureWindow,
      });
    });

    await expect(
      requestLogin(t, {
        password: 'wrong-password',
      })
    ).resolves.toEqual({ ok: false });

    const loginAttempt = await t.run(async (ctx) => {
      return await ctx.db
        .query('adminLoginAttempts')
        .withIndex('by_attemptKey', (q) =>
          q.eq('attemptKey', `${LOGIN_SOURCE_A}:admin`)
        )
        .unique();
    });
    expect(loginAttempt?.failedAttempts).toBe(1);
    expect(loginAttempt?.windowStartedAt).toBeGreaterThan(expiredFailureWindow);
    expect(loginAttempt?.blockedUntil).toBeUndefined();
  });

  it('allows a valid login after a source block expires and clears it', async () => {
    const t = convexTest(schema, modules);
    const { userId } = await bootstrapAdmin(t);

    for (let attempt = 0; attempt < 5; attempt++) {
      await requestLogin(t, { password: 'wrong-password' });
    }
    await t.run(async (ctx) => {
      const loginAttempt = await ctx.db
        .query('adminLoginAttempts')
        .withIndex('by_attemptKey', (q) =>
          q.eq('attemptKey', `${LOGIN_SOURCE_A}:admin`)
        )
        .unique();
      if (!loginAttempt) throw new Error('Expected a login-attempt record');
      await ctx.db.patch(loginAttempt._id, {
        windowStartedAt: Date.now() - 16 * 60 * 1_000,
        blockedUntil: Date.now() - 1,
      });
    });

    await expect(loginAdmin(t)).resolves.toMatchObject({ ok: true });

    const state = await t.run(async (ctx) => {
      const user = await ctx.db.get(userId);
      const attempts = await ctx.db.query('adminLoginAttempts').collect();
      return { user, attempts };
    });
    expect(state.user?.failedLoginAttempts).toBeUndefined();
    expect(state.user?.lastFailedLoginAt).toBeUndefined();
    expect(state.user?.lockoutUntil).toBeUndefined();
    expect(state.user?.lastLogin).toBeTypeOf('number');
    expect(state.attempts).toHaveLength(0);
  });

  it('migrates a valid legacy password hash after login', async () => {
    const t = convexTest(schema, modules);
    const userId = await t.run(async (ctx) => {
      return await ctx.db.insert('users', {
        username: 'legacy-admin',
        passwordHash: legacySimpleHash(ADMIN_PASSWORD),
        role: 'admin',
        createdAt: Date.now(),
      });
    });

    const login = await requestLogin(t, {
      username: 'legacy-admin',
      password: ADMIN_PASSWORD,
    });
    expect(login.ok).toBe(true);

    const migrated = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(migrated?.passwordHash).toMatch(
      /^pbkdf2_sha256\$310000\$[0-9a-f]{32}\$[0-9a-f]{64}$/
    );
  });

  it('burns a PBKDF2 derivation for an invalid legacy password', async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert('users', {
        username: 'legacy-admin',
        passwordHash: legacySimpleHash(ADMIN_PASSWORD),
        role: 'admin',
        createdAt: Date.now(),
      });
    });
    const deriveBits = vi.spyOn(crypto.subtle, 'deriveBits');

    await expect(
      requestLogin(t, {
        username: 'legacy-admin',
        password: 'wrong-password',
      })
    ).resolves.toEqual({ ok: false });

    expect(deriveBits).toHaveBeenCalledTimes(1);
  });

  it('revokes sibling sessions after a password change', async () => {
    const t = convexTest(schema, modules);
    await bootstrapAdmin(t);
    const first = await loginAdmin(t);
    const second = await loginAdmin(t);

    await t.mutation(api.auth.changePassword, {
      sessionToken: first.token,
      currentPassword: ADMIN_PASSWORD,
      newPassword: 'new-correct-password',
    });

    await expect(
      t.query(api.auth.verifySession, { sessionToken: first.token })
    ).resolves.toMatchObject({ user: { username: 'admin' } });
    await expect(
      t.query(api.auth.verifySession, { sessionToken: second.token })
    ).resolves.toBeNull();
    await expect(
      requestLogin(t, {
        password: ADMIN_PASSWORD,
      })
    ).resolves.toEqual({ ok: false });
    await expect(
      requestLogin(t, {
        password: 'new-correct-password',
      })
    ).resolves.toMatchObject({ ok: true });
  });
});

describe('guide authorization and validation', () => {
  it('hides inactive content publicly and exposes it only to an editor session', async () => {
    const t = convexTest(schema, modules);
    await bootstrapAdmin(t);
    const login = await loginAdmin(t);

    await t.run(async (ctx) => {
      for (const [name, isActive] of [
        ['Published', true],
        ['Draft', false],
      ] as const) {
        await ctx.db.insert('guideItems', {
          name,
          itemId: isActive ? 1001 : 1002,
          category: 'starter',
          reason: `${name} reason`,
          priority: isActive ? 1 : 2,
          isActive,
          updatedAt: Date.now(),
        });
      }
    });

    const publicItems = await t.query(api.guide.getItems, {});
    expect(publicItems.map((item) => item.name)).toEqual(['Published']);

    await expect(
      t.query(api.guide.getAllItems, { sessionToken: 'invalid' })
    ).rejects.toThrow('Unauthorized');

    const adminItems = await t.query(api.guide.getAllItems, {
      sessionToken: login.token,
    });
    expect(adminItems.map((item) => item.name)).toEqual(['Published', 'Draft']);
  });

  it('rejects malformed fixed-size rune pages server-side', async () => {
    const t = convexTest(schema, modules);
    await bootstrapAdmin(t);
    const login = await loginAdmin(t);

    await expect(
      t.mutation(api.guide.upsertBuild, {
        sessionToken: login.token,
        name: 'Invalid build',
        description: 'Should not persist',
        icon: 'star',
        color: 'bg-purple-500',
        borderColor: 'border-purple-500',
        isRecommended: false,
        isActive: true,
        priority: 1,
        runes: {
          name: 'Aery',
          primaryTree: 'Sorcery',
          keystone: 'Summon Aery',
          primary: ['Manaflow Band'],
          secondaryTree: 'Resolve',
          secondary: ['Font of Life', 'Revitalize'],
          shards: ['Ability Haste', 'Adaptive Force', 'Health'],
        },
        items: {
          starter: [],
          core: [],
          situational: [],
        },
        skillOrder: {
          priority: 'E > Q > W',
          levels: [],
          notes: '',
        },
      })
    ).rejects.toThrow('Primary runes must include exactly 3 values');
  });
});
