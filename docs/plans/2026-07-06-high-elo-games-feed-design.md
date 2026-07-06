# High Elo Yuumi Games Feed — Design

**Date:** 2026-07-06
**Status:** Validated with user, ready for implementation planning

## Goal

A dedicated page listing every Master+ Ranked Solo/Duo Yuumi game across all
Riot regions, played on the current or previous patch, refreshed every
5 minutes. Cards show team comps plus essential basics; clicking a card opens
the existing match viewer (`/match/[matchId]`), which fetches full details
live — so we store only what the card needs.

## Constraints & decisions

- **Riot API key:** production tier (high rate limits, but not unlimited).
- **Queues:** Ranked Solo/Duo only (queue 420).
- **Placement:** dedicated `/games` page with its own nav entry.
- **Card contents:** full team comps (10 champion icons) + Yuumi player name,
  tier, LP, KDA, win/loss, region, patch, relative time, duration.
- **Retention:** current + last patch only; older games pruned.

## Discovery architecture (Option B — two-tier roster)

Riot has no matches-by-champion endpoint, and polling all ~50–60k Master+
players every 5 minutes exceeds even production limits. Instead we exploit
that high-elo Yuumi players are few and sticky (mostly OTPs):

### Slow loop — roster builder (rolling)

1. Once per day per platform (~16 platforms): fetch Challenger, Grandmaster,
   and Master leagues for `RANKED_SOLO_5x5` (League-V4, 3 calls per
   platform). Entries include PUUIDs.
2. Rolling sweep: for each ladder player, one call to Champion-Mastery-V4
   `by-puuid/{puuid}/by-champion/350` (Yuumi). The response's `lastPlayTime`
   tells us if they touched Yuumi recently (within ~2 patches) → add to the
   watch roster. Mastery calls are platform-routed, so the sweep parallelizes
   across all 16 platforms and a full pass completes in a few hours,
   continuously repeating via a cursor.

### Fast loop — every 5 minutes

For each roster player (expected 300–1,500 globally): Match-V5
`by-puuid/{puuid}/ids?queue=420&startTime=<lastCheckedAt>`. Mostly empty
responses (cheap). For each new match ID: fetch match details once, confirm
Yuumi was played and the player is Master+, extract card data, insert into
`yuumiGames`. Requests grouped by routing cluster (americas/asia/europe/sea)
with a token bucket honoring rate-limit headers and backing off on 429.

New Yuumi players are discovered within hours of their first high-elo Yuumi
game; everyone already on the roster gets 5-minute freshness.

## Backend (Convex — self-hosted)

### Tables (additions to `convex/schema.ts`)

- **`yuumiRoster`** — `puuid`, `platform` (euw1, kr, na1, …), `gameName`,
  `tagLine`, `tier` (MASTER | GRANDMASTER | CHALLENGER), `lp`,
  `yuumiLastPlayTime`, `lastCheckedAt`. Indexes: by platform, by
  `lastCheckedAt`.
- **`yuumiGames`** — `matchId` (e.g. `EUW1_123…`, unique index), `platform`,
  `patch` ("16.13"), `gameCreation`, `gameDuration`, `win`, Yuumi player
  (`name`, `tier`, `lp`, `kills`, `deaths`, `assists`), `allyChampions`
  (5 names), `enemyChampions` (5 names). Index: by `gameCreation`.
- **`ladderSweepState`** — per-platform cursor so the rolling mastery sweep
  resumes where it left off.

### Crons (additions to `convex/crons.ts`)

- **Every 5 min** — `pollRosterMatches` (action): fast loop above.
- **Every 15 min** — `sweepLadderChunk` (action): refresh league lists daily,
  then work through a chunk of mastery checks per platform.
- **Daily** — `pruneOldGames`: delete games older than the last-patch window
  and roster entries that demoted or went inactive. Patch boundaries derived
  from ddragon versions (same source the site already uses).

`RIOT_API_KEY` lives in Convex env (`npx convex env set`), never client-side.

## Frontend — `/games`

- **Route:** `src/app/games/page.tsx` + client component. New entry in
  `src/components/shell/nav.ts` ("High Elo", rank-emblem icon from
  `public/images/ranked/`) so it appears in TopNav + SideRail.
- **Header:** `OrnateHeading` ("Master+ Yuumi Games"), live patch badge,
  "updates every 5 minutes" note, total-games count.
- **Filter bar** (hextech panel): region select, patch toggle
  (current / last / both), win-loss toggle. Client-side filtering.
- **Game cards:** full-width hextech rows, newest first. Left: Yuumi player
  (name, tier emblem, LP, KDA) with win/loss gold-vs-muted accent border.
  Center: 5v5 `DataDragonImage` champion icons, Yuumi ring-highlighted.
  Right: region badge, patch, duration, relative time. Whole row links to
  `/match/{matchId}`.
- **Data flow:** `useQuery(api.highelo.listGames)` — Convex reactivity means
  new games appear live without refresh. If Convex is unreachable, show an
  empty-state panel ("feed unavailable") instead of breaking.
- **Pagination:** initial 50 games + "load more" (Convex cursor pagination).

## Out of scope

- Storing full match payloads (match viewer fetches live).
- Flex queue, non-ranked queues, below-Master games.
- Historical stats/aggregations over the feed (win rates etc.) — possible
  later on top of `yuumiGames`.
