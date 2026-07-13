import { v } from 'convex/values';
import {
  action,
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
//  - backfillSeason (5 min): resumable season-history scan for profiles.
//  - pruneOldGames (daily): drop games from before the current season and
//    roster entries that went inactive.
//
// Rate-limit discipline (the key is dev-tier: 20 req/s + 100 req/2 min PER
// ROUTING HOST — every platform like euw1/kr and every match-v5 cluster
// like europe/asia has its own independent bucket):
//  - riotFetch paces requests ~1.5s apart per host, staying under the
//    2-minute window with headroom for the site's own match viewer.
//  - Poll and backfill each serve ONE cluster per 5-minute cron slot,
//    rotating americas -> asia -> europe -> sea and offset from each other
//    by two slots, so no cluster ever runs two jobs at once and every
//    cluster gets a full budget every 20 minutes.
//  - The poll only spends requests on players likely to have new games:
//    known producers (gamesCount > 0) plus players whose champion-mastery
//    lastPlayTime moved past our last check. Everyone else costs nothing.
//  - Actions stop at a soft deadline and flush progress, instead of being
//    killed by the 10-minute action timeout mid-batch.

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

const CLUSTERS = ['americas', 'asia', 'europe', 'sea'] as const;
type Cluster = (typeof CLUSTERS)[number];

function platformsForCluster(cluster: Cluster): Platform[] {
  return PLATFORMS.filter((p) => PLATFORM_TO_CLUSTER[p] === cluster);
}

// Cluster rotation: one cluster per 5-minute cron slot, derived from the
// clock so no state is needed. `offset` staggers independent jobs (poll at
// +0, backfill at +2) so they never share a cluster in the same slot.
const ROTATION_SLOT_MS = 5 * 60 * 1000;

function resolveCluster(raw: string | undefined, offset: number): Cluster {
  if (raw !== undefined) {
    if (!(CLUSTERS as readonly string[]).includes(raw)) {
      throw new Error(`unknown cluster: ${raw}`);
    }
    return raw as Cluster;
  }
  const slot = Math.floor(Date.now() / ROTATION_SLOT_MS);
  return CLUSTERS[(slot + offset) % CLUSTERS.length] ?? 'americas';
}

// Spacing between requests to the same routing host: 1.5s ≈ 80 requests
// per 2-minute window, under the dev key's 100:120s app limit with ~20%
// headroom left for the site's match viewer.
const RIOT_PACING_MS = 1500;
// Soft deadline for actions: stop and flush before Convex's hard
// 10-minute action timeout can kill the run and lose the current batch.
const ACTION_DEADLINE_MS = 7.5 * 60 * 1000;

function deadlineHit(startedAt: number): boolean {
  return Date.now() - startedAt > ACTION_DEADLINE_MS;
}

// Sweep pacing: mastery checks per platform per 15-min run. Ladders hold
// roughly 3-6k Master+ players per platform, so a full pass completes in a
// few hours and then keeps rolling.
const MASTERY_CHECKS_PER_RUN = 250;
const LEAGUE_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
// Played Yuumi within this window -> watched by the fast loop.
const YUUMI_ACTIVITY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
// Roster entries idle longer than this get pruned daily.
const ROSTER_RETENTION_MS = 45 * 24 * 60 * 60 * 1000;
// Most roster players polled per run (one cluster; the deadline usually
// binds first — producers sort ahead so they are never starved).
const POLL_PLAYERS_PER_RUN = 400;
// match-ids lookback: startTime filters by game START, so a game that began
// before the last poll but ended after it needs the buffer to be caught.
const POLL_LOOKBACK_MS = 3 * 60 * 60 * 1000;
// match-ids page size: producers are polled every rotation (10 is plenty);
// discovery checks may cover days since the last look, so ask for more.
const POLL_PRODUCER_MATCH_COUNT = 10;
const POLL_DISCOVERY_MATCH_COUNT = 20;
// Flush poll results to the DB every N players so a late failure or the
// deadline can't discard a whole cluster's progress.
const POLL_FLUSH_EVERY = 25;
// Games shorter than this are remakes (early surrender), not real games.
const REMAKE_MAX_DURATION_S = 300;
// Season retention fallback when the seasonStart metadata key is unset.
const DEFAULT_SEASON_LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;
// Backfill: fetch budget per run (one cluster; deadline also applies).
const BACKFILL_MATCH_FETCH_BUDGET = 200;
const BACKFILL_PLAYERS_PER_RUN = 40; // upper bound per run
// Probe bail: a player whose first N season matches contain zero ranked
// Yuumi games is treated as an ARAM/normals dabbler (mastery lastPlayTime
// counts every queue) and marked done — the poll's discovery tier catches
// them if they ever play ranked Yuumi later.
const BACKFILL_PROBE_MATCHES = 30;
// Only backfill players whose mastery says they played Yuumi recently;
// the rest would almost always burn the probe for nothing.
const BACKFILL_ELIGIBLE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

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

// Per-host pacing state for riotFetch. Module-level, so within one action
// run every request to the same routing host is spaced out; concurrent
// callers in the same isolate (the sweep's parallel platforms) each talk
// to their own host and therefore never contend on an entry.
const lastRiotRequestAt = new Map<string, number>();

/**
 * GET a Riot API URL, paced to RIOT_PACING_MS per routing host so cron
 * traffic stays under the dev key's 100:120s app limit instead of
 * saturating it and living off 429 retries. Returns parsed JSON, or null
 * on 404. Retries twice on 429 honoring Retry-After (now the exception,
 * e.g. when site traffic shares the window); throws on other errors so
 * callers can decide.
 */
async function riotFetch(url: string): Promise<unknown> {
  const host = new URL(url).host;
  for (let attempt = 0; attempt < 3; attempt++) {
    const wait =
      (lastRiotRequestAt.get(host) ?? 0) + RIOT_PACING_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRiotRequestAt.set(host, Date.now());
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

/**
 * Item IDs that count toward a build signature: finished items only.
 * Completed = built from something and building into nothing, or deep
 * enough to be a finished line (depth >= 3), or a tier-2+ boot (tier-2
 * boots list their tier-3 upgrades in `into`, so the plain rule would
 * drop them). Restricted to purchasable Summoner's Rift items; ids >=
 * 100000 are Arena variants that never appear in match-v5 item slots.
 */
async function fetchCompletedItemIds(): Promise<{
  patch: string;
  ids: number[];
}> {
  const versionsRes = await fetch(
    'https://ddragon.leagueoflegends.com/api/versions.json'
  );
  if (!versionsRes.ok) {
    throw new Error(`versions.json returned ${versionsRes.status}`);
  }
  const versions = (await versionsRes.json()) as unknown;
  const version =
    Array.isArray(versions) && typeof versions[0] === 'string'
      ? versions[0]
      : null;
  if (!version) throw new Error('versions.json malformed');

  const itemsRes = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/item.json`
  );
  if (!itemsRes.ok) throw new Error(`item.json returned ${itemsRes.status}`);
  const payload = (await itemsRes.json()) as unknown;
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new Error('item.json malformed');
  }

  const ids: number[] = [];
  for (const [rawId, item] of Object.entries(payload.data)) {
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0 || id >= 100000) continue;
    if (!isRecord(item)) continue;
    const maps = isRecord(item.maps) ? item.maps : {};
    const gold = isRecord(item.gold) ? item.gold : {};
    if (maps['11'] !== true || gold.purchasable !== true) continue;
    if (item.requiredChampion || item.requiredAlly) continue;
    const depth = typeof item.depth === 'number' ? item.depth : 1;
    const tags = Array.isArray(item.tags) ? item.tags : [];
    const isBoots = tags.includes('Boots');
    const completed =
      (!item.into && !!item.from) || depth >= 3 || (isBoots && depth >= 2);
    if (completed) ids.push(id);
  }
  if (ids.length === 0) throw new Error('no completed items derived');

  const [major, minor] = version.split('.');
  return { patch: `${major}.${minor}`, ids: ids.sort((a, b) => a - b) };
}

/**
 * Completed-items set for actions: stored catalog, refreshed from Data
 * Dragon when missing or (with `currentPatch` given) on patch rollover.
 * Keep-last-good on failure; an empty set disables build-path extraction
 * rather than storing wrong empty paths.
 */
async function loadCompletedItemsSet(
  ctx: ActionCtx,
  currentPatch?: string
): Promise<Set<number>> {
  let stored: { patch: string; ids: number[] } | null = null;
  try {
    stored = parseCompletedItems(
      await ctx.runQuery(internal.highelo.getMetadataValue, {
        key: 'completedItems',
      })
    );
    if (
      stored &&
      (currentPatch === undefined || stored.patch === currentPatch)
    ) {
      return new Set(stored.ids);
    }
    const catalog = await fetchCompletedItemIds();
    await ctx.runMutation(internal.highelo.setMetadataValue, {
      key: 'completedItems',
      value: JSON.stringify(catalog),
    });
    return new Set(catalog.ids);
  } catch (error) {
    console.error('completed-items load failed:', error);
    return new Set(stored?.ids ?? []);
  }
}

/** Parse a completedItems metadata value; null when missing or malformed. */
function parseCompletedItems(
  raw: string | null
): { patch: string; ids: number[] } | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (typeof parsed.patch !== 'string' || !Array.isArray(parsed.ids)) {
      return null;
    }
    const ids = parsed.ids.filter((id): id is number => typeof id === 'number');
    if (ids.length === 0) return null;
    return { patch: parsed.patch, ids };
  } catch {
    return null;
  }
}

/** True when patch `a` is strictly older than `b` ('major.minor' strings). */
export function isOlderPatch(a: string, b: string): boolean {
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

/** Parse a raw seasonStart metadata value (ms); 90-day fallback if unset. */
function parseSeasonStart(raw: string | null): number {
  const parsed = raw === null ? NaN : Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  console.warn('seasonStart metadata missing — defaulting to 90-day window');
  return Date.now() - DEFAULT_SEASON_LOOKBACK_MS;
}

/** Season start (ms) for actions. Same fallback semantics as the parser. */
async function getSeasonStart(ctx: ActionCtx): Promise<number> {
  const raw = await ctx.runQuery(internal.highelo.getMetadataValue, {
    key: 'seasonStart',
  });
  return parseSeasonStart(raw);
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
    const regionRanked = ranked.filter((p) => p.platform === player.platform);
    const regionPosition =
      regionRanked.findIndex((p) => p.puuid === player.puuid) + 1;

    // Per-patch winrate splits, newest patch first (games sort desc, so
    // first-seen order is already newest-first).
    const patchSplits: { patch: string; games: number; wins: number }[] = [];
    for (const game of games) {
      const split = patchSplits.find((s) => s.patch === game.patch);
      if (split) {
        split.games++;
        if (game.win) split.wins++;
      } else {
        patchSplits.push({
          patch: game.patch,
          games: 1,
          wins: game.win ? 1 : 0,
        });
      }
    }

    // Records: longest win streak (chronological walk) and best KDA game.
    let longestWinStreak = 0;
    let streak = 0;
    for (let i = games.length - 1; i >= 0; i--) {
      streak = games[i]?.win ? streak + 1 : 0;
      if (streak > longestWinStreak) longestWinStreak = streak;
    }
    const kdaOf = (g: { kills: number; deaths: number; assists: number }) =>
      (g.kills + g.assists) / Math.max(1, g.deaths);
    let bestGame: Doc<'yuumiGames'> | null = null;
    for (const game of games) {
      if (!game.win) continue;
      if (!bestGame || kdaOf(game) > kdaOf(bestGame)) bestGame = game;
    }

    // Common builds: finished items only, sorted signature -> occurrences.
    // The completedItems catalog (refreshed on patch rollover by
    // pollRosterMatches) drops component items so half-built slots don't
    // split or pollute build signatures; until the catalog exists, fall
    // back to excluding empties + trinkets (3340/3363/3364) + wards (2055).
    const EXCLUDED_ITEMS = new Set([0, 2055, 3340, 3363, 3364]);
    const completedMeta = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', 'completedItems'))
      .unique();
    const catalog = parseCompletedItems(completedMeta?.value ?? null);
    const completedItems = catalog ? new Set(catalog.ids) : null;
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
        // Full page (absent on rows ingested before the 2026-07 enrichment)
        primaryRunes?: number[];
        secondaryRunes?: number[];
        statShards?: number[];
      }
    >();
    // Build paths: purchase-order stats keyed by the first three completed
    // buys (late-game items vary too much for full-path grouping); the
    // displayed path is the newest game's, since games arrive sorted desc.
    const pathGroups = new Map<
      string,
      { path: number[]; games: number; wins: number }
    >();
    const duoGroups = new Map<string, { games: number; wins: number }>();
    for (const game of games) {
      if (game.items) {
        const core = game.items
          .filter((id) =>
            completedItems ? completedItems.has(id) : !EXCLUDED_ITEMS.has(id)
          )
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
      if (game.buildPath && game.buildPath.length >= 3) {
        const key = game.buildPath.slice(0, 3).join(',');
        const group = pathGroups.get(key) ?? {
          path: game.buildPath,
          games: 0,
          wins: 0,
        };
        group.games++;
        if (game.win) group.wins++;
        pathGroups.set(key, group);
      }
      if (game.keystoneId && game.secondaryStyleId && game.summonerSpells) {
        const spells = [...game.summonerSpells].sort((a, b) => a - b);
        // Enriched rows group by the full page so distinct minor-rune/shard
        // setups stay distinct; legacy rows keep the coarse key until the
        // backfill re-ingests them.
        const fullPage =
          game.primaryRunes && game.secondaryRunes && game.statShards
            ? {
                primaryRunes: game.primaryRunes,
                secondaryRunes: game.secondaryRunes,
                statShards: game.statShards,
              }
            : null;
        const key = fullPage
          ? `${fullPage.primaryRunes.join(',')}|${fullPage.secondaryRunes.join(',')}|${fullPage.statShards.join(',')}|${spells.join(',')}`
          : `${game.keystoneId}:${game.secondaryStyleId}:${spells.join(',')}`;
        const group = runeGroups.get(key) ?? {
          keystoneId: game.keystoneId,
          secondaryStyleId: game.secondaryStyleId,
          summonerSpells: spells,
          games: 0,
          wins: 0,
          ...(fullPage ?? {}),
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
        // null when the player isn't in the ranked list (no counted games).
        position: position > 0 ? position : null,
        regionPosition: regionPosition > 0 ? regionPosition : null,
      },
      patchSplits,
      records: {
        longestWinStreak,
        bestGame: bestGame
          ? {
              matchId: bestGame.matchId,
              kills: bestGame.kills,
              deaths: bestGame.deaths,
              assists: bestGame.assists,
              patch: bestGame.patch,
              gameCreation: bestGame.gameCreation,
            }
          : null,
      },
      builds: [...buildGroups.values()].sort(byGames).slice(0, 3),
      buildPaths: [...pathGroups.values()].sort(byGames).slice(0, 3),
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

/**
 * Poll candidates for one cluster's platforms, two tiers:
 *  A. producers (gamesCount > 0) — polled every rotation, stalest first;
 *  B. discovery — players whose champion-mastery lastPlayTime moved past
 *     our last check, i.e. they played Yuumi in SOME queue since we last
 *     looked, so one match-ids call settles whether it was ranked.
 * Everyone else is skipped at zero request cost; the sweep refreshes
 * mastery roughly daily, which is what promotes players into tier B.
 */
export const takeClusterRosterForPoll = internalQuery({
  args: { platforms: v.array(v.string()), limit: v.number() },
  handler: async (ctx, args) => {
    const players: Doc<'yuumiRoster'>[] = [];
    for (const platform of args.platforms) {
      const rows = await ctx.db
        .query('yuumiRoster')
        .withIndex('by_platform', (q) => q.eq('platform', platform))
        .collect();
      players.push(...rows);
    }
    const byStalest = (a: Doc<'yuumiRoster'>, b: Doc<'yuumiRoster'>) =>
      a.lastCheckedAt - b.lastCheckedAt;
    const producers = players
      .filter((p) => (p.gamesCount ?? 0) > 0)
      .sort(byStalest);
    const discovery = players
      .filter(
        (p) =>
          (p.gamesCount ?? 0) === 0 && p.yuumiLastPlayTime > p.lastCheckedAt
      )
      .sort(byStalest);
    return [...producers, ...discovery].slice(0, args.limit);
  },
});

/**
 * Match ids that are stored AND carry the full build snapshot. Rows from
 * before the 2026-07 enrichment (no primaryRunes) are reported as missing
 * so the poll/backfill loops re-fetch them; recordPollResults then patches
 * the new fields in place instead of double-inserting.
 */
export const getExistingMatchIds = internalQuery({
  args: { matchIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const existing: string[] = [];
    for (const matchId of args.matchIds) {
      const row = await ctx.db
        .query('yuumiGames')
        .withIndex('by_matchId', (q) => q.eq('matchId', matchId))
        .unique();
      if (row && row.primaryRunes !== undefined) existing.push(matchId);
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
  primaryRunes: v.array(v.number()),
  secondaryRunes: v.array(v.number()),
  statShards: v.array(v.number()),
  // Absent when the timeline fetch failed; [] when nothing completed.
  buildPath: v.optional(v.array(v.number())),
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
      } else if (existing.primaryRunes === undefined) {
        // Pre-enrichment row re-fetched by the backfill: patch the full
        // build snapshot in place. Roster counters already include this
        // game — leave them alone.
        await ctx.db.patch(existing._id, {
          primaryRunes: game.primaryRunes,
          secondaryRunes: game.secondaryRunes,
          statShards: game.statShards,
          ...(game.buildPath !== undefined
            ? { buildPath: game.buildPath }
            : {}),
        });
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
    // Season-aware: ignore pre-season rows still awaiting the daily prune,
    // so a backfill racing a season rollover can't bake old-season games
    // into the totals (makes the rollover runbook order-independent).
    const meta = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', 'seasonStart'))
      .unique();
    const seasonStart = parseSeasonStart(meta?.value ?? null);
    const allGames = await ctx.db
      .query('yuumiGames')
      .withIndex('by_puuid', (q) => q.eq('puuid', args.puuid))
      .collect();
    const games = allGames.filter((g) => g.gameCreation >= seasonStart);
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

/**
 * Unbackfilled roster players on the given platforms who played Yuumi
 * (any queue) since `activeSince`, most recently active first.
 */
export const takeRosterForBackfill = internalQuery({
  args: {
    platforms: v.array(v.string()),
    limit: v.number(),
    activeSince: v.number(),
  },
  handler: async (ctx, args) => {
    const players: Doc<'yuumiRoster'>[] = [];
    for (const platform of args.platforms) {
      const rows = await ctx.db
        .query('yuumiRoster')
        .withIndex('by_platform', (q) => q.eq('platform', platform))
        .collect();
      players.push(...rows);
    }
    return players
      .filter(
        (entry) =>
          entry.backfilledAt === undefined &&
          // Known producers always qualify (re-enrichment rollouts via
          // clearBackfillMarkers must reach them even when their mastery
          // lastPlayTime has gone stale); the recency gate only screens
          // players who have never produced a counted game.
          ((entry.gamesCount ?? 0) > 0 ||
            entry.yuumiLastPlayTime >= args.activeSince)
      )
      .sort((a, b) => b.yuumiLastPlayTime - a.yuumiLastPlayTime)
      .slice(0, args.limit);
  },
});

/**
 * Stored rows for the given match ids, with what the backfill needs to
 * skip or re-fetch them: creation time (cursor bookkeeping) and whether
 * the row already carries the full build snapshot.
 */
export const getStoredGames = internalQuery({
  args: { matchIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const rows: {
      matchId: string;
      gameCreation: number;
      enriched: boolean;
    }[] = [];
    for (const matchId of args.matchIds) {
      const row = await ctx.db
        .query('yuumiGames')
        .withIndex('by_matchId', (q) => q.eq('matchId', matchId))
        .unique();
      if (row) {
        rows.push({
          matchId,
          gameCreation: row.gameCreation,
          enriched: row.primaryRunes !== undefined,
        });
      }
    }
    return rows;
  },
});

/** Persist one player's backfill progress; clears the cursor when done. */
export const updateBackfillProgress = internalMutation({
  args: {
    id: v.id('yuumiRoster'),
    scanned: v.number(),
    cursor: v.number(),
    done: v.boolean(),
    at: v.number(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    if (!row) return;
    if (args.done) {
      await ctx.db.patch(args.id, {
        backfilledAt: args.at,
        backfillScanned: args.scanned,
        backfillCursor: undefined,
      });
    } else {
      await ctx.db.patch(args.id, {
        backfillScanned: args.scanned,
        backfillCursor: args.cursor,
      });
    }
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

/**
 * One-shot (2026-07 enrichment rollout): clear every backfill marker so
 * the season backfill re-sweeps and patches full build snapshots onto
 * pre-enrichment game rows. Stats are untouched — recordPollResults only
 * patches game rows for already-counted matches.
 *
 *   npx convex run highelo:clearBackfillMarkers
 */
export const clearBackfillMarkers = internalMutation({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Batched: patching the whole 8k+ roster in one mutation hits the
    // transaction timeout. Re-run until it returns 0.
    const limit = Math.min(Math.max(args.limit ?? 500, 1), 2000);
    const roster = await ctx.db.query('yuumiRoster').collect();
    let cleared = 0;
    for (const entry of roster) {
      if (cleared >= limit) break;
      // Also reset rows with only partial progress (cursor but no marker)
      // so they re-scan from the top instead of resuming mid-history.
      // backfillScanned survives on purpose: it lets the probe bail skip
      // zero-game dabblers immediately instead of re-probing 30 matches.
      if (
        entry.backfilledAt !== undefined ||
        entry.backfillCursor !== undefined
      ) {
        // Patching undefined removes the field (Convex patch semantics).
        await ctx.db.patch(entry._id, {
          backfilledAt: undefined,
          backfillCursor: undefined,
        });
        cleared++;
      }
    }
    return cleared;
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

// ---------- one-shot ops (deploy bootstrap / season rollover) ----------

/**
 * One-shot deploy bootstrap: delete game rows ingested before build
 * snapshots existed (no puuid). Their matchIds would otherwise dedupe the
 * backfill's re-fetch forever, leaving them invisible to profiles — the
 * season backfill re-ingests them with full build snapshots. The table is
 * small at deploy time, so collect() is fine. Returns the deleted count.
 */
export const deleteLegacyGames = internalMutation({
  args: {},
  handler: async (ctx) => {
    const games = await ctx.db.query('yuumiGames').collect();
    let deleted = 0;
    for (const game of games) {
      if (game.puuid === undefined) {
        await ctx.db.delete(game._id);
        deleted++;
      }
    }
    return deleted;
  },
});

/**
 * Season rollover: zero every roster row's denormalized stats and clear
 * the backfill marker so the backfill cron rebuilds history from the new
 * seasonStart. Run AFTER updating the seasonStart metadata key; the daily
 * prune then clears the old season's games.
 */
export const resetSeasonStats = internalMutation({
  args: {},
  handler: async (ctx) => {
    const roster = await ctx.db.query('yuumiRoster').collect();
    for (const entry of roster) {
      await ctx.db.patch(entry._id, {
        gamesCount: 0,
        wins: 0,
        killsTotal: 0,
        deathsTotal: 0,
        assistsTotal: 0,
        // Patching undefined removes the field (Convex patch semantics).
        backfilledAt: undefined,
        backfillCursor: undefined,
        backfillScanned: undefined,
      });
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
  platform: Platform,
  startedAt: number
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
    // Deadline: whatever is checked so far still gets recorded below.
    if (deadlineHit(startedAt)) break;
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
 * Rolling roster builder (every 15 min). Every platform has its own
 * independent app-rate-limit bucket (per routing host), so they sweep in
 * parallel — riotFetch paces each host separately; per-platform failures
 * are isolated.
 */
export const sweepLadderChunk = internalAction({
  args: {},
  handler: async (ctx) => {
    const startedAt = Date.now();
    await Promise.all(
      PLATFORMS.map((platform) =>
        sweepPlatform(ctx, platform, startedAt).catch((error) => {
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
  primaryRunes: number[];
  secondaryRunes: number[];
  statShards: number[];
  buildPath?: number[];
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
  let primaryRunes: number[] = [];
  let secondaryRunes: number[] = [];
  let statShards: number[] = [];
  if (isRecord(yuumi.perks) && Array.isArray(yuumi.perks.styles)) {
    const styles = yuumi.perks.styles.filter(isRecord);
    const perkIds = (style: Record<string, unknown> | undefined): number[] =>
      style && Array.isArray(style.selections)
        ? style.selections
            .filter(isRecord)
            .map((s) => s.perk)
            .filter((perk): perk is number => typeof perk === 'number')
        : [];
    const primary = styles.find((s) => s.description === 'primaryStyle');
    const secondary = styles.find((s) => s.description === 'subStyle');
    primaryRunes = perkIds(primary);
    secondaryRunes = perkIds(secondary);
    keystoneId = primaryRunes[0] ?? 0;
    if (secondary && typeof secondary.style === 'number') {
      secondaryStyleId = secondary.style;
    }
    const statPerks = isRecord(yuumi.perks.statPerks)
      ? yuumi.perks.statPerks
      : null;
    if (statPerks) {
      statShards = [
        statPerks.offense,
        statPerks.flex,
        statPerks.defense,
      ].filter((id): id is number => typeof id === 'number');
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
    primaryRunes,
    secondaryRunes,
    statShards,
    ...(duo
      ? { duoChampion: fixChampionName(duo.championName as string) }
      : {}),
  };
}

/**
 * Completed items in purchase order from a match-v5 timeline payload.
 * Walks frame events chronologically: ITEM_PURCHASED appends, ITEM_UNDO
 * removes the last occurrence of the refunded item. Sells are ignored —
 * a sold item was still part of the build's path. Returns null when the
 * payload is unusable (callers then omit buildPath so a later backfill
 * pass could still fill it).
 */
function extractBuildPath(
  timeline: unknown,
  puuid: string,
  completedItems: Set<number>
): number[] | null {
  if (!isRecord(timeline) || !isRecord(timeline.info)) return null;
  if (!Array.isArray(timeline.info.participants)) return null;
  const participant = timeline.info.participants
    .filter(isRecord)
    .find((p) => p.puuid === puuid);
  if (!participant || typeof participant.participantId !== 'number') {
    return null;
  }
  const participantId = participant.participantId;
  if (!Array.isArray(timeline.info.frames)) return null;

  const purchases: number[] = [];
  for (const frame of timeline.info.frames) {
    if (!isRecord(frame) || !Array.isArray(frame.events)) continue;
    for (const event of frame.events) {
      if (!isRecord(event) || event.participantId !== participantId) continue;
      if (event.type === 'ITEM_PURCHASED') {
        if (typeof event.itemId === 'number') purchases.push(event.itemId);
      } else if (event.type === 'ITEM_UNDO') {
        // beforeId is the item leaving the inventory (the undone buy).
        if (typeof event.beforeId === 'number') {
          const index = purchases.lastIndexOf(event.beforeId);
          if (index !== -1) purchases.splice(index, 1);
        }
      }
    }
  }
  return purchases.filter((id) => completedItems.has(id)).slice(0, 8);
}

/**
 * Timeline fetch + build-path parse for one game. Null on any failure —
 * the game row is stored without buildPath instead of being dropped. An
 * empty completed-items set skips the fetch entirely (no catalog means
 * every parse would wrongly yield []).
 */
async function fetchBuildPath(
  cluster: string,
  matchId: string,
  puuid: string,
  completedItems: Set<number>
): Promise<number[] | null> {
  if (completedItems.size === 0) return null;
  try {
    const timeline = await riotFetch(
      `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`
    );
    return extractBuildPath(timeline, puuid, completedItems);
  } catch (error) {
    console.error(`timeline fetch ${matchId} failed:`, error);
    return null;
  }
}

async function pollCluster(
  ctx: ActionCtx,
  cluster: string,
  players: Doc<'yuumiRoster'>[],
  patchWindow: string[],
  completedItems: Set<number>,
  startedAt: number
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
    // Deadline: unvisited players keep their stale lastCheckedAt and sort
    // to the front of their tier next rotation.
    if (deadlineHit(startedAt)) break;
    // Per-player isolation: on failure, skip the player WITHOUT stamping
    // lastCheckedAt (so the next run retries them) and keep the batch.
    try {
      const startTime = Math.max(
        Math.floor((player.lastCheckedAt - POLL_LOOKBACK_MS) / 1000),
        0
      );
      // The count bounds request cost; a producer logging more ranked
      // games than this inside one rotation is implausible enough to
      // accept, and discovery players get their history via the backfill.
      const count =
        (player.gamesCount ?? 0) > 0
          ? POLL_PRODUCER_MATCH_COUNT
          : POLL_DISCOVERY_MATCH_COUNT;
      const ids = await riotFetch(
        `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${player.puuid}/ids?queue=${RANKED_SOLO_QUEUE}&startTime=${startTime}&count=${count}`
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
          if (game) {
            // Only qualifying Yuumi games pay the timeline call.
            const path = await fetchBuildPath(
              cluster,
              matchId,
              player.puuid,
              completedItems
            );
            if (path !== null) game.buildPath = path;
            playerGames.push(game);
          }
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
 * Fast loop (every 5 min): new ranked games for one cluster's roster per
 * run, rotating through the four clusters so each gets its full app-rate
 * budget every 20 minutes. Pass `cluster` to override the rotation (used
 * when bootstrapping manually: `npx convex run highelo:pollRosterMatches
 * '{"cluster":"europe"}'`).
 */
export const pollRosterMatches = internalAction({
  args: { cluster: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const startedAt = Date.now();
    const cluster = resolveCluster(args.cluster, 0);
    const roster = await ctx.runQuery(
      internal.highelo.takeClusterRosterForPoll,
      { platforms: platformsForCluster(cluster), limit: POLL_PLAYERS_PER_RUN }
    );
    if (roster.length === 0) return;
    const patchWindow = await fetchPatchWindow();
    // Persist the window so listGames can scope the feed without a fetch.
    await ctx.runMutation(internal.highelo.setMetadataValue, {
      key: 'patchWindow',
      value: JSON.stringify(patchWindow),
    });

    // Completed-items catalog: build paths and profile build signatures
    // both use it to drop component items; refreshed on patch rollover.
    const completedItems = await loadCompletedItemsSet(ctx, patchWindow[0]);

    await pollCluster(
      ctx,
      cluster,
      roster,
      patchWindow,
      completedItems,
      startedAt
    );
  },
});

/**
 * Backfill one player's season history, resumably. Walks their ranked
 * match ids newest-to-oldest from `backfillCursor` (or now), fetching only
 * matches not already stored with a full build snapshot. Progress — the
 * oldest timestamp scanned plus a payloads-inspected counter — persists
 * after every player, so running out of budget or deadline mid-history
 * costs nothing: the next run resumes where this one stopped. Returns the
 * budget left.
 */
async function backfillPlayer(
  ctx: ActionCtx,
  cluster: string,
  player: Doc<'yuumiRoster'>,
  seasonStart: number,
  completedItems: Set<number>,
  budget: number,
  startedAt: number
): Promise<number> {
  // Probe bail: see BACKFILL_PROBE_MATCHES.
  if (
    (player.gamesCount ?? 0) === 0 &&
    (player.backfillScanned ?? 0) >= BACKFILL_PROBE_MATCHES
  ) {
    await ctx.runMutation(internal.highelo.markBackfilled, {
      ids: [player._id],
      at: Date.now(),
    });
    return budget;
  }

  // +60s overlap so a game sharing the cursor second isn't skipped; the
  // stored-games dedup absorbs the re-listing.
  const endTime = Math.floor((player.backfillCursor ?? Date.now()) / 1000) + 60;
  const startTime = Math.floor(seasonStart / 1000);
  budget--;
  const page = await riotFetch(
    `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${player.puuid}/ids?queue=${RANKED_SOLO_QUEUE}&startTime=${startTime}&endTime=${endTime}&count=100`
  );
  if (!Array.isArray(page)) return budget;
  const matchIds = page.filter((id): id is string => typeof id === 'string');

  const stored = new Map(
    (await ctx.runQuery(internal.highelo.getStoredGames, { matchIds })).map(
      (row) => [row.matchId, row]
    )
  );

  let cursor = player.backfillCursor ?? Date.now();
  let scanned = player.backfillScanned ?? 0;
  let ranOut = false;
  const games: GameRow[] = [];
  for (const matchId of matchIds) {
    const known = stored.get(matchId);
    if (known?.enriched) {
      // Already ingested with full data (e.g. by the poll) — advance past.
      cursor = Math.min(cursor, known.gameCreation);
      continue;
    }
    if (budget <= 0 || deadlineHit(startedAt)) {
      ranOut = true;
      break;
    }
    budget--;
    const match = await riotFetch(
      `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`
    );
    scanned++;
    if (isRecord(match) && isRecord(match.info)) {
      const created = match.info.gameCreation;
      if (typeof created === 'number') cursor = Math.min(cursor, created);
    }
    const game = extractGame(match, player, null);
    if (game) {
      if (budget > 0) {
        budget--;
        const path = await fetchBuildPath(
          cluster,
          matchId,
          player.puuid,
          completedItems
        );
        if (path !== null) game.buildPath = path;
      }
      games.push(game);
    }
  }

  if (games.length > 0) {
    await ctx.runMutation(internal.highelo.recordPollResults, {
      rosterIds: [],
      checkedAt: Date.now(),
      games,
    });
  }
  // Done only when this page was fully processed AND it was the last one.
  const done = !ranOut && matchIds.length < 100;
  await ctx.runMutation(internal.highelo.updateBackfillProgress, {
    id: player._id,
    scanned,
    cursor,
    done,
    at: Date.now(),
  });
  if (done) {
    await ctx.runMutation(internal.highelo.recomputePlayerStats, {
      puuid: player.puuid,
    });
  }
  return budget;
}

/**
 * Season history backfill (every 5 min): serves ONE cluster per run,
 * rotating two slots behind the poll so the two jobs never share a
 * cluster's rate budget in the same slot. Resumable per player, so a
 * heavy one-trick with hundreds of season games spreads across runs
 * instead of blocking their cluster (the pre-July-2026 failure mode).
 * Goes dormant once every eligible player is marked backfilled. Pass
 * `cluster` to override the rotation for manual runs.
 */
export const backfillSeason = internalAction({
  args: { cluster: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const startedAt = Date.now();
    const cluster = resolveCluster(args.cluster, 2);
    const players = await ctx.runQuery(internal.highelo.takeRosterForBackfill, {
      platforms: platformsForCluster(cluster),
      limit: BACKFILL_PLAYERS_PER_RUN,
      activeSince: Date.now() - BACKFILL_ELIGIBLE_WINDOW_MS,
    });
    if (players.length === 0) return;
    const seasonStart = await getSeasonStart(ctx);
    const completedItems = await loadCompletedItemsSet(ctx);
    let budget = BACKFILL_MATCH_FETCH_BUDGET;
    for (const player of players) {
      if (budget <= 0 || deadlineHit(startedAt)) return;
      try {
        budget = await backfillPlayer(
          ctx,
          cluster,
          player,
          seasonStart,
          completedItems,
          budget,
          startedAt
        );
      } catch (error) {
        console.error(
          `backfill ${cluster}: player ${player.puuid} failed:`,
          error
        );
      }
    }
  },
});

// ---------- on-demand profile refresh ----------

// Public cooldown between manual refreshes of the same profile; verified
// subscribers refreshing their own linked profile get the shorter one
// (that's what powers auto-refresh while they watch their page).
const MANUAL_REFRESH_COOLDOWN_MS = 5 * 60 * 1000;
const SUBSCRIBER_REFRESH_COOLDOWN_MS = 60 * 1000;

export const getRosterByPuuid = internalQuery({
  args: { puuid: v.string() },
  handler: async (ctx, args): Promise<Doc<'yuumiRoster'> | null> => {
    return await ctx.db
      .query('yuumiRoster')
      .withIndex('by_puuid', (q) => q.eq('puuid', args.puuid))
      .unique();
  },
});

export const stampManualRefresh = internalMutation({
  args: { puuid: v.string(), at: v.number() },
  handler: async (ctx, args): Promise<void> => {
    const row = await ctx.db
      .query('yuumiRoster')
      .withIndex('by_puuid', (q) => q.eq('puuid', args.puuid))
      .unique();
    if (row) await ctx.db.patch(row._id, { lastManualRefreshAt: args.at });
  },
});

/**
 * On-demand single-player refresh for profile pages: pulls the player's
 * newest ranked games right now instead of waiting for their cluster's
 * poll rotation. Cooldown is stored per player (5 min public; 1 min for a
 * verified subscriber refreshing their own linked profile, which is what
 * the profile page's auto-refresh uses). Request cost is tiny (1 id-list
 * call + fetches for genuinely new games only), so it coexists with the
 * cron choreography's rate budget.
 */
export const refreshPlayer = action({
  args: { puuid: v.string(), token: v.optional(v.string()) },
  handler: async (
    ctx,
    args
  ): Promise<{ refreshed: boolean; nextAllowedAt: number }> => {
    const player = await ctx.runQuery(internal.highelo.getRosterByPuuid, {
      puuid: args.puuid,
    });
    if (!player) throw new Error('Player is not on the Yuumi ladder');

    // Subscriber fast lane only for the profile the caller has verified
    // ownership of — everyone else shares the public per-player cooldown.
    let cooldown = MANUAL_REFRESH_COOLDOWN_MS;
    if (args.token) {
      const user = await ctx.runQuery(internal.webauth.resolveUser, {
        token: args.token,
      });
      if (
        user &&
        (user.subscribedUntil ?? 0) > Date.now() &&
        user.linkedPuuid === args.puuid
      ) {
        cooldown = SUBSCRIBER_REFRESH_COOLDOWN_MS;
      }
    }
    const now = Date.now();
    const last = player.lastManualRefreshAt ?? 0;
    if (now - last < cooldown) {
      return {
        refreshed: false,
        nextAllowedAt: last + cooldown,
      };
    }
    // Stamp before the Riot calls so concurrent clicks can't double-spend.
    await ctx.runMutation(internal.highelo.stampManualRefresh, {
      puuid: args.puuid,
      at: now,
    });

    const patchWindow = await fetchPatchWindow();
    const completedItems = await loadCompletedItemsSet(ctx, patchWindow[0]);
    const cluster =
      PLATFORM_TO_CLUSTER[player.platform as Platform] ?? 'europe';
    await pollCluster(ctx, cluster, [player], patchWindow, completedItems, now);
    return { refreshed: true, nextAllowedAt: now + cooldown };
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
