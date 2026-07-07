# Yuumi Player Profiles & Ladder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** onetricks.gg-style Yuumi ladder (`/players`) and shareable player profiles (`/players/[region]/[riotId]`) with season stats, common builds, duo partners, recent games, and Discord OG cards.

**Architecture:** Extends the high-elo feed pipeline (convex/highelo.ts). Game ingest additionally captures a per-game build snapshot; roster rows carry denormalized season stats maintained transactionally on insert; a budget-paced backfill cron fills season history; profiles are queries over roster+games. Design: `docs/plans/2026-07-07-yuumi-player-profiles-design.md`.

**Tech Stack:** Convex (self-hosted), Next.js 15 App Router, next/og, Tailwind 4 hextech utilities.

**Validation:** No test framework. Every task ends with: `npx convex codegen` (if convex/ changed), `npm run type-check`, `npm run lint`, `npx prettier --write` on touched files, then commit (append `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`).

**Existing primitives to reuse (do not reinvent):**
- `ItemSlot` (`src/components/match-history/item-slots.tsx`) — item icon by numeric id, sizes sm/md/lg/xl.
- `RuneDisplay` (`src/components/ui/rune-display.tsx`) — rune icon by numeric `runeId` (works for keystones).
- `GameCard` + helpers in `src/app/games/games-client.tsx` (Task 5 extracts them to a shared file).
- `HextechPanel`, `OrnateHeading` (`src/components/ui/hextech-panel.tsx`).
- Rank emblems `public/images/ranked/{master,grandmaster,challenger}.png`.

---

### Task 1: Schema — build snapshot on games, stats on roster

**Files:**
- Modify: `convex/schema.ts` (yuumiGames + yuumiRoster tables)

**Step 1: Extend `yuumiGames`** — add after `enemyChampions`:

```typescript
    // Build snapshot for player profiles (optional: pre-profile rows lack it)
    puuid: v.optional(v.string()),
    items: v.optional(v.array(v.number())), // 7 slots, 0 = empty
    keystoneId: v.optional(v.number()),
    secondaryStyleId: v.optional(v.number()),
    summonerSpells: v.optional(v.array(v.number())), // 2 ids
    duoChampion: v.optional(v.string()), // ADC on Yuumi's team (BOTTOM)
```

and add `.index('by_puuid', ['puuid'])` after the existing indexes.

**Step 2: Extend `yuumiRoster`** — add after `lastCheckedAt`:

```typescript
    // Riot ID (from the newest ingested game; profiles resolve by these)
    gameName: v.optional(v.string()),
    tagLine: v.optional(v.string()),
    // Denormalized season stats, maintained on game insert + recount
    gamesCount: v.optional(v.number()),
    wins: v.optional(v.number()),
    killsTotal: v.optional(v.number()),
    deathsTotal: v.optional(v.number()),
    assistsTotal: v.optional(v.number()),
    // Season backfill bookkeeping (ms epoch when completed)
    backfilledAt: v.optional(v.number()),
```

**Step 3: Verify + commit**

Run: `npx convex codegen && npm run type-check && npm run lint`
Expected: all pass (fields are optional — no data migration needed).

```bash
git add convex/schema.ts convex/_generated
git commit -m "feat: add build snapshot and roster stats to high-elo schema"
```

---

### Task 2: Ingest — extract build snapshot, maintain roster stats

**Files:**
- Modify: `convex/highelo.ts`

**Step 1: Extend `GameRow` type and `gameValidator`** — add matching fields (`puuid: string`, `items: number[]`, `keystoneId: number`, `secondaryStyleId: number`, `summonerSpells: number[]`, `duoChampion?: string`). In the validator use `v.optional(v.string())` for `duoChampion`, plain validators for the rest (ingest always provides them going forward). NOTE strict TS: `exactOptionalPropertyTypes` — build `GameRow` with `duoChampion` conditionally spread, never `undefined` assigned.

**Step 2: Extend `extractGame`** — after the ally/enemy loop, before `return`:

```typescript
  const items: number[] = [];
  for (let slot = 0; slot <= 6; slot++) {
    const value = yuumi[`item${slot}`];
    items.push(typeof value === 'number' ? value : 0);
  }
  let keystoneId = 0;
  let secondaryStyleId = 0;
  if (isRecord(yuumi.perks) && Array.isArray(yuumi.perks.styles)) {
    const styles = yuumi.perks.styles.filter(isRecord);
    const primary = styles.find((s) => s.description === 'primaryStyle');
    const secondary = styles.find((s) => s.description === 'subStyle');
    if (primary && Array.isArray(primary.selections)) {
      const first = primary.selections.filter(isRecord)[0];
      if (first && typeof first.perk === 'number') keystoneId = first.perk;
    }
    if (secondary && typeof secondary.style === 'number') {
      secondaryStyleId = secondary.style;
    }
  }
  const summonerSpells = [
    typeof yuumi.summoner1Id === 'number' ? yuumi.summoner1Id : 0,
    typeof yuumi.summoner2Id === 'number' ? yuumi.summoner2Id : 0,
  ];
  const duo = participants.find(
    (p) =>
      p.teamId === yuumi.teamId &&
      p.puuid !== yuumi.puuid &&
      p.teamPosition === 'BOTTOM' &&
      typeof p.championName === 'string'
  );
```

Return object additions: `puuid: player.puuid`, `items`, `keystoneId`, `secondaryStyleId`, `summonerSpells`, and `...(duo ? { duoChampion: fixChampionName(duo.championName as string) } : {})`.

**Step 3: Change `extractGame`'s patch gate to support backfill** — change signature to `patchWindow: string[] | null`; the gate becomes:

```typescript
  if (patchWindow !== null) {
    const oldestPatch = patchWindow[patchWindow.length - 1];
    if (!oldestPatch || isOlderPatch(patch, oldestPatch)) return null;
  }
```

(Existing poll callers pass the array unchanged; the backfill in Task 4 passes `null` because season history legitimately spans old patches.)

**Step 4: Maintain roster stats in `recordPollResults`** — inside the games loop, in the `if (!existing)` branch, after the insert:

```typescript
        const rosterRow = await ctx.db
          .query('yuumiRoster')
          .withIndex('by_puuid', (q) => q.eq('puuid', game.puuid))
          .unique();
        if (rosterRow) {
          await ctx.db.patch(rosterRow._id, {
            gameName: game.playerName,
            tagLine: game.playerTag,
            gamesCount: (rosterRow.gamesCount ?? 0) + 1,
            wins: (rosterRow.wins ?? 0) + (game.win ? 1 : 0),
            killsTotal: (rosterRow.killsTotal ?? 0) + game.kills,
            deathsTotal: (rosterRow.deathsTotal ?? 0) + game.deaths,
            assistsTotal: (rosterRow.assistsTotal ?? 0) + game.assists,
          });
        }
```

CAUTION: `game.puuid` is typed optional on the validator only if you made it optional — make it REQUIRED in the validator (`puuid: v.string()`); old rows in the DB are unaffected (validators gate args, not documents).

**Step 5: Recount mutation (self-healing, used by backfill)**

```typescript
/** Recompute a player's denormalized season stats from their game rows. */
export const recomputePlayerStats = internalMutation({
  args: { puuid: v.string() },
  handler: async (ctx, args) => {
    const rosterRow = await ctx.db
      .query('yuumiRoster')
      .withIndex('by_puuid', (q) => q.eq('puuid', args.puuid))
      .unique();
    if (!rosterRow) return;
    const games = await ctx.db
      .query('yuumiGames')
      .withIndex('by_puuid', (q) => q.eq('puuid', args.puuid))
      .collect();
    const stats = {
      gamesCount: games.length,
      wins: games.filter((g) => g.win).length,
      killsTotal: games.reduce((sum, g) => sum + g.kills, 0),
      deathsTotal: games.reduce((sum, g) => sum + g.deaths, 0),
      assistsTotal: games.reduce((sum, g) => sum + g.assists, 0),
    };
    await ctx.db.patch(rosterRow._id, stats);
  },
});
```

**Step 6: Verify + commit** (codegen, type-check, lint, prettier)

```bash
git add convex/highelo.ts convex/_generated
git commit -m "feat: capture build snapshots and roster stats on game ingest"
```

---

### Task 3: Season retention + patch-window metadata

**Files:**
- Modify: `convex/highelo.ts`

**Step 1: Season-start helper + metadata plumbing**

```typescript
const DEFAULT_SEASON_LOOKBACK_MS = 90 * 24 * 60 * 60 * 1000;

export const getMetadataValue = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique();
    return row?.value ?? null;
  },
});

export const setMetadataValue = internalMutation({
  args: { key: v.string(), value: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique();
    if (row) {
      await ctx.db.patch(row._id, { value: args.value, updatedAt: Date.now() });
    } else {
      await ctx.db.insert('guideMetadata', { ...args, updatedAt: Date.now() });
    }
  },
});

/** Season start (ms). Falls back to a 90-day lookback if unconfigured. */
async function getSeasonStart(ctx: ActionCtx): Promise<number> {
  const raw = await ctx.runQuery(internal.highelo.getMetadataValue, {
    key: 'seasonStart',
  });
  const parsed = raw === null ? NaN : Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  console.warn('seasonStart metadata missing — defaulting to 90-day window');
  return Date.now() - DEFAULT_SEASON_LOOKBACK_MS;
}
```

**Step 2: `pollRosterMatches` persists the patch window** — after `const patchWindow = await fetchPatchWindow();` add:

```typescript
    await ctx.runMutation(internal.highelo.setMetadataValue, {
      key: 'patchWindow',
      value: JSON.stringify(patchWindow),
    });
```

**Step 3: `listGames` filters to the stored patch window** (games now live all season; the feed must not regress into old patches). Replace the handler body:

```typescript
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 500);
    const meta = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', 'patchWindow'))
      .unique();
    let window: string[] = [];
    try {
      const parsed: unknown = meta ? JSON.parse(meta.value) : [];
      if (Array.isArray(parsed)) {
        window = parsed.filter((p): p is string => typeof p === 'string');
      }
    } catch {
      window = [];
    }
    const results = await ctx.db
      .query('yuumiGames')
      .withIndex('by_gameCreation')
      .order('desc')
      .filter((q) =>
        window.length === 0
          ? true
          : q.or(...window.map((p) => q.eq(q.field('patch'), p)))
      )
      .take(limit);
    return results;
```

NOTE: `.filter` with a `window.length === 0` guard — Convex `q.or()` requires ≥1 arg; the ternary sidesteps it. Games newer than the window (ddragon lag) are hidden from the feed for at most hours; they remain in profiles.

**Step 4: Prune switches to season cutoff.** Replace `deleteGamesOutsidePatches` with:

```typescript
/** Deletes up to 2000 games that started before the season; returns count. */
export const deleteGamesBeforeSeason = internalMutation({
  args: { seasonStart: v.number() },
  handler: async (ctx, args) => {
    const games = await ctx.db
      .query('yuumiGames')
      .withIndex('by_gameCreation')
      .order('asc')
      .take(2000);
    let deleted = 0;
    for (const game of games) {
      if (game.gameCreation >= args.seasonStart) break; // index-ordered
      await ctx.db.delete(game._id);
      deleted++;
    }
    return deleted;
  },
});
```

and update `pruneOldGames` to call it with `await getSeasonStart(ctx)` (keep the `pruneInactiveRoster` call; drop the `fetchPatchWindow` import usage there if now unused).

**Step 5: Verify + commit**

```bash
git add convex/highelo.ts convex/_generated
git commit -m "feat: season-long game retention with patch-window feed filter"
```

---

### Task 4: Season backfill (budget-paced cron)

**Files:**
- Modify: `convex/highelo.ts`, `convex/crons.ts`

**Step 1: Constants**

```typescript
// Backfill: fetch budget per cluster per run; matches checked per player.
const BACKFILL_MATCH_FETCH_BUDGET = 250;
const BACKFILL_MATCHES_PER_PLAYER = 200;
const BACKFILL_PLAYERS_PER_RUN = 40; // per cluster, upper bound
```

**Step 2: Roster selection + completion mutations**

```typescript
/** Unbackfilled roster players, most recently active first. */
export const takeRosterForBackfill = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const roster = await ctx.db.query('yuumiRoster').collect();
    return roster
      .filter((entry) => entry.backfilledAt === undefined)
      .sort((a, b) => b.yuumiLastPlayTime - a.yuumiLastPlayTime)
      .slice(0, args.limit);
  },
});

export const markBackfilled = internalMutation({
  args: { ids: v.array(v.id('yuumiRoster')), at: v.number() },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const row = await ctx.db.get(id);
      if (row) await ctx.db.patch(id, { backfilledAt: args.at });
    }
  },
});
```

(Roster is small — `collect()` + in-memory filter is fine and avoids an index on an optional field.)

**Step 3: The backfill action.** Mirrors `pollCluster`'s per-player isolation and flush habits; key differences: pages up to 200 match ids from `seasonStart`, passes `patchWindow: null` to `extractGame`, decrements a shared per-cluster budget, marks players done, and recounts their stats.

```typescript
async function backfillCluster(
  ctx: ActionCtx,
  cluster: string,
  players: Doc<'yuumiRoster'>[],
  seasonStart: number
): Promise<void> {
  let budget = BACKFILL_MATCH_FETCH_BUDGET;
  for (const player of players) {
    if (budget <= 0) return;
    try {
      const startTime = Math.floor(seasonStart / 1000);
      const matchIds: string[] = [];
      for (let start = 0; start < BACKFILL_MATCHES_PER_PLAYER; start += 100) {
        const page = await riotFetch(
          `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${player.puuid}/ids?queue=${RANKED_SOLO_QUEUE}&startTime=${startTime}&start=${start}&count=100`
        );
        if (!Array.isArray(page) || page.length === 0) break;
        matchIds.push(
          ...page.filter((id): id is string => typeof id === 'string')
        );
        if (page.length < 100) break;
      }
      const existing = new Set(
        await ctx.runQuery(internal.highelo.getExistingMatchIds, { matchIds })
      );
      const pending = matchIds.filter((id) => !existing.has(id));
      if (pending.length > budget) {
        // Not enough budget to finish this player — leave them unmarked so
        // the next run resumes (dedup makes the redo cheap).
        return;
      }
      const games: GameRow[] = [];
      for (const matchId of pending) {
        budget--;
        const match = await riotFetch(
          `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`
        );
        const game = extractGame(match, player, null);
        if (game) games.push(game);
      }
      if (games.length > 0) {
        await ctx.runMutation(internal.highelo.recordPollResults, {
          rosterIds: [],
          checkedAt: Date.now(),
          games,
        });
      }
      await ctx.runMutation(internal.highelo.markBackfilled, {
        ids: [player._id],
        at: Date.now(),
      });
      await ctx.runMutation(internal.highelo.recomputePlayerStats, {
        puuid: player.puuid,
      });
    } catch (error) {
      console.error(
        `backfill ${cluster}: player ${player.puuid} failed:`,
        error
      );
    }
  }
}

/**
 * Season history backfill (every 15 min): budget-paced so the shared Riot
 * key's 5-minute poll and the site's match viewer never starve. Goes
 * dormant once every roster player is marked backfilled; newly swept
 * players get picked up automatically.
 */
export const backfillSeason = internalAction({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.runQuery(internal.highelo.takeRosterForBackfill, {
      limit: BACKFILL_PLAYERS_PER_RUN * 4,
    });
    if (players.length === 0) return;
    const seasonStart = await getSeasonStart(ctx);
    const byCluster = new Map<string, Doc<'yuumiRoster'>[]>();
    for (const player of players) {
      const cluster = (PLATFORM_TO_CLUSTER as Record<string, string>)[
        player.platform
      ];
      if (!cluster) continue; // poll cron handles unknown-platform cleanup
      const list = byCluster.get(cluster) ?? [];
      if (list.length < BACKFILL_PLAYERS_PER_RUN) list.push(player);
      byCluster.set(cluster, list);
    }
    await Promise.all(
      [...byCluster.entries()].map(([cluster, list]) =>
        backfillCluster(ctx, cluster, list, seasonStart).catch((error) => {
          console.error(`backfill ${cluster} failed:`, error);
        })
      )
    );
  },
});
```

NOTE: `recordPollResults` stats-increments cover inserts, and `recomputePlayerStats` immediately after makes the player's stats exact regardless — order matters: recompute AFTER the insert mutation.

**Step 4: Cron** — in `convex/crons.ts`:

```typescript
// Season history backfill for profile stats; dormant when caught up.
crons.interval(
  'backfill season yuumi games',
  { minutes: 15 },
  internal.highelo.backfillSeason
);
```

**Step 5: Verify + commit**

```bash
git add convex/highelo.ts convex/crons.ts convex/_generated
git commit -m "feat: add budget-paced season backfill for player profiles"
```

---

### Task 5: Public queries — ladder + profile

**Files:**
- Modify: `convex/highelo.ts`

**Step 1: Ladder query.** Tier ordering helper + query:

```typescript
const TIER_ORDER: Record<string, number> = {
  CHALLENGER: 0,
  GRANDMASTER: 1,
  MASTER: 2,
};

/** LP-ranked Master+ Yuumi players with season stats (small table). */
export const listPlayers = query({
  args: {},
  handler: async (ctx) => {
    const roster = await ctx.db.query('yuumiRoster').collect();
    return roster
      .filter((p) => (p.gamesCount ?? 0) > 0 && p.gameName)
      .sort(
        (a, b) =>
          (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9) || b.lp - a.lp
      )
      .map((p) => ({
        puuid: p.puuid,
        platform: p.platform,
        tier: p.tier,
        lp: p.lp,
        gameName: p.gameName ?? 'Unknown',
        tagLine: p.tagLine ?? '',
        gamesCount: p.gamesCount ?? 0,
        wins: p.wins ?? 0,
        killsTotal: p.killsTotal ?? 0,
        deathsTotal: p.deathsTotal ?? 0,
        assistsTotal: p.assistsTotal ?? 0,
      }));
  },
});
```

**Step 2: Profile query.** Resolves riot id case-insensitively within a platform, aggregates builds/duos, returns recent games:

```typescript
export const getPlayerProfile = query({
  args: { platform: v.string(), gameName: v.string(), tagLine: v.string() },
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query('yuumiRoster')
      .withIndex('by_platform', (q) => q.eq('platform', args.platform))
      .collect();
    const nameLc = args.gameName.toLowerCase();
    const tagLc = args.tagLine.toLowerCase();
    const player = candidates.find(
      (p) =>
        (p.gameName ?? '').toLowerCase() === nameLc &&
        (p.tagLine ?? '').toLowerCase() === tagLc
    );
    if (!player) return null;

    const games = await ctx.db
      .query('yuumiGames')
      .withIndex('by_puuid', (q) => q.eq('puuid', player.puuid))
      .collect();
    games.sort((a, b) => b.gameCreation - a.gameCreation);

    // Ladder position among Yuumi players with games (global).
    const roster = await ctx.db.query('yuumiRoster').collect();
    const ranked = roster
      .filter((p) => (p.gamesCount ?? 0) > 0)
      .sort(
        (a, b) =>
          (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9) || b.lp - a.lp
      );
    const position = ranked.findIndex((p) => p.puuid === player.puuid) + 1;

    // Common builds: completed items (exclude empties + trinkets), sorted
    // signature -> occurrences. Trinkets: 3340/3363/3364; wards 2055.
    const EXCLUDED_ITEMS = new Set([0, 2055, 3340, 3363, 3364]);
    const buildGroups = new Map<
      string,
      { items: number[]; games: number; wins: number }
    >();
    const runeGroups = new Map<
      string,
      {
        keystoneId: number;
        secondaryStyleId: number;
        summonerSpells: number[];
        games: number;
        wins: number;
      }
    >();
    const duoGroups = new Map<string, { games: number; wins: number }>();
    for (const game of games) {
      if (game.items) {
        const core = game.items
          .filter((id) => !EXCLUDED_ITEMS.has(id))
          .sort((a, b) => a - b);
        if (core.length >= 3) {
          const key = core.join(',');
          const group = buildGroups.get(key) ?? {
            items: core,
            games: 0,
            wins: 0,
          };
          group.games++;
          if (game.win) group.wins++;
          buildGroups.set(key, group);
        }
      }
      if (game.keystoneId && game.secondaryStyleId && game.summonerSpells) {
        const spells = [...game.summonerSpells].sort((a, b) => a - b);
        const key = `${game.keystoneId}:${game.secondaryStyleId}:${spells.join(',')}`;
        const group = runeGroups.get(key) ?? {
          keystoneId: game.keystoneId,
          secondaryStyleId: game.secondaryStyleId,
          summonerSpells: spells,
          games: 0,
          wins: 0,
        };
        group.games++;
        if (game.win) group.wins++;
        runeGroups.set(key, group);
      }
      if (game.duoChampion) {
        const group = duoGroups.get(game.duoChampion) ?? { games: 0, wins: 0 };
        group.games++;
        if (game.win) group.wins++;
        duoGroups.set(game.duoChampion, group);
      }
    }
    const byGames = <T extends { games: number }>(a: T, b: T) =>
      b.games - a.games;

    return {
      player: {
        puuid: player.puuid,
        platform: player.platform,
        tier: player.tier,
        lp: player.lp,
        gameName: player.gameName ?? 'Unknown',
        tagLine: player.tagLine ?? '',
        gamesCount: player.gamesCount ?? 0,
        wins: player.wins ?? 0,
        killsTotal: player.killsTotal ?? 0,
        deathsTotal: player.deathsTotal ?? 0,
        assistsTotal: player.assistsTotal ?? 0,
        position,
      },
      builds: [...buildGroups.values()].sort(byGames).slice(0, 3),
      runePages: [...runeGroups.values()].sort(byGames).slice(0, 2),
      duos: [...duoGroups.entries()]
        .map(([champion, stats]) => ({ champion, ...stats }))
        .sort(byGames)
        .slice(0, 5),
      recentGames: games.slice(0, 20),
    };
  },
});
```

**Step 3: Verify + commit**

```bash
git add convex/highelo.ts convex/_generated
git commit -m "feat: add ladder and player profile queries"
```

---

### Task 6: Shared frontend pieces — GameCard extraction + High Elo tabs

**Files:**
- Create: `src/components/highelo/game-card.tsx`
- Create: `src/components/highelo/high-elo-tabs.tsx`
- Create: `src/lib/highelo/regions.ts`
- Modify: `src/app/games/games-client.tsx`

**Step 1: `src/lib/highelo/regions.ts`** — move `PLATFORM_LABELS` + `platformLabel` out of games-client verbatim, add URL slug helpers:

```typescript
export function regionSlug(platform: string): string {
  return platformLabel(platform).toLowerCase();
}

export function platformFromSlug(slug: string): string | null {
  const entry = Object.entries(PLATFORM_LABELS).find(
    ([, label]) => label.toLowerCase() === slug.toLowerCase()
  );
  return entry ? entry[0] : null;
}
```

(Export `PLATFORM_LABELS` and `platformLabel` too.)

**Step 2: `src/components/highelo/game-card.tsx`** — move `GameCard`, `timeAgo`, `formatDuration` from games-client verbatim (plus their imports; import `platformLabel` from the new lib module). Export all three. Keep `'use client'`.

Addition while moving: the player block inside `GameCard` links to the profile. Because the card itself is a `<Link>`, nested anchors are invalid — instead make the whole card unchanged and add a small "Profile" chip-link RIGHT-ALIGNED in the meta row using a `<span>`+router push? NO — keep it simple and valid: wrap the player name in a `<Link>` with `onClick={(e) => e.stopPropagation()}` is still invalid nesting. SOLUTION: `GameCard` gains an optional prop `profileHref?: string`; when provided, render the rank emblem + name block as a nested `<object>`-free layout by converting the OUTER element from `<Link>` to a `<div>` with `onClick` navigation? Too clever. FINAL DECISION (do exactly this): leave `GameCard` untouched as a match link; profiles are reached from the ladder page and profile URLs — game cards do NOT link to profiles. This matches the validated design ("game cards in /games also link to profiles") loosely, but HTML validity wins; the ladder page is one click away via the tabs. Note the deviation in your report.

**Step 3: `src/components/highelo/high-elo-tabs.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Games', href: '/games' },
  { label: 'Players', href: '/players' },
];

export function HighEloTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex justify-center gap-1">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-sm border px-4 py-1.5 text-xs tracking-widest uppercase transition-colors',
              active
                ? 'border-hx-gold bg-hx-gold/10 text-hx-gold-bright'
                : 'border-hx-gold-dark/40 text-hx-gold/60 hover:text-hx-gold'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
```

(Style matches the win-filter buttons already on /games; check `src/app/guide-client.tsx` match-tab triggers and prefer those classes if they differ meaningfully.)

**Step 4: Update `games-client.tsx`** — delete the moved code, import from the new modules, render `<HighEloTabs />` immediately after the `<p>` subtitle (before `HextechPanel`).

**Step 5: Verify + commit** — also load http://localhost:3000/games if the dev server is running (`worktree-games-dev` in .claude/launch.json) to confirm no regression.

```bash
git add src/components/highelo src/lib/highelo src/app/games
git commit -m "refactor: extract shared high-elo components, add section tabs"
```

---

### Task 7: `/players` — the ladder page

**Files:**
- Create: `src/app/players/players-client.tsx`
- Create: `src/app/players/page.tsx`

**Step 1: `players-client.tsx`.** Follow games-client's exact state pattern (timedOut effect + render-time `prevPlayers` hold — copy those ~20 lines). Core rendering:

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { Crown } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { HextechPanel, OrnateHeading } from '@/components/ui/hextech-panel';
import {
  PLATFORM_LABELS,
  platformLabel,
  regionSlug,
} from '@/lib/highelo/regions';
import { HighEloTabs } from '@/components/highelo/high-elo-tabs';
import { cn } from '@/lib/utils';

const MIN_GAMES_DEFAULT = 10;
```

Component: `useQuery(api.highelo.listPlayers)`; filters `region` (select, options from data like games-client) and `minGames` toggle button ("10+ games" / "All players"). Derived rows via useMemo. Table inside `HextechPanel title="The Yuumi Ladder" icon={<Crown .../>}` with header count chip like games-client:

```tsx
<div className="overflow-x-auto">
  <table className="w-full text-left text-sm">
    <thead>
      <tr className="hex-label border-b border-hx-gold-dark/30 text-[10px]">
        <th className="px-2 py-2">#</th>
        <th className="px-2 py-2">Player</th>
        <th className="px-2 py-2">Region</th>
        <th className="px-2 py-2 text-right">LP</th>
        <th className="px-2 py-2 text-right">Games</th>
        <th className="px-2 py-2 text-right">Winrate</th>
        <th className="px-2 py-2 text-right">KDA</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((p, i) => {
        const winrate =
          p.gamesCount > 0 ? Math.round((p.wins / p.gamesCount) * 100) : 0;
        const kda =
          p.deathsTotal === 0
            ? 'Perfect'
            : ((p.killsTotal + p.assistsTotal) / p.deathsTotal).toFixed(2);
        return (
          <tr key={p.puuid} className="group relative border-b border-hx-gold-dark/15 transition-colors hover:bg-hx-gold/5">
            <td className="px-2 py-2.5 text-hx-gold/50">{i + 1}</td>
            <td className="px-2 py-2.5">
              <Link
                href={`/players/${regionSlug(p.platform)}/${encodeURIComponent(`${p.gameName}-${p.tagLine}`)}`}
                className="flex items-center gap-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-hx-gold"
              >
                <Image
                  src={`/images/ranked/${p.tier.toLowerCase()}.png`}
                  alt={p.tier}
                  width={24}
                  height={24}
                />
                <span className="font-semibold text-hx-gold-bright group-hover:underline">
                  {p.gameName}
                  <span className="ml-1 text-xs font-normal text-hx-gold/50">
                    #{p.tagLine}
                  </span>
                </span>
              </Link>
            </td>
            <td className="px-2 py-2.5">
              <span className="hex-chip-magic">{platformLabel(p.platform)}</span>
            </td>
            <td className="px-2 py-2.5 text-right text-hx-gold">{p.lp}</td>
            <td className="px-2 py-2.5 text-right text-hx-gold/70">
              {p.gamesCount}
            </td>
            <td
              className={cn(
                'px-2 py-2.5 text-right',
                winrate >= 55 ? 'text-hx-gold-bright' : 'text-hx-gold/70'
              )}
            >
              {winrate}%
            </td>
            <td className="px-2 py-2.5 text-right text-hx-gold/70">{kda}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
</div>
```

Page shell mirrors games-client: `OrnateHeading eyebrow="Master+ around the world"` → "The Yuumi Ladder", subtitle line, `<HighEloTabs />`, skeleton rows / timeout notice / empty state ("The ladder is still assembling — check back soon."). Low-volume note under the table: `Players with fewer than ${MIN_GAMES_DEFAULT} season games are hidden by default.`

**Step 2: `src/app/players/page.tsx`** — mirror `src/app/games/page.tsx` exactly (metadata: title "Yuumi Ladder — Master+ Players", matching description) rendering `PlayersClient`.

**Step 3: Verify + commit** (type-check, lint, prettier; browser-check /players)

```bash
git add src/app/players
git commit -m "feat: add /players Yuumi ladder page"
```

---

### Task 8: Profile page + OG image

**Files:**
- Create: `src/app/players/[region]/[riotId]/page.tsx`
- Create: `src/app/players/[region]/[riotId]/profile-client.tsx`
- Create: `src/app/players/[region]/[riotId]/opengraph-image.tsx`

**Step 1: Param parsing helper** (top of `page.tsx`, exported for the OG image):

```typescript
import { platformFromSlug } from '@/lib/highelo/regions';

export function parseProfileParams(region: string, riotId: string) {
  const platform = platformFromSlug(region);
  const decoded = decodeURIComponent(riotId);
  const sep = decoded.lastIndexOf('-');
  if (!platform || sep <= 0) return null;
  return {
    platform,
    gameName: decoded.slice(0, sep),
    tagLine: decoded.slice(sep + 1),
  };
}
```

(`lastIndexOf` because game names may contain hyphens; tags cannot.)

**Step 2: `page.tsx`** — async server component (Next 15: `params` is a Promise):

```tsx
import type { Metadata } from 'next';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';
import { ProfileClient } from './profile-client';

type Params = { region: string; riotId: string };

async function fetchProfile(params: Params) {
  const parsed = parseProfileParams(params.region, params.riotId);
  if (!parsed) return null;
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  try {
    const client = new ConvexHttpClient(url);
    return await client.query(api.highelo.getPlayerProfile, parsed);
  } catch {
    return null;
  }
}

export async function generateMetadata(props: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const params = await props.params;
  const profile = await fetchProfile(params);
  if (!profile) {
    return { title: 'Player not found — yuumi.quest' };
  }
  const { player } = profile;
  const winrate =
    player.gamesCount > 0
      ? Math.round((player.wins / player.gamesCount) * 100)
      : 0;
  const title = `${player.gameName}#${player.tagLine} — Yuumi Player Profile`;
  const description = `${player.tier} ${player.lp} LP · #${player.position} Yuumi worldwide · ${player.gamesCount} games, ${winrate}% winrate this season.`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ProfilePage(props: { params: Promise<Params> }) {
  const params = await props.params;
  const parsed = parseProfileParams(params.region, params.riotId);
  return <ProfileClient params={parsed} />;
}
```

**Step 3: `profile-client.tsx`.** `'use client'`; takes `params: { platform, gameName, tagLine } | null`; `useQuery(api.highelo.getPlayerProfile, params ?? 'skip')` (Convex skip token for the null case). States: null params OR loaded-null → not-found panel ("This summoner isn't on the Master+ Yuumi ladder." + `btn-hextech` link to /players); undefined → skeleton (copy the timedOut pattern).

Layout (max-w-5xl shell like games-client, `<HighEloTabs />` up top):

1. **Identity header** — a `hex-card` row: `<Image src={/images/ranked/{tier}.png} width={72}>`, name + tag (hex-title, large), `hex-chip-magic` region, then a 4-stat strip (LP · `#${position}` Yuumi worldwide · games/winrate · avg KDA). Winrate < 5 games → show "Early season" instead of the percentage.
2. **Common builds** — `HextechPanel title="Common Builds"`: for each of `profile.builds`: row of `ItemSlot` (size "lg") per item id + `{games} games · {Math.round(wins/games*100)}% WR` label. Under it, for each `runePages` entry: `RuneDisplay runeId={keystoneId} size` + secondary tree name via a tiny local map `{8000:'Precision',8100:'Domination',8200:'Sorcery',8300:'Inspiration',8400:'Resolve'}` + summoner spell names via local map `{1:'Cleanse',3:'Exhaust',4:'Flash',6:'Ghost',7:'Heal',11:'Smite',12:'Teleport',13:'Clarity',14:'Ignite',21:'Barrier',32:'Snowball'}` (check `src/lib/utils/summonerSpells.ts` first — if it exports an id→name map, use it instead). Empty state: "No build data yet — games are still being ingested."
3. **Duo partners** — `HextechPanel title="Duo Partners"`: `profile.duos` as rows: `DataDragonImage championId={duo.champion} type="icon" width={32}` + champion name + `{games} games · {winrate}%`.
4. **Recent games** — `HextechPanel title="Recent Games"`: `profile.recentGames.map(g => <GameCard key={g._id} game={g} />)` (import from `@/components/highelo/game-card`).

IMPORTANT — `useQuery` skip: the exact convex/react idiom is `useQuery(api.highelo.getPlayerProfile, params ?? 'skip')`. Verify the installed convex version supports the `'skip'` sentinel (it has since 1.x); if typing complains, gate the whole component: `if (!params) return <NotFound />` before the hook is NOT allowed (hooks order) — instead keep `'skip'`.

**Step 4: `opengraph-image.tsx`** — follow the existing root `src/app/opengraph-image.tsx` conventions EXACTLY (inspect it first: export names `alt`/`size`/`contentType`, ImageResponse import, any Discord-compat lessons from PR #29 like explicit width/height and PNG). Content: 1200×630, `background: '#0A1428'`, 4px `#C8AA6E` border, player name+tag large serif, tier + LP line, three stat blocks (Winrate / Games / KDA), footer "yuumi.quest · Master+ Yuumi ladder". Data via the same `fetchProfile`; fallback branch renders a generic "yuumi.quest" card when profile is null. `export const revalidate = 3600;`.

**Step 5: Verify + commit** — browser-check a real profile URL from your dev DB (pick one from /players), the not-found state, and `/players/euw/junk` (no crash). Check the OG image renders at `/players/<region>/<riotId>/opengraph-image`.

```bash
git add src/app/players
git commit -m "feat: add shareable player profile pages with OG cards"
```

---

### Task 9: Navigation

**Files:**
- Modify: `src/components/shell/SideRail.tsx`

**Step 1:** Add `{ label: 'Yuumi Players', href: '/players', icon: Crown }` to RESOURCE_LINKS directly after the 'High Elo Games' entry; add `Crown` to the lucide-react import (alphabetical). Do NOT touch TopNav (7 links is the fit limit at 1024px; /players is reachable via the section tabs).

**Step 2: Verify + commit**

```bash
git add src/components/shell/SideRail.tssx
git commit -m "feat: add Yuumi Players to side rail navigation"
```

(fix the path typo when running: `src/components/shell/SideRail.tsx`)

---

### Task 10: Deploy + bootstrap (coordinator-run, needs user-approved permissions)

1. `npx convex deploy` from the worktree (schema + functions).
2. Set season start (ms epoch — confirm the actual current ranked season/split start date with the user, do not guess): `npx convex run highelo:setMetadataValue '{"key":"seasonStart","value":"<ms>"}'`.
3. Backfill cron begins automatically; kick one run early: `npx convex run highelo:backfillSeason` (expect Cloudflare 524 on the CLI after 100s — the action continues server-side; verify via `npx convex data yuumiGames --limit 3 --order desc` and `npx convex logs`).
4. Browser verification per Task 7/8 steps + `/games` regression (feed still shows only current+last patch).
5. Watch for 429 contention on the match viewer while backfill runs; if severe, halve `BACKFILL_MATCH_FETCH_BUDGET`.
