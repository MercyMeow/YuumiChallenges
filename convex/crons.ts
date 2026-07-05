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

export default crons;
