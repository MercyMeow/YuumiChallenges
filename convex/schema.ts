import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Admin users for authentication
  users: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal('admin'), v.literal('editor')),
    createdAt: v.number(),
    lastLogin: v.optional(v.number()),
  }).index('by_username', ['username']),

  // Sessions for auth
  sessions: defineTable({
    userId: v.id('users'),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index('by_token', ['token'])
    .index('by_userId', ['userId']),

  // Guide sections (editable text content)
  guideSections: defineTable({
    sectionKey: v.string(), // e.g., 'overview', 'mechanics_intro'
    title: v.string(),
    content: v.string(),
    order: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id('users')),
  }).index('by_sectionKey', ['sectionKey']),

  // Items for the guide
  guideItems: defineTable({
    name: v.string(),
    itemId: v.number(), // Data Dragon item ID
    category: v.union(
      v.literal('starter'),
      v.literal('early'),
      v.literal('core'),
      v.literal('situational')
    ),
    reason: v.string(),
    priority: v.number(), // Display order within category
    isActive: v.boolean(),
    updatedAt: v.number(),
  })
    .index('by_category', ['category'])
    .index('by_category_priority', ['category', 'priority']),

  // Runes configuration
  guideRunes: defineTable({
    name: v.string(), // e.g., "Standard Aery", "Guardian Sustain"
    primaryTree: v.string(), // e.g., "Sorcery"
    keystone: v.string(), // e.g., "SummonAery"
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
    updatedAt: v.number(),
  }).index('by_priority', ['priority']),

  // Skill order (legacy - kept for backwards compatibility)
  guideSkillOrder: defineTable({
    name: v.string(), // e.g., "Standard", "Aggressive"
    description: v.string(),
    levels: v.array(v.string()), // Array of 18 strings: 'Q', 'W', 'E', 'R'
    isRecommended: v.boolean(),
    priority: v.number(),
    updatedAt: v.number(),
  }).index('by_priority', ['priority']),

  // Unified builds (combines runes, items, and skill order)
  guideBuilds: defineTable({
    name: v.string(), // e.g., "Standard Aery", "Guardian Sustain"
    description: v.string(),
    icon: v.string(), // Icon identifier for the build
    color: v.string(), // Tailwind color class
    borderColor: v.string(), // Tailwind border color class
    isRecommended: v.boolean(),
    isActive: v.boolean(),
    priority: v.number(), // Display order
    // Runes configuration
    runes: v.object({
      name: v.string(),
      primaryTree: v.string(),
      keystone: v.string(),
      primary: v.array(v.string()), // 3 primary runes after keystone
      secondaryTree: v.string(),
      secondary: v.array(v.string()), // 2 secondary runes
      shards: v.array(v.string()), // 3 stat shards
    }),
    // Items configuration
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
    // Skill order configuration
    skillOrder: v.object({
      priority: v.string(), // e.g., "E > W > Q"
      levels: v.array(v.string()), // Array of 18: 'Q', 'W', 'E', 'R'
      notes: v.string(),
    }),
    updatedAt: v.number(),
  })
    .index('by_priority', ['priority'])
    .index('by_active', ['isActive']),

  // Matchups
  guideMatchups: defineTable({
    championName: v.string(),
    championId: v.string(), // For Data Dragon
    matchupType: v.union(v.literal('enemy_support'), v.literal('ally_adc')),
    difficulty: v.optional(
      v.union(v.literal('Easy'), v.literal('Medium'), v.literal('Hard'))
    ), // For enemy supports
    synergy: v.optional(
      v.union(
        v.literal('Excellent'),
        v.literal('Very Good'),
        v.literal('Good'),
        v.literal('Poor')
      )
    ), // For ally ADCs
    tips: v.array(v.string()),
    recommendedRunes: v.optional(v.string()),
    recommendedItems: v.optional(v.string()),
    earlyItems: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    playstyle: v.optional(v.string()),
    optimalAttachTargets: v.optional(v.string()),
    buildAdjustments: v.optional(v.array(v.string())),
    updatedAt: v.number(),
  })
    .index('by_type', ['matchupType'])
    .index('by_champion', ['championName'])
    .index('by_type_champion', ['matchupType', 'championName']),

  // Scraped data from external sources
  scrapedData: defineTable({
    source: v.union(
      v.literal('ugg'),
      v.literal('opgg'),
      v.literal('lolalytics'),
      v.literal('mobalytics'),
      v.literal('onetricks')
    ),
    dataType: v.union(
      v.literal('items'),
      v.literal('runes'),
      v.literal('skillOrder'),
      v.literal('matchups'),
      v.literal('stats')
    ),
    patch: v.string(),
    rank: v.optional(v.string()), // e.g., 'Emerald+', 'Diamond+', 'All'
    region: v.optional(v.string()), // e.g., 'World', 'NA', 'EUW'
    data: v.any(), // JSON data from the source
    sampleSize: v.optional(v.number()),
    winRate: v.optional(v.number()),
    pickRate: v.optional(v.number()),
    scrapedAt: v.number(),
  })
    .index('by_source', ['source'])
    .index('by_source_type', ['source', 'dataType'])
    .index('by_source_patch', ['source', 'patch'])
    .index('by_scrapedAt', ['scrapedAt']),

  // Scrape job logs
  scrapeJobs: defineTable({
    source: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed')
    ),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    recordsScraped: v.optional(v.number()),
    triggeredBy: v.optional(v.id('users')),
  })
    .index('by_source', ['source'])
    .index('by_status', ['status']),

  // Guide metadata (patch, last update, etc.)
  guideMetadata: defineTable({
    key: v.string(),
    value: v.string(),
    updatedAt: v.number(),
  }).index('by_key', ['key']),
});
