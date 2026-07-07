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
//  - pruneOldGames (daily): drop games outside the current+last patch
//    window and roster entries that went inactive.

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
 */
async function riotFetch(url: string): Promise<unknown> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: { 'X-Riot-Token': riotApiKey() },
    });
    if (res.status === 404) return null;
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After') ?? '2');
      await sleep(Math.min(retryAfter, 20) * 1000);
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

// ---------- public query ----------

export const listGames = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 500);
    return await ctx.db
      .query('yuumiGames')
      .withIndex('by_gameCreation')
      .order('desc')
      .take(limit);
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
      }
    }
    for (const id of args.rosterIds) {
      await ctx.db.patch(id, { lastCheckedAt: args.checkedAt });
    }
  },
});

// ---------- internal plumbing (prune) ----------

/** Deletes up to 2000 games outside the patch window; returns count. */
export const deleteGamesOutsidePatches = internalMutation({
  args: { patches: v.array(v.string()) },
  handler: async (ctx, args) => {
    const games = await ctx.db.query('yuumiGames').take(4000);
    let deleted = 0;
    for (const game of games) {
      if (!args.patches.includes(game.patch)) {
        await ctx.db.delete(game._id);
        deleted++;
        if (deleted >= 2000) break;
      }
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
    if (!isRecord(data) || !Array.isArray(data.entries)) continue;
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
    const mastery = await riotFetch(
      `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${item.puuid}/by-champion/${YUUMI_CHAMPION_ID}`
    );
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
};

// match-v5 keeps a couple of legacy champion spellings Data Dragon rejects.
const CHAMPION_NAME_FIXES: Record<string, string> = {
  FiddleSticks: 'Fiddlesticks',
};

function fixChampionName(name: string): string {
  return CHAMPION_NAME_FIXES[name] ?? name;
}

/** Card row from a match-v5 payload, or null if it doesn't qualify. */
function extractGame(
  match: unknown,
  player: Doc<'yuumiRoster'>,
  patchWindow: string[]
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
  if (!patchWindow.includes(patch)) return null;
  if (!Array.isArray(info.participants)) return null;

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

  return {
    matchId: metadata.matchId,
    platform: player.platform,
    patch,
    gameCreation:
      typeof info.gameCreation === 'number' ? info.gameCreation : Date.now(),
    gameDuration: typeof info.gameDuration === 'number' ? info.gameDuration : 0,
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
  };
}

async function pollCluster(
  ctx: ActionCtx,
  cluster: string,
  players: Doc<'yuumiRoster'>[],
  patchWindow: string[]
): Promise<void> {
  const now = Date.now();
  const games: GameRow[] = [];
  const rosterIds: Id<'yuumiRoster'>[] = [];
  for (const player of players) {
    const startTime = Math.max(
      Math.floor((player.lastCheckedAt - POLL_LOOKBACK_MS) / 1000),
      0
    );
    const ids = await riotFetch(
      `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${player.puuid}/ids?queue=${RANKED_SOLO_QUEUE}&startTime=${startTime}&count=10`
    );
    rosterIds.push(player._id);
    if (!Array.isArray(ids) || ids.length === 0) continue;
    const matchIds = ids.filter((id): id is string => typeof id === 'string');
    const existing = new Set(
      await ctx.runQuery(internal.highelo.getExistingMatchIds, { matchIds })
    );
    for (const matchId of matchIds) {
      if (existing.has(matchId)) continue;
      const match = await riotFetch(
        `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`
      );
      const game = extractGame(match, player, patchWindow);
      if (game) games.push(game);
    }
  }
  await ctx.runMutation(internal.highelo.recordPollResults, {
    rosterIds,
    checkedAt: now,
    games,
  });
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

    const byCluster = new Map<string, Doc<'yuumiRoster'>[]>();
    for (const player of roster) {
      const cluster =
        PLATFORM_TO_CLUSTER[player.platform as Platform] ?? 'europe';
      const list = byCluster.get(cluster) ?? [];
      list.push(player);
      byCluster.set(cluster, list);
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

/** Daily cleanup: keep only current+last patch games and an active roster. */
export const pruneOldGames = internalAction({
  args: {},
  handler: async (ctx) => {
    const patches = await fetchPatchWindow();
    let deleted = 0;
    do {
      deleted = await ctx.runMutation(
        internal.highelo.deleteGamesOutsidePatches,
        { patches }
      );
    } while (deleted > 0);
    await ctx.runMutation(internal.highelo.pruneInactiveRoster, {
      cutoff: Date.now() - ROSTER_RETENTION_MS,
    });
  },
});
