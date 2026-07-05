import { v } from 'convex/values';
import { mutation, query, action } from './_generated/server';
import { api } from './_generated/api';
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
    const limit = args.limit || 50;
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
