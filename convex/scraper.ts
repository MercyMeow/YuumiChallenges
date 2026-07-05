import { v } from 'convex/values';
import { query, internalAction, internalMutation } from './_generated/server';
import { internal } from './_generated/api';
import {
  AUTO_BUILD_METADATA_KEY,
  parseAutoBuild,
} from '../src/lib/builds/auto-build-shared';
import { applyAutoBuildToFields } from '../src/lib/builds/apply-auto-build';

// ============ SCRAPE JOB LOGS ============
// The daily auto-build pipeline (below) records its runs here; surfaced for
// debugging via the Convex dashboard / CLI.

export const getScrapeJobs = query({
  args: {
    status: v.optional(
      v.union(
        v.literal('pending'),
        v.literal('running'),
        v.literal('completed'),
        v.literal('failed')
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const status = args.status;
    const limit = args.limit ?? 50;
    const results = status
      ? await ctx.db
          .query('scrapeJobs')
          .withIndex('by_status', (q) => q.eq('status', status))
          .order('desc')
          .take(limit)
      : await ctx.db.query('scrapeJobs').order('desc').take(limit);
    return results;
  },
});

// ============ AUTO BUILD PIPELINE (daily cron) ============
//
// Fetches the most-picked Yuumi support build from OP.GG's champion API,
// resolves names/icons via Data Dragon, stores a compact JSON blob in
// guideMetadata under AUTO_BUILD_METADATA_KEY, and overlays the scraped
// runes/core/boots/skill order onto the recommended guideBuilds row so the DB
// is the source of truth the site reads. The metadata blob still feeds share
// embeds / OG images and the "Live" label.
// Keep-last-good: on any fetch/parse failure nothing is overwritten.

const OPGG_URL =
  'https://lol-api-champion.op.gg/api/EUW/champions/ranked/yuumi/support';
const DDRAGON_BASE = 'https://ddragon.leagueoflegends.com';

// Stat shard IDs -> icon keys used by the guide UI.
const STAT_MOD_KEYS: Record<number, string> = {
  5001: 'HealthScaling',
  5002: 'Armor',
  5003: 'MagicRes',
  5005: 'AttackSpeed',
  5007: 'AbilityHaste',
  5008: 'AdaptiveForce',
  5010: 'MoveSpeed',
  5011: 'Health',
  5013: 'TenacitySlowResist',
};

type RuneInfo = { id: number; name: string; key: string; icon: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function numberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((n): n is number => typeof n === 'number')
    : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((s): s is string => typeof s === 'string')
    : [];
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'YuumiChallenges/1.0 (yuumi.quest)' },
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

/** Builds perk id -> {name,key,icon} from Data Dragon runesReforged. */
async function fetchRuneInfoMap(
  version: string
): Promise<Map<number, RuneInfo>> {
  const styles = await fetchJson(
    `${DDRAGON_BASE}/cdn/${version}/data/en_US/runesReforged.json`
  );
  const map = new Map<number, RuneInfo>();
  if (!Array.isArray(styles)) return map;
  for (const style of styles) {
    if (!isRecord(style) || !Array.isArray(style.slots)) continue;
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
          map.set(rune.id, {
            id: rune.id,
            name: rune.name,
            key: rune.key,
            icon: rune.icon,
          });
        }
      }
    }
  }
  return map;
}

/** Builds item id -> name from Data Dragon item.json. */
async function fetchItemNameMap(version: string): Promise<Map<number, string>> {
  const payload = await fetchJson(
    `${DDRAGON_BASE}/cdn/${version}/data/en_US/item.json`
  );
  const map = new Map<number, string>();
  if (!isRecord(payload) || !isRecord(payload.data)) return map;
  for (const [id, item] of Object.entries(payload.data)) {
    if (isRecord(item) && typeof item.name === 'string') {
      map.set(Number(id), item.name);
    }
  }
  return map;
}

export const recordAutoBuild = internalMutation({
  args: {
    success: v.boolean(),
    error: v.optional(v.string()),
    json: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.insert('scrapeJobs', {
      source: 'opgg-auto',
      status: args.success ? 'completed' : 'failed',
      completedAt: now,
      ...(args.error ? { error: args.error } : {}),
      ...(args.success ? { recordsScraped: 1 } : {}),
    });

    if (!args.success || !args.json) return { success: true };

    // 1) Store the raw blob — share embeds, OG images, and the "Live" label
    //    read this metadata record.
    const existing = await ctx.db
      .query('guideMetadata')
      .withIndex('by_key', (q) => q.eq('key', AUTO_BUILD_METADATA_KEY))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value: args.json, updatedAt: now });
    } else {
      await ctx.db.insert('guideMetadata', {
        key: AUTO_BUILD_METADATA_KEY,
        value: args.json,
        updatedAt: now,
      });
    }

    // 2) Make the recommended guideBuilds row the source of truth: overlay the
    //    scraped runes/core/boots/skill order onto it (starter/situational stay
    //    curated). Skipped when the blob is invalid or no recommended row exists.
    const autoBuild = parseAutoBuild(args.json);
    if (autoBuild) {
      const rows = await ctx.db.query('guideBuilds').collect();
      const recommended =
        rows.find((b) => b.isRecommended && b.isActive) ??
        rows.find((b) => b.isRecommended);
      if (recommended) {
        const applied = applyAutoBuildToFields(
          {
            runes: recommended.runes,
            items: recommended.items,
            skillOrder: recommended.skillOrder,
          },
          autoBuild
        );
        await ctx.db.patch(recommended._id, {
          runes: applied.runes,
          items: applied.items,
          skillOrder: applied.skillOrder,
          updatedAt: now,
        });
      }
    }

    return { success: true };
  },
});

export const autoUpdateBuild = internalAction({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; error?: string }> => {
    try {
      // 1. Sources
      const versions = await fetchJson(`${DDRAGON_BASE}/api/versions.json`);
      const version =
        Array.isArray(versions) && typeof versions[0] === 'string'
          ? versions[0]
          : null;
      if (!version) throw new Error('No Data Dragon version available');

      const opgg = await fetchJson(OPGG_URL);
      if (!isRecord(opgg) || !isRecord(opgg.data)) {
        throw new Error('Unexpected OP.GG payload shape');
      }
      const data = opgg.data;
      const meta = isRecord(opgg.meta) ? opgg.meta : {};

      const [runeInfo, itemNames] = await Promise.all([
        fetchRuneInfoMap(version),
        fetchItemNameMap(version),
      ]);

      // 2. Runes (most-picked page)
      const runeRow = Array.isArray(data.runes) ? data.runes[0] : null;
      if (!isRecord(runeRow)) throw new Error('OP.GG runes missing');
      const primaryIds = numberArray(runeRow.primary_rune_ids);
      const secondaryIds = numberArray(runeRow.secondary_rune_ids);
      const shardIds = numberArray(runeRow.stat_mod_ids);
      const runePage = Array.isArray(data.rune_pages)
        ? data.rune_pages[0]
        : null;
      const primaryStyleId =
        (isRecord(runeRow) && typeof runeRow.primary_page_id === 'number'
          ? runeRow.primary_page_id
          : null) ??
        (isRecord(runePage) && typeof runePage.primary_page_id === 'number'
          ? runePage.primary_page_id
          : null);
      const secondaryStyleId =
        (isRecord(runeRow) && typeof runeRow.secondary_page_id === 'number'
          ? runeRow.secondary_page_id
          : null) ??
        (isRecord(runePage) && typeof runePage.secondary_page_id === 'number'
          ? runePage.secondary_page_id
          : null);

      const resolveRunes = (ids: number[]): RuneInfo[] =>
        ids.flatMap((id) => {
          const info = runeInfo.get(id);
          return info ? [info] : [];
        });

      const primary = resolveRunes(primaryIds);
      const secondary = resolveRunes(secondaryIds);
      const keystone = primary[0];

      // 3. Items
      const coreRow = Array.isArray(data.core_items)
        ? data.core_items[0]
        : null;
      const coreIds = isRecord(coreRow) ? numberArray(coreRow.ids) : [];
      const bootsRow = Array.isArray(data.boots) ? data.boots[0] : null;
      const bootsId = isRecord(bootsRow)
        ? (numberArray(bootsRow.ids)[0] ?? null)
        : null;

      const coreItems = coreIds.flatMap((id) => {
        const name = itemNames.get(id);
        return name ? [{ id, name }] : [];
      });

      // 4. Skills
      const masteryRow = Array.isArray(data.skill_masteries)
        ? data.skill_masteries[0]
        : null;
      const skillPriority = isRecord(masteryRow)
        ? stringArray(masteryRow.ids)
        : [];
      const skillsRow = Array.isArray(data.skills) ? data.skills[0] : null;
      const skillOrder = isRecord(skillsRow)
        ? stringArray(skillsRow.order)
        : [];

      // 5. Validate before overwriting anything (keep-last-good)
      if (!keystone) throw new Error('Keystone could not be resolved');
      if (primary.length < 4) throw new Error('Primary runes incomplete');
      if (secondary.length < 2) throw new Error('Secondary runes incomplete');
      if (coreItems.length < 2) throw new Error('Core items incomplete');
      if (skillPriority.length !== 3) {
        throw new Error('Skill priority incomplete');
      }

      const patch =
        typeof meta.version === 'string'
          ? meta.version
          : version.split('.').slice(0, 2).join('.');

      const autoBuild = {
        version: 1,
        patch,
        updatedAt: Date.now(),
        source: 'OP.GG · Ranked · EUW',
        runes: {
          primaryStyleId,
          secondaryStyleId,
          keystone,
          primary: primary.slice(1),
          secondary,
          shardKeys: shardIds.flatMap((id) => {
            const key = STAT_MOD_KEYS[id];
            return key ? [key] : [];
          }),
        },
        coreItems,
        boots:
          bootsId && itemNames.get(bootsId)
            ? { id: bootsId, name: itemNames.get(bootsId)! }
            : null,
        skillPriority,
        skillOrder: skillOrder.length === 18 ? skillOrder : null,
      };

      await ctx.runMutation(internal.scraper.recordAutoBuild, {
        success: true,
        json: JSON.stringify(autoBuild),
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
