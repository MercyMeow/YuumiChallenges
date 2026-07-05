// Overlays the daily auto-scraped build (OP.GG via Convex) onto the
// recommended build. Pure and Convex-safe (no fetch deps): used by the home
// page's static fallback, by convex/seed.ts, and by convex/scraper.ts so the
// scraped runes/core/boots/skill order become the DB source of truth for the
// recommended build. Non-recommended builds pass through untouched, and each
// auto field falls back to the static value when absent.

import type { DefaultBuild } from './default-builds';
import { RUNE_STYLE_NAMES, type AutoBuild } from './auto-build-shared';

type BuildItem = { id: number; name: string; reason: string };

/** The build fields the auto build can override (mutable arrays for Convex writes). */
export type AutoBuildFields = {
  runes: DefaultBuild['runes'];
  items: { starter: BuildItem[]; core: BuildItem[]; situational: BuildItem[] };
  skillOrder: DefaultBuild['skillOrder'];
};

type BuildFieldsInput = Pick<DefaultBuild, 'runes' | 'items' | 'skillOrder'>;

/**
 * Overlays the auto build onto a single build's runes/items/skill order.
 * Scraped core items replace the curated core, with the most-picked boots
 * appended so they surface in the item path. Starter/situational stay curated.
 */
export function applyAutoBuildToFields(
  base: BuildFieldsInput,
  autoBuild: AutoBuild
): AutoBuildFields {
  const core: BuildItem[] = autoBuild.coreItems.map((item) => ({
    id: item.id,
    name: item.name,
    reason: `Most-picked core item (${autoBuild.source}).`,
  }));
  if (autoBuild.boots) {
    core.push({
      id: autoBuild.boots.id,
      name: autoBuild.boots.name,
      reason: `Most-picked boots (${autoBuild.source}).`,
    });
  }

  return {
    runes: {
      ...base.runes,
      name: autoBuild.runes.keystone.name,
      primaryTree:
        (autoBuild.runes.primaryStyleId !== null
          ? RUNE_STYLE_NAMES[autoBuild.runes.primaryStyleId]
          : undefined) ?? base.runes.primaryTree,
      keystone: autoBuild.runes.keystone.key,
      primary: autoBuild.runes.primary.map((rune) => rune.key),
      secondaryTree:
        (autoBuild.runes.secondaryStyleId !== null
          ? RUNE_STYLE_NAMES[autoBuild.runes.secondaryStyleId]
          : undefined) ?? base.runes.secondaryTree,
      secondary: autoBuild.runes.secondary.map((rune) => rune.key),
      shards:
        autoBuild.runes.shardKeys.length === 3
          ? [...autoBuild.runes.shardKeys]
          : [...base.runes.shards],
    },
    items: {
      starter: base.items.starter.map((item) => ({ ...item })),
      core,
      situational: base.items.situational.map((item) => ({ ...item })),
    },
    skillOrder: {
      ...base.skillOrder,
      priority: autoBuild.skillPriority.join(' > '),
      levels: autoBuild.skillOrder ?? [...base.skillOrder.levels],
    },
  };
}

/** Overlays the auto build onto the recommended build in a list; others pass through. */
export function applyAutoBuild(
  builds: DefaultBuild[],
  autoBuild: AutoBuild | null
): DefaultBuild[] {
  if (!autoBuild) return builds;
  return builds.map((build) =>
    build.isRecommended
      ? { ...build, ...applyAutoBuildToFields(build, autoBuild) }
      : build
  );
}
