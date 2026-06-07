/**
 * Computes the next reset time for each Mythic Shop section.
 *
 * Riot's documented rules (see "The Shops Update"):
 * - Daily accessories reset every day at 00:00 UTC.
 * - Weekly chromas reset every Thursday at 00:00 UTC.
 * - Bi-weekly Mythic skins reset every two weeks on Thursday at 00:00 UTC.
 *
 * The featured section has no fixed cadence (ad hoc), so it returns null.
 *
 * All functions take an explicit `now` for testability and to keep the logic
 * pure; callers pass `new Date()` at request time.
 */

import type { MythicShopSectionId } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const THURSDAY = 4; // Date.getUTCDay(): Sunday = 0 ... Thursday = 4.

/**
 * Anchor Thursday (00:00 UTC) used to derive the bi-weekly parity.
 * 2026-01-01 is a Thursday; bi-weekly periods run in 14-day blocks from here.
 *
 * NOTE: If a future shop revamp shifts the bi-weekly boundary, update this
 * anchor to any known bi-weekly reset Thursday.
 */
const BIWEEKLY_ANCHOR_UTC = Date.UTC(2026, 0, 1);

/** Returns the next 00:00 UTC strictly after `now`. */
export function nextDailyReset(now: Date): Date {
  const next = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  if (next.getTime() <= now.getTime()) {
    next.setTime(next.getTime() + MS_PER_DAY);
  }
  return next;
}

/** Returns the next Thursday 00:00 UTC strictly after `now`. */
export function nextWeeklyReset(now: Date): Date {
  const candidate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const dayDelta = (THURSDAY - candidate.getUTCDay() + 7) % 7;
  candidate.setTime(candidate.getTime() + dayDelta * MS_PER_DAY);
  if (candidate.getTime() <= now.getTime()) {
    candidate.setTime(candidate.getTime() + 7 * MS_PER_DAY);
  }
  return candidate;
}

/**
 * Returns the next bi-weekly Thursday 00:00 UTC strictly after `now`,
 * aligned to the 14-day cadence anchored at BIWEEKLY_ANCHOR_UTC.
 */
export function nextBiweeklyReset(now: Date): Date {
  let candidate = nextWeeklyReset(now).getTime();
  const weeksFromAnchor = Math.round(
    (candidate - BIWEEKLY_ANCHOR_UTC) / (7 * MS_PER_DAY)
  );
  if (weeksFromAnchor % 2 !== 0) {
    candidate += 7 * MS_PER_DAY;
  }
  return new Date(candidate);
}

/** Returns the next reset ISO string for a section, or null if ad hoc. */
export function getNextResetForSection(
  section: MythicShopSectionId,
  now: Date
): string | null {
  switch (section) {
    case 'daily':
      return nextDailyReset(now).toISOString();
    case 'weekly':
      return nextWeeklyReset(now).toISOString();
    case 'biweekly':
      return nextBiweeklyReset(now).toISOString();
    case 'featured':
      return null;
    default: {
      const exhaustive: never = section;
      return exhaustive;
    }
  }
}
