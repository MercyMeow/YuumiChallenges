import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import type { MutationCtx, QueryCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_HASH_VERSION = 'pbkdf2_sha256';
const PBKDF2_ITERATIONS = 310000;
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_KEY_BYTES = 32;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 32;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const DUMMY_PASSWORD_HASH =
  'pbkdf2_sha256$310000$000102030405060708090a0b0c0d0e0f$' +
  '000102030405060708090a0b0c0d0e0f' +
  '101112131415161718191a1b1c1d1e1f';

type AuthUser = Doc<'users'>;
type UserFields = Omit<Doc<'users'>, '_id' | '_creationTime'>;
type UserPatch = Omit<
  Partial<UserFields>,
  'failedLoginAttempts' | 'lastFailedLoginAt' | 'lockoutUntil'
> & {
  failedLoginAttempts?: number | undefined;
  lastFailedLoginAt?: number | undefined;
  lockoutUntil?: number | undefined;
};
type DatabaseReaderContext = Pick<QueryCtx, 'db'>;

type ParsedPasswordHash = {
  iterations: number;
  salt: Uint8Array;
  hash: Uint8Array;
};

const textEncoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function normalizeUsername(username: string): string {
  return username.trim();
}

function isUsernameWithinBounds(username: string): boolean {
  return (
    username.length >= USERNAME_MIN_LENGTH &&
    username.length <= USERNAME_MAX_LENGTH &&
    USERNAME_PATTERN.test(username)
  );
}

function validateUsernameForStorage(username: string): string {
  const normalized = normalizeUsername(username);
  if (!isUsernameWithinBounds(normalized)) {
    throw new Error(
      `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters and use only letters, numbers, dots, underscores, or hyphens`
    );
  }
  return normalized;
}

function validateUsernameForLogin(username: string): string | null {
  const normalized = normalizeUsername(username);
  if (!isUsernameWithinBounds(normalized)) {
    return null;
  }
  return normalized;
}

function validatePasswordForStorage(password: string): string {
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    throw new Error(
      `Password must be ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters`
    );
  }
  return password;
}

function validatePasswordForLogin(password: string): string | null {
  if (password.length === 0 || password.length > PASSWORD_MAX_LENGTH) {
    return null;
  }
  return password;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length === 0 || hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const value = Number.parseInt(hex.slice(i, i + 2), 16);
    if (Number.isNaN(value)) return null;
    bytes[i / 2] = value;
  }
  return bytes;
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) {
    diff |= left[i]! ^ right[i]!;
  }
  return diff === 0;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }
  const salted = `yuumi_${hash}_guide`;
  let finalHash = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    finalHash = (finalHash << 5) - finalHash + char;
    finalHash &= finalHash;
  }
  return Math.abs(finalHash).toString(16);
}

function randomHex(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function derivePasswordHash(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const passwordBytes = new Uint8Array(textEncoder.encode(password));
  const saltBytes = new Uint8Array(salt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: saltBytes,
      iterations,
    },
    keyMaterial,
    PBKDF2_KEY_BYTES * 8
  );
  return new Uint8Array(bits);
}

function parsePasswordHash(passwordHash: string): ParsedPasswordHash | null {
  const [version, iterationsText, saltHex, hashHex] = passwordHash.split('$');
  if (
    version !== PASSWORD_HASH_VERSION ||
    !iterationsText ||
    !saltHex ||
    !hashHex
  ) {
    return null;
  }

  const iterations = Number.parseInt(iterationsText, 10);
  const salt = hexToBytes(saltHex);
  const hash = hexToBytes(hashHex);
  if (
    !Number.isFinite(iterations) ||
    iterations < 1 ||
    !salt ||
    salt.length !== PBKDF2_SALT_BYTES ||
    !hash ||
    hash.length !== PBKDF2_KEY_BYTES
  ) {
    return null;
  }

  return { iterations, salt, hash };
}

async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(PBKDF2_SALT_BYTES);
  crypto.getRandomValues(salt);
  const hash = await derivePasswordHash(password, salt, PBKDF2_ITERATIONS);
  return `${PASSWORD_HASH_VERSION}$${PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(hash)}`;
}

async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<{ valid: boolean; needsUpgrade: boolean }> {
  const parsed = parsePasswordHash(passwordHash);
  if (parsed) {
    const derived = await derivePasswordHash(
      password,
      parsed.salt,
      parsed.iterations
    );
    return {
      valid: timingSafeEqual(derived, parsed.hash),
      needsUpgrade: false,
    };
  }

  const legacyHash = textEncoder.encode(simpleHash(password));
  const storedHash = textEncoder.encode(passwordHash);
  const valid = timingSafeEqual(legacyHash, storedHash);
  return { valid, needsUpgrade: valid };
}

async function burnInvalidPasswordAttempt(password: string): Promise<void> {
  await verifyPassword(password, DUMMY_PASSWORD_HASH);
}

async function patchUser(
  ctx: MutationCtx,
  userId: Id<'users'>,
  patch: UserPatch
): Promise<void> {
  await ctx.db.patch(userId, patch);
}

async function cleanupExpiredSessionsForUser(
  ctx: MutationCtx,
  userId: Id<'users'>,
  now: number
): Promise<void> {
  const sessions = await ctx.db
    .query('sessions')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .collect();
  for (const session of sessions) {
    if (session.expiresAt < now) {
      await ctx.db.delete(session._id);
    }
  }
}

async function deleteSessionsForUser(
  ctx: MutationCtx,
  userId: Id<'users'>,
  keepSessionId?: Doc<'sessions'>['_id']
): Promise<void> {
  const sessions = await ctx.db
    .query('sessions')
    .withIndex('by_userId', (q) => q.eq('userId', userId))
    .collect();
  for (const session of sessions) {
    if (session._id !== keepSessionId) {
      await ctx.db.delete(session._id);
    }
  }
}

function buildFailedLoginPatch(user: AuthUser, now: number): UserPatch {
  const withinWindow =
    user.lastFailedLoginAt !== undefined &&
    now - user.lastFailedLoginAt <= FAILED_LOGIN_WINDOW_MS;
  const failedLoginAttempts = withinWindow
    ? (user.failedLoginAttempts ?? 0) + 1
    : 1;

  return {
    failedLoginAttempts,
    lastFailedLoginAt: now,
    lockoutUntil:
      failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS
        ? now + LOGIN_LOCKOUT_MS
        : undefined,
  };
}

async function requireUserSession(
  ctx: DatabaseReaderContext,
  sessionToken: string
): Promise<{ session: Doc<'sessions'>; user: AuthUser }> {
  const session = await ctx.db
    .query('sessions')
    .withIndex('by_token', (q) => q.eq('token', sessionToken))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    throw new Error('Unauthorized');
  }

  const user = await ctx.db.get(session.userId);
  if (!user) {
    throw new Error('Unauthorized');
  }

  return { session, user };
}

async function requireAdminSession(
  ctx: DatabaseReaderContext,
  sessionToken: string
): Promise<AuthUser> {
  const { user } = await requireUserSession(ctx, sessionToken);
  if (user.role !== 'admin') {
    throw new Error('Only admins can create users');
  }
  return user;
}

// Internal-only first-admin bootstrap.
export const createAdminUser = internalMutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const username = validateUsernameForStorage(args.username);
    const password = validatePasswordForStorage(args.password);
    const existingAdmin = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('role'), 'admin'))
      .first();

    if (existingAdmin) {
      throw new Error('Admin user already exists');
    }

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', username))
      .first();
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const passwordHash = await hashPassword(password);
    const userId = await ctx.db.insert('users', {
      username,
      passwordHash,
      role: 'admin',
      createdAt: Date.now(),
    });

    return { userId, message: 'Admin user created successfully' };
  },
});

export const createUser = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    role: v.union(v.literal('admin'), v.literal('editor')),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdminSession(ctx, args.sessionToken);
    const username = validateUsernameForStorage(args.username);
    const password = validatePasswordForStorage(args.password);

    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', username))
      .first();

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const passwordHash = await hashPassword(password);
    const userId = await ctx.db.insert('users', {
      username,
      passwordHash,
      role: args.role,
      createdAt: Date.now(),
    });

    return { userId, message: 'User created successfully' };
  },
});

export const login = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const username = validateUsernameForLogin(args.username);
    const password = validatePasswordForLogin(args.password);
    if (!username || !password) {
      return { ok: false as const };
    }
    const now = Date.now();
    const userDoc = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', username))
      .first();

    if (!userDoc) {
      await burnInvalidPasswordAttempt(password);
      return { ok: false as const };
    }

    const user = userDoc;
    if ((user.lockoutUntil ?? 0) > now) {
      await burnInvalidPasswordAttempt(password);
      return { ok: false as const };
    }

    const passwordCheck = await verifyPassword(password, user.passwordHash);
    if (!passwordCheck.valid) {
      const failedPatch = buildFailedLoginPatch(user, now);
      await patchUser(ctx, user._id, failedPatch);
      // Convex rolls back every database write when a mutation throws. Return
      // a generic failure instead so the lockout counters are committed.
      return { ok: false as const };
    }

    await cleanupExpiredSessionsForUser(ctx, user._id, now);

    const successPatch: UserPatch = {
      lastLogin: now,
      failedLoginAttempts: undefined,
      lastFailedLoginAt: undefined,
      lockoutUntil: undefined,
    };
    if (passwordCheck.needsUpgrade) {
      successPatch.passwordHash = await hashPassword(password);
    }
    await patchUser(ctx, user._id, successPatch);

    const token = randomHex(32);
    const expiresAt = now + SESSION_TTL_MS;
    await ctx.db.insert('sessions', {
      userId: user._id,
      token,
      expiresAt,
      createdAt: now,
    });

    return {
      ok: true as const,
      token,
      expiresAt,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    };
  },
});

export const logout = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.sessionToken))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

export const verifySession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    };
  },
});

export const listUsers = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserSession(ctx, args.sessionToken);
    if (user.role !== 'admin') {
      throw new Error('Unauthorized');
    }

    const users = await ctx.db.query('users').collect();
    return users.map((u) => ({
      id: u._id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
    }));
  },
});

export const changePassword = mutation({
  args: {
    sessionToken: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const currentPassword = validatePasswordForLogin(args.currentPassword);
    const newPassword = validatePasswordForStorage(args.newPassword);
    if (!currentPassword) {
      throw new Error('Current password is incorrect');
    }
    const now = Date.now();
    const { session, user } = await requireUserSession(ctx, args.sessionToken);
    const passwordCheck = await verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!passwordCheck.valid) {
      throw new Error('Current password is incorrect');
    }

    const newHash = await hashPassword(newPassword);
    await patchUser(ctx, user._id, {
      passwordHash: newHash,
      failedLoginAttempts: undefined,
      lastFailedLoginAt: undefined,
      lockoutUntil: undefined,
      lastLogin: now,
    });
    await cleanupExpiredSessionsForUser(ctx, user._id, now);
    await deleteSessionsForUser(ctx, user._id, session._id);

    return { success: true };
  },
});
