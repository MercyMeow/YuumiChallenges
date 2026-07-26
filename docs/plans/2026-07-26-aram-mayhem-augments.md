# ARAM Mayhem Augments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/mayhem` tab where players pick a champion, then see best ARAM: Mayhem augments for that champ plus a highlighted full list, fed by live IESDev data.

**Architecture:** Next.js API route proxies IESDev stats, enriches with CommunityDragon `cherry-augments.json` (names/icons) and Data Dragon champion squares, caches ~1h. Client page follows `/stats` / `/games` Hextech patterns: empty champion picker → split “Best for” + “All” lists.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind hextech tokens, `next/image` (unoptimized), CommunityDragon + Data Dragon CDNs.

**Spec:** `docs/plans/2026-07-26-aram-mayhem-augments-design.md`

## Global Constraints

- Theme: Hextech Grimoire (`OrnateHeading`, `HextechPanel`, `hex-chip`, navy/gold — no purple glow spam).
- Always use Next.js `Image` for remote assets.
- No Convex/Mongo for this feed in v1.
- No unit-test framework in repo — verify with `npm run type-check`, `npm run lint`, curl, and manual UI checks.
- Do not put Mayhem under `HighEloTabs`.
- Tier map: 1→S, 2→A, 3→B, 4→C, 5→D.
- Augment id join: IESDev `augment_id` === CDragon `cherry-augments.json` `id` (numeric string/number).
- Icon URL: map `/lol-game-data/assets/ASSETS/...` → `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/...` (lowercase path); use the `_small` icon path as-is (CDragon has no `_large` variants).

---

## File Structure

| Path | Responsibility |
|------|----------------|
| `src/lib/mayhem/types.ts` | Shared types for feed + API response |
| `src/lib/mayhem/tiers.ts` | Tier → S–D label + chip class helpers |
| `src/lib/mayhem/enrich.ts` | Pure join/sort helpers (testable without UI) |
| `src/lib/mayhem/fetch-catalog.ts` | Server-only fetches (IESDev, CDragon, DDragon) |
| `src/app/api/mayhem/augments/route.ts` | Cached GET handler |
| `src/app/mayhem/page.tsx` | Metadata + render client |
| `src/app/mayhem/mayhem-client.tsx` | Champion picker + split lists |
| `src/components/shell/TopNav.tsx` | Add Mayhem nav link |
| `src/components/shell/SideRail.tsx` | Add Mayhem resource link |
| `next.config.ts` | Allow `raw.communitydragon.org` images |

---

### Task 1: Types, tier helpers, enrich, image host

**Files:**
- Create: `src/lib/mayhem/types.ts`
- Create: `src/lib/mayhem/tiers.ts`
- Create: `src/lib/mayhem/enrich.ts`
- Modify: `next.config.ts` (add CDragon remotePattern)

**Interfaces:**
- Produces: `MayhemTier`, `MayhemAugment`, `MayhemChampion`, `MayhemAugmentsResponse`, `IesAugmentRow`, `CherryAugment`, `tierLabel`, `tierChipClass`, `buildAugmentCatalog`, `filterBestForChampion`, `sortByMetaTier`

- [ ] **Step 1: Create types**

Create `src/lib/mayhem/types.ts`:

```ts
/** Meta / champ-specific tier from IESDev (1 = best). */
export type MayhemTier = 1 | 2 | 3 | 4 | 5;

export type MayhemChampion = {
  id: string;
  key: string;
  name: string;
  squareUrl: string;
};

export type MayhemTopChampion = MayhemChampion & {
  tier: MayhemTier;
};

export type MayhemAugment = {
  id: string;
  name: string;
  iconUrl: string;
  rarity?: string;
  metaTier: MayhemTier;
  topChampions: MayhemTopChampion[];
};

export type MayhemAugmentsResponse = {
  patch: string;
  generatedAt: string;
  champions: MayhemChampion[];
  augments: MayhemAugment[];
};

/** Raw IESDev row (subset). */
export type IesAugmentRow = {
  augment_id: string;
  patch: string;
  dt: string;
  stats: {
    tier: number;
    top_champions: Array<{ champion_id: string; tier: number }>;
  };
};

export type IesAugmentsPayload = {
  data: IesAugmentRow[];
  meta: { count: number; generated_at: string };
};

/** CommunityDragon cherry-augments.json entry. */
export type CherryAugment = {
  id: number;
  augmentNameId: string;
  nameTRA: string;
  augmentSmallIconPath: string;
  rarity?: string;
};
```

- [ ] **Step 2: Create tier helpers**

Create `src/lib/mayhem/tiers.ts`:

```ts
import type { MayhemTier } from './types';

const LABELS: Record<MayhemTier, string> = {
  1: 'S',
  2: 'A',
  3: 'B',
  4: 'C',
  5: 'D',
};

/** Map feed tier 1–5 to S–D display letter. */
export function tierLabel(tier: MayhemTier): string {
  return LABELS[tier];
}

/** Clamp unknown numbers into MayhemTier (defaults to 5). */
export function asMayhemTier(value: number): MayhemTier {
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) {
    return value;
  }
  return 5;
}

/** Chip class progression: gold (S) → steel (D). */
export function tierChipClass(tier: MayhemTier): string {
  switch (tier) {
    case 1:
      return 'hex-chip border-hx-gold/50 text-hx-gold-bright';
    case 2:
      return 'hex-chip border-hx-gold-dark/50 text-hx-gold';
    case 3:
      return 'hex-chip border-hx-steel/50 text-hx-parchment';
    case 4:
      return 'hex-chip border-hx-steel/40 text-hx-steel';
    case 5:
      return 'hex-chip border-hx-navy/60 text-hx-steel/80';
    default: {
      const _exhaustive: never = tier;
      return _exhaustive;
    }
  }
}
```

- [ ] **Step 3: Create enrich helpers**

Create `src/lib/mayhem/enrich.ts`:

```ts
import { asMayhemTier } from './tiers';
import type {
  CherryAugment,
  IesAugmentRow,
  MayhemAugment,
  MayhemChampion,
  MayhemTopChampion,
} from './types';

const CDRAGON_ASSETS =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default';

/** Convert lol-game-data asset path to a raw.communitydragon URL. */
export function cherryIconUrl(smallPath: string): string {
  // CDragon only ships `_small` cherry augment icons — `_large` 404s.
  const stripped = smallPath
    .replace(/^\/lol-game-data\/assets\//i, '')
    .toLowerCase();
  return `${CDRAGON_ASSETS}/${stripped}`;
}

/** Humanize AugmentNameId when nameTRA is empty. */
export function fallbackAugmentName(augmentNameId: string, id: string): string {
  let name = augmentNameId || `Augment ${id}`;
  if (name.startsWith('ARAM_')) name = name.slice(5);
  return name.replace(/(?<!^)(?=[A-Z])/g, ' ').replace(/_/g, ' ').trim();
}

type ChampionLookup = Map<string, MayhemChampion>;

/** Join one IES row with cherry catalog + champion lookup. */
export function enrichAugmentRow(
  row: IesAugmentRow,
  cherryById: Map<number, CherryAugment>,
  championsById: ChampionLookup
): MayhemAugment {
  const id = String(row.augment_id);
  const cherry = cherryById.get(Number(id));
  const name = cherry?.nameTRA?.trim()
    ? cherry.nameTRA.trim()
    : fallbackAugmentName(cherry?.augmentNameId ?? '', id);
  const iconUrl = cherry?.augmentSmallIconPath
    ? cherryIconUrl(cherry.augmentSmallIconPath)
    : `${CDRAGON_ASSETS}/v1/champion-icons/-1.png`;

  const topChampions: MayhemTopChampion[] = (row.stats.top_champions ?? [])
    .map((entry) => {
      const champ = championsById.get(String(entry.champion_id));
      if (!champ) {
        return {
          id: String(entry.champion_id),
          key: String(entry.champion_id),
          name: `Champion ${entry.champion_id}`,
          squareUrl: `https://cdn.communitydragon.org/latest/champion/${entry.champion_id}/square`,
          tier: asMayhemTier(entry.tier),
        };
      }
      return { ...champ, tier: asMayhemTier(entry.tier) };
    });

  return {
    id,
    name,
    iconUrl,
    ...(cherry?.rarity ? { rarity: cherry.rarity } : {}),
    metaTier: asMayhemTier(row.stats.tier),
    topChampions,
  };
}

/** Build full enriched list from feed + catalogs. */
export function buildAugmentCatalog(
  rows: IesAugmentRow[],
  cherry: CherryAugment[],
  championsById: ChampionLookup
): MayhemAugment[] {
  const cherryById = new Map(cherry.map((a) => [a.id, a]));
  return rows.map((row) => enrichAugmentRow(row, cherryById, championsById));
}

/** Augments where champ appears in topChampions, sorted by champ tier then meta. */
export function filterBestForChampion(
  augments: MayhemAugment[],
  championId: string
): MayhemAugment[] {
  return augments
    .filter((a) => a.topChampions.some((c) => c.id === championId))
    .slice()
    .sort((a, b) => {
      const aTier =
        a.topChampions.find((c) => c.id === championId)?.tier ?? 5;
      const bTier =
        b.topChampions.find((c) => c.id === championId)?.tier ?? 5;
      if (aTier !== bTier) return aTier - bTier;
      return a.metaTier - b.metaTier;
    });
}

/** Sort all augments by overall meta tier ascending. */
export function sortByMetaTier(augments: MayhemAugment[]): MayhemAugment[] {
  return augments.slice().sort((a, b) => a.metaTier - b.metaTier);
}
```

- [ ] **Step 4: Allow CommunityDragon images in next.config**

In `next.config.ts`, inside `remotePatterns`, add:

```ts
{
  protocol: 'https',
  hostname: 'raw.communitydragon.org',
  port: '',
  pathname: '/**',
},
{
  protocol: 'https',
  hostname: 'cdn.communitydragon.org',
  port: '',
  pathname: '/**',
},
```

- [ ] **Step 5: Verify TypeScript on new modules**

Run: `npx tsc --noEmit --pretty false 2>&1 | Select-String -Pattern "mayhem|next.config" | Select-Object -First 20`

Expected: no errors mentioning `src/lib/mayhem` (project may have unrelated noise — focus on mayhem paths).

- [ ] **Step 6: Commit**

```bash
git add src/lib/mayhem/types.ts src/lib/mayhem/tiers.ts src/lib/mayhem/enrich.ts next.config.ts
git commit -m "feat(mayhem): add types, enrich helpers, and CDragon image hosts"
```

---

### Task 2: Server fetch + API route

**Files:**
- Create: `src/lib/mayhem/fetch-catalog.ts`
- Create: `src/app/api/mayhem/augments/route.ts`

**Interfaces:**
- Consumes: `buildAugmentCatalog`, types from Task 1
- Produces: `GET /api/mayhem/augments` → `MayhemAugmentsResponse | { error: string }`

- [ ] **Step 1: Create server fetch helpers**

Create `src/lib/mayhem/fetch-catalog.ts`:

```ts
import { getLiveDdragonVersion } from '@/lib/utils/live-patch';
import { buildAugmentCatalog } from './enrich';
import type {
  CherryAugment,
  IesAugmentsPayload,
  MayhemAugmentsResponse,
  MayhemChampion,
} from './types';

const IES_URL =
  'https://data.v2.iesdev.com/api/v1/query_objects/prod/lol/aram_mayhem_augments';
const CHERRY_URL =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json';
const SUMMARY_URL =
  'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json';

type ChampionSummary = {
  id: number;
  name: string;
  alias: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'User-Agent': 'YuumiChallenges/1.0',
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`${url} responded ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Build champion id → MayhemChampion map from CDragon summary + DD squares. */
export async function loadChampionLookup(): Promise<{
  byId: Map<string, MayhemChampion>;
  list: MayhemChampion[];
}> {
  const [summary, version] = await Promise.all([
    fetchJson<ChampionSummary[]>(SUMMARY_URL),
    getLiveDdragonVersion(),
  ]);

  const list: MayhemChampion[] = summary
    .filter((c) => c.id > 0)
    .map((c) => ({
      id: String(c.id),
      key: c.alias,
      name: c.name,
      squareUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.alias}.png`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    byId: new Map(list.map((c) => [c.id, c])),
    list,
  };
}

/** Fetch IESDev + catalogs and return the public API payload. */
export async function loadMayhemAugments(): Promise<MayhemAugmentsResponse> {
  const [ies, cherry, champs] = await Promise.all([
    fetchJson<IesAugmentsPayload>(IES_URL, { next: { revalidate: 3600 } }),
    fetchJson<CherryAugment[]>(CHERRY_URL, { next: { revalidate: 3600 } }),
    loadChampionLookup(),
  ]);

  const rows = ies.data ?? [];
  const patch = rows[0]?.patch ?? '';
  const augments = buildAugmentCatalog(rows, cherry, champs.byId);

  return {
    patch,
    generatedAt: ies.meta?.generated_at ?? new Date().toISOString(),
    champions: champs.list,
    augments,
  };
}
```

- [ ] **Step 2: Create API route**

Create `src/app/api/mayhem/augments/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { loadMayhemAugments } from '@/lib/mayhem/fetch-catalog';

export const revalidate = 3600;

/** Proxy + enrich ARAM Mayhem augment meta for the /mayhem client. */
export async function GET() {
  try {
    const payload = await loadMayhemAugments();
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('mayhem augments fetch failed', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to load Mayhem data',
      },
      { status: 502 }
    );
  }
}
```

- [ ] **Step 3: Smoke-test the route (dev server or curl via next start)**

If `npm run dev` is already running, curl:

```bash
curl.exe -s "http://localhost:3000/api/mayhem/augments" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('patch'), len(d.get('augments',[])), d['augments'][0]['name'] if d.get('augments') else d)"
```

Expected: a patch like `16.14`, augment count ~200, first augment has a human name (not only `Augment 1234`).

If no server: `npx tsx -e "import { loadMayhemAugments } from './src/lib/mayhem/fetch-catalog.ts'; const d = await loadMayhemAugments(); console.log(d.patch, d.augments.length, d.augments[0]);"`

Expected: same shape, no throw.

- [ ] **Step 4: Commit**

```bash
git add src/lib/mayhem/fetch-catalog.ts src/app/api/mayhem/augments/route.ts
git commit -m "feat(mayhem): add augments API proxy with catalog enrichment"
```

---

### Task 3: `/mayhem` page UI

**Files:**
- Create: `src/app/mayhem/page.tsx`
- Create: `src/app/mayhem/mayhem-client.tsx`

**Interfaces:**
- Consumes: `MayhemAugmentsResponse`, `filterBestForChampion`, `sortByMetaTier`, `tierLabel`, `tierChipClass`
- Produces: Interactive `/mayhem` route

- [ ] **Step 1: Create thin page**

Create `src/app/mayhem/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { MayhemClient } from './mayhem-client';

export const metadata: Metadata = {
  title: 'ARAM Mayhem Augments',
  description:
    'Pick a champion and see the best ARAM: Mayhem augments for them, ranked from live meta data.',
};

export default function MayhemPage() {
  return <MayhemClient />;
}
```

- [ ] **Step 2: Create client UI**

Create `src/app/mayhem/mayhem-client.tsx` with:

- State: `data`, `error`, `loading`, `selectedId`, `champQuery`, `augmentQuery`
- `useEffect` fetch `/api/mayhem/augments` once; expose `retry` that re-fetches
- Empty: `OrnateHeading` “ARAM Mayhem”, patch/updated subline, searchable champion grid (squares via `Image`)
- Selected: clear chip; **Best for {name}** list; **All augments** list (name filter); highlight rows in All when augment id is in Best set (`border-hx-magic/40` or similar)
- Rows: augment `Image` 40×40, name, meta tier chip, champ tier chip (Best only), mini top-champ faces on All rows
- Loading: `PanelSkeleton`; error: message + retry button (`btn-hextech`)

Skeleton structure (keep file focused — prefer one client file ~250–350 lines, extract row component in-file):

```tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Sparkles, X } from 'lucide-react';
import { HextechPanel, OrnateHeading } from '@/components/ui/hextech-panel';
import { PanelSkeleton } from '@/components/ui/skeleton';
import {
  filterBestForChampion,
  sortByMetaTier,
} from '@/lib/mayhem/enrich';
import { tierChipClass, tierLabel } from '@/lib/mayhem/tiers';
import type {
  MayhemAugment,
  MayhemAugmentsResponse,
  MayhemChampion,
  MayhemTier,
} from '@/lib/mayhem/types';
import { cn } from '@/lib/utils';

// Implement MayhemClient as described above.
// Helper: TierChip({ tier }: { tier: MayhemTier })
// Helper: AugmentRow({ augment, champTier?, highlighted?, selectedChampId? })
```

Implement the full component body in this step (no placeholders). Key behaviors:

```ts
const best = useMemo(
  () =>
    selectedId ? filterBestForChampion(data?.augments ?? [], selectedId) : [],
  [data, selectedId]
);
const bestIds = useMemo(() => new Set(best.map((a) => a.id)), [best]);
const allSorted = useMemo(
  () => sortByMetaTier(data?.augments ?? []),
  [data]
);
const allFiltered = useMemo(() => {
  const q = augmentQuery.trim().toLowerCase();
  if (!q) return allSorted;
  return allSorted.filter((a) => a.name.toLowerCase().includes(q));
}, [allSorted, augmentQuery]);
const filteredChamps = useMemo(() => {
  const q = champQuery.trim().toLowerCase();
  const list = data?.champions ?? [];
  if (!q) return list;
  return list.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.key.toLowerCase().includes(q)
  );
}, [data, champQuery]);
```

Format `generatedAt` with `toLocaleString()` for the subline.

- [ ] **Step 3: Manual UI check**

Run: `npm run dev` → open `http://localhost:3000/mayhem`

Checklist:
1. Empty picker + patch chip after load
2. Search “Yuumi”, select → Best section non-empty (or empty only if Yuumi never in top_champions — try Annie/Ahri if so)
3. All list highlights Best rows
4. Clear selection returns to empty
5. Mobile width: no horizontal overflow

- [ ] **Step 4: Commit**

```bash
git add src/app/mayhem/page.tsx src/app/mayhem/mayhem-client.tsx
git commit -m "feat(mayhem): add champion-first Mayhem augments page"
```

---

### Task 4: Navigation

**Files:**
- Modify: `src/components/shell/TopNav.tsx` (`NAV_LINKS`)
- Modify: `src/components/shell/SideRail.tsx` (`RESOURCE_LINKS`)

**Interfaces:**
- Consumes: `/mayhem` route from Task 3
- Produces: Discoverable Mayhem tab in TopNav + SideRail

- [ ] **Step 1: Add TopNav link**

In `NAV_LINKS`, after Stats (before Match Viewer):

```ts
{ label: 'Mayhem', href: '/mayhem' },
```

- [ ] **Step 2: Add SideRail link**

Import `Flame` (or `Sparkles`) from `lucide-react`. In `RESOURCE_LINKS`, after Meta Stats:

```ts
{ label: 'Mayhem Augments', href: '/mayhem', icon: Flame },
```

- [ ] **Step 3: Verify active styles**

Open `/mayhem` — TopNav “Mayhem” and SideRail “Mayhem Augments” show active hex styles (`isActiveLink` / pathname match already used by siblings).

- [ ] **Step 4: Commit**

```bash
git add src/components/shell/TopNav.tsx src/components/shell/SideRail.tsx
git commit -m "feat(mayhem): register Mayhem in TopNav and SideRail"
```

---

### Task 5: Quality gates

**Files:**
- Touch only if lint/type errors require fixes in mayhem files

- [ ] **Step 1: Lint**

Run: `npm run lint`

Expected: zero new errors in mayhem / nav files.

- [ ] **Step 2: Format**

Run: `npm run format`

- [ ] **Step 3: Type-check**

Run: `npm run type-check`

Expected: zero TypeScript errors.

- [ ] **Step 4: Final commit if format changed files**

```bash
git add -u
git status
# only if dirty:
git commit -m "chore(mayhem): format and lint cleanup"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| `/mayhem` route + metadata | 3 |
| Champion-first empty → pick | 3 |
| Best for champ + All highlighted | 3 (`filterBestForChampion`) |
| IESDev live feed | 2 |
| CDragon names/icons | 1–2 (`cherry-augments.json`) |
| Champ squares | 2 (`loadChampionLookup`) |
| Hextech theme | 3 |
| TopNav + SideRail | 4 |
| 1h cache / fail soft | 2 |
| Fallback unknown augments | 1 (`enrichAugmentRow`) |
| S–D tiers | 1 (`tiers.ts`) |
| next/image + CDragon hosts | 1 + 3 |
| Not under HighEloTabs | 4 (explicit omission) |

## Self-review notes

- No TBDs; augment id join locked to `cherry-augments.json` `id`.
- `fallbackAugmentName` uses a lookbehind regex — supported in modern JS targets used by Next; if lint complains, replace with a simple space-insertion loop.
- `fetch-catalog` uses `next: { revalidate: 3600 }` on upstream fetches plus route `revalidate = 3600`.
