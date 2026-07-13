import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import {
  autoBuildSchema,
  parseAutoBuild,
  STAT_MOD_KEYS,
} from '../src/lib/builds/auto-build-shared';

// ============ AUTO BUILD DERIVATION (daily cron) ============
//
// Derives the homepage "auto build" JSON blob from OUR OWN aggregated Master+
// Yuumi ladder stats — the hourly 'metaStats' blob computed by convex/meta.ts
// (computeMetaStats) — instead of scraping OP.GG. It reuses the scraper's
// storage + keep-last-good pipeline: the finished blob is handed to
// internal.scraper.recordAutoBuild, which validates it, stores it under
// guideMetadata['autoBuild'], logs a scrapeJobs row, and overlays the
// runes/core/boots/skill order onto the recommended guideBuilds row. On any
// missing-data guard or fetch/parse failure nothing is overwritten, so the
// previous good build (even a scraped one) stays live.
//
// The OP.GG scraper (convex/scraper.ts:autoUpdateBuild) remains available as
// a manual fallback: `npx convex run scraper:autoUpdateBuild`.

const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';

// Minimum in-window games before the ladder aggregate is trusted enough to
// replace the live build; below this we keep the previous blob.
const MIN_WINDOW_GAMES = 50;

// Stat-shard perk id -> icon key. Identical to convex/scraper.ts's
// STAT_MOD_KEYS and the guide UI's STAT_SHARDS map
// (src/components/BuildRunes.tsx), so the mapped keys render. The window's
// statShards arrive as [offense, flex, defense] (see extractGame in
// convex/highelo.ts) — exactly the positional order the shard grid
// highlights — so the keys stay row-aligned without reordering.

type RuneInfo = { id: number; name: string; key: string; icon: string };
type ItemInfo = { name: string; isBoots: boolean };

// A resolved rune page, ready to become both the top-level `runes` block and
// a `runePages[]` entry of the blob.
type ResolvedPage = {
  primaryStyleId: number;
  secondaryStyleId: number;
  keystone: RuneInfo;
  primary: RuneInfo[];
  secondary: RuneInfo[];
  shardKeys: string[];
  games: number;
  winRate: number;
  pickRate: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function numberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((n): n is number => typeof n === 'number')
    : [];
}

function toNumber(value: unknown): number {
  return typeof value === 'number' ? value : 0;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'YuumiChallenges/1.0 (yuumi.quest)' },
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

/**
 * Data Dragon runesReforged -> perk id maps: full display info plus the
 * owning style (tree) id, used to resolve a keystone's primary style.
 */
async function fetchRuneMaps(version: string): Promise<{
  runeInfo: Map<number, RuneInfo>;
  perkToStyle: Map<number, number>;
}> {
  const styles = await fetchJson(
    `${DDRAGON_BASE}/cdn/${version}/data/en_US/runesReforged.json`
  );
  const runeInfo = new Map<number, RuneInfo>();
  const perkToStyle = new Map<number, number>();
  if (!Array.isArray(styles)) return { runeInfo, perkToStyle };
  for (const style of styles) {
    if (!isRecord(style) || typeof style.id !== 'number') continue;
    if (!Array.isArray(style.slots)) continue;
    for (const slot of style.slots) {
      if (!isRecord(slot) || !Array.isArray(slot.runes)) continue;
      for (const rune of slot.runes) {
        if (
          isRecord(rune) &&
          typeof rune.id === 'number' &&
          typeof rune.name === 'string' &&
          typeof rune.key === 'string' &&
          typeof rune.icon === 'string'
        ) {
          runeInfo.set(rune.id, {
            id: rune.id,
            name: rune.name,
            key: rune.key,
            icon: rune.icon,
          });
          perkToStyle.set(rune.id, style.id);
        }
      }
    }
  }
  return { runeInfo, perkToStyle };
}

/** Data Dragon item.json -> id -> {name, isBoots} (Boots-tag detection). */
async function fetchItemMap(version: string): Promise<Map<number, ItemInfo>> {
  const payload = await fetchJson(
    `${DDRAGON_BASE}/cdn/${version}/data/en_US/item.json`
  );
  const map = new Map<number, ItemInfo>();
  if (!isRecord(payload) || !isRecord(payload.data)) return map;
  for (const [id, item] of Object.entries(payload.data)) {
    if (!isRecord(item) || typeof item.name !== 'string') continue;
    const tags = Array.isArray(item.tags) ? item.tags : [];
    map.set(Number(id), { name: item.name, isBoots: tags.includes('Boots') });
  }
  return map;
}

export const deriveAutoBuild = internalAction({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Our own ladder aggregate (hourly cron output). We wrote it, so
      //    parse light — but guard every field the build depends on.
      const raw = await ctx.runQuery(internal.highelo.getMetadataValue, {
        key: 'metaStats',
      });
      if (!raw) throw new Error('metaStats metadata missing');
      const stats: unknown = JSON.parse(raw);
      if (!isRecord(stats)) throw new Error('metaStats malformed');
      const windowScope = isRecord(stats.window) ? stats.window : null;
      if (!windowScope) throw new Error('metaStats window scope missing');
      const totals = isRecord(windowScope.totals) ? windowScope.totals : {};
      const totalGames = toNumber(totals.games);
      const rawRunePages = Array.isArray(windowScope.runePages)
        ? windowScope.runePages
        : [];
      const rawBuildPaths = Array.isArray(windowScope.buildPaths)
        ? windowScope.buildPaths
        : [];
      const rawItems = Array.isArray(windowScope.items)
        ? windowScope.items
        : [];
      const patchWindow = Array.isArray(stats.patchWindow)
        ? stats.patchWindow.filter((p): p is string => typeof p === 'string')
        : [];

      // Guards -> keep the previous good blob (recorded as a failed job).
      if (totalGames < MIN_WINDOW_GAMES) {
        throw new Error(
          `metaStats window has ${totalGames} games (< ${MIN_WINDOW_GAMES})`
        );
      }
      if (rawRunePages.length === 0) throw new Error('no rune pages in window');
      if (rawBuildPaths.length === 0) {
        throw new Error('no build paths in window');
      }

      // 2. Data Dragon reference data (public CDN, no API key needed).
      const versions = await fetchJson(`${DDRAGON_BASE}/api/versions.json`);
      const version =
        Array.isArray(versions) && typeof versions[0] === 'string'
          ? versions[0]
          : null;
      if (!version) throw new Error('No Data Dragon version available');
      const [{ runeInfo, perkToStyle }, itemMap] = await Promise.all([
        fetchRuneMaps(version),
        fetchItemMap(version),
      ]);

      // 3. Rune pages, most-played first (already sorted by meta.ts). Shape
      //    matches the scraper: keystone kept separate, `primary` holds the
      //    three minors. Pages that don't fully resolve are dropped rather
      //    than failing the whole derivation.
      const resolveRunes = (ids: number[]): RuneInfo[] =>
        ids.flatMap((id) => {
          const info = runeInfo.get(id);
          return info ? [info] : [];
        });

      const resolvedPages: ResolvedPage[] = rawRunePages.flatMap((page) => {
        if (!isRecord(page)) return [];
        const primaryResolved = resolveRunes(numberArray(page.primaryRunes));
        const keystone = primaryResolved[0];
        // keystone + 3 minors, matching scraper.ts's `length < 4` gate.
        if (!keystone || primaryResolved.length < 4) return [];
        const secondaryResolved = resolveRunes(
          numberArray(page.secondaryRunes)
        );
        if (secondaryResolved.length < 2) return [];
        const primaryStyleId = perkToStyle.get(keystone.id);
        if (primaryStyleId === undefined) return [];
        const games = toNumber(page.games);
        return [
          {
            primaryStyleId,
            secondaryStyleId: toNumber(page.secondaryStyleId),
            keystone,
            primary: primaryResolved.slice(1),
            secondary: secondaryResolved,
            shardKeys: numberArray(page.statShards).flatMap((id) => {
              const key = STAT_MOD_KEYS[id];
              return key ? [key] : [];
            }),
            games,
            // 0-1 fractions: the rune-page UI (BuildRunes.tsx) multiplies by
            // 100 for display and thresholds winRate at 0.5, matching the
            // OP.GG scraper's stored convention.
            winRate: games > 0 ? toNumber(page.wins) / games : 0,
            pickRate: totalGames > 0 ? games / totalGames : 0,
          },
        ];
      });

      const topPage = resolvedPages[0];
      if (!topPage) throw new Error('no resolvable rune pages');

      // 4. Items from the most-played build path (buy order). Boots are split
      //    out of the core; the core is topped up from the item board only if
      //    the path yields fewer than the schema's two required items.
      const firstPath = rawBuildPaths[0];
      const topPathIds = isRecord(firstPath) ? numberArray(firstPath.path) : [];
      const coreItems: { id: number; name: string }[] = [];
      let boots: { id: number; name: string } | null = null;
      for (const id of topPathIds) {
        const info = itemMap.get(id);
        if (!info) continue;
        if (info.isBoots) {
          if (!boots) boots = { id, name: info.name };
          continue;
        }
        if (!coreItems.some((c) => c.id === id)) {
          coreItems.push({ id, name: info.name });
        }
      }
      // Top up core from the most-played completed items (games-desc already).
      for (const entry of rawItems) {
        if (coreItems.length >= 2) break;
        if (!isRecord(entry) || typeof entry.id !== 'number') continue;
        const info = itemMap.get(entry.id);
        if (!info || info.isBoots) continue;
        if (coreItems.some((c) => c.id === entry.id)) continue;
        coreItems.push({ id: entry.id, name: info.name });
      }
      if (coreItems.length < 2) throw new Error('core items incomplete');
      // Boots fallback: most-played Boots-tagged item on the board.
      if (!boots) {
        for (const entry of rawItems) {
          if (!isRecord(entry) || typeof entry.id !== 'number') continue;
          const info = itemMap.get(entry.id);
          if (info?.isBoots) {
            boots = { id: entry.id, name: info.name };
            break;
          }
        }
      }

      // 5. Skill order isn't part of our match ingestion, so carry it over
      //    from the previous stored build (scraped or derived); otherwise
      //    fall back to Yuumi's standard E > W > Q with no per-level order.
      const previous = parseAutoBuild(
        await ctx.runQuery(internal.highelo.getMetadataValue, {
          key: 'autoBuild',
        })
      );
      // Matches the static guide's recommendation (default-builds.ts).
      const skillPriority = previous?.skillPriority ?? ['Q', 'E', 'W'];
      const skillOrder = previous?.skillOrder ?? null;

      const patch = patchWindow[0] ?? version.split('.').slice(0, 2).join('.');

      // 6. Assemble + validate locally (fail fast into keep-last-good) before
      //    handing the blob to the shared recorder.
      const autoBuild = {
        version: 1 as const,
        patch,
        updatedAt: Date.now(),
        source: 'yuumi.quest · Master+ ladder · all regions',
        runes: {
          primaryStyleId: topPage.primaryStyleId,
          secondaryStyleId: topPage.secondaryStyleId,
          keystone: topPage.keystone,
          primary: topPage.primary,
          secondary: topPage.secondary,
          shardKeys: topPage.shardKeys,
        },
        runePages: resolvedPages.slice(0, 5),
        coreItems,
        boots,
        skillPriority,
        skillOrder,
      };
      const validated = autoBuildSchema.parse(autoBuild);

      await ctx.runMutation(internal.scraper.recordAutoBuild, {
        success: true,
        json: JSON.stringify(validated),
      });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await ctx.runMutation(internal.scraper.recordAutoBuild, {
        success: false,
        error: message,
      });
      return { success: false, error: message };
    }
  },
});
