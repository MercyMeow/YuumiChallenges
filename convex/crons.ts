import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Refresh the auto-scraped Yuumi build once a day. On failure the last
// good build stays in guideMetadata, so the site never regresses.
crons.daily(
  'auto update yuumi build',
  { hourUTC: 6, minuteUTC: 30 },
  internal.scraper.autoUpdateBuild
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

export default crons;
