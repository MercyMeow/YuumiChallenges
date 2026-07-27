import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { DatabaseReader } from './_generated/server';
import { Id } from './_generated/dataModel';

// Helper to verify session
async function verifyGuideEditor(
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

  const user = session.userId ? await ctx.db.get(session.userId) : null;
  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return null;
  }

  return user._id;
}

// Shared matchup enum validators — used by upsertMatchup and
// bulkImportMatchups so the two endpoints can never drift apart.
const difficultyValidator = v.union(
  v.literal('Easy'),
  v.literal('Medium'),
  v.literal('Hard')
);
const synergyValidator = v.union(
  v.literal('Excellent'),
  v.literal('Very Good'),
  v.literal('Good'),
  v.literal('Average'),
  v.literal('Situational'),
  v.literal('Poor')
);
const GUIDE_BUILD_ICONS = new Set(['star', 'shield', 'zap']);
const MAX_GUIDE_BUILD_DOCUMENT_BYTES = 900_000;

// Drops the auth token from mutation args before persisting the rest.
function stripSessionToken<T extends { sessionToken: string }>(
  args: T
): Omit<T, 'sessionToken'> {
  const { sessionToken: _sessionToken, ...rest } = args;
  void _sessionToken;
  return rest;
}

function requireGuideEditorSession(userId: Id<'users'> | null): Id<'users'> {
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

function normalizeRequiredString(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }
  return normalized;
}

function normalizeOptionalString(value: string): string {
  return value.trim();
}

function normalizePriority(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }
  return value;
}

function normalizePositiveItemId(value: number, fieldName: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
  return value;
}

function normalizeStringArray(
  values: string[],
  fieldName: string,
  minimumLength = 1,
  exactLength?: number
): string[] {
  const normalized = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (exactLength !== undefined && normalized.length !== exactLength) {
    throw new Error(
      `${fieldName} must include exactly ${exactLength} value${exactLength === 1 ? '' : 's'}`
    );
  }

  if (normalized.length < minimumLength) {
    throw new Error(
      `${fieldName} must include at least ${minimumLength} value${minimumLength === 1 ? '' : 's'}`
    );
  }

  return normalized;
}

function normalizeSkillLevels(levels: string[]): string[] {
  if (levels.length !== 18) {
    throw new Error('Skill order must have exactly 18 levels');
  }

  const counts = { Q: 0, W: 0, E: 0, R: 0 };
  const ultimateIndices = new Set([5, 10, 15]);

  const normalizedLevels = levels.map((level, index) => {
    const normalized = level.trim().toUpperCase();
    if (!['Q', 'W', 'E', 'R'].includes(normalized)) {
      throw new Error(`Skill level ${index + 1} must be one of Q, W, E, or R`);
    }
    if (normalized === 'R' && !ultimateIndices.has(index)) {
      throw new Error('Ultimate can only be assigned at levels 6, 11, and 16');
    }
    counts[normalized as keyof typeof counts] += 1;
    if (normalized !== 'R') {
      const championLevel = index + 1;
      const availableRanks = Math.min(5, Math.ceil(championLevel / 2));
      if (counts[normalized as 'Q' | 'W' | 'E'] > availableRanks) {
        throw new Error(
          `${normalized} rank ${counts[normalized as 'Q' | 'W' | 'E']} is not available at level ${championLevel}`
        );
      }
    }
    return normalized;
  });

  if (counts.R !== 3) {
    throw new Error('Skill order must include exactly 3 ultimate levels');
  }
  if (counts.Q > 5 || counts.W > 5 || counts.E > 5) {
    throw new Error('Q, W, and E can each be leveled at most 5 times');
  }

  return normalizedLevels;
}

function normalizeBuildIcon(value: string): string {
  const normalized = normalizeRequiredString(value, 'Build icon');
  if (!GUIDE_BUILD_ICONS.has(normalized)) {
    throw new Error('Build icon must be one of star, shield, or zap');
  }
  return normalized;
}

function assertBuildDocumentSize(build: unknown): void {
  const documentBytes = new TextEncoder().encode(
    JSON.stringify(build)
  ).byteLength;
  if (documentBytes > MAX_GUIDE_BUILD_DOCUMENT_BYTES) {
    throw new Error(
      `Build exceeds the ${MAX_GUIDE_BUILD_DOCUMENT_BYTES} byte storage budget`
    );
  }
}

function normalizeBuildItems(
  items: Array<{ id: number; name: string; reason: string }>,
  fieldName: string
) {
  return items.map((item, index) => ({
    id: normalizePositiveItemId(item.id, `${fieldName} item ${index + 1} ID`),
    name: normalizeRequiredString(
      item.name,
      `${fieldName} item ${index + 1} name`
    ),
    reason: normalizeRequiredString(
      item.reason,
      `${fieldName} item ${index + 1} reason`
    ),
  }));
}

function normalizeGuideItemPayload(args: {
  name: string;
  itemId: number;
  category: 'starter' | 'early' | 'core' | 'situational';
  reason: string;
  priority: number;
  isActive: boolean;
}) {
  return {
    name: normalizeRequiredString(args.name, 'Item name'),
    itemId: normalizePositiveItemId(args.itemId, 'Item ID'),
    category: args.category,
    reason: normalizeRequiredString(args.reason, 'Item reason'),
    priority: normalizePriority(args.priority, 'Item priority'),
    isActive: args.isActive,
  };
}

function normalizeBuildPayload(args: {
  name: string;
  description: string;
  icon: string;
  color: string;
  borderColor: string;
  isRecommended: boolean;
  isActive: boolean;
  priority: number;
  runes: {
    name: string;
    primaryTree: string;
    keystone: string;
    primary: string[];
    secondaryTree: string;
    secondary: string[];
    shards: string[];
  };
  items: {
    starter: Array<{ id: number; name: string; reason: string }>;
    core: Array<{ id: number; name: string; reason: string }>;
    situational: Array<{ id: number; name: string; reason: string }>;
  };
  skillOrder: {
    priority: string;
    levels: string[];
    notes: string;
  };
}) {
  const normalizedBuild = {
    name: normalizeRequiredString(args.name, 'Build name'),
    description: normalizeRequiredString(args.description, 'Build description'),
    icon: normalizeBuildIcon(args.icon),
    color: normalizeRequiredString(args.color, 'Build color class'),
    borderColor: normalizeRequiredString(
      args.borderColor,
      'Build border color class'
    ),
    isRecommended: args.isRecommended,
    isActive: args.isActive,
    priority: normalizePriority(args.priority, 'Build priority'),
    runes: {
      name: normalizeRequiredString(args.runes.name, 'Rune page name'),
      primaryTree: normalizeRequiredString(
        args.runes.primaryTree,
        'Primary rune tree'
      ),
      keystone: normalizeRequiredString(args.runes.keystone, 'Keystone'),
      primary: normalizeStringArray(args.runes.primary, 'Primary runes', 1, 3),
      secondaryTree: normalizeRequiredString(
        args.runes.secondaryTree,
        'Secondary rune tree'
      ),
      secondary: normalizeStringArray(
        args.runes.secondary,
        'Secondary runes',
        1,
        2
      ),
      shards: normalizeStringArray(args.runes.shards, 'Rune shards', 1, 3),
    },
    items: {
      starter: normalizeBuildItems(args.items.starter, 'Starter'),
      core: normalizeBuildItems(args.items.core, 'Core'),
      situational: normalizeBuildItems(args.items.situational, 'Situational'),
    },
    skillOrder: {
      priority: normalizeRequiredString(
        args.skillOrder.priority,
        'Skill order priority'
      ),
      levels: normalizeSkillLevels(args.skillOrder.levels),
      notes: normalizeOptionalString(args.skillOrder.notes),
    },
  };

  assertBuildDocumentSize(normalizedBuild);
  return normalizedBuild;
}

// ============ ITEMS ============

export const getItems = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query('guideItems').collect();
    return items
      .filter((item) => item.isActive)
      .sort((a, b) => {
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
    const items = await ctx.db
      .query('guideItems')
      .withIndex('by_category', (q) => q.eq('category', args.category))
      .collect();
    return items
      .filter((item) => item.isActive)
      .sort((a, b) => a.priority - b.priority);
  },
});

export const getAllItems = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

    const { id, ...data } = stripSessionToken(args);
    const itemData = {
      ...normalizeGuideItemPayload(data),
      updatedAt: Date.now(),
    };

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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

    const { id, ...data } = stripSessionToken(args);
    const skillData = {
      ...data,
      name: normalizeRequiredString(data.name, 'Skill order name'),
      description: normalizeRequiredString(
        data.description,
        'Skill order description'
      ),
      levels: normalizeSkillLevels(data.levels),
      priority: normalizePriority(data.priority, 'Skill order priority'),
      updatedAt: Date.now(),
    };

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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

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
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

    const builds = await ctx.db.query('guideBuilds').collect();
    return builds.sort((a, b) => a.priority - b.priority);
  },
});

export const getBuildById = query({
  args: {
    id: v.id('guideBuilds'),
  },
  handler: async (ctx, args) => {
    const build = await ctx.db.get(args.id);
    return build?.isActive ? build : null;
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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

    const { id, ...data } = stripSessionToken(args);
    const buildData = {
      ...normalizeBuildPayload(data),
      updatedAt: Date.now(),
    };

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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

    const ids = [];
    for (const build of args.builds) {
      const id = await ctx.db.insert('guideBuilds', {
        ...normalizeBuildPayload(build),
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
    difficulty: v.optional(difficultyValidator),
    synergy: v.optional(synergyValidator),
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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

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
    const userId = requireGuideEditorSession(
      await verifyGuideEditor(ctx, args.sessionToken)
    );

    const { id, ...data } = stripSessionToken(args);
    const sectionData = {
      ...data,
      sectionKey: normalizeRequiredString(data.sectionKey, 'Section key'),
      title: normalizeRequiredString(data.title, 'Section title'),
      content: normalizeRequiredString(data.content, 'Section content'),
      order: normalizePriority(data.order, 'Section order'),
      updatedAt: Date.now(),
      updatedBy: userId,
    };

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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

    const normalizedKey = normalizeRequiredString(args.key, 'Metadata key');
    const normalizedValue = normalizeRequiredString(
      args.value,
      'Metadata value'
    );
    const existing = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', normalizedKey))
      .collect();

    if (existing.length > 0) {
      const canonical = existing[0]!;
      await ctx.db.patch(canonical._id, {
        value: normalizedValue,
        updatedAt: Date.now(),
      });
      for (const duplicate of existing.slice(1)) {
        await ctx.db.delete(duplicate._id);
      }
      return canonical._id;
    } else {
      return await ctx.db.insert('guideMetadata', {
        key: normalizedKey,
        value: normalizedValue,
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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

    const ids = [];
    for (const item of args.items) {
      const id = await ctx.db.insert('guideItems', {
        ...normalizeGuideItemPayload(item),
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
        difficulty: v.optional(difficultyValidator),
        synergy: v.optional(synergyValidator),
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
    requireGuideEditorSession(await verifyGuideEditor(ctx, args.sessionToken));

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
