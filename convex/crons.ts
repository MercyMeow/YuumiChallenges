import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Derive the homepage Yuumi build from our own Master+ ladder aggregate
// (convex/autobuild.ts) once a day. Scheduled at 6:30 UTC, comfortably after
// the hourly metaStats compute (:20) that it reads from. On failure the last
// good build stays in guideMetadata, so the site never regresses. The OP.GG
// scraper stays available as a manual fallback:
//   npx convex run scraper:autoUpdateBuild
crons.daily(
  'derive yuumi build from ladder',
  { hourUTC: 6, minuteUTC: 30 },
  internal.autobuild.deriveAutoBuild
);

// High-elo Yuumi feed: game polling and season backfill each serve ONE
// match-v5 cluster per run, rotating americas -> asia -> europe -> sea and
// offset from each other by two slots, so the dev-tier Riot key's
// per-cluster budget is never shared by two jobs. The ladder sweep only
// touches per-platform hosts (independent buckets) and stays parallel.
// See the rate-limit notes at the top of convex/highelo.ts.
crons.interval(
  'poll high elo yuumi games',
  { minutes: 5 },
  internal.highelo.pollRosterMatches,
  {}
);
crons.interval(
  'backfill season yuumi games',
  { minutes: 5 },
  internal.highelo.backfillSeason,
  {}
);
crons.interval(
  'sweep high elo ladder',
  { minutes: 15 },
  internal.highelo.sweepLadderChunk
);
crons.daily(
  'prune high elo feed',
  { hourUTC: 5, minuteUTC: 45 },
  internal.highelo.pruneOldGames
);

// Ladder meta stats & snapshots (convex/meta.ts): DB-only aggregation over
// the games feed — no Riot API traffic, so the jobs above keep their full
// per-cluster rate budgets.
crons.hourly(
  'compute yuumi meta stats',
  { minuteUTC: 20 },
  internal.meta.computeMetaStats,
  {}
);
crons.daily(
  'snapshot yuumi ladder',
  { hourUTC: 4, minuteUTC: 50 },
  internal.meta.snapshotRoster,
  {}
);

export default crons;
