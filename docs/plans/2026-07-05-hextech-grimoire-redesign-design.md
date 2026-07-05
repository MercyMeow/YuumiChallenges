# Hextech Grimoire — Full Visual Redesign

Date: 2026-07-05
Branch: `feat/patch-1613-refresh`
Mode: autonomous (user provided concept art + directive: "classic LoL client theme,
a bit Yuumi themed, don't be afraid to start over, populate the database").

## Vision

The site becomes a **LoL-client-style app**: ornate gold-framed panels on deep
hextech navy, Cinzel display type, magic-teal data accents, and Yuumi's
purple/pink sparkle reserved for flourishes. Concept art direction: top nav bar
+ left sidebar rail + right utility rail, everything framed like the old
(pre-2016 "Hextech") League client meets Yuumi's Book of Thresholds.

## Design language

### Palette (CSS vars, oklch)

| Token | Hex anchor | Use |
|---|---|---|
| `--hx-abyss` | `#010A13` | page background base |
| `--hx-navy` | `#091428` | background mid |
| `--hx-panel` | `#0A1428` | panel fill |
| `--hx-steel` | `#0A323C` | background top glow |
| `--hx-blue` | `#005A82` | deep hextech blue |
| `--hx-magic` | `#0AC8B9` | live-data accent, hover magic |
| `--hx-ice` | `#CDFAFA` | bright magic highlight |
| `--hx-gold-shadow` | `#463714` | frame outer edge |
| `--hx-gold-dark` | `#785A28` | frame main border |
| `--hx-gold` | `#C8AA6E` | text gold, active states |
| `--hx-parchment` | `#F0E6D2` | headings, body-on-dark |
| `--yuumi-purple` | `#9D7BEE` | Yuumi flourish (wisps, sparkles) |
| `--yuumi-pink` | `#EE7BC0` | Yuumi flourish (rare) |

Dominant navy + gold; teal as the single sharp accent; purple/pink only as
Yuumi seasoning (sparkles, wisp counter, her subtitle).

### Typography

- Display: **Cinzel** (kept) — uppercase, 0.06–0.14em tracking, weights 700–900.
- Body: **Source Sans 3** (kept).
- Contrast via scale jumps: hero ~64px vs body 15px; section titles use
  flanking filigree rules with a center diamond.

### Frame system

- `hex-card` / `hex-card-elevated` (retheme): layered border — 1px gold-dark
  outer, black inset gap, faint inner gold hairline; top edge catches light.
- `.hex-corners` upgraded: SVG-feel corner studs on all four corners.
- New `hex-section-title`: filigree lines + center diamond ornament.
- New `btn-hextech-primary`: gold-gradient filled button (old client "PLAY").
- New `hex-input`: recessed dark input, gold hairline, magic focus glow.
- Legacy `glass-card`, `content-glass`, `glass` **rethemed** to hextech navy +
  gold hairline so match-history/admin components inherit the theme without
  touching every file.

### Background

Replace the purple "magical" radial system (html::before/after + injected
`.global-magical-bg` script in layout.tsx) with a fixed hextech backdrop:
vertical navy gradient (steel → navy → abyss), top magic-teal radial glow,
faint gold star-field (two tiled radial-gradient layers, slow twinkle,
`prefers-reduced-motion` safe), edge vignette.

## App shell

Pathname-aware `SiteShell` in the root layout (no route moves):

- `/admin/*` → children render bare (admin keeps its own console styling).
- Public pages → TopNav + SideRail + content.

**TopNav** (sticky, navy blur, gold double hairline bottom): paw-gem wordmark
"yuumi.quest"; links OVERVIEW · BUILDS · MATCHUPS · MATCH VIEWER · MYTHIC SHOP ·
GALLERY (gold underline glow on active); right side live patch chip + admin
gear. Mobile: hamburger → slide-down panel.

**SideRail** (≥xl only): framed Yuumi paw medallion; "YUUMI GUIDE" group
(Overview, Builds, Runes & Skills, Items, Matchups — anchors on `/`, routed
links elsewhere); "RESOURCES" group (Match Viewer, Mythic Shop, Gallery);
footer "patch crystal" showing live patch with pulsing magic gem.

**Right rail** (home only): Mythic Shop preview (countdown + up to 3 items +
CTA), Patch panel (live patch, build-verified state, auto-build source), quick
links.

## Pages

1. **Home** (`src/app/page.tsx`, rebuilt): breadcrumb `GUIDES › SUPPORT ›
   YUUMI`; hero panel — gold-gradient YUUMI title, "The Magical Cat" in magic
   teal, role badges (SUPPORT / ENCHANTER / EASY), splash art fading into the
   panel, at-a-glance stat strip (Patch · Role · Difficulty · Data source);
   Recommended Build section (3 selector cards + detail panel: runes / items /
   skill order in ornate columns); Matchups explorer (tabs, champion grid,
   detail panel); footer. Builds come from **Convex `guide.getBuilds`** with
   the static array as fallback; auto-build overlay unchanged.
2. **Mythic Shop**: ornate shop cards (art, name plate, ME cost gem chip),
   section headers with countdown crystal badges.
3. **Gallery**: framed GIF cards, hextech copy-link buttons.
4. **Match viewer** (`/match`, `/match/[matchId]`): chrome-level reskin —
   hextech search panel, headers, container cards; inner match components
   inherit via rethemed utilities.
5. **Admin**: consistent hextech console (panels, buttons, inputs); behavior
   unchanged.

## Database population

DB is currently empty (verified: `getBuilds` `[]`, `getMatchups` `[]`,
`getMetadata` `{}`).

- Schema: extend `guideMatchups.synergy` union with `'Average' | 'Situational'`
  (static ADC data uses both).
- New `convex/seed.ts` → `seedAll` internalMutation, idempotent (replaces rows
  in seeded tables; only sets specific metadata keys). Seeds:
  - `guideBuilds`: Standard Aery (recommended), Guardian Sustain, Aggressive
    Comet — from the static guide data.
  - `guideItems`: BEST_ITEMS starter/early/core/situational with priorities.
  - `guideRunes`: 3 rune pages matching the builds.
  - `guideSkillOrder`: 3 orders.
  - `guideMatchups`: all `SUPPORT_MATCHUPS` (enemy_support) + `ADC_MATCHUPS`
    (ally_adc) from `src/lib/matchups/`.
  - `guideSections`: overview / playstyle / tips.
  - `guideMetadata`: `currentPatch`, `seededAt`.
- Execute: `npx convex deploy` → `npx convex run seed:seedAll` →
  `npx convex run scraper:autoUpdateBuild` → verify with queries.

## Verification

`npm run lint` + `type-check` + `build`; dev preview screenshots of all routes
(desktop + mobile), console/network error check.

## Assumptions

1. Concept art is directional, not literal — fictional nav items (Community,
   login, wisp currency) are dropped or reinterpreted; nav maps to real routes.
2. Keep Cinzel + Source Sans 3 (already the hextech pairing; avoids font bloat).
3. Pre-existing uncommitted patch-16.13 work on this branch is kept and
   committed separately before the redesign lands.
