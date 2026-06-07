# Mythic Shop Resets

The home page (`src/app/page.tsx`) always shows the League of Legends Mythic
Shop reset countdowns via `MythicShopRotationPanel`.

## Why timers only (no live item list)

Riot exposes **no public API** for the Mythic Shop, and its contents are
randomly generated server-side. Every third-party source we evaluated is
unreliable for automation:

- The Fandom wiki (`leagueoflegends.fandom.com`) is an abandoned mirror — its
  "current" rotation was ~2 years stale.
- The active official wiki (`wiki.leagueoflegends.com`) redirects the rotation
  page to a generic article with no parseable current list.
- The freshest human-maintained guides (Mobalytics, esports.gg) block
  server-side requests (HTTP 403).
- The one reachable guide (esports.net) has uncertain update cadence.

So instead of scraping a source that can silently go stale, we show only what we
can compute deterministically — the **reset countdowns** — and link out for the
live item list. The in-game client (Loot tab) remains the source of truth.

## Reset timers

Countdowns are computed locally in `src/lib/mythic-shop/reset-schedule.ts` from
Riot's documented rules ("The Shops Update"):

- **Daily** accessories reset every day at 00:00 UTC.
- **Weekly** chromas reset every Thursday at 00:00 UTC.
- **Bi-weekly** Mythic skins reset every two weeks on Thursday at 00:00 UTC,
  anchored to `2026-01-01` (a Thursday). Update `BIWEEKLY_ANCHOR_UTC` if Riot
  ever shifts the bi-weekly boundary.
- **Featured** content is event-based (ad hoc) and shows "Varies by event".

The panel re-renders the countdowns once a minute. To avoid hydration
mismatches, the first paint shows a placeholder and the timer starts on mount.

## Item list

`MythicShopRotationPanel` links to a community tracker
(`MYTHIC_SHOP_TRACKER_URL` in `src/lib/utils/constants.ts`) for the actual
current items. Update that constant if a better source becomes available.
