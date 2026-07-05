import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { DatabaseReader } from './_generated/server';
import { Id } from './_generated/dataModel';

// Helper to verify session
async function verifyAuth(
  ctx: { db: DatabaseReader },
  sessionToken: string
): Promise<Id<'users'> | null> {
  const session = await ctx.db
    .query('sessions')
    .withIndex('by_token', (q) => q.eq('token', sessionToken))
    .first();

  if (!session || session.expiresAt < Date.now()) {
    return null;
  }

  return session.userId ?? null;
}

// Drops the auth token from mutation args before persisting the rest.
function stripSessionToken<T extends { sessionToken: string }>(
  args: T
): Omit<T, 'sessionToken'> {
  const { sessionToken: _sessionToken, ...rest } = args;
  void _sessionToken;
  return rest;
}

// ============ ITEMS ============

export const getItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query('guideItems').collect();
    return items.sort((a, b) => {
      const categoryOrder = ['starter', 'early', 'core', 'situational'];
      const catDiff =
        categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      if (catDiff !== 0) return catDiff;
      return a.priority - b.priority;
    });
  },
});

export const getItemsByCategory = query({
  args: {
    category: v.union(
      v.literal('starter'),
      v.literal('early'),
      v.literal('core'),
      v.literal('situational')
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('guideItems')
      .withIndex('by_category', (q) => q.eq('category', args.category))
      .collect();
  },
});

export const upsertItem = mutation({
  args: {
    sessionToken: v.string(),
    id: v.optional(v.id('guideItems')),
    name: v.string(),
    itemId: v.number(),
    category: v.union(
      v.literal('starter'),
      v.literal('early'),
      v.literal('core'),
      v.literal('situational')
    ),
    reason: v.string(),
    priority: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    const { id, ...data } = stripSessionToken(args);
    const itemData = { ...data, updatedAt: Date.now() };

    if (id) {
      await ctx.db.patch(id, itemData);
      return id;
    } else {
      return await ctx.db.insert('guideItems', itemData);
    }
  },
});

export const deleteItem = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id('guideItems'),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============ RUNES ============

export const getRunes = query({
  args: {},
  handler: async (ctx) => {
    const runes = await ctx.db.query('guideRunes').collect();
    return runes.sort((a, b) => a.priority - b.priority);
  },
});

export const upsertRune = mutation({
  args: {
    sessionToken: v.string(),
    id: v.optional(v.id('guideRunes')),
    name: v.string(),
    primaryTree: v.string(),
    keystone: v.string(),
    primarySlot1: v.string(),
    primarySlot2: v.string(),
    primarySlot3: v.string(),
    secondaryTree: v.string(),
    secondarySlot1: v.string(),
    secondarySlot2: v.string(),
    statShard1: v.string(),
    statShard2: v.string(),
    statShard3: v.string(),
    description: v.optional(v.string()),
    isRecommended: v.boolean(),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    const { id, ...data } = stripSessionToken(args);
    const runeData = { ...data, updatedAt: Date.now() };

    if (id) {
      await ctx.db.patch(id, runeData);
      return id;
    } else {
      return await ctx.db.insert('guideRunes', runeData);
    }
  },
});

export const deleteRune = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id('guideRunes'),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============ SKILL ORDER ============

export const getSkillOrders = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query('guideSkillOrder').collect();
    return orders.sort((a, b) => a.priority - b.priority);
  },
});

export const upsertSkillOrder = mutation({
  args: {
    sessionToken: v.string(),
    id: v.optional(v.id('guideSkillOrder')),
    name: v.string(),
    description: v.string(),
    levels: v.array(v.string()),
    isRecommended: v.boolean(),
    priority: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    if (args.levels.length !== 18) {
      throw new Error('Skill order must have exactly 18 levels');
    }

    const { id, ...data } = stripSessionToken(args);
    const skillData = { ...data, updatedAt: Date.now() };

    if (id) {
      await ctx.db.patch(id, skillData);
      return id;
    } else {
      return await ctx.db.insert('guideSkillOrder', skillData);
    }
  },
});

export const deleteSkillOrder = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id('guideSkillOrder'),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============ UNIFIED BUILDS ============

export const getBuilds = query({
  args: {},
  handler: async (ctx) => {
    const builds = await ctx.db.query('guideBuilds').collect();
    return builds
      .filter((b) => b.isActive)
      .sort((a, b) => a.priority - b.priority);
  },
});

export const getAllBuilds = query({
  args: {},
  handler: async (ctx) => {
    const builds = await ctx.db.query('guideBuilds').collect();
    return builds.sort((a, b) => a.priority - b.priority);
  },
});

export const getBuildById = query({
  args: {
    id: v.id('guideBuilds'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const upsertBuild = mutation({
  args: {
    sessionToken: v.string(),
    id: v.optional(v.id('guideBuilds')),
    name: v.string(),
    description: v.string(),
    icon: v.string(),
    color: v.string(),
    borderColor: v.string(),
    isRecommended: v.boolean(),
    isActive: v.boolean(),
    priority: v.number(),
    runes: v.object({
      name: v.string(),
      primaryTree: v.string(),
      keystone: v.string(),
      primary: v.array(v.string()),
      secondaryTree: v.string(),
      secondary: v.array(v.string()),
      shards: v.array(v.string()),
    }),
    items: v.object({
      starter: v.array(
        v.object({
          id: v.number(),
          name: v.string(),
          reason: v.string(),
        })
      ),
      core: v.array(
        v.object({
          id: v.number(),
          name: v.string(),
          reason: v.string(),
        })
      ),
      situational: v.array(
        v.object({
          id: v.number(),
          name: v.string(),
          reason: v.string(),
        })
      ),
    }),
    skillOrder: v.object({
      priority: v.string(),
      levels: v.array(v.string()),
      notes: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    // Validate skill order has 18 levels
    if (args.skillOrder.levels.length !== 18) {
      throw new Error('Skill order must have exactly 18 levels');
    }

    const { id, ...data } = stripSessionToken(args);
    const buildData = { ...data, updatedAt: Date.now() };

    if (id) {
      await ctx.db.patch(id, buildData);
      return id;
    } else {
      return await ctx.db.insert('guideBuilds', buildData);
    }
  },
});

export const deleteBuild = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id('guideBuilds'),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const bulkImportBuilds = mutation({
  args: {
    sessionToken: v.string(),
    builds: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        icon: v.string(),
        color: v.string(),
        borderColor: v.string(),
        isRecommended: v.boolean(),
        isActive: v.boolean(),
        priority: v.number(),
        runes: v.object({
          name: v.string(),
          primaryTree: v.string(),
          keystone: v.string(),
          primary: v.array(v.string()),
          secondaryTree: v.string(),
          secondary: v.array(v.string()),
          shards: v.array(v.string()),
        }),
        items: v.object({
          starter: v.array(
            v.object({
              id: v.number(),
              name: v.string(),
              reason: v.string(),
            })
          ),
          core: v.array(
            v.object({
              id: v.number(),
              name: v.string(),
              reason: v.string(),
            })
          ),
          situational: v.array(
            v.object({
              id: v.number(),
              name: v.string(),
              reason: v.string(),
            })
          ),
        }),
        skillOrder: v.object({
          priority: v.string(),
          levels: v.array(v.string()),
          notes: v.string(),
        }),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    const ids = [];
    for (const build of args.builds) {
      if (build.skillOrder.levels.length !== 18) {
        throw new Error(
          `Build "${build.name}" skill order must have exactly 18 levels`
        );
      }
      const id = await ctx.db.insert('guideBuilds', {
        ...build,
        updatedAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

// ============ MATCHUPS ============

export const getMatchups = query({
  args: {
    type: v.optional(
      v.union(v.literal('enemy_support'), v.literal('ally_adc'))
    ),
  },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query('guideMatchups')
        .withIndex('by_type', (q) => q.eq('matchupType', args.type!))
        .collect();
    }
    return await ctx.db.query('guideMatchups').collect();
  },
});

export const getMatchupByChampion = query({
  args: {
    championName: v.string(),
    type: v.union(v.literal('enemy_support'), v.literal('ally_adc')),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('guideMatchups')
      .withIndex('by_type_champion', (q) =>
        q.eq('matchupType', args.type).eq('championName', args.championName)
      )
      .first();
  },
});

export const upsertMatchup = mutation({
  args: {
    sessionToken: v.string(),
    id: v.optional(v.id('guideMatchups')),
    championName: v.string(),
    championId: v.string(),
    matchupType: v.union(v.literal('enemy_support'), v.literal('ally_adc')),
    difficulty: v.optional(
      v.union(v.literal('Easy'), v.literal('Medium'), v.literal('Hard'))
    ),
    synergy: v.optional(
      v.union(
        v.literal('Excellent'),
        v.literal('Very Good'),
        v.literal('Good'),
        v.literal('Average'),
        v.literal('Situational'),
        v.literal('Poor')
      )
    ),
    tips: v.array(v.string()),
    recommendedRunes: v.optional(v.string()),
    recommendedItems: v.optional(v.string()),
    earlyItems: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    playstyle: v.optional(v.string()),
    optimalAttachTargets: v.optional(v.string()),
    buildAdjustments: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    const { id, ...data } = stripSessionToken(args);
    const matchupData = { ...data, updatedAt: Date.now() };

    if (id) {
      await ctx.db.patch(id, matchupData);
      return id;
    } else {
      return await ctx.db.insert('guideMatchups', matchupData);
    }
  },
});

export const deleteMatchup = mutation({
  args: {
    sessionToken: v.string(),
    id: v.id('guideMatchups'),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============ GUIDE SECTIONS ============

export const getSections = query({
  args: {},
  handler: async (ctx) => {
    const sections = await ctx.db.query('guideSections').collect();
    return sections.sort((a, b) => a.order - b.order);
  },
});

export const getSectionByKey = query({
  args: {
    sectionKey: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('guideSections')
      .withIndex('by_sectionKey', (q) => q.eq('sectionKey', args.sectionKey))
      .first();
  },
});

export const upsertSection = mutation({
  args: {
    sessionToken: v.string(),
    id: v.optional(v.id('guideSections')),
    sectionKey: v.string(),
    title: v.string(),
    content: v.string(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    const { id, ...data } = stripSessionToken(args);
    const sectionData = { ...data, updatedAt: Date.now(), updatedBy: userId };

    if (id) {
      await ctx.db.patch(id, sectionData);
      return id;
    } else {
      return await ctx.db.insert('guideSections', sectionData);
    }
  },
});

// ============ METADATA ============

export const getMetadata = query({
  args: {},
  handler: async (ctx) => {
    const metadata = await ctx.db.query('guideMetadata').collect();
    return Object.fromEntries(metadata.map((m) => [m.key, m.value]));
  },
});

export const setMetadata = mutation({
  args: {
    sessionToken: v.string(),
    key: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    const existing = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert('guideMetadata', {
        key: args.key,
        value: args.value,
        updatedAt: Date.now(),
      });
    }
  },
});

// ============ BULK IMPORT (for initial data) ============

export const bulkImportItems = mutation({
  args: {
    sessionToken: v.string(),
    items: v.array(
      v.object({
        name: v.string(),
        itemId: v.number(),
        category: v.union(
          v.literal('starter'),
          v.literal('early'),
          v.literal('core'),
          v.literal('situational')
        ),
        reason: v.string(),
        priority: v.number(),
        isActive: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    const ids = [];
    for (const item of args.items) {
      const id = await ctx.db.insert('guideItems', {
        ...item,
        updatedAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});

export const bulkImportMatchups = mutation({
  args: {
    sessionToken: v.string(),
    matchups: v.array(
      v.object({
        championName: v.string(),
        championId: v.string(),
        matchupType: v.union(v.literal('enemy_support'), v.literal('ally_adc')),
        difficulty: v.optional(
          v.union(v.literal('Easy'), v.literal('Medium'), v.literal('Hard'))
        ),
        synergy: v.optional(
          v.union(
            v.literal('Excellent'),
            v.literal('Very Good'),
            v.literal('Good'),
            v.literal('Average'),
            v.literal('Situational'),
            v.literal('Poor')
          )
        ),
        tips: v.array(v.string()),
        recommendedRunes: v.optional(v.string()),
        recommendedItems: v.optional(v.string()),
        earlyItems: v.optional(v.array(v.string())),
        notes: v.optional(v.string()),
        playstyle: v.optional(v.string()),
        optimalAttachTargets: v.optional(v.string()),
        buildAdjustments: v.optional(v.array(v.string())),
      })
    ),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    const ids = [];
    for (const matchup of args.matchups) {
      const id = await ctx.db.insert('guideMatchups', {
        ...matchup,
        updatedAt: Date.now(),
      });
      ids.push(id);
    }
    return ids;
  },
});
