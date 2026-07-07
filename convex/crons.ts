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

// High-elo Yuumi feed: fast game polling, rolling ladder sweep, and a daily
// prune to the current+last patch window. See convex/highelo.ts.
crons.interval(
  'poll high elo yuumi games',
  { minutes: 5 },
  internal.highelo.pollRosterMatches
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
