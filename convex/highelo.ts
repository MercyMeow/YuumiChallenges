import { v } from 'convex/values';
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server';
import type { ActionCtx } from './_generated/server';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';

// ============ HIGH-ELO YUUMI GAMES FEED ============
//
// Two-tier discovery (docs/plans/2026-07-06-high-elo-games-feed-design.md):
//  - sweepLadderChunk (15 min): refresh Master+ ladders daily per platform,
//    roll through cheap champion-mastery checks to find players who play
//    Yuumi, keep them in yuumiRoster.
//  - pollRosterMatches (5 min): check roster players' new ranked games,
//    store card-sized rows in yuumiGames.
//  - pruneOldGames (daily): drop games from before the current season and
//    roster entries that went inactive.

const YUUMI_CHAMPION_ID = 350;
const RANKED_SOLO_QUEUE = 420;

// Every live platform routing value and its match-v5 regional cluster.
const PLATFORM_TO_CLUSTER = {
  br1: 'americas',
  la1: 'americas',
  la2: 'americas',
  na1: 'americas',
  jp1: 'asia',
  kr: 'asia',
  eun1: 'europe',
  euw1: 'europe',
  me1: 'europe',
  ru: 'europe',
  tr1: 'europe',
  oc1: 'sea',
  sg2: 'sea',
  tw2: 'sea',
  vn2: 'sea',
} as const;

type Platform = keyof typeof PLATFORM_TO_CLUSTER;
const PLATFORMS = Object.keys(PLATFORM_TO_CLUSTER) as Platform[];

// Sweep pacing: mastery checks per platform per 15-min run. Ladders hold
// roughly 3-6k Master+ players per platform, so a full pass completes in a
// few hours and then keeps rolling.
const MASTERY_CHECKS_PER_RUN = 250;
const LEAGUE_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
// Played Yuumi within this window -> watched by the fast loop.
const YUUMI_ACTIVITY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
// Roster entries idle longer than this get pruned daily.
const ROSTER_RETENTION_MS = 45 * 24 * 60 * 60 * 1000;
// Most roster players polled per 5-min run (stalest first).
const POLL_PLAYERS_PER_RUN = 1500;
// match-ids lookback: startTime filters by game START, so a game that began
// before the last poll but ended after it needs the buffer to be caught.
const POLL_LOOKBACK_MS = 3 * 60 * 60 * 1000;
// Flush poll results to the DB every N players so a late failure or an
// action timeout can't discard a whole cluster's progress.
const POLL_FLUSH_EVERY = 150;
// Games shorter than this are remakes (early surrender), not real games.
const REMAKE_MAX_DURATION_S = 300;
// Season retention fallback when the seasonStart metadata key is unset.
const DEFAULT_SEASON_LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;
// Backfill: fetch budget per cluster per run; matches checked per player.
const BACKFILL_MATCH_FETCH_BUDGET = 250;
const BACKFILL_MATCHES_PER_PLAYER = 200;
const BACKFILL_PLAYERS_PER_RUN = 40; // per cluster, upper bound

// ---------- generic helpers ----------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function riotApiKey(): string {
  const key = process.env.RIOT_API_KEY;
  if (!key) {
    throw new Error('RIOT_API_KEY is not set in the Convex environment');
  }
  return key;
}

/**
 * GET a Riot API URL. Returns parsed JSON, or null on 404. Retries twice on
 * 429 honoring Retry-After; throws on other errors so callers can decide.
 *
 * No token bucket: pacing relies on the chunk-size constants above plus
 * these 429 retries. If Riot tightens app limits, a shared limiter per
 * platform/cluster would be the next step.
 */
async function riotFetch(url: string): Promise<unknown> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: { 'X-Riot-Token': riotApiKey() },
    });
    if (res.status === 404) return null;
    if (res.status === 429) {
      // Riot's app-limit windows go up to ~120s; a missing or malformed
      // Retry-After falls back to a short pause instead of a hot retry.
      const parsed = Number(res.headers.get('Retry-After'));
      const retryAfter = Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
      await sleep(Math.min(retryAfter, 120) * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`Riot API ${res.status}: ${url}`);
    return res.json();
  }
  throw new Error(`Riot API rate limited after retries: ${url}`);
}

/** ['16.13', '16.12'] — current and previous patch from Data Dragon. */
async function fetchPatchWindow(): Promise<string[]> {
  const res = await fetch(
    'https://ddragon.leagueoflegends.com/api/versions.json'
  );
  if (!res.ok) throw new Error(`versions.json returned ${res.status}`);
  const versions = (await res.json()) as unknown;
  if (!Array.isArray(versions)) throw new Error('versions.json malformed');
  const patches: string[] = [];
  for (const version of versions) {
    if (typeof version !== 'string') continue;
    const [major, minor] = version.split('.');
    if (!major || !minor || Number.isNaN(Number(major))) continue;
    const patch = `${major}.${minor}`;
    if (!patches.includes(patch)) patches.push(patch);
    if (patches.length === 2) break;
  }
  if (patches.length < 2) throw new Error('could not derive patch window');
  return patches;
}

/** True when patch `a` is strictly older than `b` ('major.minor' strings). */
function isOlderPatch(a: string, b: string): boolean {
  const [aMajor = 0, aMinor = 0] = a.split('.').map(Number);
  const [bMajor = 0, bMinor = 0] = b.split('.').map(Number);
  return aMajor !== bMajor ? aMajor < bMajor : aMinor < bMinor;
}

// ---------- season metadata ----------

export const getMetadataValue = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique();
    return row?.value ?? null;
  },
});

export const setMetadataValue = internalMutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique();
    if (row) {
      await ctx.db.patch(row._id, { value: args.value, updatedAt: Date.now() });
    } else {
      await ctx.db.insert('guideMetadata', { ...args, updatedAt: Date.now() });
    }
  },
});

/** Season start (ms). Falls back to a 90-day lookback if unconfigured. */
async function getSeasonStart(ctx: ActionCtx): Promise<number> {
  const raw = await ctx.runQuery(internal.highelo.getMetadataValue, {
    key: 'seasonStart',
  });
  const parsed = raw === null ? NaN : Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  console.warn('seasonStart metadata missing — defaulting to 90-day window');
  return Date.now() - DEFAULT_SEASON_LOOKBACK_MS;
}

// ---------- public queries ----------

export const listGames = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 500);
    // Games are retained all season for profiles; the feed shows only the
    // stored current+last patch window. Games newer than the stored window
    // (ddragon lag) are hidden for at most hours until the next poll run.
    const meta = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', 'patchWindow'))
      .unique();
    let window: string[] = [];
    try {
      const parsed: unknown = meta ? JSON.parse(meta.value) : [];
      if (Array.isArray(parsed)) {
        window = parsed.filter((p): p is string => typeof p === 'string');
      }
    } catch {
      window = [];
    }
    const results = await ctx.db
      .query('yuumiGames')
      .withIndex('by_gameCreation')
      .order('desc')
      .filter((q) =>
        window.length === 0
          ? true
          : q.or(...window.map((p) => q.eq(q.field('patch'), p)))
      )
      .take(limit);
    return results;
  },
});

const TIER_ORDER: Record<string, number> = {
  CHALLENGER: 0,
  GRANDMASTER: 1,
  MASTER: 2,
};

/** LP-ranked Master+ Yuumi players with season stats (small table). */
export const listPlayers = query({
  args: {},
  handler: async (ctx) => {
    const roster = await ctx.db.query('yuumiRoster').collect();
    return roster
      .filter((p) => (p.gamesCount ?? 0) > 0 && p.gameName)
      .sort(
        (a, b) =>
          (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9) || b.lp - a.lp
      )
      .map((p) => ({
        puuid: p.puuid,
        platform: p.platform,
        tier: p.tier,
        lp: p.lp,
        gameName: p.gameName ?? 'Unknown',
        tagLine: p.tagLine ?? '',
        gamesCount: p.gamesCount ?? 0,
        wins: p.wins ?? 0,
        killsTotal: p.killsTotal ?? 0,
        deathsTotal: p.deathsTotal ?? 0,
        assistsTotal: p.assistsTotal ?? 0,
      }));
  },
});

export const getPlayerProfile = query({
  args: { platform: v.string(), gameName: v.string(), tagLine: v.string() },
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query('yuumiRoster')
      .withIndex('by_platform', (q) => q.eq('platform', args.platform))
      .collect();
    const nameLc = args.gameName.toLowerCase();
    const tagLc = args.tagLine.toLowerCase();
    const player = candidates.find(
      (p) =>
        (p.gameName ?? '').toLowerCase() === nameLc &&
        (p.tagLine ?? '').toLowerCase() === tagLc
    );
    if (!player) return null;

    const games = await ctx.db
      .query('yuumiGames')
      .withIndex('by_puuid', (q) => q.eq('puuid', player.puuid))
      .collect();
    games.sort((a, b) => b.gameCreation - a.gameCreation);

    // Ladder position among Yuumi players with games (global).
    const roster = await ctx.db.query('yuumiRoster').collect();
    const ranked = roster
      .filter((p) => (p.gamesCount ?? 0) > 0)
      .sort(
        (a, b) =>
          (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9) || b.lp - a.lp
      );
    const position = ranked.findIndex((p) => p.puuid === player.puuid) + 1;

    // Common builds: completed items (exclude empties + trinkets), sorted
    // signature -> occurrences. Trinkets: 3340/3363/3364; wards 2055.
    const EXCLUDED_ITEMS = new Set([0, 2055, 3340, 3363, 3364]);
    const buildGroups = new Map<
      string,
      { items: number[]; games: number; wins: number }
    >();
    const runeGroups = new Map<
      string,
      {
        keystoneId: number;
        secondaryStyleId: number;
        summonerSpells: number[];
        games: number;
        wins: number;
      }
    >();
    const duoGroups = new Map<string, { games: number; wins: number }>();
    for (const game of games) {
      if (game.items) {
        const core = game.items
          .filter((id) => !EXCLUDED_ITEMS.has(id))
          .sort((a, b) => a - b);
        if (core.length >= 3) {
          const key = core.join(',');
          const group = buildGroups.get(key) ?? {
            items: core,
            games: 0,
            wins: 0,
          };
          group.games++;
          if (game.win) group.wins++;
          buildGroups.set(key, group);
        }
      }
      if (game.keystoneId && game.secondaryStyleId && game.summonerSpells) {
        const spells = [...game.summonerSpells].sort((a, b) => a - b);
        const key = `${game.keystoneId}:${game.secondaryStyleId}:${spells.join(',')}`;
        const group = runeGroups.get(key) ?? {
          keystoneId: game.keystoneId,
          secondaryStyleId: game.secondaryStyleId,
          summonerSpells: spells,
          games: 0,
          wins: 0,
        };
        group.games++;
        if (game.win) group.wins++;
        runeGroups.set(key, group);
      }
      if (game.duoChampion) {
        const group = duoGroups.get(game.duoChampion) ?? { games: 0, wins: 0 };
        group.games++;
        if (game.win) group.wins++;
        duoGroups.set(game.duoChampion, group);
      }
    }
    const byGames = <T extends { games: number }>(a: T, b: T) =>
      b.games - a.games;

    return {
      player: {
        puuid: player.puuid,
        platform: player.platform,
        tier: player.tier,
        lp: player.lp,
        gameName: player.gameName ?? 'Unknown',
        tagLine: player.tagLine ?? '',
        gamesCount: player.gamesCount ?? 0,
        wins: player.wins ?? 0,
        killsTotal: player.killsTotal ?? 0,
        deathsTotal: player.deathsTotal ?? 0,
        assistsTotal: player.assistsTotal ?? 0,
        position,
      },
      builds: [...buildGroups.values()].sort(byGames).slice(0, 3),
      runePages: [...runeGroups.values()].sort(byGames).slice(0, 2),
      duos: [...duoGroups.entries()]
        .map(([champion, stats]) => ({ champion, ...stats }))
        .sort(byGames)
        .slice(0, 5),
      recentGames: games.slice(0, 20),
    };
  },
});

// ---------- internal plumbing (sweep) ----------

export const getSweepState = internalQuery({
  args: { platform: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sweepState')
      .withIndex('by_platform', (q) => q.eq('platform', args.platform))
      .unique();
  },
});

export const setSweepState = internalMutation({
  args: { platform: v.string(), lastLeagueRefreshAt: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('sweepState')
      .withIndex('by_platform', (q) => q.eq('platform', args.platform))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastLeagueRefreshAt: args.lastLeagueRefreshAt,
      });
    } else {
      await ctx.db.insert('sweepState', args);
    }
  },
});

/** Deletes up to `limit` queue rows for a platform; returns count deleted. */
export const clearSweepQueueBatch = internalMutation({
  args: { platform: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('sweepQueue')
      .withIndex('by_platform', (q) => q.eq('platform', args.platform))
      .take(args.limit);
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return rows.length;
  },
});

export const enqueueSweepEntries = internalMutation({
  args: {
    platform: v.string(),
    entries: v.array(
      v.object({ puuid: v.string(), tier: v.string(), lp: v.number() })
    ),
  },
  handler: async (ctx, args) => {
    for (const entry of args.entries) {
      await ctx.db.insert('sweepQueue', { platform: args.platform, ...entry });
    }
  },
});

export const takeSweepQueue = internalQuery({
  args: { platform: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sweepQueue')
      .withIndex('by_platform', (q) => q.eq('platform', args.platform))
      .take(args.limit);
  },
});

/** Batch-finish a sweep chunk: drop queue rows, upsert found Yuumi players. */
export const finishSweepChunk = internalMutation({
  args: {
    queueIds: v.array(v.id('sweepQueue')),
    rosterUpserts: v.array(
      v.object({
        puuid: v.string(),
        platform: v.string(),
        tier: v.string(),
        lp: v.number(),
        yuumiLastPlayTime: v.number(),
      })
    ),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    for (const id of args.queueIds) {
      await ctx.db.delete(id);
    }
    for (const entry of args.rosterUpserts) {
      const existing = await ctx.db
        .query('yuumiRoster')
        .withIndex('by_puuid', (q) => q.eq('puuid', entry.puuid))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          platform: entry.platform,
          tier: entry.tier,
          lp: entry.lp,
          yuumiLastPlayTime: entry.yuumiLastPlayTime,
        });
      } else {
        await ctx.db.insert('yuumiRoster', {
          ...entry,
          lastCheckedAt: args.now,
        });
      }
    }
  },
});

/** Roster rows for one platform (a few hundred max) — id + puuid only. */
export const getRosterPuuidsByPlatform = internalQuery({
  args: { platform: v.string() },
  handler: async (ctx, args) => {
    const roster = await ctx.db
      .query('yuumiRoster')
      .withIndex('by_platform', (q) => q.eq('platform', args.platform))
      .collect();
    return roster.map((entry) => ({ _id: entry._id, puuid: entry.puuid }));
  },
});

/** Deletes roster rows by id. Callers chunk (Convex caps arrays at 8192). */
export const deleteRosterEntries = internalMutation({
  args: { ids: v.array(v.id('yuumiRoster')) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  },
});

// ---------- internal plumbing (poll) ----------

export const takeRosterForPoll = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('yuumiRoster')
      .withIndex('by_lastCheckedAt')
      .order('asc')
      .take(args.limit);
  },
});

export const getExistingMatchIds = internalQuery({
  args: { matchIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const existing: string[] = [];
    for (const matchId of args.matchIds) {
      const row = await ctx.db
        .query('yuumiGames')
        .withIndex('by_matchId', (q) => q.eq('matchId', matchId))
        .unique();
      if (row) existing.push(matchId);
    }
    return existing;
  },
});

const gameValidator = v.object({
  matchId: v.string(),
  platform: v.string(),
  patch: v.string(),
  gameCreation: v.number(),
  gameDuration: v.number(),
  win: v.boolean(),
  playerName: v.string(),
  playerTag: v.string(),
  tier: v.string(),
  lp: v.number(),
  kills: v.number(),
  deaths: v.number(),
  assists: v.number(),
  allyChampions: v.array(v.string()),
  enemyChampions: v.array(v.string()),
  puuid: v.string(),
  items: v.array(v.number()),
  keystoneId: v.number(),
  secondaryStyleId: v.number(),
  summonerSpells: v.array(v.number()),
  duoChampion: v.optional(v.string()),
});

/** Batch-record a poll run: insert new games, stamp roster lastCheckedAt. */
export const recordPollResults = internalMutation({
  args: {
    rosterIds: v.array(v.id('yuumiRoster')),
    checkedAt: v.number(),
    games: v.array(gameValidator),
  },
  handler: async (ctx, args) => {
    const seen = new Set<string>();
    for (const game of args.games) {
      if (seen.has(game.matchId)) continue;
      seen.add(game.matchId);
      const existing = await ctx.db
        .query('yuumiGames')
        .withIndex('by_matchId', (q) => q.eq('matchId', game.matchId))
        .unique();
      if (!existing) {
        await ctx.db.insert('yuumiGames', game);
        const rosterRow = await ctx.db
          .query('yuumiRoster')
          .withIndex('by_puuid', (q) => q.eq('puuid', game.puuid))
          .unique();
        if (rosterRow) {
          await ctx.db.patch(rosterRow._id, {
            gameName: game.playerName,
            tagLine: game.playerTag,
            gamesCount: (rosterRow.gamesCount ?? 0) + 1,
            wins: (rosterRow.wins ?? 0) + (game.win ? 1 : 0),
            killsTotal: (rosterRow.killsTotal ?? 0) + game.kills,
            deathsTotal: (rosterRow.deathsTotal ?? 0) + game.deaths,
            assistsTotal: (rosterRow.assistsTotal ?? 0) + game.assists,
          });
        }
      }
    }
    for (const id of args.rosterIds) {
      // The row may have been deleted by a prune mid-poll — don't throw.
      const row = await ctx.db.get(id);
      if (row) {
        await ctx.db.patch(id, { lastCheckedAt: args.checkedAt });
      }
    }
  },
});

/** Recompute a player's denormalized season stats from their game rows. */
export const recomputePlayerStats = internalMutation({
  args: { puuid: v.string() },
  handler: async (ctx, args) => {
    const rosterRow = await ctx.db
      .query('yuumiRoster')
      .withIndex('by_puuid', (q) => q.eq('puuid', args.puuid))
      .unique();
    if (!rosterRow) return;
    const games = await ctx.db
      .query('yuumiGames')
      .withIndex('by_puuid', (q) => q.eq('puuid', args.puuid))
      .collect();
    const stats = {
      gamesCount: games.length,
      wins: games.filter((g) => g.win).length,
      killsTotal: games.reduce((sum, g) => sum + g.kills, 0),
      deathsTotal: games.reduce((sum, g) => sum + g.deaths, 0),
      assistsTotal: games.reduce((sum, g) => sum + g.assists, 0),
    };
    await ctx.db.patch(rosterRow._id, stats);
  },
});

// ---------- internal plumbing (backfill) ----------

/** Unbackfilled roster players, most recently active first. */
export const takeRosterForBackfill = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    // Roster is small — collect() + in-memory filter avoids an index on an
    // optional field.
    const roster = await ctx.db.query('yuumiRoster').collect();
    return roster
      .filter((entry) => entry.backfilledAt === undefined)
      .sort((a, b) => b.yuumiLastPlayTime - a.yuumiLastPlayTime)
      .slice(0, args.limit);
  },
});

export const markBackfilled = internalMutation({
  args: { ids: v.array(v.id('yuumiRoster')), at: v.number() },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const row = await ctx.db.get(id);
      if (row) await ctx.db.patch(id, { backfilledAt: args.at });
    }
  },
});

// ---------- internal plumbing (prune) ----------

/** Deletes up to 2000 games that started before the season; returns count. */
export const deleteGamesBeforeSeason = internalMutation({
  args: { seasonStart: v.number() },
  handler: async (ctx, args) => {
    const games = await ctx.db
      .query('yuumiGames')
      .withIndex('by_gameCreation')
      .order('asc')
      .take(2000);
    let deleted = 0;
    for (const game of games) {
      if (game.gameCreation >= args.seasonStart) break; // index-ordered
      await ctx.db.delete(game._id);
      deleted++;
    }
    return deleted;
  },
});

export const pruneInactiveRoster = internalMutation({
  args: { cutoff: v.number() },
  handler: async (ctx, args) => {
    const roster = await ctx.db.query('yuumiRoster').collect();
    for (const entry of roster) {
      if (entry.yuumiLastPlayTime < args.cutoff) {
        await ctx.db.delete(entry._id);
      }
    }
  },
});

// ---------- actions ----------

type LadderEntry = { puuid: string; tier: string; lp: number };

/** All Master+ solo-queue entries for one platform (3 League-V4 calls). */
async function fetchLadder(platform: Platform): Promise<LadderEntry[]> {
  const base = `https://${platform}.api.riotgames.com/lol/league/v4`;
  const tiers = [
    ['challengerleagues', 'CHALLENGER'],
    ['grandmasterleagues', 'GRANDMASTER'],
    ['masterleagues', 'MASTER'],
  ] as const;
  const entries: LadderEntry[] = [];
  for (const [path, tier] of tiers) {
    const data = await riotFetch(`${base}/${path}/by-queue/RANKED_SOLO_5x5`);
    if (!isRecord(data) || !Array.isArray(data.entries)) {
      console.warn(`ladder ${platform}/${path}: unexpected response shape`);
      continue;
    }
    for (const entry of data.entries) {
      if (isRecord(entry) && typeof entry.puuid === 'string') {
        entries.push({
          puuid: entry.puuid,
          tier,
          lp: typeof entry.leaguePoints === 'number' ? entry.leaguePoints : 0,
        });
      }
    }
  }
  return entries;
}

async function sweepPlatform(
  ctx: ActionCtx,
  platform: Platform
): Promise<void> {
  const now = Date.now();
  const state = await ctx.runQuery(internal.highelo.getSweepState, {
    platform,
  });

  // Refresh the ladder once a day, replacing the pending queue.
  if (!state || now - state.lastLeagueRefreshAt > LEAGUE_REFRESH_INTERVAL_MS) {
    const ladder = await fetchLadder(platform);
    if (ladder.length > 0) {
      let cleared = 0;
      do {
        cleared = await ctx.runMutation(internal.highelo.clearSweepQueueBatch, {
          platform,
          limit: 1000,
        });
      } while (cleared > 0);
      for (let i = 0; i < ladder.length; i += 500) {
        await ctx.runMutation(internal.highelo.enqueueSweepEntries, {
          platform,
          entries: ladder.slice(i, i + 500),
        });
      }
      // Demotions: drop roster rows that fell off the fresh Master+ ladder
      // so they stop producing cards with frozen tier/LP. The delete list
      // is computed here in the action: full ladders can exceed Convex's
      // 8192-element array cap (KR Master+ is >10k), but the per-platform
      // roster — let alone its demoted subset — never will.
      const ladderPuuids = new Set(ladder.map((entry) => entry.puuid));
      const rosterRows = await ctx.runQuery(
        internal.highelo.getRosterPuuidsByPlatform,
        { platform }
      );
      const demotedIds = rosterRows
        .filter((row) => !ladderPuuids.has(row.puuid))
        .map((row) => row._id);
      for (let i = 0; i < demotedIds.length; i += 1000) {
        await ctx.runMutation(internal.highelo.deleteRosterEntries, {
          ids: demotedIds.slice(i, i + 1000),
        });
      }
      await ctx.runMutation(internal.highelo.setSweepState, {
        platform,
        lastLeagueRefreshAt: now,
      });
    }
  }

  // Work through a chunk of pending mastery checks.
  const pending = await ctx.runQuery(internal.highelo.takeSweepQueue, {
    platform,
    limit: MASTERY_CHECKS_PER_RUN,
  });
  if (pending.length === 0) return;

  const queueIds: Id<'sweepQueue'>[] = [];
  const rosterUpserts: {
    puuid: string;
    platform: string;
    tier: string;
    lp: number;
    yuumiLastPlayTime: number;
  }[] = [];
  for (const item of pending) {
    // A failed check stays in the queue for the next run; one flaky call
    // must not abort the whole platform's chunk.
    let mastery: unknown;
    try {
      mastery = await riotFetch(
        `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${item.puuid}/by-champion/${YUUMI_CHAMPION_ID}`
      );
    } catch (error) {
      console.error(`sweep ${platform}: mastery ${item.puuid} failed:`, error);
      continue;
    }
    queueIds.push(item._id);
    const lastPlayTime =
      isRecord(mastery) && typeof mastery.lastPlayTime === 'number'
        ? mastery.lastPlayTime
        : 0;
    if (now - lastPlayTime < YUUMI_ACTIVITY_WINDOW_MS) {
      rosterUpserts.push({
        puuid: item.puuid,
        platform,
        tier: item.tier,
        lp: item.lp,
        yuumiLastPlayTime: lastPlayTime,
      });
    }
  }
  await ctx.runMutation(internal.highelo.finishSweepChunk, {
    queueIds,
    rosterUpserts,
    now,
  });
}

/**
 * Rolling roster builder (every 15 min). Platforms have independent rate
 * limits, so they sweep in parallel; per-platform failures are isolated.
 */
export const sweepLadderChunk = internalAction({
  args: {},
  handler: async (ctx) => {
    await Promise.all(
      PLATFORMS.map((platform) =>
        sweepPlatform(ctx, platform).catch((error) => {
          console.error(`sweep ${platform} failed:`, error);
        })
      )
    );
  },
});

type GameRow = {
  matchId: string;
  platform: string;
  patch: string;
  gameCreation: number;
  gameDuration: number;
  win: boolean;
  playerName: string;
  playerTag: string;
  tier: string;
  lp: number;
  kills: number;
  deaths: number;
  assists: number;
  allyChampions: string[];
  enemyChampions: string[];
  puuid: string;
  items: number[];
  keystoneId: number;
  secondaryStyleId: number;
  summonerSpells: number[];
  duoChampion?: string;
};

// match-v5 keeps a couple of legacy champion spellings Data Dragon rejects.
const CHAMPION_NAME_FIXES: Record<string, string> = {
  FiddleSticks: 'Fiddlesticks',
};

function fixChampionName(name: string): string {
  return CHAMPION_NAME_FIXES[name] ?? name;
}

/**
 * Card row from a match-v5 payload, or null if it doesn't qualify.
 * `patchWindow: null` skips the patch gate (season backfill spans patches).
 */
function extractGame(
  match: unknown,
  player: Doc<'yuumiRoster'>,
  patchWindow: string[] | null
): GameRow | null {
  if (!isRecord(match) || !isRecord(match.metadata) || !isRecord(match.info)) {
    return null;
  }
  const { metadata, info } = match;
  if (typeof metadata.matchId !== 'string') return null;
  if (info.queueId !== RANKED_SOLO_QUEUE) return null;
  if (typeof info.gameVersion !== 'string') return null;
  const [major, minor] = info.gameVersion.split('.');
  const patch = major && minor ? `${major}.${minor}` : '';
  if (!patch) return null;
  // ddragon's versions.json lags new patch releases, so reject only games
  // strictly OLDER than the window — current, last, and anything newer all
  // qualify. pruneOldGames stays strict and cleans up oddities later.
  if (patchWindow !== null) {
    const oldestPatch = patchWindow[patchWindow.length - 1];
    if (!oldestPatch || isOlderPatch(patch, oldestPatch)) return null;
  }
  if (!Array.isArray(info.participants)) return null;
  const gameDuration =
    typeof info.gameDuration === 'number' ? info.gameDuration : 0;
  if (gameDuration < REMAKE_MAX_DURATION_S) return null;

  const participants = info.participants.filter(isRecord);
  const yuumi = participants.find(
    (p) => p.puuid === player.puuid && p.championName === 'Yuumi'
  );
  if (!yuumi) return null;

  const allyChampions: string[] = [];
  const enemyChampions: string[] = [];
  for (const p of participants) {
    if (typeof p.championName !== 'string') continue;
    const name = fixChampionName(p.championName);
    if (p.teamId === yuumi.teamId) allyChampions.push(name);
    else enemyChampions.push(name);
  }
  if (allyChampions.length !== 5 || enemyChampions.length !== 5) return null;

  const items: number[] = [];
  for (let slot = 0; slot <= 6; slot++) {
    const value = yuumi[`item${slot}`];
    items.push(typeof value === 'number' ? value : 0);
  }
  let keystoneId = 0;
  let secondaryStyleId = 0;
  if (isRecord(yuumi.perks) && Array.isArray(yuumi.perks.styles)) {
    const styles = yuumi.perks.styles.filter(isRecord);
    const primary = styles.find((s) => s.description === 'primaryStyle');
    const secondary = styles.find((s) => s.description === 'subStyle');
    if (primary && Array.isArray(primary.selections)) {
      const first = primary.selections.filter(isRecord)[0];
      if (first && typeof first.perk === 'number') keystoneId = first.perk;
    }
    if (secondary && typeof secondary.style === 'number') {
      secondaryStyleId = secondary.style;
    }
  }
  const summonerSpells = [
    typeof yuumi.summoner1Id === 'number' ? yuumi.summoner1Id : 0,
    typeof yuumi.summoner2Id === 'number' ? yuumi.summoner2Id : 0,
  ];
  const duo = participants.find(
    (p) =>
      p.teamId === yuumi.teamId &&
      p.puuid !== yuumi.puuid &&
      p.teamPosition === 'BOTTOM' &&
      typeof p.championName === 'string'
  );

  return {
    matchId: metadata.matchId,
    platform: player.platform,
    patch,
    gameCreation:
      typeof info.gameCreation === 'number' ? info.gameCreation : Date.now(),
    gameDuration,
    win: yuumi.win === true,
    playerName:
      typeof yuumi.riotIdGameName === 'string' && yuumi.riotIdGameName !== ''
        ? yuumi.riotIdGameName
        : typeof yuumi.summonerName === 'string' && yuumi.summonerName !== ''
          ? yuumi.summonerName
          : 'Unknown',
    playerTag:
      typeof yuumi.riotIdTagline === 'string' ? yuumi.riotIdTagline : '',
    tier: player.tier,
    lp: player.lp,
    kills: typeof yuumi.kills === 'number' ? yuumi.kills : 0,
    deaths: typeof yuumi.deaths === 'number' ? yuumi.deaths : 0,
    assists: typeof yuumi.assists === 'number' ? yuumi.assists : 0,
    allyChampions,
    enemyChampions,
    puuid: player.puuid,
    items,
    keystoneId,
    secondaryStyleId,
    summonerSpells,
    ...(duo
      ? { duoChampion: fixChampionName(duo.championName as string) }
      : {}),
  };
}

async function pollCluster(
  ctx: ActionCtx,
  cluster: string,
  players: Doc<'yuumiRoster'>[],
  patchWindow: string[]
): Promise<void> {
  let games: GameRow[] = [];
  let rosterIds: Id<'yuumiRoster'>[] = [];

  const flush = async () => {
    if (games.length === 0 && rosterIds.length === 0) return;
    await ctx.runMutation(internal.highelo.recordPollResults, {
      rosterIds,
      checkedAt: Date.now(),
      games,
    });
    games = [];
    rosterIds = [];
  };

  for (const player of players) {
    // Per-player isolation: on failure, skip the player WITHOUT stamping
    // lastCheckedAt (so the next run retries them) and keep the batch.
    try {
      const startTime = Math.max(
        Math.floor((player.lastCheckedAt - POLL_LOOKBACK_MS) / 1000),
        0
      );
      // count=10 bounds request cost; a roster player logging >10 ranked
      // games inside one poll window is implausible enough to accept.
      const ids = await riotFetch(
        `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${player.puuid}/ids?queue=${RANKED_SOLO_QUEUE}&startTime=${startTime}&count=10`
      );
      const playerGames: GameRow[] = [];
      if (Array.isArray(ids) && ids.length > 0) {
        const matchIds = ids.filter(
          (id): id is string => typeof id === 'string'
        );
        const existing = new Set(
          await ctx.runQuery(internal.highelo.getExistingMatchIds, {
            matchIds,
          })
        );
        for (const matchId of matchIds) {
          if (existing.has(matchId)) continue;
          const match = await riotFetch(
            `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`
          );
          const game = extractGame(match, player, patchWindow);
          if (game) playerGames.push(game);
        }
      }
      rosterIds.push(player._id);
      games.push(...playerGames);
    } catch (error) {
      console.error(`poll ${cluster}: player ${player.puuid} failed:`, error);
      continue;
    }
    if (rosterIds.length >= POLL_FLUSH_EVERY) {
      await flush();
    }
  }
  await flush();
}

/**
 * Fast loop (every 5 min): new ranked games for roster players, stalest
 * first. Clusters have independent rate limits -> parallel per cluster.
 */
export const pollRosterMatches = internalAction({
  args: {},
  handler: async (ctx) => {
    const roster = await ctx.runQuery(internal.highelo.takeRosterForPoll, {
      limit: POLL_PLAYERS_PER_RUN,
    });
    if (roster.length === 0) return;
    const patchWindow = await fetchPatchWindow();
    // Persist the window so listGames can scope the feed without a fetch.
    await ctx.runMutation(internal.highelo.setMetadataValue, {
      key: 'patchWindow',
      value: JSON.stringify(patchWindow),
    });

    const byCluster = new Map<string, Doc<'yuumiRoster'>[]>();
    const unknownPlatformIds: Id<'yuumiRoster'>[] = [];
    for (const player of roster) {
      const cluster = (PLATFORM_TO_CLUSTER as Record<string, string>)[
        player.platform
      ];
      if (!cluster) {
        // Unpollable, and stalest-first would resurface it every run —
        // drop the row instead of guessing a cluster.
        console.warn(
          `poll: unknown platform ${player.platform} for ${player.puuid}`
        );
        unknownPlatformIds.push(player._id);
        continue;
      }
      const list = byCluster.get(cluster) ?? [];
      list.push(player);
      byCluster.set(cluster, list);
    }
    if (unknownPlatformIds.length > 0) {
      await ctx.runMutation(internal.highelo.deleteRosterEntries, {
        ids: unknownPlatformIds,
      });
    }

    await Promise.all(
      [...byCluster.entries()].map(([cluster, players]) =>
        pollCluster(ctx, cluster, players, patchWindow).catch((error) => {
          console.error(`poll ${cluster} failed:`, error);
        })
      )
    );
  },
});

async function backfillCluster(
  ctx: ActionCtx,
  cluster: string,
  players: Doc<'yuumiRoster'>[],
  seasonStart: number
): Promise<void> {
  let budget = BACKFILL_MATCH_FETCH_BUDGET;
  for (const player of players) {
    if (budget <= 0) return;
    try {
      const startTime = Math.floor(seasonStart / 1000);
      const matchIds: string[] = [];
      for (let start = 0; start < BACKFILL_MATCHES_PER_PLAYER; start += 100) {
        const page = await riotFetch(
          `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${player.puuid}/ids?queue=${RANKED_SOLO_QUEUE}&startTime=${startTime}&start=${start}&count=100`
        );
        if (!Array.isArray(page) || page.length === 0) break;
        matchIds.push(
          ...page.filter((id): id is string => typeof id === 'string')
        );
        if (page.length < 100) break;
      }
      const existing = new Set(
        await ctx.runQuery(internal.highelo.getExistingMatchIds, { matchIds })
      );
      const pending = matchIds.filter((id) => !existing.has(id));
      if (pending.length > budget) {
        // Not enough budget to finish this player — leave them unmarked so
        // the next run resumes (dedup makes the redo cheap).
        return;
      }
      const games: GameRow[] = [];
      for (const matchId of pending) {
        budget--;
        const match = await riotFetch(
          `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`
        );
        const game = extractGame(match, player, null);
        if (game) games.push(game);
      }
      if (games.length > 0) {
        await ctx.runMutation(internal.highelo.recordPollResults, {
          rosterIds: [],
          checkedAt: Date.now(),
          games,
        });
      }
      await ctx.runMutation(internal.highelo.markBackfilled, {
        ids: [player._id],
        at: Date.now(),
      });
      await ctx.runMutation(internal.highelo.recomputePlayerStats, {
        puuid: player.puuid,
      });
    } catch (error) {
      console.error(
        `backfill ${cluster}: player ${player.puuid} failed:`,
        error
      );
    }
  }
}

/**
 * Season history backfill (every 15 min): budget-paced so the shared Riot
 * key's 5-minute poll and the site's match viewer never starve. Goes
 * dormant once every roster player is marked backfilled; newly swept
 * players get picked up automatically.
 */
export const backfillSeason = internalAction({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.runQuery(internal.highelo.takeRosterForBackfill, {
      limit: BACKFILL_PLAYERS_PER_RUN * 4,
    });
    if (players.length === 0) return;
    const seasonStart = await getSeasonStart(ctx);
    const byCluster = new Map<string, Doc<'yuumiRoster'>[]>();
    for (const player of players) {
      const cluster = (PLATFORM_TO_CLUSTER as Record<string, string>)[
        player.platform
      ];
      if (!cluster) continue; // poll cron handles unknown-platform cleanup
      const list = byCluster.get(cluster) ?? [];
      if (list.length < BACKFILL_PLAYERS_PER_RUN) list.push(player);
      byCluster.set(cluster, list);
    }
    await Promise.all(
      [...byCluster.entries()].map(([cluster, list]) =>
        backfillCluster(ctx, cluster, list, seasonStart).catch((error) => {
          console.error(`backfill ${cluster} failed:`, error);
        })
      )
    );
  },
});

/** Daily cleanup: keep only this season's games and an active roster. */
export const pruneOldGames = internalAction({
  args: {},
  handler: async (ctx) => {
    const seasonStart = await getSeasonStart(ctx);
    let deleted = 0;
    do {
      deleted = await ctx.runMutation(
        internal.highelo.deleteGamesBeforeSeason,
        { seasonStart }
      );
    } while (deleted > 0);
    await ctx.runMutation(internal.highelo.pruneInactiveRoster, {
      cutoff: Date.now() - ROSTER_RETENTION_MS,
    });
  },
});
