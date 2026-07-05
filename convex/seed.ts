// Database seeding for the Yuumi guide. Idempotent: replaces the contents of
// the seeded guide tables and sets specific metadata keys (never wipes
// metadata wholesale — autoBuild/mythicShop live there too).
//
// Run against the deployment with:
//   npx convex run seed:seedAll
//
// Data sources are the static guide modules under src/lib — the same data the
// site falls back to when Convex is unreachable, so DB and fallback agree.

import { internalMutation } from './_generated/server';
import { DEFAULT_BUILDS } from '../src/lib/builds/default-builds';
import { applyAutoBuild } from '../src/lib/builds/apply-auto-build';
import {
  AUTO_BUILD_METADATA_KEY,
  parseAutoBuild,
} from '../src/lib/builds/auto-build-shared';
import { BEST_ITEMS } from '../src/lib/builds/yuumi';
import { SUPPORT_MATCHUPS, ADC_MATCHUPS } from '../src/lib/matchups/index';

import { GUIDE_PATCH } from '../src/lib/guide/patch';

// Display names for Data Dragon champion ids that need punctuation.
const CHAMPION_LABEL_OVERRIDES: Record<string, string> = {
  Kaisa: "Kai'Sa",
  KogMaw: "Kog'Maw",
  Velkoz: "Vel'Koz",
  MissFortune: 'Miss Fortune',
  TahmKench: 'Tahm Kench',
  TwistedFate: 'Twisted Fate',
};

function championLabel(id: string): string {
  return (
    CHAMPION_LABEL_OVERRIDES[id] ??
    id
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim()
  );
}

const GUIDE_SECTIONS = [
  {
    sectionKey: 'overview',
    title: 'Overview',
    content:
      'Yuumi, the Magical Cat, is an enchanter support who attaches to allies ' +
      'and amplifies them with heals, shields, and adaptive stats. This guide ' +
      'tracks the live meta each patch: builds and runes are refreshed from ' +
      'OP.GG/Lolalytics data daily, while matchup notes are curated by the ' +
      'Yuumi mains community.',
    order: 1,
  },
  {
    sectionKey: 'playstyle',
    title: 'Playstyle',
    content:
      'Ride your Best Friend — the ally with the strongest bond empowers Q, W, ' +
      'and R. Curve Prowling Projectile for empowered slows in lane; buffer ' +
      'Zoomies shields before trades, not after damage lands. Detach only ' +
      'when W is ready and enemy CC is down. E shields and restores mana; ' +
      'healing comes from passive procs, W on-hit heal, and Final Chapter waves.',
    order: 2,
  },
  {
    sectionKey: 'laning',
    title: 'Laning Phase',
    content:
      'Start World Atlas and max Q first for poke. Curve Q behind minions to ' +
      'force recalls — empowered hits after ~1.35s travel deal bonus damage ' +
      'and a stronger slow. Proc passive with autos or Q, then re-attach to ' +
      'share the heal. Never detach into hook or grab range; immobilize while ' +
      'detached locks W. Complete the support quest and buy control wards.',
    order: 3,
  },
  {
    sectionKey: 'teamfighting',
    title: 'Teamfighting',
    content:
      'Channel Final Chapter where multiple allies collect wave heals — excess ' +
      'healing becomes shields. On Best Friend, steer R with your mouse. You ' +
      'can cast Zoomies mid-ult for emergency shields. Swap hosts with W to ' +
      'follow divers, but casting W during R locks wave direction. Q poke ' +
      'between cooldowns; save E for the moment your carry gets focused.',
    order: 4,
  },
  {
    sectionKey: 'about',
    title: 'About This Guide',
    content:
      'Built by the Yuumi mains community. Build data auto-updates daily from ' +
      'OP.GG via the site cron; the Mythic Shop rotation is curated by hand ' +
      'because Riot exposes no public API for it. Patch labels follow Data ' +
      'Dragon versioning.',
    order: 5,
  },
] as const;

export const seedAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Overlay the latest auto-scraped build (persisted in guideMetadata, which
    // this seed never wipes) onto the recommended build, so re-seeding keeps the
    // live scraped runes/core/boots/skill order instead of regressing to the
    // curated static data. Falls back to curated when no auto build exists.
    const autoMeta = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', AUTO_BUILD_METADATA_KEY))
      .first();
    const builds = applyAutoBuild(
      DEFAULT_BUILDS,
      parseAutoBuild(autoMeta?.value)
    );

    // ---- wipe seeded tables (leave users/sessions/scrape data/metadata) ----
    const tables = [
      'guideBuilds',
      'guideItems',
      'guideRunes',
      'guideSkillOrder',
      'guideMatchups',
      'guideSections',
    ] as const;
    for (const table of tables) {
      const rows = await ctx.db.query(table).collect();
      for (const row of rows) {
        await ctx.db.delete(row._id);
      }
    }

    // ---- unified builds ----
    let priority = 0;
    for (const build of builds) {
      await ctx.db.insert('guideBuilds', {
        name: build.name,
        description: build.description,
        icon: build.icon,
        color: 'bg-hx-gold/10',
        borderColor: 'border-hx-gold-dark',
        isRecommended: build.isRecommended ?? false,
        isActive: true,
        priority: priority++,
        runes: {
          name: build.runes.name,
          primaryTree: build.runes.primaryTree,
          keystone: build.runes.keystone,
          primary: [...build.runes.primary],
          secondaryTree: build.runes.secondaryTree,
          secondary: [...build.runes.secondary],
          shards: [...build.runes.shards],
        },
        items: {
          starter: build.items.starter.map((i) => ({ ...i })),
          core: build.items.core.map((i) => ({ ...i })),
          situational: build.items.situational.map((i) => ({ ...i })),
        },
        skillOrder: {
          priority: build.skillOrder.priority,
          levels: [...build.skillOrder.levels],
          notes: build.skillOrder.notes,
        },
        updatedAt: now,
      });
    }

    // ---- itemized guide items (by category, incl. early game) ----
    const itemCategories = [
      ['starter', BEST_ITEMS.starter],
      ['early', BEST_ITEMS.early],
      ['core', BEST_ITEMS.core],
      ['situational', BEST_ITEMS.situational],
    ] as const;
    let itemCount = 0;
    for (const [category, items] of itemCategories) {
      let itemPriority = 0;
      for (const item of items) {
        await ctx.db.insert('guideItems', {
          name: item.name,
          itemId: item.id,
          category,
          reason: item.reason,
          priority: itemPriority++,
          isActive: true,
          updatedAt: now,
        });
        itemCount++;
      }
    }

    // ---- rune pages + skill orders (mirroring the unified builds) ----
    let runePriority = 0;
    for (const build of builds) {
      const [p1 = '', p2 = '', p3 = ''] = build.runes.primary;
      const [s1 = '', s2 = ''] = build.runes.secondary;
      const [sh1 = '', sh2 = '', sh3 = ''] = build.runes.shards;
      await ctx.db.insert('guideRunes', {
        name: build.runes.name,
        primaryTree: build.runes.primaryTree,
        keystone: build.runes.keystone,
        primarySlot1: p1,
        primarySlot2: p2,
        primarySlot3: p3,
        secondaryTree: build.runes.secondaryTree,
        secondarySlot1: s1,
        secondarySlot2: s2,
        statShard1: sh1,
        statShard2: sh2,
        statShard3: sh3,
        description: build.description,
        isRecommended: build.isRecommended ?? false,
        priority: runePriority,
        updatedAt: now,
      });
      await ctx.db.insert('guideSkillOrder', {
        name: build.name,
        description: build.skillOrder.notes,
        levels: [...build.skillOrder.levels],
        isRecommended: build.isRecommended ?? false,
        priority: runePriority,
        updatedAt: now,
      });
      runePriority++;
    }

    // ---- matchups: enemy supports ----
    let matchupCount = 0;
    for (const [championId, matchup] of Object.entries(SUPPORT_MATCHUPS)) {
      await ctx.db.insert('guideMatchups', {
        championName: championLabel(championId),
        championId,
        matchupType: 'enemy_support',
        difficulty: matchup.difficulty,
        tips: [...matchup.tips],
        recommendedRunes: matchup.recommendedRunes,
        recommendedItems: matchup.recommendedItems,
        ...(matchup.earlyItems ? { earlyItems: [...matchup.earlyItems] } : {}),
        ...(matchup.notes ? { notes: matchup.notes } : {}),
        updatedAt: now,
      });
      matchupCount++;
    }

    // ---- matchups: ally ADC synergies ----
    for (const [championId, synergy] of Object.entries(ADC_MATCHUPS)) {
      await ctx.db.insert('guideMatchups', {
        championName: championLabel(championId),
        championId,
        matchupType: 'ally_adc',
        synergy: synergy.synergy,
        tips: [...synergy.tips],
        playstyle: synergy.playstyle,
        ...(synergy.optimalAttachTargets
          ? { optimalAttachTargets: synergy.optimalAttachTargets }
          : {}),
        ...(synergy.buildAdjustments
          ? { buildAdjustments: [...synergy.buildAdjustments] }
          : {}),
        updatedAt: now,
      });
      matchupCount++;
    }

    // ---- text sections ----
    for (const section of GUIDE_SECTIONS) {
      await ctx.db.insert('guideSections', {
        sectionKey: section.sectionKey,
        title: section.title,
        content: section.content,
        order: section.order,
        updatedAt: now,
      });
    }

    // ---- metadata (targeted keys only) ----
    const setMeta = async (key: string, value: string) => {
      const existing = await ctx.db
        .query('guideMetadata')
        .withIndex('by_key', (q) => q.eq('key', key))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { value, updatedAt: now });
      } else {
        await ctx.db.insert('guideMetadata', { key, value, updatedAt: now });
      }
    };
    await setMeta('currentPatch', GUIDE_PATCH);
    await setMeta('seededAt', new Date(now).toISOString());

    return {
      builds: DEFAULT_BUILDS.length,
      items: itemCount,
      runePages: DEFAULT_BUILDS.length,
      skillOrders: DEFAULT_BUILDS.length,
      matchups: matchupCount,
      sections: GUIDE_SECTIONS.length,
    };
  },
});
