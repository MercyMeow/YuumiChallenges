import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import { api, internal } from './_generated/api';
import schema from './schema';
import { modules } from './test.setup';

const ADMIN_PASSWORD = 'correct-horse';

async function bootstrapAdmin(t: ReturnType<typeof convexTest>) {
  return await t.mutation(internal.auth.createAdminUser, {
    username: 'admin',
    password: ADMIN_PASSWORD,
  });
}

async function loginAdmin(t: ReturnType<typeof convexTest>) {
  const login = await t.mutation(api.auth.login, {
    username: 'admin',
    password: ADMIN_PASSWORD,
  });
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

  it('commits failed-attempt counters and keeps locked login errors generic', async () => {
    const t = convexTest(schema, modules);
    const { userId } = await bootstrapAdmin(t);

    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(
        t.mutation(api.auth.login, {
          username: 'admin',
          password: 'wrong-password',
        })
      ).resolves.toEqual({ ok: false });
    }

    const lockedUser = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(lockedUser?.failedLoginAttempts).toBe(5);
    expect(lockedUser?.lockoutUntil).toBeGreaterThan(Date.now());

    await expect(
      t.mutation(api.auth.login, {
        username: 'admin',
        password: ADMIN_PASSWORD,
      })
    ).resolves.toEqual({ ok: false });
    await expect(
      t.mutation(api.auth.login, {
        username: 'missing-user',
        password: ADMIN_PASSWORD,
      })
    ).resolves.toEqual({ ok: false });

    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        failedLoginAttempts: undefined,
        lastFailedLoginAt: undefined,
        lockoutUntil: undefined,
      });
    });
    await expect(loginAdmin(t)).resolves.toMatchObject({ ok: true });
  });

  it('restarts the failed-attempt counter after the failure window expires', async () => {
    const t = convexTest(schema, modules);
    const { userId } = await bootstrapAdmin(t);
    const expiredFailureWindow = Date.now() - 16 * 60 * 1_000;

    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        failedLoginAttempts: 4,
        lastFailedLoginAt: expiredFailureWindow,
        lockoutUntil: undefined,
      });
    });

    await expect(
      t.mutation(api.auth.login, {
        username: 'admin',
        password: 'wrong-password',
      })
    ).resolves.toEqual({ ok: false });

    const user = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(user?.failedLoginAttempts).toBe(1);
    expect(user?.lastFailedLoginAt).toBeGreaterThan(expiredFailureWindow);
    expect(user?.lockoutUntil).toBeUndefined();
  });

  it('allows a valid login after lockout expiry and clears failure state', async () => {
    const t = convexTest(schema, modules);
    const { userId } = await bootstrapAdmin(t);

    await t.run(async (ctx) => {
      await ctx.db.patch(userId, {
        failedLoginAttempts: 5,
        lastFailedLoginAt: Date.now() - 1_000,
        lockoutUntil: Date.now() - 1,
      });
    });

    await expect(loginAdmin(t)).resolves.toMatchObject({ ok: true });

    const user = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(user?.failedLoginAttempts).toBeUndefined();
    expect(user?.lastFailedLoginAt).toBeUndefined();
    expect(user?.lockoutUntil).toBeUndefined();
    expect(user?.lastLogin).toBeTypeOf('number');
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

    const login = await t.mutation(api.auth.login, {
      username: 'legacy-admin',
      password: ADMIN_PASSWORD,
    });
    expect(login.ok).toBe(true);

    const migrated = await t.run(async (ctx) => await ctx.db.get(userId));
    expect(migrated?.passwordHash).toMatch(
      /^pbkdf2_sha256\$310000\$[0-9a-f]{32}\$[0-9a-f]{64}$/
    );
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
      t.mutation(api.auth.login, {
        username: 'admin',
        password: ADMIN_PASSWORD,
      })
    ).resolves.toEqual({ ok: false });
    await expect(
      t.mutation(api.auth.login, {
        username: 'admin',
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
        icon: 'Sparkles',
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
