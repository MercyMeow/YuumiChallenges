// Client-side contract for the aggregated meta-stats blob computed by
// convex/meta.ts (computeMetaStats) and served by api.meta.getMetaStats.
// The writer is ours, so parsing stays light: verify the top-level shape
// and trust the leaf values.

export type WinCount = { games: number; wins: number };
export type DuoStat = WinCount & {
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
};
export type ChampionStat = WinCount & { champion: string };
export type KeystoneStat = WinCount & { id: number };
export type DurationStat = WinCount & { key: string };
export type RegionStat = WinCount & { platform: string };
export type TierStat = WinCount & { tier: string };
export type PatchStat = WinCount & { patch: string };

export type MetaScope = {
  totals: WinCount;
  duos: DuoStat[];
  enemies: ChampionStat[];
  keystones: KeystoneStat[];
  durations: DurationStat[];
  regions: RegionStat[];
  tiers: TierStat[];
};

export type MetaStats = {
  computedAt: number;
  seasonStart: number;
  patchWindow: string[];
  scanned: number;
  window: MetaScope;
  season: MetaScope;
  patchTrend: PatchStat[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isScope(value: unknown): value is MetaScope {
  return (
    isRecord(value) &&
    isRecord(value.totals) &&
    typeof value.totals.games === 'number' &&
    Array.isArray(value.duos) &&
    Array.isArray(value.enemies) &&
    Array.isArray(value.keystones) &&
    Array.isArray(value.durations) &&
    Array.isArray(value.regions) &&
    Array.isArray(value.tiers)
  );
}

/** Validated meta-stats payload, or null when missing/malformed. */
export function parseMetaStats(value: unknown): MetaStats | null {
  if (
    !isRecord(value) ||
    typeof value.computedAt !== 'number' ||
    !Array.isArray(value.patchTrend) ||
    !isScope(value.window) ||
    !isScope(value.season)
  ) {
    return null;
  }
  return value as unknown as MetaStats;
}

// ---------- weekly climbers (api.meta.getClimbers) ----------

export type Climber = {
  puuid: string;
  platform: string;
  tier: string;
  lp: number;
  gameName: string;
  tagLine: string;
  delta: number;
};

export type Climbers = {
  since: number;
  computedAt: number;
  entries: Climber[];
};

/** Validated climbers payload, or null when missing/malformed. */
export function parseClimbers(value: unknown): Climbers | null {
  if (
    !isRecord(value) ||
    typeof value.since !== 'number' ||
    typeof value.computedAt !== 'number' ||
    !Array.isArray(value.entries)
  ) {
    return null;
  }
  const entries = value.entries.filter(
    (entry): entry is Climber =>
      isRecord(entry) &&
      typeof entry.puuid === 'string' &&
      typeof entry.gameName === 'string' &&
      typeof entry.tagLine === 'string' &&
      typeof entry.platform === 'string' &&
      typeof entry.tier === 'string' &&
      typeof entry.lp === 'number' &&
      typeof entry.delta === 'number'
  );
  return { since: value.since, computedAt: value.computedAt, entries };
}

/** Whole-percent winrate, matching the site's display convention. */
export function winratePct(stat: WinCount): number {
  return stat.games > 0 ? Math.round((stat.wins / stat.games) * 100) : 0;
}

/** Average KDA string over summed kills/deaths/assists ('Perfect' at 0 deaths). */
export function avgKda(stat: {
  kills: number;
  deaths: number;
  assists: number;
}): string {
  return stat.deaths === 0
    ? 'Perfect'
    : ((stat.kills + stat.assists) / stat.deaths).toFixed(2);
}
