# High Elo Yuumi Games Feed Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** A `/games` page listing every Master+ Ranked Solo/Duo Yuumi game across all Riot regions on the current + last patch, refreshed every 5 minutes, each card linking to the existing `/match/[matchId]` viewer.

**Architecture:** Two-tier discovery in Convex (see `docs/plans/2026-07-06-high-elo-games-feed-design.md`): a rolling ladder sweep uses cheap Champion-Mastery calls to maintain a roster of Master+ players who play Yuumi; a 5-minute cron polls only roster players' match histories and stores card-sized rows in `yuumiGames`. Frontend is a reactive Convex `useQuery` page styled with the existing hextech primitives.

**Tech Stack:** Convex (self-hosted; crons + internalActions with `fetch`), Riot API (League-V4, Champion-Mastery-V4, Match-V5), Next.js App Router, Tailwind 4 hextech utilities.

**Working directory:** `D:\YuumiChallenges\.worktrees\high-elo-games-feed` (branch `feat/high-elo-games-feed`). All paths below are relative to it.

**Validation:** No unit test framework exists in this repo. Per CLAUDE.md, every task verifies with `npm run type-check` + `npm run lint`, and the final task runs `npm run build` + manual verification. Format with `npm run format` before each commit (Prettier is strict here).

**Strict TS warning:** `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals` are all on. Array indexing returns `T | undefined`; don't pass `undefined` to optional props.

---

### Task 0: Worktree env setup

The worktree has no `.env*` files (git-ignored, not copied by `git worktree add`).

**Step 1:** Copy env files from the main checkout:

```bash
cp D:/YuumiChallenges/.env D:/YuumiChallenges/.worktrees/high-elo-games-feed/.env
cp D:/YuumiChallenges/.env.local D:/YuumiChallenges/.worktrees/high-elo-games-feed/.env.local
```

**Step 2:** Verify they are ignored: `git status --short` must NOT list `.env` or `.env.local`.

No commit (nothing tracked changed).

---

### Task 1: Schema — four new tables

**Files:**
- Modify: `convex/schema.ts` (append inside `defineSchema({ ... })`, after `guideMetadata`)

**Step 1:** Add the tables:

```typescript
  // ===== High-elo Yuumi games feed =====

  // Master+ players known to play Yuumi; polled every 5 minutes.
  yuumiRoster: defineTable({
    puuid: v.string(),
    platform: v.string(), // 'euw1', 'kr', ...
    tier: v.string(), // 'MASTER' | 'GRANDMASTER' | 'CHALLENGER'
    lp: v.number(),
    yuumiLastPlayTime: v.number(), // ms epoch, from champion mastery
    lastCheckedAt: v.number(), // ms epoch of last match-ids poll
  })
    .index('by_puuid', ['puuid'])
    .index('by_lastCheckedAt', ['lastCheckedAt']),

  // Found games — card data only; the match viewer fetches full details.
  yuumiGames: defineTable({
    matchId: v.string(), // 'EUW1_1234567890'
    platform: v.string(),
    patch: v.string(), // '16.13'
    gameCreation: v.number(), // ms epoch
    gameDuration: v.number(), // seconds
    win: v.boolean(),
    playerName: v.string(), // Riot ID game name of the Yuumi player
    playerTag: v.string(),
    tier: v.string(),
    lp: v.number(),
    kills: v.number(),
    deaths: v.number(),
    assists: v.number(),
    allyChampions: v.array(v.string()), // 5 ddragon ids incl. Yuumi
    enemyChampions: v.array(v.string()), // 5 ddragon ids
  })
    .index('by_matchId', ['matchId'])
    .index('by_gameCreation', ['gameCreation']),

  // Pending mastery checks from the last ladder refresh (rolling sweep).
  sweepQueue: defineTable({
    platform: v.string(),
    puuid: v.string(),
    tier: v.string(),
    lp: v.number(),
  }).index('by_platform', ['platform']),

  // Per-platform sweep bookkeeping.
  sweepState: defineTable({
    platform: v.string(),
    lastLeagueRefreshAt: v.number(),
  }).index('by_platform', ['platform']),
```

**Step 2:** Regenerate Convex types: `npx convex codegen`
(If that errors about deployment config, use `npx convex dev --once` — env was copied in Task 0.)

**Step 3:** Verify: `npm run type-check` → passes.

**Step 4:** Commit:

```bash
git add convex/schema.ts convex/_generated
git commit -m "feat: add high-elo feed tables (yuumiRoster, yuumiGames, sweep state)"
```

---

### Task 2: `convex/highelo.ts` — constants, Riot helpers, internal queries/mutations

**Files:**
- Create: `convex/highelo.ts`

**Step 1:** Create the file with constants + helpers + all internal queries/mutations (actions come in Task 3, appended to the same file):

```typescript
import { v } from 'convex/values';
import {
  internalAction,
  internalMutation,
  internalQuery,
  query,
} from './_generated/server';
import type { ActionCtx } from './_generated/server';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';

// ============ HIGH-ELO YUUMI GAMES FEED ============
//
// Two-tier discovery (docs/plans/2026-07-06-high-elo-games-feed-design.md):
//  - sweepLadderChunk (15 min): refresh Master+ ladders daily per platform,
//    roll through cheap champion-mastery checks to find players who play
//    Yuumi, keep them in yuumiRoster.
//  - pollRosterMatches (5 min): check roster players' new ranked games,
//    store card-sized rows in yuumiGames.
//  - pruneOldGames (daily): drop games outside the current+last patch
//    window and roster entries that went inactive.

const YUUMI_CHAMPION_ID = 350;
const RANKED_SOLO_QUEUE = 420;

// Every live platform routing value and its match-v5 regional cluster.
const PLATFORM_TO_CLUSTER = {
  br1: 'americas',
  la1: 'americas',
  la2: 'americas',
  na1: 'americas',
  jp1: 'asia',
  kr: 'asia',
  eun1: 'europe',
  euw1: 'europe',
  me1: 'europe',
  ru: 'europe',
  tr1: 'europe',
  oc1: 'sea',
  sg2: 'sea',
  tw2: 'sea',
  vn2: 'sea',
} as const;

type Platform = keyof typeof PLATFORM_TO_CLUSTER;
const PLATFORMS = Object.keys(PLATFORM_TO_CLUSTER) as Platform[];

// Sweep pacing: mastery checks per platform per 15-min run. Ladders hold
// roughly 3-6k Master+ players per platform, so a full pass completes in a
// few hours and then keeps rolling.
const MASTERY_CHECKS_PER_RUN = 250;
const LEAGUE_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;
// Played Yuumi within this window -> watched by the fast loop.
const YUUMI_ACTIVITY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
// Roster entries idle longer than this get pruned daily.
const ROSTER_RETENTION_MS = 45 * 24 * 60 * 60 * 1000;
// Most roster players polled per 5-min run (stalest first).
const POLL_PLAYERS_PER_RUN = 1500;
// match-ids lookback: startTime filters by game START, so a game that began
// before the last poll but ended after it needs the buffer to be caught.
const POLL_LOOKBACK_MS = 3 * 60 * 60 * 1000;

// ---------- generic helpers ----------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function riotApiKey(): string {
  const key = process.env.RIOT_API_KEY;
  if (!key) {
    throw new Error('RIOT_API_KEY is not set in the Convex environment');
  }
  return key;
}

/**
 * GET a Riot API URL. Returns parsed JSON, or null on 404. Retries twice on
 * 429 honoring Retry-After; throws on other errors so callers can decide.
 */
async function riotFetch(url: string): Promise<unknown> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: { 'X-Riot-Token': riotApiKey() },
    });
    if (res.status === 404) return null;
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After') ?? '2');
      await sleep(Math.min(retryAfter, 20) * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`Riot API ${res.status}: ${url}`);
    return res.json();
  }
  throw new Error(`Riot API rate limited after retries: ${url}`);
}

/** ['16.13', '16.12'] — current and previous patch from Data Dragon. */
async function fetchPatchWindow(): Promise<string[]> {
  const res = await fetch(
    'https://ddragon.leagueoflegends.com/api/versions.json'
  );
  if (!res.ok) throw new Error(`versions.json returned ${res.status}`);
  const versions = (await res.json()) as unknown;
  if (!Array.isArray(versions)) throw new Error('versions.json malformed');
  const patches: string[] = [];
  for (const version of versions) {
    if (typeof version !== 'string') continue;
    const [major, minor] = version.split('.');
    if (!major || !minor || Number.isNaN(Number(major))) continue;
    const patch = `${major}.${minor}`;
    if (!patches.includes(patch)) patches.push(patch);
    if (patches.length === 2) break;
  }
  if (patches.length < 2) throw new Error('could not derive patch window');
  return patches;
}

// ---------- public query ----------

export const listGames = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 500);
    return await ctx.db
      .query('yuumiGames')
      .withIndex('by_gameCreation')
      .order('desc')
      .take(limit);
  },
});

// ---------- internal plumbing (sweep) ----------

export const getSweepState = internalQuery({
  args: { platform: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sweepState')
      .withIndex('by_platform', (q) => q.eq('platform', args.platform))
      .unique();
  },
});

export const setSweepState = internalMutation({
  args: { platform: v.string(), lastLeagueRefreshAt: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('sweepState')
      .withIndex('by_platform', (q) => q.eq('platform', args.platform))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastLeagueRefreshAt: args.lastLeagueRefreshAt,
      });
    } else {
      await ctx.db.insert('sweepState', args);
    }
  },
});

/** Deletes up to `limit` queue rows for a platform; returns count deleted. */
export const clearSweepQueueBatch = internalMutation({
  args: { platform: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('sweepQueue')
      .withIndex('by_platform', (q) => q.eq('platform', args.platform))
      .take(args.limit);
    for (const row of rows) {
      await ctx.db.delete(row._id);
    }
    return rows.length;
  },
});

export const enqueueSweepEntries = internalMutation({
  args: {
    platform: v.string(),
    entries: v.array(
      v.object({ puuid: v.string(), tier: v.string(), lp: v.number() })
    ),
  },
  handler: async (ctx, args) => {
    for (const entry of args.entries) {
      await ctx.db.insert('sweepQueue', { platform: args.platform, ...entry });
    }
  },
});

export const takeSweepQueue = internalQuery({
  args: { platform: v.string(), limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('sweepQueue')
      .withIndex('by_platform', (q) => q.eq('platform', args.platform))
      .take(args.limit);
  },
});

/** Batch-finish a sweep chunk: drop queue rows, upsert found Yuumi players. */
export const finishSweepChunk = internalMutation({
  args: {
    queueIds: v.array(v.id('sweepQueue')),
    rosterUpserts: v.array(
      v.object({
        puuid: v.string(),
        platform: v.string(),
        tier: v.string(),
        lp: v.number(),
        yuumiLastPlayTime: v.number(),
      })
    ),
    now: v.number(),
  },
  handler: async (ctx, args) => {
    for (const id of args.queueIds) {
      await ctx.db.delete(id);
    }
    for (const entry of args.rosterUpserts) {
      const existing = await ctx.db
        .query('yuumiRoster')
        .withIndex('by_puuid', (q) => q.eq('puuid', entry.puuid))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, {
          platform: entry.platform,
          tier: entry.tier,
          lp: entry.lp,
          yuumiLastPlayTime: entry.yuumiLastPlayTime,
        });
      } else {
        await ctx.db.insert('yuumiRoster', {
          ...entry,
          lastCheckedAt: args.now,
        });
      }
    }
  },
});

// ---------- internal plumbing (poll) ----------

export const takeRosterForPoll = internalQuery({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('yuumiRoster')
      .withIndex('by_lastCheckedAt')
      .order('asc')
      .take(args.limit);
  },
});

export const getExistingMatchIds = internalQuery({
  args: { matchIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const existing: string[] = [];
    for (const matchId of args.matchIds) {
      const row = await ctx.db
        .query('yuumiGames')
        .withIndex('by_matchId', (q) => q.eq('matchId', matchId))
        .unique();
      if (row) existing.push(matchId);
    }
    return existing;
  },
});

const gameValidator = v.object({
  matchId: v.string(),
  platform: v.string(),
  patch: v.string(),
  gameCreation: v.number(),
  gameDuration: v.number(),
  win: v.boolean(),
  playerName: v.string(),
  playerTag: v.string(),
  tier: v.string(),
  lp: v.number(),
  kills: v.number(),
  deaths: v.number(),
  assists: v.number(),
  allyChampions: v.array(v.string()),
  enemyChampions: v.array(v.string()),
});

/** Batch-record a poll run: insert new games, stamp roster lastCheckedAt. */
export const recordPollResults = internalMutation({
  args: {
    rosterIds: v.array(v.id('yuumiRoster')),
    checkedAt: v.number(),
    games: v.array(gameValidator),
  },
  handler: async (ctx, args) => {
    const seen = new Set<string>();
    for (const game of args.games) {
      if (seen.has(game.matchId)) continue;
      seen.add(game.matchId);
      const existing = await ctx.db
        .query('yuumiGames')
        .withIndex('by_matchId', (q) => q.eq('matchId', game.matchId))
        .unique();
      if (!existing) {
        await ctx.db.insert('yuumiGames', game);
      }
    }
    for (const id of args.rosterIds) {
      await ctx.db.patch(id, { lastCheckedAt: args.checkedAt });
    }
  },
});

// ---------- internal plumbing (prune) ----------

/** Deletes up to 2000 games outside the patch window; returns count. */
export const deleteGamesOutsidePatches = internalMutation({
  args: { patches: v.array(v.string()) },
  handler: async (ctx, args) => {
    const games = await ctx.db.query('yuumiGames').take(4000);
    let deleted = 0;
    for (const game of games) {
      if (!args.patches.includes(game.patch)) {
        await ctx.db.delete(game._id);
        deleted++;
        if (deleted >= 2000) break;
      }
    }
    return deleted;
  },
});

export const pruneInactiveRoster = internalMutation({
  args: { cutoff: v.number() },
  handler: async (ctx, args) => {
    const roster = await ctx.db.query('yuumiRoster').collect();
    for (const entry of roster) {
      if (entry.yuumiLastPlayTime < args.cutoff) {
        await ctx.db.delete(entry._id);
      }
    }
  },
});
```

**Step 2:** `npm run type-check` — expect failures ONLY about unused imports/constants (`internalAction`, `ActionCtx`, `YUUMI_CHAMPION_ID`, sweep constants, etc. are used in Task 3). If so, proceed to Task 3 before committing — Tasks 2+3 land as one commit. If there are OTHER errors, fix them now.

---

### Task 3: `convex/highelo.ts` — the three actions

**Files:**
- Modify: `convex/highelo.ts` (append)

**Step 1:** Append the sweep action:

```typescript
// ---------- actions ----------

type LadderEntry = { puuid: string; tier: string; lp: number };

/** All Master+ solo-queue entries for one platform (3 League-V4 calls). */
async function fetchLadder(platform: Platform): Promise<LadderEntry[]> {
  const base = `https://${platform}.api.riotgames.com/lol/league/v4`;
  const tiers = [
    ['challengerleagues', 'CHALLENGER'],
    ['grandmasterleagues', 'GRANDMASTER'],
    ['masterleagues', 'MASTER'],
  ] as const;
  const entries: LadderEntry[] = [];
  for (const [path, tier] of tiers) {
    const data = await riotFetch(`${base}/${path}/by-queue/RANKED_SOLO_5x5`);
    if (!isRecord(data) || !Array.isArray(data.entries)) continue;
    for (const entry of data.entries) {
      if (isRecord(entry) && typeof entry.puuid === 'string') {
        entries.push({
          puuid: entry.puuid,
          tier,
          lp:
            typeof entry.leaguePoints === 'number' ? entry.leaguePoints : 0,
        });
      }
    }
  }
  return entries;
}

async function sweepPlatform(
  ctx: ActionCtx,
  platform: Platform
): Promise<void> {
  const now = Date.now();
  const state = await ctx.runQuery(internal.highelo.getSweepState, {
    platform,
  });

  // Refresh the ladder once a day, replacing the pending queue.
  if (!state || now - state.lastLeagueRefreshAt > LEAGUE_REFRESH_INTERVAL_MS) {
    const ladder = await fetchLadder(platform);
    if (ladder.length > 0) {
      let cleared = 0;
      do {
        cleared = await ctx.runMutation(
          internal.highelo.clearSweepQueueBatch,
          { platform, limit: 1000 }
        );
      } while (cleared > 0);
      for (let i = 0; i < ladder.length; i += 500) {
        await ctx.runMutation(internal.highelo.enqueueSweepEntries, {
          platform,
          entries: ladder.slice(i, i + 500),
        });
      }
      await ctx.runMutation(internal.highelo.setSweepState, {
        platform,
        lastLeagueRefreshAt: now,
      });
    }
  }

  // Work through a chunk of pending mastery checks.
  const pending = await ctx.runQuery(internal.highelo.takeSweepQueue, {
    platform,
    limit: MASTERY_CHECKS_PER_RUN,
  });
  if (pending.length === 0) return;

  const queueIds = [];
  const rosterUpserts = [];
  for (const item of pending) {
    const mastery = await riotFetch(
      `https://${platform}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${item.puuid}/by-champion/${YUUMI_CHAMPION_ID}`
    );
    queueIds.push(item._id);
    const lastPlayTime =
      isRecord(mastery) && typeof mastery.lastPlayTime === 'number'
        ? mastery.lastPlayTime
        : 0;
    if (now - lastPlayTime < YUUMI_ACTIVITY_WINDOW_MS) {
      rosterUpserts.push({
        puuid: item.puuid,
        platform,
        tier: item.tier,
        lp: item.lp,
        yuumiLastPlayTime: lastPlayTime,
      });
    }
  }
  await ctx.runMutation(internal.highelo.finishSweepChunk, {
    queueIds,
    rosterUpserts,
    now,
  });
}

/**
 * Rolling roster builder (every 15 min). Platforms have independent rate
 * limits, so they sweep in parallel; per-platform failures are isolated.
 */
export const sweepLadderChunk = internalAction({
  args: {},
  handler: async (ctx) => {
    await Promise.all(
      PLATFORMS.map((platform) =>
        sweepPlatform(ctx, platform).catch((error) => {
          console.error(`sweep ${platform} failed:`, error);
        })
      )
    );
  },
});
```

**Step 2:** Append the poll action:

```typescript
type GameRow = {
  matchId: string;
  platform: string;
  patch: string;
  gameCreation: number;
  gameDuration: number;
  win: boolean;
  playerName: string;
  playerTag: string;
  tier: string;
  lp: number;
  kills: number;
  deaths: number;
  assists: number;
  allyChampions: string[];
  enemyChampions: string[];
};

// match-v5 keeps a couple of legacy champion spellings Data Dragon rejects.
const CHAMPION_NAME_FIXES: Record<string, string> = {
  FiddleSticks: 'Fiddlesticks',
};

function fixChampionName(name: string): string {
  return CHAMPION_NAME_FIXES[name] ?? name;
}

/** Card row from a match-v5 payload, or null if it doesn't qualify. */
function extractGame(
  match: unknown,
  player: Doc<'yuumiRoster'>,
  patchWindow: string[]
): GameRow | null {
  if (!isRecord(match) || !isRecord(match.metadata) || !isRecord(match.info)) {
    return null;
  }
  const { metadata, info } = match;
  if (typeof metadata.matchId !== 'string') return null;
  if (info.queueId !== RANKED_SOLO_QUEUE) return null;
  if (typeof info.gameVersion !== 'string') return null;
  const [major, minor] = info.gameVersion.split('.');
  const patch = major && minor ? `${major}.${minor}` : '';
  if (!patchWindow.includes(patch)) return null;
  if (!Array.isArray(info.participants)) return null;

  const participants = info.participants.filter(isRecord);
  const yuumi = participants.find(
    (p) => p.puuid === player.puuid && p.championName === 'Yuumi'
  );
  if (!yuumi) return null;

  const allyChampions: string[] = [];
  const enemyChampions: string[] = [];
  for (const p of participants) {
    if (typeof p.championName !== 'string') continue;
    const name = fixChampionName(p.championName);
    if (p.teamId === yuumi.teamId) allyChampions.push(name);
    else enemyChampions.push(name);
  }
  if (allyChampions.length !== 5 || enemyChampions.length !== 5) return null;

  return {
    matchId: metadata.matchId,
    platform: player.platform,
    patch,
    gameCreation:
      typeof info.gameCreation === 'number' ? info.gameCreation : Date.now(),
    gameDuration:
      typeof info.gameDuration === 'number' ? info.gameDuration : 0,
    win: yuumi.win === true,
    playerName:
      typeof yuumi.riotIdGameName === 'string' && yuumi.riotIdGameName !== ''
        ? yuumi.riotIdGameName
        : typeof yuumi.summonerName === 'string' && yuumi.summonerName !== ''
          ? yuumi.summonerName
          : 'Unknown',
    playerTag:
      typeof yuumi.riotIdTagline === 'string' ? yuumi.riotIdTagline : '',
    tier: player.tier,
    lp: player.lp,
    kills: typeof yuumi.kills === 'number' ? yuumi.kills : 0,
    deaths: typeof yuumi.deaths === 'number' ? yuumi.deaths : 0,
    assists: typeof yuumi.assists === 'number' ? yuumi.assists : 0,
    allyChampions,
    enemyChampions,
  };
}

async function pollCluster(
  ctx: ActionCtx,
  cluster: string,
  players: Doc<'yuumiRoster'>[],
  patchWindow: string[]
): Promise<void> {
  const now = Date.now();
  const games: GameRow[] = [];
  const rosterIds = [];
  for (const player of players) {
    const startTime = Math.max(
      Math.floor((player.lastCheckedAt - POLL_LOOKBACK_MS) / 1000),
      0
    );
    const ids = await riotFetch(
      `https://${cluster}.api.riotgames.com/lol/match/v5/matches/by-puuid/${player.puuid}/ids?queue=${RANKED_SOLO_QUEUE}&startTime=${startTime}&count=10`
    );
    rosterIds.push(player._id);
    if (!Array.isArray(ids) || ids.length === 0) continue;
    const matchIds = ids.filter((id): id is string => typeof id === 'string');
    const existing = new Set(
      await ctx.runQuery(internal.highelo.getExistingMatchIds, { matchIds })
    );
    for (const matchId of matchIds) {
      if (existing.has(matchId)) continue;
      const match = await riotFetch(
        `https://${cluster}.api.riotgames.com/lol/match/v5/matches/${matchId}`
      );
      const game = extractGame(match, player, patchWindow);
      if (game) games.push(game);
    }
  }
  await ctx.runMutation(internal.highelo.recordPollResults, {
    rosterIds,
    checkedAt: now,
    games,
  });
}

/**
 * Fast loop (every 5 min): new ranked games for roster players, stalest
 * first. Clusters have independent rate limits -> parallel per cluster.
 */
export const pollRosterMatches = internalAction({
  args: {},
  handler: async (ctx) => {
    const roster = await ctx.runQuery(internal.highelo.takeRosterForPoll, {
      limit: POLL_PLAYERS_PER_RUN,
    });
    if (roster.length === 0) return;
    const patchWindow = await fetchPatchWindow();

    const byCluster = new Map<string, Doc<'yuumiRoster'>[]>();
    for (const player of roster) {
      const cluster =
        PLATFORM_TO_CLUSTER[player.platform as Platform] ?? 'europe';
      const list = byCluster.get(cluster) ?? [];
      list.push(player);
      byCluster.set(cluster, list);
    }

    await Promise.all(
      [...byCluster.entries()].map(([cluster, players]) =>
        pollCluster(ctx, cluster, players, patchWindow).catch((error) => {
          console.error(`poll ${cluster} failed:`, error);
        })
      )
    );
  },
});
```

**Step 3:** Append the prune action:

```typescript
/** Daily cleanup: keep only current+last patch games and an active roster. */
export const pruneOldGames = internalAction({
  args: {},
  handler: async (ctx) => {
    const patches = await fetchPatchWindow();
    let deleted = 0;
    do {
      deleted = await ctx.runMutation(
        internal.highelo.deleteGamesOutsidePatches,
        { patches }
      );
    } while (deleted > 0);
    await ctx.runMutation(internal.highelo.pruneInactiveRoster, {
      cutoff: Date.now() - ROSTER_RETENTION_MS,
    });
  },
});
```

**Step 4:** Regenerate types (`npx convex codegen`), then `npm run type-check` and `npm run lint` → both pass. Common trap: `deleteGamesOutsidePatches` loop condition — it returns count deleted out of the first 4000 rows read; when all remaining rows are in-window it returns 0 and the loop exits. If more than 4000 in-window games ever accumulate, out-of-window rows past row 4000 wait for the next daily run — acceptable, do not "fix".

**Step 5:** `npm run format`, then commit:

```bash
git add convex/highelo.ts convex/_generated
git commit -m "feat: high-elo Yuumi discovery pipeline (sweep, poll, prune)"
```

---

### Task 4: Cron registration

**Files:**
- Modify: `convex/crons.ts`

**Step 1:** Append before `export default crons;`:

```typescript
// High-elo Yuumi feed: fast game polling, rolling ladder sweep, and a daily
// prune to the current+last patch window. See convex/highelo.ts.
crons.interval(
  'poll high elo yuumi games',
  { minutes: 5 },
  internal.highelo.pollRosterMatches
);
crons.interval(
  'sweep high elo ladder',
  { minutes: 15 },
  internal.highelo.sweepLadderChunk
);
crons.daily(
  'prune high elo feed',
  { hourUTC: 5, minuteUTC: 45 },
  internal.highelo.pruneOldGames
);
```

**Step 2:** `npm run type-check` → passes.

**Step 3:** Commit:

```bash
git add convex/crons.ts
git commit -m "feat: schedule high-elo feed crons (poll 5m, sweep 15m, prune daily)"
```

---

### Task 5: `/games` page — client component

**Files:**
- Create: `src/app/games/games-client.tsx`

**Step 1:** Create the component. Full code:

```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { Swords, Trophy } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import type { Doc } from '@/../convex/_generated/dataModel';
import { HextechPanel, OrnateHeading } from '@/components/ui/hextech-panel';
import { DataDragonImage } from '@/components/ui/datadragon-image';
import { useLivePatch } from '@/lib/hooks/use-live-patch';
import { cn } from '@/lib/utils';

type YuumiGame = Doc<'yuumiGames'>;

const PAGE_SIZE = 50;

const PLATFORM_LABELS: Record<string, string> = {
  br1: 'BR',
  eun1: 'EUNE',
  euw1: 'EUW',
  jp1: 'JP',
  kr: 'KR',
  la1: 'LAN',
  la2: 'LAS',
  me1: 'ME',
  na1: 'NA',
  oc1: 'OCE',
  ru: 'RU',
  sg2: 'SEA',
  tr1: 'TR',
  tw2: 'TW',
  vn2: 'VN',
};

function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform.toUpperCase();
}

function timeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function GameCard({ game }: { game: YuumiGame }) {
  const kda =
    game.deaths === 0
      ? 'Perfect'
      : ((game.kills + game.assists) / game.deaths).toFixed(1);

  return (
    <Link
      href={`/match/${game.matchId}`}
      className={cn(
        'hex-card group relative block rounded-sm border-l-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-hx-gold',
        game.win ? 'border-l-emerald-400/70' : 'border-l-red-400/60'
      )}
    >
      <div className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center lg:gap-4">
        {/* Yuumi player */}
        <div className="flex min-w-0 items-center gap-3 lg:w-72 lg:shrink-0">
          <Image
            src={`/images/ranked/${game.tier.toLowerCase()}.png`}
            alt={game.tier}
            width={40}
            height={40}
            className="shrink-0"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-hx-gold-bright">
              {game.playerName}
              {game.playerTag && (
                <span className="ml-1 text-xs font-normal text-hx-gold/50">
                  #{game.playerTag}
                </span>
              )}
            </div>
            <div className="text-[11px] tracking-wide text-hx-gold/60">
              {game.lp} LP · {game.kills}/{game.deaths}/{game.assists} · {kda}{' '}
              KDA
            </div>
          </div>
        </div>

        {/* Team comps */}
        <div className="flex flex-1 items-center justify-center gap-2">
          <div className="flex gap-1">
            {game.allyChampions.map((champion, i) => (
              <DataDragonImage
                key={`ally-${champion}-${i}`}
                championId={champion}
                type="icon"
                width={28}
                height={28}
                className={cn(
                  'rounded-sm',
                  champion === 'Yuumi' && 'ring-2 ring-hx-magic'
                )}
              />
            ))}
          </div>
          <Swords className="h-3.5 w-3.5 shrink-0 text-hx-gold/40" aria-hidden />
          <div className="flex gap-1">
            {game.enemyChampions.map((champion, i) => (
              <DataDragonImage
                key={`enemy-${champion}-${i}`}
                championId={champion}
                type="icon"
                width={28}
                height={28}
                className="rounded-sm opacity-90"
              />
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 text-[11px] tracking-wide text-hx-gold/60 lg:w-64 lg:shrink-0 lg:justify-end">
          <span
            className={cn(
              'hex-title text-xs',
              game.win ? 'text-emerald-300' : 'text-red-300'
            )}
          >
            {game.win ? 'Victory' : 'Defeat'}
          </span>
          <span className="hex-chip-magic">{platformLabel(game.platform)}</span>
          <span>{game.patch}</span>
          <span>{formatDuration(game.gameDuration)}</span>
          <span className="whitespace-nowrap">{timeAgo(game.gameCreation)}</span>
        </div>
      </div>
    </Link>
  );
}

type WinFilter = 'all' | 'wins' | 'losses';

export function GamesClient() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [region, setRegion] = useState('all');
  const [patchFilter, setPatchFilter] = useState('all');
  const [winFilter, setWinFilter] = useState<WinFilter>('all');
  const games = useQuery(api.highelo.listGames, { limit });
  const livePatch = useLivePatch();

  // Convex unreachable -> useQuery stays undefined forever; show a notice
  // instead of skeletons after a grace period.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (games !== undefined) return;
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [games]);

  const regions = useMemo(
    () => [...new Set((games ?? []).map((g) => g.platform))].sort(),
    [games]
  );
  const patches = useMemo(
    () =>
      [...new Set((games ?? []).map((g) => g.patch))].sort((a, b) =>
        b.localeCompare(a, undefined, { numeric: true })
      ),
    [games]
  );

  const filtered = useMemo(
    () =>
      (games ?? []).filter(
        (g) =>
          (region === 'all' || g.platform === region) &&
          (patchFilter === 'all' || g.patch === patchFilter) &&
          (winFilter === 'all' || (winFilter === 'wins') === g.win)
      ),
    [games, region, patchFilter, winFilter]
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <OrnateHeading as="h1" eyebrow="Live from the ladder">
        Master+ Yuumi Games
      </OrnateHeading>
      <p className="mt-3 text-center text-xs tracking-wide text-hx-gold/60">
        Every Master+ solo queue Yuumi game across all regions on patch{' '}
        {livePatch ?? '…'} and the one before · refreshed every 5 minutes
      </p>

      <HextechPanel
        title="Game Feed"
        icon={<Trophy className="h-4 w-4" aria-hidden />}
        className="mt-8"
        action={
          <span className="hex-label">
            {games ? `${filtered.length} games` : '…'}
          </span>
        }
      >
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="hex-card-inset rounded-sm border border-hx-gold-dark/40 bg-transparent px-2 py-1.5 text-xs tracking-wide text-hx-gold"
            aria-label="Filter by region"
          >
            <option value="all">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {platformLabel(r)}
              </option>
            ))}
          </select>
          <select
            value={patchFilter}
            onChange={(e) => setPatchFilter(e.target.value)}
            className="hex-card-inset rounded-sm border border-hx-gold-dark/40 bg-transparent px-2 py-1.5 text-xs tracking-wide text-hx-gold"
            aria-label="Filter by patch"
          >
            <option value="all">All patches</option>
            {patches.map((p) => (
              <option key={p} value={p}>
                Patch {p}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            {(['all', 'wins', 'losses'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setWinFilter(value)}
                className={cn(
                  'rounded-sm border px-2.5 py-1.5 text-xs tracking-wide capitalize transition-colors',
                  winFilter === value
                    ? 'border-hx-gold bg-hx-gold/10 text-hx-gold-bright'
                    : 'border-hx-gold-dark/40 text-hx-gold/60 hover:text-hx-gold'
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        {games === undefined ? (
          timedOut ? (
            <p className="py-10 text-center text-sm text-hx-gold/60">
              The game feed is unavailable right now — please try again later.
            </p>
          ) : (
            <div className="space-y-2" aria-busy>
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="hex-card h-16 animate-pulse rounded-sm opacity-50"
                />
              ))}
            </div>
          )
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-hx-gold/60">
            No games found yet — the ladder sweep may still be warming up.
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((game) => (
              <GameCard key={game._id} game={game} />
            ))}
          </div>
        )}

        {/* Load more */}
        {games && games.length >= limit && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              className="btn-hextech rounded-sm px-4 py-2 text-xs"
            >
              Load more
            </button>
          </div>
        )}
      </HextechPanel>
    </div>
  );
}
```

**Step 2:** Check class utilities actually exist: `hex-chip-magic`, `hex-card-inset`, `hex-label`, `hex-title`, `btn-hextech`, `hex-card` are all used by existing shell components (`TopNav.tsx`, `SideRail.tsx`) — grep `src/app/globals.css` if unsure. Adjust only if a class is missing.

**Step 3:** `npm run type-check` → passes (page not yet created; component is exported but unused files are fine — `noUnusedLocals` is per-file, not per-project).

---

### Task 6: `/games` page — route + metadata

**Files:**
- Create: `src/app/games/page.tsx`

**Step 1:** Look at `src/app/mythic-shop/page.tsx` (or `src/app/match/page.tsx`) for the local metadata convention, then create:

```tsx
import type { Metadata } from 'next';
import { GamesClient } from './games-client';

export const metadata: Metadata = {
  title: 'High Elo Yuumi Games',
  description:
    'Every Master+ solo queue Yuumi game across all Riot regions on the current and last patch, refreshed every 5 minutes.',
};

export default function GamesPage() {
  return <GamesClient />;
}
```

Match the surrounding convention if it differs (e.g. title templates).

**Step 2:** `npm run type-check` && `npm run lint` → pass.

**Step 3:** `npm run format`, then commit:

```bash
git add src/app/games
git commit -m "feat: add /games high-elo Yuumi feed page"
```

---

### Task 7: Navigation entries

**Files:**
- Modify: `src/components/shell/TopNav.tsx:12-19` (NAV_LINKS)
- Modify: `src/components/shell/SideRail.tsx:24-29` (RESOURCE_LINKS) and its lucide import block

**Step 1:** In `TopNav.tsx`, add to `NAV_LINKS` after Matchups:

```typescript
  { label: 'High Elo', href: '/games' },
```

**Step 2:** In `SideRail.tsx`, add `Trophy` to the lucide-react import (keep the list alphabetical) and add to `RESOURCE_LINKS` before Match Viewer:

```typescript
  { label: 'High Elo Games', href: '/games', icon: Trophy },
```

**Step 3:** `npm run type-check` && `npm run lint` → pass.

**Step 4:** `npm run format`, then commit:

```bash
git add src/components/shell/TopNav.tsx src/components/shell/SideRail.tsx
git commit -m "feat: add High Elo games feed to navigation"
```

---

### Task 8: Full validation + manual verification

**Step 1:** Full local gates, all must pass:

```bash
npm run lint && npm run type-check && npm run format:check && npm run build
```

Note: `npm run build` deploys Convex first (per package.json) — if that is undesired from the worktree, use `npx next build` instead and say so in the report.

**Step 2:** Deploy backend + set the API key (Convex env, NOT .env):

```bash
npx convex deploy
npx convex env set RIOT_API_KEY <value from .env.local>
```

**Step 3:** Bootstrap manually instead of waiting for crons:

```bash
npx convex run highelo:sweepLadderChunk   # run 2-3 times → roster fills
npx convex run highelo:pollRosterMatches  # → first games appear
```

Check data in the Convex dashboard or via `npx convex run highelo:listGames '{}'`.

**Step 4:** Manual UI verification with the dev server (`npm run dev`): open `/games`, confirm cards render (rank emblem, comps with Yuumi ring, W/L coloring), filters work, a card click lands on `/match/<matchId>` and the viewer loads, and nav entries highlight correctly. Verify mobile layout (cards stack).

**Step 5:** Commit any fixes, then report status honestly (what was verified, what wasn't).

---

## Riot API reference (for the implementer)

| Purpose | Endpoint | Routing |
|---|---|---|
| Challenger league | `GET /lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5` | platform (`euw1`…) |
| Grandmaster league | `GET /lol/league/v4/grandmasterleagues/by-queue/RANKED_SOLO_5x5` | platform |
| Master league | `GET /lol/league/v4/masterleagues/by-queue/RANKED_SOLO_5x5` | platform |
| Yuumi mastery | `GET /lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}/by-champion/350` | platform |
| Match ids | `GET /lol/match/v5/matches/by-puuid/{puuid}/ids?queue=420&startTime={sec}&count=10` | cluster (`americas`/`asia`/`europe`/`sea`) |
| Match detail | `GET /lol/match/v5/matches/{matchId}` | cluster |

Auth header: `X-Riot-Token`. League entries include `puuid` and `leaguePoints`. Mastery 404 = never played Yuumi (riotFetch returns null → skip). `startTime` is epoch **seconds** and filters by game start. If the `sea` cluster ever returns routing errors for match-v5, fall back to `asia` for those platforms and note it.
