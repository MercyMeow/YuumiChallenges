# Mythic Shop Rotation

The home page (`src/app/page.tsx`) always displays the current League of Legends
Mythic Shop rotation via `MythicShopRotationPanel`.

## Data source

Riot does **not** expose a public API for the Mythic Shop (the store runs on a
separate server and rotations are timer-based / auto-generated). We therefore
ingest the community-maintained
[League Wiki – Mythic Shop Rotation](https://leagueoflegends.fandom.com/wiki/Mythic_Shop_Rotation)
page through the Fandom MediaWiki `parse` API:

```
https://leagueoflegends.fandom.com/api.php?action=parse&prop=wikitext&format=json&page=Mythic%20Shop%20Rotation
```

The raw **wikitext** is parsed in `src/lib/mythic-shop/parse-wiki-rotation.ts`.
Each entry is a `{{Mythic_Shop_Rotation}}` template with a `{{ME|<cost>}}`
header and a `|title =` line. Only the "Current" block is read (parsing stops at
the "Upcoming" block). Items are bucketed into sections by their Mythic Essence
cost (`featured` ≥ 250, `biweekly` ≥ 100, `weekly` ≥ 35, otherwise `daily`).

> The wiki does not support the `extracts`/plaintext or rendered-HTML
> endpoints, so wikitext is the most stable structured source.

## Reset timers

Countdowns are computed locally in `src/lib/mythic-shop/reset-schedule.ts` from
Riot's documented rules:

- **Daily** accessories reset every day at 00:00 UTC.
- **Weekly** chromas reset every Thursday at 00:00 UTC.
- **Bi-weekly** Mythic skins reset every two weeks on Thursday at 00:00 UTC,
  anchored to `2026-01-01` (a Thursday). Update `BIWEEKLY_ANCHOR_UTC` if Riot
  ever shifts the bi-weekly boundary.

## Caching & resilience

- Server route `src/app/api/mythic-shop/rotation/route.ts` caches the parsed
  rotation in memory for 4 hours.
- On a fetch/parse failure the route serves the last good payload flagged with
  `stale: true`; the panel shows a warning banner in that case.
- The client hook `src/hooks/use-mythic-shop-rotation.ts` adds a 1-hour
  session cache.

## Verifying / updating

The wiki can lag the in-game client, which is always the source of truth. To
verify, open the League client → Loot → Mythic Shop and compare. If the wiki
template structure changes and parsing breaks, adjust `ENTRY_REGEX` /
`UPCOMING_MARKER` in `parse-wiki-rotation.ts`, or swap the implementation of
`fetch-wiki-rotation.ts` for an alternate source while keeping the same API
shape.
