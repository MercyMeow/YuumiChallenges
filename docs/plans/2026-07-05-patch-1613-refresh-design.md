# Patch 16.13 Guide Refresh + Codebase Polish — Design

Date: 2026-07-05
Branch: `feat/patch-1613-refresh`
Mode: autonomous (user absent); assumptions documented below.

## Goals

1. Update Yuumi guide to latest patch.
2. Apply best practices across codebase.
3. Clean, modern, consistent UI on all pages.

## Research Findings

- Riot marketing patch: **26.13** (live since 2026-06-23). Next: 26.14 on July 15.
- Data Dragon CDN latest: **16.13.1**. Repo convention follows ddragon-style
  numbering (`16.11`), so guide bumps to **16.13**.
- Current guide content (Aery / Manaflow / Transcendence / Scorch + Font of
  Life / Revitalize; Dream Maker → Moonstone → Ardent / Mikael's; Q>E>W;
  Exhaust+Heal) **already matches the 26.13 meta** per Mobalytics / METAsrc /
  U.GG. No build-content changes required — only version labels and fallbacks.

## Scope

### A. Patch bump (mechanical)

| File | Change |
|---|---|
| `src/app/page.tsx:33` | `PATCH = '16.11'` → `'16.13'` |
| `src/lib/builds/yuumi.ts` | patch fields + comments → 16.13; `updatedAt: new Date().toISOString()` → static `'2026-07-05'` ISO (current value regenerates every render — lies about data age) |
| `src/lib/runes/yuumi.ts` | 5× `patch: '16.11'` → `'16.13'` |
| `src/app/api/data-dragon/summoner-spells/route.ts` | fallback `16.11.1` → `16.13.1` |
| `src/app/api/data-dragon/version/route.ts` | fallback `15.14.1` → `16.13.1` |
| `src/lib/utils/data-dragon.ts` | fallback `15.14.1` → `16.13.1` |
| `src/lib/apis/datadragon.ts` | fallback `14.23.1` → `16.13.1` |

### B. Best practices (safe, verifiable wins only)

- `src/components/match-details/TimelineTab.tsx`: remove sole `as any` cast — type properly.
- Console noise: route stray `console.*` in src through `src/lib/logger.ts`
  where it is app logic (skip logger.ts itself and legit error paths).
- `CLAUDE.md`: fix stale "~32K lines" claim for page.tsx (actual ~950).
- Admin pages: hardcoded `bg-purple-600` etc. → design tokens (folded into UI pass).
- **Deliberately out of scope** (risk > value without tests): renaming
  `match-history` duplicate components, splitting 1534-line
  `DetailedStatsTab.tsx`, touching untracked `verify_shards.ps1` (user's
  local script).
- ~~Removing `ignoreBuildErrors` was also listed here originally~~ —
  superseded later in the same PR: the Convex type errors were fixed and
  `ignoreBuildErrors` WAS removed; TypeScript errors now fail the build.

### C. UI polish (frontend-design skill governs execution)

Existing design system is strong: OKLCH tokens, glassmorphism cards, Yuumi
brand palette (purple/blue/teal/pink), WCAG AA colors. Public pages (home,
gallery, match) already use it. Admin pages deviate with ad-hoc utilities.

- Admin login / dashboard / builds / items / scraper: adopt glass cards,
  brand gradient accents, token-based colors. Keep all behavior identical.
- Gallery + match pages: consistency audit, spacing/hierarchy refinements.
- No redesign of home page — recently refreshed (PR #27), stays as anchor.

## Verification

`npm run lint` + `type-check` + `format:check` + `build`; visual check of all
routes via dev preview. Type-check baseline already green.

## Assumptions (user absent)

1. Repo keeps ddragon-style patch numbering (`16.13`, not `26.13`).
2. Build content stays as-is since it matches live meta.
3. Heavy refactors deferred; this pass optimizes safety + visual consistency.
