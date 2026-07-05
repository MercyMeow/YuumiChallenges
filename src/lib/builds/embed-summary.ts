// Single source of truth for share embeds (OpenGraph/Discord).
// Derives everything from the guide build data — or, when available, the
// auto-scraped build from Convex — so embeds never go stale.

import { BEST_ITEMS, BEST_RUNES } from './yuumi';
import type { AutoBuild } from './auto-build';

export const SKILL_ORDER = ['Q', 'E', 'W'] as const;

// Derives the Data Dragon icon path from a rune's tree + key. Riot's
// convention (perk-images/Styles/{Tree}/{Key}/{Key}.png) holds for every
// rune the static build uses; the auto build carries exact paths anyway.
function runeIconPath(tree: string, key: string): string {
  return `perk-images/Styles/${tree}/${key}/${key}.png`;
}

export interface EmbedRune {
  name: string;
  /** Data Dragon icon path relative to /cdn/img/ (null if unknown). */
  icon: string | null;
}

export function getEmbedRunes(auto?: AutoBuild | null): EmbedRune[] {
  if (auto) {
    return [
      auto.runes.keystone,
      ...auto.runes.primary,
      ...auto.runes.secondary,
    ].map((rune) => ({ name: rune.name, icon: rune.icon }));
  }
  const { primary, secondary } = BEST_RUNES;
  return [
    {
      name: primary.keystone.name,
      key: primary.keystone.key,
      tree: primary.tree,
    },
    ...primary.slots.map((slot) => ({ ...slot, tree: primary.tree })),
    ...secondary.slots.map((slot) => ({ ...slot, tree: secondary.tree })),
  ].map((rune) => ({
    name: rune.name,
    icon: runeIconPath(rune.tree, rune.key),
  }));
}

export function getCoreItems(
  auto?: AutoBuild | null
): { id: number; name: string }[] {
  if (auto) return auto.coreItems;
  return BEST_ITEMS.core.map((item) => ({ id: item.id, name: item.name }));
}

export function getSkillPriority(auto?: AutoBuild | null): readonly string[] {
  return auto?.skillPriority ?? SKILL_ORDER;
}

/** One-line share description for og:description / twitter:description. */
export function buildShareDescription(
  patch: string,
  auto?: AutoBuild | null
): string {
  const runes = getEmbedRunes(auto)
    .map((rune) => rune.name)
    .join(', ');
  const core = getCoreItems(auto)
    .map((item) => item.name)
    .join(' → ');
  const skills = getSkillPriority(auto).join(' > ');
  const freshness = auto ? ' · auto-updated' : '';
  return `Patch ${patch} Yuumi build · Runes: ${runes} · Core: ${core} · Skills: ${skills}${freshness}`;
}

/** Markdown block for the Discord bot embed payload. */
export function buildDiscordBuildField(auto?: AutoBuild | null): string {
  return [
    `**Runes:** ${getEmbedRunes(auto)
      .map((rune) => rune.name)
      .join(', ')}`,
    `**Core:** ${getCoreItems(auto)
      .map((item) => item.name)
      .join(' → ')}`,
    `**Skills:** ${getSkillPriority(auto).join(' > ')}`,
  ].join('\n');
}
