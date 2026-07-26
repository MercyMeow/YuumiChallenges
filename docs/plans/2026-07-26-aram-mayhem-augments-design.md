# ARAM Mayhem Augments — Design

**Date:** 2026-07-26  
**Status:** Approved  
**Route:** `/mayhem`

## Goal

Add a dedicated **Mayhem** tab that surfaces live ARAM: Mayhem augment meta from IESDev, in a champion-first flow that matches the Hextech Grimoire theme.

## Requirements

1. **Champion-first:** Full roster, searchable; empty until a champion is selected.
2. **Split view after pick:**
   - **Best for {Champ}** — augments where the champ appears in `top_champions`, sorted by that champ’s tier (1 → 5).
   - **All augments** — full list by overall meta tier; rows that include the selected champ are highlighted; optional name search.
3. **Live data** from `https://data.v2.iesdev.com/api/v1/query_objects/prod/lol/aram_mayhem_augments`.
4. **Enrichment:** Resolve `augment_id` → name + icon (CommunityDragon); resolve `champion_id` → name + square (Data Dragon / existing helpers).
5. **Theme fit:** Same shell patterns as `/stats` and `/games` (`OrnateHeading`, `HextechPanel`, hex chips, navy/gold tokens).

## Non-goals (v1)

- Historical patch picker / time travel
- Win-rate or pick-rate numbers beyond the feed’s tier fields
- Convex / Mongo persistence of snapshots
- Admin editing of tiers
- Placing this under High Elo tabs

## Architecture

### Approach

Next.js API proxy + client page (same family as Data Dragon / match-detail proxies). No Convex cron for v1 — the upstream feed is already continuously updated.

```
Browser (mayhem-client)
    → GET /api/mayhem/augments
        → IESDev aram_mayhem_augments
        → CommunityDragon augment catalog (names/icons)
        → Champion id map (existing DD helpers)
    ← enriched JSON
```

### Files

| Path | Role |
|------|------|
| `src/app/mayhem/page.tsx` | Thin server page + metadata |
| `src/app/mayhem/mayhem-client.tsx` | Champion picker + split lists |
| `src/app/api/mayhem/augments/route.ts` | Proxy + enrich + cache |
| `src/lib/mayhem/types.ts` | Shared request/response types |
| `src/lib/mayhem/enrich.ts` | Join IESDev rows with CDragon + champs |
| `src/components/shell/TopNav.tsx` | Add “Mayhem” link |
| `src/components/shell/SideRail.tsx` | Add under Resources |

### API response shape

```ts
type MayhemAugmentsResponse = {
  patch: string;
  generatedAt: string; // ISO from feed meta
  champions: Array<{
    id: string;
    key: string;
    name: string;
    squareUrl: string;
  }>;
  augments: Array<{
    id: string;
    name: string;
    iconUrl: string;
    description?: string;
    metaTier: 1 | 2 | 3 | 4 | 5; // 1 = S … 5 = D
    topChampions: Array<{
      id: string;
      key: string;
      name: string;
      squareUrl: string;
      tier: 1 | 2 | 3 | 4 | 5;
    }>;
  }>;
};
```

### Caching

- Route uses `revalidate` ≈ 3600s (1 hour).
- Fail soft: non-OK upstream → JSON `{ error }` with appropriate status; client shows Hextech error panel.
- Unknown augment ids still render with fallback label (`Augment {id}`) and a placeholder icon so the list never blanks.

### Client data logic

1. Fetch `/api/mayhem/augments` once on mount.
2. Load champion roster from the same source the rest of the site uses for squares/keys.
3. On champion select (`championId`):
   - `best` = augments where `topChampions` contains that id, sort by that entry’s `tier` asc, then `metaTier` asc.
   - `all` = all augments sorted by `metaTier` asc; `highlighted` = ids in `best`.
4. Optional text filter on augment name applies to the **All** section only (Best stays complete).

## UX

### Empty state

- `OrnateHeading`: “ARAM Mayhem”
- Subline: patch + “Updated …” from `generatedAt`
- Searchable champion picker (square + name); Hextech input styling
- No augment rows until a pick

### Selected state

1. Selected champ chip / clear control at top
2. **Best for {Name}** panel — ranked augment rows:
   - Icon | name | meta tier chip | champ tier chip
3. **All augments** panel — same row layout; relevant rows get soft `hx-magic` border highlight; mini strip of top-5 champ faces optional on each row
4. Mobile: picker full-width; lists stack; chips wrap

### Tier display

| Feed tier | Label |
|-----------|-------|
| 1 | S |
| 2 | A |
| 3 | B |
| 4 | C |
| 5 | D |

Use existing `hex-chip` / gold→steel progression; no purple glow.

### Navigation

- TopNav `NAV_LINKS`: `{ href: '/mayhem', label: 'Mayhem' }`
- SideRail `RESOURCE_LINKS`: same entry beside Meta Stats / Match Viewer
- Do **not** add to `HighEloTabs`

## Error & loading

- Loading: `PanelSkeleton` inside `HextechPanel`
- Fetch error: short message + retry affordance
- Partial enrich (missing CDragon entry): keep row, fallback name/icon

## Testing (manual)

1. Open `/mayhem` — empty picker, patch chip visible when data loads.
2. Search and select a champion — Best section populates; All highlights matching rows.
3. Clear selection — return to empty state.
4. Narrow viewport — layout stacks without overflow.
5. Confirm TopNav + SideRail active states on `/mayhem`.
6. `npm run lint` + `npm run type-check` clean for touched files.

## Open implementation notes

- CommunityDragon catalog: `cherry-augments.json` (numeric `id` aligns with IESDev `augment_id`); icon paths use `_small` assets (no `_large` on CDragon).
- Champion squares: reuse `getChampionSquareUrl` / CommunityDragon square pattern already in the repo.
- Next `Image` for all remote icons; allowlist CDragon + ddragon hosts in `next.config` if not already.
