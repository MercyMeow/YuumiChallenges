import { v } from 'convex/values';
import {
  mutation,
  query,
  action,
  internalAction,
  internalMutation,
} from './_generated/server';
import { api, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import type { DatabaseReader } from './_generated/server';

type ScrapeResult = { success: boolean; jobId: Id<'scrapeJobs'> };

// Patch tag recorded with scraped data
const CURRENT_PATCH = '16.13';

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

// ============ SCRAPED DATA QUERIES ============

export const getScrapedData = query({
  args: {
    source: v.optional(
      v.union(
        v.literal('ugg'),
        v.literal('opgg'),
        v.literal('lolalytics'),
        v.literal('mobalytics'),
        v.literal('onetricks')
      )
    ),
    dataType: v.optional(
      v.union(
        v.literal('items'),
        v.literal('runes'),
        v.literal('skillOrder'),
        v.literal('matchups'),
        v.literal('stats')
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const source = args.source;
    const results = source
      ? await ctx.db
          .query('scrapedData')
          .withIndex('by_source', (q) => q.eq('source', source))
          .order('desc')
          .collect()
      : await ctx.db.query('scrapedData').order('desc').collect();

    let filtered = results;
    if (args.dataType) {
      filtered = results.filter((r) => r.dataType === args.dataType);
    }

    if (args.limit) {
      filtered = filtered.slice(0, args.limit);
    }

    return filtered;
  },
});

export const getLatestScrapedData = query({
  args: {
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
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query('scrapedData')
      .withIndex('by_source_type', (q) =>
        q.eq('source', args.source).eq('dataType', args.dataType)
      )
      .order('desc')
      .first();

    return results;
  },
});

export const getAggregatedData = query({
  args: {
    dataType: v.union(
      v.literal('items'),
      v.literal('runes'),
      v.literal('skillOrder'),
      v.literal('matchups'),
      v.literal('stats')
    ),
  },
  handler: async (ctx, args) => {
    // Get latest from each source
    const sources = [
      'ugg',
      'opgg',
      'lolalytics',
      'mobalytics',
      'onetricks',
    ] as const;
    const aggregated = [];

    for (const source of sources) {
      const latest = await ctx.db
        .query('scrapedData')
        .withIndex('by_source_type', (q) =>
          q.eq('source', source).eq('dataType', args.dataType)
        )
        .order('desc')
        .first();

      if (latest) {
        aggregated.push(latest);
      }
    }

    return aggregated;
  },
});

// ============ SCRAPE JOBS ============

export const getScrapeJobs = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('running'),
        v.literal('completed'),
        v.literal('failed')
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const status = args.status;
    const limit = args.limit ?? 50;
    const results = status
      ? await ctx.db
          .query('scrapeJobs')
          .withIndex('by_status', (q) => q.eq('status', status))
          .order('desc')
          .take(limit)
      : await ctx.db.query('scrapeJobs').order('desc').take(limit);
    return results;
  },
});

export const createScrapeJob = mutation({
  args: {
    sessionToken: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    // Check if there's already a running job for this source
    const runningJob = await ctx.db
      .query('scrapeJobs')
      .withIndex('by_source', (q) => q.eq('source', args.source))
      .filter((q) => q.eq(q.field('status'), 'running'))
      .first();

    if (runningJob) {
      throw new Error(`A scrape job for ${args.source} is already running`);
    }

    const jobId = await ctx.db.insert('scrapeJobs', {
      source: args.source,
      status: 'pending',
      triggeredBy: userId,
    });

    return jobId;
  },
});

export const updateScrapeJob = mutation({
  args: {
    jobId: v.id('scrapeJobs'),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('completed'),
      v.literal('failed')
    ),
    error: v.optional(v.string()),
    recordsScraped: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { status: args.status };

    if (args.status === 'running') {
      updates.startedAt = Date.now();
    }

    if (args.status === 'completed' || args.status === 'failed') {
      updates.completedAt = Date.now();
    }

    if (args.error) {
      updates.error = args.error;
    }

    if (args.recordsScraped !== undefined) {
      updates.recordsScraped = args.recordsScraped;
    }

    await ctx.db.patch(args.jobId, updates);
    return { success: true };
  },
});

// ============ STORE SCRAPED DATA ============

export const storeScrapedData = mutation({
  args: {
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
    rank: v.optional(v.string()),
    region: v.optional(v.string()),
    data: v.any(),
    sampleSize: v.optional(v.number()),
    winRate: v.optional(v.number()),
    pickRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('scrapedData', {
      ...args,
      scrapedAt: Date.now(),
    });
    return id;
  },
});

// ============ SCRAPER ACTIONS ============

// These are actions that make HTTP requests to scrape data
// They run outside of the Convex transaction system

export const scrapeUGG = action({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args): Promise<ScrapeResult> => {
    // Create job
    const jobId: Id<'scrapeJobs'> = await ctx.runMutation(
      api.scraper.createScrapeJob,
      { sessionToken: args.sessionToken, source: 'ugg' }
    );

    try {
      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'running',
      });

      // U.GG API endpoint (they have a public API)
      const response = await fetch(
        'https://u.gg/api/lol/ranked_stats/champion/yuumi/support',
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`U.GG returned ${response.status}`);
      }

      const html = await response.text();

      // Parse the data (simplified - real implementation would use proper parsing)
      const data = {
        source: 'ugg' as const,
        rawHtml: html.substring(0, 1000), // Store sample for debugging
        scrapedAt: new Date().toISOString(),
        note: 'U.GG scraping requires browser automation for full data',
      };

      await ctx.runMutation(api.scraper.storeScrapedData, {
        source: 'ugg',
        dataType: 'stats',
        patch: CURRENT_PATCH,
        data,
      });

      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'completed',
        recordsScraped: 1,
      });

      return { success: true, jobId };
    } catch (error) {
      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
});

export const scrapeOPGG = action({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args): Promise<ScrapeResult> => {
    const jobId: Id<'scrapeJobs'> = await ctx.runMutation(
      api.scraper.createScrapeJob,
      { sessionToken: args.sessionToken, source: 'opgg' }
    );

    try {
      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'running',
      });

      // OP.GG champion page
      const response = await fetch(
        'https://www.op.gg/champions/yuumi/support/build',
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`OP.GG returned ${response.status}`);
      }

      const html = await response.text();

      // Extract data from HTML (simplified)
      const data = {
        source: 'opgg' as const,
        rawHtml: html.substring(0, 1000),
        scrapedAt: new Date().toISOString(),
        note: 'OP.GG data extracted from HTML',
      };

      await ctx.runMutation(api.scraper.storeScrapedData, {
        source: 'opgg',
        dataType: 'stats',
        patch: CURRENT_PATCH,
        data,
      });

      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'completed',
        recordsScraped: 1,
      });

      return { success: true, jobId };
    } catch (error) {
      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
});

export const scrapeLolalytics = action({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args): Promise<ScrapeResult> => {
    const jobId: Id<'scrapeJobs'> = await ctx.runMutation(
      api.scraper.createScrapeJob,
      { sessionToken: args.sessionToken, source: 'lolalytics' }
    );

    try {
      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'running',
      });

      // Lolalytics has a nice API structure
      const response = await fetch(
        'https://lolalytics.com/lol/yuumi/build/?lane=support',
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Lolalytics returned ${response.status}`);
      }

      const html = await response.text();

      const data = {
        source: 'lolalytics' as const,
        rawHtml: html.substring(0, 1000),
        scrapedAt: new Date().toISOString(),
      };

      await ctx.runMutation(api.scraper.storeScrapedData, {
        source: 'lolalytics',
        dataType: 'stats',
        patch: CURRENT_PATCH,
        data,
      });

      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'completed',
        recordsScraped: 1,
      });

      return { success: true, jobId };
    } catch (error) {
      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
});

export const scrapeMobalytics = action({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args): Promise<ScrapeResult> => {
    const jobId: Id<'scrapeJobs'> = await ctx.runMutation(
      api.scraper.createScrapeJob,
      { sessionToken: args.sessionToken, source: 'mobalytics' }
    );

    try {
      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'running',
      });

      const response = await fetch(
        'https://app.mobalytics.gg/lol/champions/yuumi/build',
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Mobalytics returned ${response.status}`);
      }

      const html = await response.text();

      const data = {
        source: 'mobalytics' as const,
        rawHtml: html.substring(0, 1000),
        scrapedAt: new Date().toISOString(),
      };

      await ctx.runMutation(api.scraper.storeScrapedData, {
        source: 'mobalytics',
        dataType: 'stats',
        patch: CURRENT_PATCH,
        data,
      });

      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'completed',
        recordsScraped: 1,
      });

      return { success: true, jobId };
    } catch (error) {
      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
});

export const scrapeOnetricks = action({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args): Promise<ScrapeResult> => {
    const jobId: Id<'scrapeJobs'> = await ctx.runMutation(
      api.scraper.createScrapeJob,
      { sessionToken: args.sessionToken, source: 'onetricks' }
    );

    try {
      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'running',
      });

      // Onetricks.gg for high elo one-trick data
      const response = await fetch('https://www.onetricks.gg/champions/Yuumi', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Onetricks.gg returned ${response.status}`);
      }

      const html = await response.text();

      const data = {
        source: 'onetricks' as const,
        rawHtml: html.substring(0, 1000),
        scrapedAt: new Date().toISOString(),
        note: 'High elo one-trick player data',
      };

      await ctx.runMutation(api.scraper.storeScrapedData, {
        source: 'onetricks',
        dataType: 'stats',
        patch: CURRENT_PATCH,
        data,
      });

      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'completed',
        recordsScraped: 1,
      });

      return { success: true, jobId };
    } catch (error) {
      await ctx.runMutation(api.scraper.updateScrapeJob, {
        jobId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },
});

// Scrape all sources
export const scrapeAll = action({
  args: {
    sessionToken: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<Array<ScrapeResult | { source: string; error: string }>> => {
    const results: Array<ScrapeResult | { source: string; error: string }> = [];

    // Run scrapers sequentially to avoid rate limiting
    try {
      results.push(
        await ctx.runAction(api.scraper.scrapeUGG, {
          sessionToken: args.sessionToken,
        })
      );
    } catch (e) {
      results.push({ source: 'ugg', error: (e as Error).message });
    }

    try {
      results.push(
        await ctx.runAction(api.scraper.scrapeOPGG, {
          sessionToken: args.sessionToken,
        })
      );
    } catch (e) {
      results.push({ source: 'opgg', error: (e as Error).message });
    }

    try {
      results.push(
        await ctx.runAction(api.scraper.scrapeLolalytics, {
          sessionToken: args.sessionToken,
        })
      );
    } catch (e) {
      results.push({ source: 'lolalytics', error: (e as Error).message });
    }

    try {
      results.push(
        await ctx.runAction(api.scraper.scrapeMobalytics, {
          sessionToken: args.sessionToken,
        })
      );
    } catch (e) {
      results.push({ source: 'mobalytics', error: (e as Error).message });
    }

    try {
      results.push(
        await ctx.runAction(api.scraper.scrapeOnetricks, {
          sessionToken: args.sessionToken,
        })
      );
    } catch (e) {
      results.push({ source: 'onetricks', error: (e as Error).message });
    }

    return results;
  },
});

// Delete old scraped data (cleanup)
export const cleanupOldData = mutation({
  args: {
    sessionToken: v.string(),
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await verifyAuth(ctx, args.sessionToken);
    if (!userId) throw new Error('Unauthorized');

    const cutoff = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;

    const oldData = await ctx.db
      .query('scrapedData')
      .filter((q) => q.lt(q.field('scrapedAt'), cutoff))
      .collect();

    for (const record of oldData) {
      await ctx.db.delete(record._id);
    }

    return { deleted: oldData.length };
  },
});

// ============ AUTO BUILD PIPELINE (daily cron) ============
//
// Fetches the most-picked Yuumi support build from OP.GG's champion API,
// resolves names/icons via Data Dragon, and stores a compact JSON blob in
// guideMetadata under AUTO_BUILD_KEY. The site and share embeds read this
// blob and fall back to the static build when it is missing.
// Keep-last-good: on any fetch/parse failure nothing is overwritten.

const AUTO_BUILD_KEY = 'autoBuild';
const OPGG_URL =
  'https://lol-api-champion.op.gg/api/EUW/champions/ranked/yuumi/support';
const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';

// Stat shard IDs -> icon keys used by the guide UI.
const STAT_MOD_KEYS: Record<number, string> = {
  5001: 'HealthScaling',
  5002: 'Armor',
  5003: 'MagicRes',
  5005: 'AttackSpeed',
  5007: 'AbilityHaste',
  5008: 'AdaptiveForce',
  5010: 'MoveSpeed',
  5011: 'Health',
  5013: 'TenacitySlowResist',
};

type RuneInfo = { id: number; name: string; key: string; icon: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function numberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((n): n is number => typeof n === 'number')
    : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((s): s is string => typeof s === 'string')
    : [];
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'YuumiChallenges/1.0 (yuumi.quest)' },
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

/** Builds perk id -> {name,key,icon} from Data Dragon runesReforged. */
async function fetchRuneInfoMap(
  version: string
): Promise<Map<number, RuneInfo>> {
  const styles = await fetchJson(
    `${DDRAGON_BASE}/cdn/${version}/data/en_US/runesReforged.json`
  );
  const map = new Map<number, RuneInfo>();
  if (!Array.isArray(styles)) return map;
  for (const style of styles) {
    if (!isRecord(style) || !Array.isArray(style.slots)) continue;
    for (const slot of style.slots) {
      if (!isRecord(slot) || !Array.isArray(slot.runes)) continue;
      for (const rune of slot.runes) {
        if (
          isRecord(rune) &&
          typeof rune.id === 'number' &&
          typeof rune.name === 'string' &&
          typeof rune.key === 'string' &&
          typeof rune.icon === 'string'
        ) {
          map.set(rune.id, {
            id: rune.id,
            name: rune.name,
            key: rune.key,
            icon: rune.icon,
          });
        }
      }
    }
  }
  return map;
}

/** Builds item id -> name from Data Dragon item.json. */
async function fetchItemNameMap(version: string): Promise<Map<number, string>> {
  const payload = await fetchJson(
    `${DDRAGON_BASE}/cdn/${version}/data/en_US/item.json`
  );
  const map = new Map<number, string>();
  if (!isRecord(payload) || !isRecord(payload.data)) return map;
  for (const [id, item] of Object.entries(payload.data)) {
    if (isRecord(item) && typeof item.name === 'string') {
      map.set(Number(id), item.name);
    }
  }
  return map;
}

export const recordAutoBuild = internalMutation({
  args: {
    success: v.boolean(),
    error: v.optional(v.string()),
    json: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('scrapeJobs', {
      source: 'opgg-auto',
      status: args.success ? 'completed' : 'failed',
      completedAt: Date.now(),
      ...(args.error ? { error: args.error } : {}),
      ...(args.success ? { recordsScraped: 1 } : {}),
    });

    if (args.success && args.json) {
      const existing = await ctx.db
        .query('guideMetadata')
        .withIndex('by_key', (q) => q.eq('key', AUTO_BUILD_KEY))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          value: args.json,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert('guideMetadata', {
          key: AUTO_BUILD_KEY,
          value: args.json,
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true };
  },
});

export const autoUpdateBuild = internalAction({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Sources
      const versions = await fetchJson(`${DDRAGON_BASE}/api/versions.json`);
      const version =
        Array.isArray(versions) && typeof versions[0] === 'string'
          ? versions[0]
          : null;
      if (!version) throw new Error('No Data Dragon version available');

      const opgg = await fetchJson(OPGG_URL);
      if (!isRecord(opgg) || !isRecord(opgg.data)) {
        throw new Error('Unexpected OP.GG payload shape');
      }
      const data = opgg.data;
      const meta = isRecord(opgg.meta) ? opgg.meta : {};

      const [runeInfo, itemNames] = await Promise.all([
        fetchRuneInfoMap(version),
        fetchItemNameMap(version),
      ]);

      // 2. Runes (most-picked page)
      const runeRow = Array.isArray(data.runes) ? data.runes[0] : null;
      if (!isRecord(runeRow)) throw new Error('OP.GG runes missing');
      const primaryIds = numberArray(runeRow.primary_rune_ids);
      const secondaryIds = numberArray(runeRow.secondary_rune_ids);
      const shardIds = numberArray(runeRow.stat_mod_ids);
      const runePage = Array.isArray(data.rune_pages)
        ? data.rune_pages[0]
        : null;
      const primaryStyleId =
        (isRecord(runeRow) && typeof runeRow.primary_page_id === 'number'
          ? runeRow.primary_page_id
          : null) ??
        (isRecord(runePage) && typeof runePage.primary_page_id === 'number'
          ? runePage.primary_page_id
          : null);
      const secondaryStyleId =
        (isRecord(runeRow) && typeof runeRow.secondary_page_id === 'number'
          ? runeRow.secondary_page_id
          : null) ??
        (isRecord(runePage) && typeof runePage.secondary_page_id === 'number'
          ? runePage.secondary_page_id
          : null);

      const resolveRunes = (ids: number[]): RuneInfo[] =>
        ids.flatMap((id) => {
          const info = runeInfo.get(id);
          return info ? [info] : [];
        });

      const primary = resolveRunes(primaryIds);
      const secondary = resolveRunes(secondaryIds);
      const keystone = primary[0];

      // 3. Items
      const coreRow = Array.isArray(data.core_items)
        ? data.core_items[0]
        : null;
      const coreIds = isRecord(coreRow) ? numberArray(coreRow.ids) : [];
      const bootsRow = Array.isArray(data.boots) ? data.boots[0] : null;
      const bootsId = isRecord(bootsRow)
        ? (numberArray(bootsRow.ids)[0] ?? null)
        : null;

      const coreItems = coreIds.flatMap((id) => {
        const name = itemNames.get(id);
        return name ? [{ id, name }] : [];
      });

      // 4. Skills
      const masteryRow = Array.isArray(data.skill_masteries)
        ? data.skill_masteries[0]
        : null;
      const skillPriority = isRecord(masteryRow)
        ? stringArray(masteryRow.ids)
        : [];
      const skillsRow = Array.isArray(data.skills) ? data.skills[0] : null;
      const skillOrder = isRecord(skillsRow)
        ? stringArray(skillsRow.order)
        : [];

      // 5. Validate before overwriting anything (keep-last-good)
      if (!keystone) throw new Error('Keystone could not be resolved');
      if (primary.length < 4) throw new Error('Primary runes incomplete');
      if (secondary.length < 2) throw new Error('Secondary runes incomplete');
      if (coreItems.length < 2) throw new Error('Core items incomplete');
      if (skillPriority.length !== 3) {
        throw new Error('Skill priority incomplete');
      }

      const patch =
        typeof meta.version === 'string'
          ? meta.version
          : version.split('.').slice(0, 2).join('.');

      const autoBuild = {
        version: 1,
        patch,
        updatedAt: Date.now(),
        source: 'OP.GG · Ranked · EUW',
        runes: {
          primaryStyleId,
          secondaryStyleId,
          keystone,
          primary: primary.slice(1),
          secondary,
          shardKeys: shardIds.flatMap((id) => {
            const key = STAT_MOD_KEYS[id];
            return key ? [key] : [];
          }),
        },
        coreItems,
        boots:
          bootsId && itemNames.get(bootsId)
            ? { id: bootsId, name: itemNames.get(bootsId)! }
            : null,
        skillPriority,
        skillOrder: skillOrder.length === 18 ? skillOrder : null,
      };

      await ctx.runMutation(internal.scraper.recordAutoBuild, {
        success: true,
        json: JSON.stringify(autoBuild),
      });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await ctx.runMutation(internal.scraper.recordAutoBuild, {
        success: false,
        error: message,
      });
      return { success: false, error: message };
    }
  },
});
