import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Simple hash function for passwords (in production, use bcrypt via an action)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  // Add salt and convert to hex
  const salted = `yuumi_${hash}_guide`;
  let finalHash = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    finalHash = (finalHash << 5) - finalHash + char;
    finalHash = finalHash & finalHash;
  }
  return Math.abs(finalHash).toString(16);
}

// Generate a random token
function generateToken(): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Create initial admin user (run once)
export const createAdminUser = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if any admin exists
    const existingAdmin = await ctx.db
      .query('users')
      .filter((q) => q.eq(q.field('role'), 'admin'))
      .first();

    if (existingAdmin) {
      throw new Error('Admin user already exists');
    }

    const passwordHash = simpleHash(args.password);

    const userId = await ctx.db.insert('users', {
      username: args.username,
      passwordHash,
      role: 'admin',
      createdAt: Date.now(),
    });

    return { userId, message: 'Admin user created successfully' };
  },
});

// Create additional user (admin only)
export const createUser = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    role: v.union(v.literal('admin'), v.literal('editor')),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify admin session
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error('Unauthorized');
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Only admins can create users');
    }

    // Check if username exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .first();

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const passwordHash = simpleHash(args.password);

    const userId = await ctx.db.insert('users', {
      username: args.username,
      passwordHash,
      role: args.role,
      createdAt: Date.now(),
    });

    return { userId, message: 'User created successfully' };
  },
});

// Login
export const login = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_username', (q) => q.eq('username', args.username))
      .first();

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const passwordHash = simpleHash(args.password);
    if (user.passwordHash !== passwordHash) {
      throw new Error('Invalid credentials');
    }

    // Create session token
    const token = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    await ctx.db.insert('sessions', {
      userId: user._id,
      token,
      expiresAt,
      createdAt: Date.now(),
    });

    // Update last login
    await ctx.db.patch(user._id, { lastLogin: Date.now() });

    return {
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
      },
    };
  },
});

// Logout
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

// Verify session
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

// Get all users (admin only)
export const listUsers = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error('Unauthorized');
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || currentUser.role !== 'admin') {
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

// Change password
export const changePassword = mutation({
  args: {
    sessionToken: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query('sessions')
      .withIndex('by_token', (q) => q.eq('token', args.sessionToken))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error('Unauthorized');
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentHash = simpleHash(args.currentPassword);
    if (user.passwordHash !== currentHash) {
      throw new Error('Current password is incorrect');
    }

    const newHash = simpleHash(args.newPassword);
    await ctx.db.patch(user._id, { passwordHash: newHash });

    return { success: true };
  },
});
