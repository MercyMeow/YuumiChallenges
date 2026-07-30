import { v } from 'convex/values';
import { query } from './_generated/server';

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

// ============ RUNES ============

export const getRunes = query({
  args: {},
  handler: async (ctx) => {
    const runes = await ctx.db.query('guideRunes').collect();
    return runes.sort((a, b) => a.priority - b.priority);
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

// ============ UNIFIED BUILDS ============

export const getBuilds = query({
  args: {},
  handler: async (ctx) => {
    const builds = await ctx.db.query('guideBuilds').collect();
    return builds
      .filter((build) => build.isActive)
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

// ============ METADATA ============

export const getMetadata = query({
  args: {},
  handler: async (ctx) => {
    const metadata = await ctx.db.query('guideMetadata').collect();
    return Object.fromEntries(
      metadata.map((entry) => [entry.key, entry.value])
    );
  },
});
