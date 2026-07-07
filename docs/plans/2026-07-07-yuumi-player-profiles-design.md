# Yuumi Player Profiles & Ladder — Design

**Date:** 2026-07-07
**Status:** Validated with user, ready for implementation planning
**Builds on:** 2026-07-06-high-elo-games-feed-design.md (roster + games pipeline)

## Goal

onetricks.gg-style shareable profiles, but Yuumi-only and Master+ only: a
global LP-ranked ladder of every Master+ Yuumi player (`/players`), and a
profile page per player (`/players/[region]/[riotId]`) showing rank, season
stats, common builds/runes, duo partners, and recent games — clean, in the
hextech theme, with Discord-rich sharing.

## Decisions

- **Scope:** leaderboard page + individual profile pages; game cards link to
  profiles.
- **Stats window:** season to date (not just the feed's 2-patch window).
- **Backfill:** yes — bounded backfill of season history on launch and for
  newly discovered players.
- **Profile contents:** identity header (rank/LP/ladder position/winrate/
  KDA), common builds + runes + spells, duo partners, recent games list.
- **Sharing:** pretty URLs + per-profile dynamic OG image for Discord.
- **Skill order:** explicitly out — would require the timeline endpoint
  (2x API cost) for a near-constant answer on Yuumi.

## Data model changes (extend, no new tables except backfill cursor)

### `yuumiGames` — add per-game build snapshot + identity

New fields extracted from the SAME match-details payload the poll already
fetches (zero extra API calls):

- `puuid` (+ index `by_puuid`) — profile queries and dedup per player
- `items: number[]` — final 7 slots (0 = empty)
- `keystoneId: number`, `secondaryStyleId: number`
- `summonerSpells: [number, number]`
- `duoChampion: string | null` — the bot-lane ADC on Yuumi's team, detected
  via `teamPosition === 'BOTTOM'` on Yuumi's team (fallback: null)

Existing rows lack these fields → schema fields optional; UI treats missing
build data gracefully (backfill re-ingests most rows anyway).

### Retention: season-long rows, 2-patch feed view

- Rows persist for the whole season (~300 bytes each).
- The `/games` feed query filters to the current 2-patch window; profile
  queries use the full table.
- Daily prune changes from patch-window deletion to "delete games older
  than season start". Season start lives in `guideMetadata['seasonStart']`
  (epoch ms) so a new split is one admin metadata change.

### `yuumiRoster` — denormalized season stats for the leaderboard

- `gamesCount`, `wins`, `killsTotal`, `deathsTotal`, `assistsTotal`
- Updated transactionally in the same mutation that inserts game rows;
  recompute path (recount from `yuumiGames` by puuid) used after backfill
  batches for self-healing.
- Leaderboard = roster sorted by tier+LP with stats attached — no per-view
  aggregation over game rows.

### `backfillState` — rolling cursor (same pattern as `ladderSweepState`)

Tracks per-player backfill progress; marks players `backfilledAt` when done.

## Backfill (bounded, budget-paced)

Riot's match-ids endpoint cannot filter by champion, so backfill = fetch
details to check. Bounds and pacing:

- Per player: up to the **last 200 season solo-queue matches** (queue 420,
  `startTime = seasonStart`), paged newest-first; ingest Yuumi games only.
- Order: players by most recent `yuumiLastPlayTime` first (value converges
  fast — active OTPs get full profiles on day one).
- **Budget per cron tick**: a few hundred match fetches, then yield. The
  5-minute poll is the priority consumer of the shared production key —
  lesson from the bootstrap sweep briefly 429'ing the match viewer.
- Dedup free via existing upsert-by-matchId; overlapping poll/backfill runs
  are safe. Completed cursor → job dormant. Newly discovered roster players
  get the same bounded backfill on first sight.

## Pages

### Navigation

- No 8th TopNav link (7 barely fit at 1024px). "High Elo" section gets
  Games / Players **tabs** at the top of both pages, styled like the guide's
  match tab triggers.
- SideRail: add "Yuumi Players" entry (icon: Users or Crown).

### `/players` — the ladder

- OrnateHeading ("The Yuumi Ladder"), reactive Convex query.
- Hextech table ranked by tier bucket then LP: rank #, tier emblem, Name#tag,
  region badge, LP, season games, winrate (gold accent ≥55%), avg KDA.
- Filters: region select; minimum-games (default ≥10) toggle.
- Rows link to profiles.

### `/players/[region]/[riotId]` — the profile

Example: `/players/euw/Shion-DNO`. Resolution: riotId slug → roster lookup
by gameName/tagLine + platform. Renames resolve automatically (roster stores
current name); stale links → "player not found — check the ladder" state
linking to `/players`.

Four panels (reusing existing shapes):

1. **Identity header** — big tier emblem, Name#tag, region, LP, ladder
   position ("#3 Yuumi worldwide"), season games / winrate / avg KDA.
2. **Common builds** — most-frequent completed item sets (pick count +
   winrate) with `DataDragonImage` items like the guide's build panels;
   keystone + secondary tree + summoner spells alongside.
3. **Duo partners** — top ADC partners: champion icon, games, winrate.
4. **Recent games** — reuse the GameCard row from `/games`, linking to the
   match viewer.

Low-volume guard: <5 season games → "early season" copy instead of a
misleading winrate.

## Sharing / Discord

- `opengraph-image.tsx` under the profile route (next/og, same Discord
  lessons as PR #29): navy hextech backdrop, gold border, tier emblem,
  Name#TAG — REGION, stat blocks (winrate / games / KDA), yuumi.quest footer.
  Data via `ConvexHttpClient`, `revalidate ~3600`.
- `generateMetadata`: title "Name#TAG — Yuumi Player Profile", description
  with rank/winrate/games, OG + Twitter card tags.
- Unknown player → generic fallback OG + not-found page state.

## Rollout

Continues on `feat/high-elo-games-feed` (extends `convex/highelo.ts` and the
same schema). Ship as one PR or split at merge time.
