import { v } from 'convex/values';
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server';
import { internal } from './_generated/api';
import { isOlderPatch } from './highelo';

// ============ LADDER META STATS & SNAPSHOTS ============
//
// Aggregation layer over the high-elo Yuumi feed. Two DB-only cron jobs
// (zero Riot API cost, so the feed's rate-limit choreography is untouched):
//  - computeMetaStats (hourly): pages through yuumiGames and rolls duo
//    synergy, enemy-champion, keystone, game-length, patch, region and tier
//    winrates into one JSON blob in guideMetadata ('metaStats'), in two
//    scopes: the feed's current+last patch window and the full season.
//    Keep-last-good: a failed run leaves the previous blob in place.
//  - snapshotRoster (daily): writes compact LP/games snapshots of ladder
//    producers into rosterSnapshots (profile form sparklines) and maintains
//    a rolling LP baseline to compute the weekly-climbers board
//    ('climbers' metadata).

// Games fetched per aggregation page: small projected rows, so pages stay
// far under Convex's per-query document and size limits.
const STATS_PAGE_SIZE = 2500;
// Hard cap on scanned games per run — a runaway-table backstop set far
// above a season's realistic Master+ Yuumi volume.
const STATS_MAX_SCANNED = 100_000;
// Duo/enemy/keystone entries below this many games are dropped from the
// stored blob: they are statistical noise and only bloat the payload.
const STATS_MIN_GROUP_GAMES = 2;

// Snapshots are pruned after this long; profiles chart at most ~2 months.
const SNAPSHOT_RETENTION_MS = 60 * 24 * 60 * 60 * 1000;
// Climber baseline rotates weekly, so deltas cover a rolling <=7d window.
const CLIMBER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const CLIMBER_COUNT = 20;
const SNAPSHOT_INSERT_CHUNK = 400;

// Season retention fallback when the seasonStart metadata key is unset
// (mirrors convex/highelo.ts semantics).
const DEFAULT_SEASON_LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseSeasonStartValue(raw: string | null): number {
  const parsed = raw === null ? NaN : Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return Date.now() - DEFAULT_SEASON_LOOKBACK_MS;
}

/** Ids from the poll's completedItems catalog; empty set when unset. */
function parseCompletedItemIds(raw: string | null): Set<number> {
  if (raw === null) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.ids)) return new Set();
    return new Set(
      parsed.ids.filter((id): id is number => typeof id === 'number')
    );
  } catch {
    return new Set();
  }
}

function parseStringArray(raw: string | null): string[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((p): p is string => typeof p === 'string')
      : [];
  } catch {
    return [];
  }
}

// ---------- meta stats aggregation ----------

/** Winrate-by-game-length buckets, in minutes. Order matters (display). */
const DURATION_BUCKETS = [
  { key: '<20', maxMinutes: 20 },
  { key: '20–25', maxMinutes: 25 },
  { key: '25–30', maxMinutes: 30 },
  { key: '30–35', maxMinutes: 35 },
  { key: '35+', maxMinutes: Infinity },
] as const;

type WinCount = { games: number; wins: number };
type DuoCount = WinCount & { kills: number; deaths: number; assists: number };
type PathCount = WinCount & { path: number[] };
type RunePageCount = WinCount & {
  primaryRunes: number[];
  secondaryRunes: number[];
  statShards: number[];
  secondaryStyleId: number;
};
type SpellsCount = WinCount & { ids: number[] };

// Stored-entry caps per board: enough for any UI, bounded blob size.
const ITEMS_CAP = 40;
const BUILD_PATHS_CAP = 25;
const RUNE_PAGES_CAP = 20;
const SPELLS_CAP = 8;

type ScopeAgg = {
  totals: WinCount;
  duos: Map<string, DuoCount>;
  enemies: Map<string, WinCount>;
  keystones: Map<number, WinCount>;
  items: Map<number, WinCount>;
  buildPaths: Map<string, PathCount>;
  runePages: Map<string, RunePageCount>;
  spells: Map<string, SpellsCount>;
  durations: WinCount[];
  regions: Map<string, WinCount>;
  tiers: Map<string, WinCount>;
};

function newScopeAgg(): ScopeAgg {
  return {
    totals: { games: 0, wins: 0 },
    duos: new Map(),
    enemies: new Map(),
    keystones: new Map(),
    items: new Map(),
    buildPaths: new Map(),
    runePages: new Map(),
    spells: new Map(),
    durations: DURATION_BUCKETS.map(() => ({ games: 0, wins: 0 })),
    regions: new Map(),
    tiers: new Map(),
  };
}

function bump<K>(map: Map<K, WinCount>, key: K, win: boolean): void {
  const entry = map.get(key) ?? { games: 0, wins: 0 };
  entry.games++;
  if (win) entry.wins++;
  map.set(key, entry);
}

type StatsGameRow = {
  gameCreation: number;
  patch: string;
  platform: string;
  tier: string;
  win: boolean;
  gameDuration: number;
  kills: number;
  deaths: number;
  assists: number;
  enemyChampions: string[];
  duoChampion?: string;
  keystoneId?: number;
  secondaryStyleId?: number;
  items?: number[];
  buildPath?: number[];
  primaryRunes?: number[];
  secondaryRunes?: number[];
  statShards?: number[];
  summonerSpells?: number[];
};

function addGame(
  agg: ScopeAgg,
  game: StatsGameRow,
  completedItems: Set<number>
): void {
  agg.totals.games++;
  if (game.win) agg.totals.wins++;
  if (game.duoChampion) {
    const entry = agg.duos.get(game.duoChampion) ?? {
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    };
    entry.games++;
    if (game.win) entry.wins++;
    entry.kills += game.kills;
    entry.deaths += game.deaths;
    entry.assists += game.assists;
    agg.duos.set(game.duoChampion, entry);
  }
  for (const champion of game.enemyChampions) {
    bump(agg.enemies, champion, game.win);
  }
  if (game.keystoneId) bump(agg.keystones, game.keystoneId, game.win);
  // Item winrates: completed items only (catalog maintained by the poll);
  // a Set dedupes the rare double-slot case so a game counts once.
  if (game.items && completedItems.size > 0) {
    for (const id of new Set(
      game.items.filter((id) => completedItems.has(id))
    )) {
      bump(agg.items, id, game.win);
    }
  }
  // Openers: first three completed buys, same signature the profiles use;
  // pages iterate newest-first so the stored path is the newest example.
  if (game.buildPath && game.buildPath.length >= 3) {
    const key = game.buildPath.slice(0, 3).join(',');
    const entry = agg.buildPaths.get(key) ?? {
      path: game.buildPath.slice(0, 3),
      games: 0,
      wins: 0,
    };
    entry.games++;
    if (game.win) entry.wins++;
    agg.buildPaths.set(key, entry);
  }
  // Full rune pages (enriched rows only — legacy rows lack the minors).
  if (
    game.primaryRunes &&
    game.primaryRunes.length >= 4 &&
    game.secondaryRunes &&
    game.statShards &&
    game.secondaryStyleId
  ) {
    const key = `${game.primaryRunes.join(',')}|${game.secondaryRunes.join(',')}|${game.statShards.join(',')}`;
    const entry = agg.runePages.get(key) ?? {
      primaryRunes: game.primaryRunes,
      secondaryRunes: game.secondaryRunes,
      statShards: game.statShards,
      secondaryStyleId: game.secondaryStyleId,
      games: 0,
      wins: 0,
    };
    entry.games++;
    if (game.win) entry.wins++;
    agg.runePages.set(key, entry);
  }
  if (game.summonerSpells && game.summonerSpells.length === 2) {
    const ids = [...game.summonerSpells].sort((a, b) => a - b);
    const key = ids.join(',');
    const entry = agg.spells.get(key) ?? { ids, games: 0, wins: 0 };
    entry.games++;
    if (game.win) entry.wins++;
    agg.spells.set(key, entry);
  }
  const minutes = game.gameDuration / 60;
  const index = DURATION_BUCKETS.findIndex((b) => minutes < b.maxMinutes);
  const bucket = agg.durations[index === -1 ? 0 : index];
  if (bucket) {
    bucket.games++;
    if (game.win) bucket.wins++;
  }
  bump(agg.regions, game.platform, game.win);
  bump(agg.tiers, game.tier, game.win);
}

/** Map -> sorted array with the key folded in, small groups dropped. */
function serializeGroups<K, T extends WinCount>(
  map: Map<K, T>,
  fold: (key: K, value: T) => Record<string, unknown>
): Record<string, unknown>[] {
  return [...map.entries()]
    .filter(([, value]) => value.games >= STATS_MIN_GROUP_GAMES)
    .sort((a, b) => b[1].games - a[1].games)
    .map(([key, value]) => fold(key, value));
}

function serializeScope(agg: ScopeAgg): Record<string, unknown> {
  return {
    totals: agg.totals,
    duos: serializeGroups(agg.duos, (champion, s) => ({ champion, ...s })),
    enemies: serializeGroups(agg.enemies, (champion, s) => ({
      champion,
      ...s,
    })),
    keystones: serializeGroups(agg.keystones, (id, s) => ({ id, ...s })),
    items: serializeGroups(agg.items, (id, s) => ({ id, ...s })).slice(
      0,
      ITEMS_CAP
    ),
    buildPaths: serializeGroups(agg.buildPaths, (_key, s) => ({ ...s })).slice(
      0,
      BUILD_PATHS_CAP
    ),
    runePages: serializeGroups(agg.runePages, (_key, s) => ({ ...s })).slice(
      0,
      RUNE_PAGES_CAP
    ),
    spells: serializeGroups(agg.spells, (_key, s) => ({ ...s })).slice(
      0,
      SPELLS_CAP
    ),
    durations: DURATION_BUCKETS.map((bucket, i) => ({
      key: bucket.key,
      ...(agg.durations[i] ?? { games: 0, wins: 0 }),
    })),
    regions: serializeGroups(agg.regions, (platform, s) => ({
      platform,
      ...s,
    })),
    tiers: serializeGroups(agg.tiers, (tier, s) => ({ tier, ...s })),
  };
}

/** One page of projected game rows for aggregation, newest first. */
export const getGamesPageForStats = internalQuery({
  args: { cursor: v.optional(v.number()), limit: v.number() },
  handler: async (ctx, args) => {
    const cursor = args.cursor;
    const rows = await ctx.db
      .query('yuumiGames')
      .withIndex('by_gameCreation', (q) =>
        cursor === undefined ? q : q.lt('gameCreation', cursor)
      )
      .order('desc')
      .take(args.limit);
    return rows.map((game) => ({
      gameCreation: game.gameCreation,
      patch: game.patch,
      platform: game.platform,
      tier: game.tier,
      win: game.win,
      gameDuration: game.gameDuration,
      kills: game.kills,
      deaths: game.deaths,
      assists: game.assists,
      enemyChampions: game.enemyChampions,
      ...(game.duoChampion !== undefined
        ? { duoChampion: game.duoChampion }
        : {}),
      ...(game.keystoneId !== undefined ? { keystoneId: game.keystoneId } : {}),
      ...(game.secondaryStyleId !== undefined
        ? { secondaryStyleId: game.secondaryStyleId }
        : {}),
      ...(game.items !== undefined ? { items: game.items } : {}),
      ...(game.buildPath !== undefined ? { buildPath: game.buildPath } : {}),
      ...(game.primaryRunes !== undefined
        ? { primaryRunes: game.primaryRunes }
        : {}),
      ...(game.secondaryRunes !== undefined
        ? { secondaryRunes: game.secondaryRunes }
        : {}),
      ...(game.statShards !== undefined
        ? { statShards: game.statShards }
        : {}),
      ...(game.summonerSpells !== undefined
        ? { summonerSpells: game.summonerSpells }
        : {}),
    }));
  },
});

/**
 * Roll the whole season's games into the 'metaStats' metadata blob
 * (hourly cron). Reads the DB only — no Riot API traffic. On failure the
 * previous blob stays in place, so the stats page never regresses.
 */
export const computeMetaStats = internalAction({
  args: {},
  handler: async (ctx) => {
    const seasonStart = parseSeasonStartValue(
      await ctx.runQuery(internal.highelo.getMetadataValue, {
        key: 'seasonStart',
      })
    );
    // Current+last patch, maintained by the poll. Empty (pre-first-poll)
    // means the window scope simply matches the season scope.
    const patchWindow = parseStringArray(
      await ctx.runQuery(internal.highelo.getMetadataValue, {
        key: 'patchWindow',
      })
    );
    const oldestWindowPatch = patchWindow[patchWindow.length - 1];
    // Completed-items catalog (maintained by the poll on patch rollover);
    // empty set just disables item winrates for this run.
    const completedItems = parseCompletedItemIds(
      await ctx.runQuery(internal.highelo.getMetadataValue, {
        key: 'completedItems',
      })
    );

    const season = newScopeAgg();
    const window = newScopeAgg();
    const patchTrend = new Map<string, WinCount>();

    let cursor: number | undefined;
    let scanned = 0;
    let done = false;
    while (!done) {
      const page: StatsGameRow[] = await ctx.runQuery(
        internal.meta.getGamesPageForStats,
        { limit: STATS_PAGE_SIZE, ...(cursor !== undefined ? { cursor } : {}) }
      );
      for (const game of page) {
        cursor = game.gameCreation;
        if (game.gameCreation < seasonStart) {
          // Pages walk newest-to-oldest, so everything from here back is
          // pre-season (rows awaiting the daily prune) — stop entirely.
          done = true;
          break;
        }
        scanned++;
        addGame(season, game, completedItems);
        bump(patchTrend, game.patch, game.win);
        // The feed treats games NEWER than the stored window as in-window
        // (ddragon lags new patches), so only strictly-older ones fall out.
        if (
          oldestWindowPatch === undefined ||
          !isOlderPatch(game.patch, oldestWindowPatch)
        ) {
          addGame(window, game, completedItems);
        }
      }
      if (page.length < STATS_PAGE_SIZE || scanned >= STATS_MAX_SCANNED) {
        done = true;
      }
    }

    await ctx.runMutation(internal.highelo.setMetadataValue, {
      key: 'metaStats',
      value: JSON.stringify({
        computedAt: Date.now(),
        seasonStart,
        patchWindow,
        scanned,
        window: serializeScope(window),
        season: serializeScope(season),
        // Season-wide per-patch winrate, oldest patch first.
        patchTrend: [...patchTrend.entries()]
          .sort(([a], [b]) => (isOlderPatch(a, b) ? -1 : 1))
          .map(([patch, s]) => ({ patch, ...s })),
      }),
    });
  },
});

/**
 * The aggregated meta-stats blob for the /stats page, or null before the
 * first hourly compute has run. Shape: see computeMetaStats above and
 * src/lib/highelo/meta-stats.ts (the client-side contract).
 */
export const getMetaStats = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', 'metaStats'))
      .unique();
    if (!row) return null;
    try {
      const parsed: unknown = JSON.parse(row.value);
      if (!isRecord(parsed) || typeof parsed.computedAt !== 'number') {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },
});

// ---------- roster snapshots & climbers ----------

/**
 * Ladder producers (players with counted games), projected for snapshots.
 * The roster is bounded by active Master+ Yuumi players (a few thousand
 * rows), so a single collect stays well under query limits.
 */
export const getProducersForSnapshot = internalQuery({
  args: {},
  handler: async (ctx) => {
    const roster = await ctx.db.query('yuumiRoster').collect();
    return roster
      .filter((p) => (p.gamesCount ?? 0) > 0 && p.gameName)
      .map((p) => ({
        puuid: p.puuid,
        platform: p.platform,
        tier: p.tier,
        lp: p.lp,
        gamesCount: p.gamesCount ?? 0,
        wins: p.wins ?? 0,
        gameName: p.gameName ?? 'Unknown',
        tagLine: p.tagLine ?? '',
      }));
  },
});

export const insertSnapshots = internalMutation({
  args: {
    takenAt: v.number(),
    rows: v.array(
      v.object({
        puuid: v.string(),
        platform: v.string(),
        tier: v.string(),
        lp: v.number(),
        gamesCount: v.number(),
        wins: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const row of args.rows) {
      await ctx.db.insert('rosterSnapshots', {
        ...row,
        takenAt: args.takenAt,
      });
    }
  },
});

/** Deletes up to `limit` snapshots older than `cutoff`; returns count. */
export const deleteSnapshotsBefore = internalMutation({
  args: { cutoff: v.number(), limit: v.number() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('rosterSnapshots')
      .withIndex('by_takenAt', (q) => q.lt('takenAt', args.cutoff))
      .take(args.limit);
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return rows.length;
  },
});

/** Parse the climber baseline; null when missing or malformed. */
function parseClimberBaseline(
  raw: string | null
): { takenAt: number; lpByPuuid: Map<string, number> } | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || typeof parsed.takenAt !== 'number') return null;
    if (!Array.isArray(parsed.players)) return null;
    const lpByPuuid = new Map<string, number>();
    for (const entry of parsed.players) {
      if (
        isRecord(entry) &&
        typeof entry.puuid === 'string' &&
        typeof entry.lp === 'number'
      ) {
        lpByPuuid.set(entry.puuid, entry.lp);
      }
    }
    return { takenAt: parsed.takenAt, lpByPuuid };
  } catch {
    return null;
  }
}

/**
 * Daily ladder snapshot (cron). Appends one rosterSnapshots row per
 * producer (profile form sparklines), prunes old snapshots, and refreshes
 * the weekly-climbers board: deltas are computed against a stored LP
 * baseline that rotates every CLIMBER_WINDOW_MS, so the board always shows
 * gains over a rolling <=7 day window. DB-only — no Riot API traffic.
 */
export const snapshotRoster = internalAction({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const producers = await ctx.runQuery(
      internal.meta.getProducersForSnapshot,
      {}
    );

    for (let i = 0; i < producers.length; i += SNAPSHOT_INSERT_CHUNK) {
      await ctx.runMutation(internal.meta.insertSnapshots, {
        takenAt: now,
        rows: producers
          .slice(i, i + SNAPSHOT_INSERT_CHUNK)
          .map(({ puuid, platform, tier, lp, gamesCount, wins }) => ({
            puuid,
            platform,
            tier,
            lp,
            gamesCount,
            wins,
          })),
      });
    }

    let deleted = 0;
    do {
      deleted = await ctx.runMutation(internal.meta.deleteSnapshotsBefore, {
        cutoff: now - SNAPSHOT_RETENTION_MS,
        limit: 1000,
      });
    } while (deleted > 0);

    // Climbers: compare today's LP against the stored baseline BEFORE
    // rotating it, so day-7 still reports the full week's gains.
    const baseline = parseClimberBaseline(
      await ctx.runQuery(internal.highelo.getMetadataValue, {
        key: 'climberBaseline',
      })
    );
    if (baseline && baseline.lpByPuuid.size > 0) {
      const entries = producers
        .flatMap((p) => {
          const baseLp = baseline.lpByPuuid.get(p.puuid);
          if (baseLp === undefined) return [];
          const delta = p.lp - baseLp;
          return delta > 0 ? [{ ...p, delta }] : [];
        })
        .sort((a, b) => b.delta - a.delta)
        .slice(0, CLIMBER_COUNT)
        .map(({ puuid, platform, tier, lp, gameName, tagLine, delta }) => ({
          puuid,
          platform,
          tier,
          lp,
          gameName,
          tagLine,
          delta,
        }));
      await ctx.runMutation(internal.highelo.setMetadataValue, {
        key: 'climbers',
        value: JSON.stringify({
          since: baseline.takenAt,
          computedAt: now,
          entries,
        }),
      });
    }
    if (!baseline || now - baseline.takenAt >= CLIMBER_WINDOW_MS) {
      await ctx.runMutation(internal.highelo.setMetadataValue, {
        key: 'climberBaseline',
        value: JSON.stringify({
          takenAt: now,
          players: producers.map((p) => ({ puuid: p.puuid, lp: p.lp })),
        }),
      });
    }
  },
});

/**
 * The weekly-climbers board for the ladder page, or null before enough
 * snapshot history exists. Entries are LP gains over a rolling <=7d window.
 */
export const getClimbers = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', 'climbers'))
      .unique();
    if (!row) return null;
    try {
      const parsed: unknown = JSON.parse(row.value);
      if (
        !isRecord(parsed) ||
        typeof parsed.since !== 'number' ||
        !Array.isArray(parsed.entries)
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  },
});

/** Daily LP snapshots for one player, oldest first (profile sparkline). */
export const getPlayerSnapshots = query({
  args: { puuid: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('rosterSnapshots')
      .withIndex('by_puuid', (q) => q.eq('puuid', args.puuid))
      .collect();
    return rows
      .sort((a, b) => a.takenAt - b.takenAt)
      .slice(-90)
      .map((row) => ({ takenAt: row.takenAt, lp: row.lp, tier: row.tier }));
  },
});
