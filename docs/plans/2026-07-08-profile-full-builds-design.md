# Player Profile Full Builds — Design

**Date:** 2026-07-08
**Scope:** Player profiles (`/players/[region]/[riotId]`) show full rune
pages, summoner spell icons, and ordered build paths — the same information
onetricks.gg surfaces, rendered in the hextech theme.

## What's missing today

`yuumiGames` rows store only `keystoneId`, `secondaryStyleId`,
`summonerSpells`, and the final item slots. Two data gaps:

1. **Full rune pages** (all 6 perks + 3 stat shards) — present in the
   match-v5 payload `extractGame` already parses; just not stored.
2. **Build path** (item *purchase order*) — only exists in the match-v5
   **timeline** endpoint: one extra Riot API call per game.

Decisions (confirmed): profiles only; fetch timelines; re-backfill the
season's history so existing games gain the new fields.

## Schema (`yuumiGames`, all optional — legacy rows lack them)

| Field | Type | Notes |
|---|---|---|
| `primaryRunes` | `number[]` | 4 perk ids, keystone first |
| `secondaryRunes` | `number[]` | 2 perk ids |
| `statShards` | `number[]` | `[offense, flex, defense]` |
| `buildPath` | `number[]` | completed items in purchase order, max 8 |

`primaryRunes` doubles as the **enrichment marker**: rows without it are
re-fetched and patched. `buildPath` may be absent when the timeline fetch
fails (never retried — acceptable, rare) and `[]` when no completed item
was purchased.

## Ingestion (`convex/highelo.ts`)

- `extractGame` also returns the three rune arrays (same `perks` blob it
  already walks, plus `statPerks`).
- New `extractBuildPath(timeline, puuid, completedItems)`: resolve the
  player's `participantId`, walk frame events in order — `ITEM_PURCHASED`
  appends, `ITEM_UNDO` removes the last occurrence of `beforeId` — then
  filter to the completed-items catalog (same `completedItems` metadata the
  profile query uses) and cap at 8.
- `pollCluster` / `backfillCluster` fetch the timeline after each match
  (failure degrades to no `buildPath`, never drops the game). The timeline
  fetch counts against the backfill budget, so a backfill run does half as
  many games per cycle — acceptable, the loop is budget-paced by design.
- `getExistingMatchIds` treats **unenriched** rows (no `primaryRunes`) as
  missing so both loops re-fetch them; `recordPollResults` patches the
  enrichment fields onto existing rows *without* touching roster counters.
- One-shot `clearBackfillMarkers` mutation (run once after deploy): clears
  `backfilledAt` on every roster row so the dormant backfill cron sweeps
  the season again and enriches history. Stats are recomputed per player by
  the existing `recomputePlayerStats`, which is idempotent.

## Profile query (`getPlayerProfile`)

- `runePages` groups by the full signature (runes + shards + spells) when
  present, falling back to the legacy keystone/style/spells key; each group
  carries the optional full-page arrays for the UI.
- New `buildPaths`: games with `buildPath.length >= 3` group by the first
  three purchases (stable stats despite late-game variance); each group
  shows the newest game's full path. Top 3 by games.
- `builds` (completed-item sets) stays as-is.

## UI (`profile-client.tsx`)

Inside the existing Common Builds panel, hextech-styled:

1. **Build Path** rows — `ItemSlot` sequence joined by gold chevrons,
   games/WR badge.
2. **Item sets** — unchanged.
3. **Rune pages** — keystone `RuneIcon` + 3 primary minors + secondary
   `RuneTreeIcon` + 2 secondary runes + 3 `StatShardIcon` + 2
   `SummonerSpell` icons + games/WR. Pages without full data render the
   current compact row (transition state until backfill completes).

The onetricks grayed-out full-tree visual is intentionally not replicated;
the compact row carries the same information at profile-row scale.

## Rollout

1. Deploy Convex (blocked until the in-flight `scraper.ts` WIP compiles).
2. `npx convex run highelo:clearBackfillMarkers`
3. Backfill cron re-sweeps the season (budget-paced, roughly a day or two);
   profiles fill in progressively — the UI renders legacy rows until then.
