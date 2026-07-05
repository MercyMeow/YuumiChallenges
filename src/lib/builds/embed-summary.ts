// Single source of truth for share embeds (OpenGraph/Discord).
// Derives everything from the guide build data — or, when available, the
// auto-scraped build from Convex — so embeds never go stale.

import { BEST_ITEMS, BEST_RUNES } from './yuumi';
import type { AutoBuild } from './auto-build';

export const SKILL_ORDER = ['Q', 'E', 'W'] as const;

// Data Dragon rune icon paths (stable across patches), keyed by rune name.
// Base URL: https://ddragon.leagueoflegends.com/cdn/img/
// Used as fallback when no auto build (which carries its own icon paths).
export const RUNE_ICON_PATHS: Record<string, string> = {
  'Summon Aery': 'perk-images/Styles/Sorcery/SummonAery/SummonAery.png',
  'Manaflow Band': 'perk-images/Styles/Sorcery/ManaflowBand/ManaflowBand.png',
  Transcendence: 'perk-images/Styles/Sorcery/Transcendence/Transcendence.png',
  Scorch: 'perk-images/Styles/Sorcery/Scorch/Scorch.png',
  'Font of Life': 'perk-images/Styles/Resolve/FontOfLife/FontOfLife.png',
  Revitalize: 'perk-images/Styles/Resolve/Revitalize/Revitalize.png',
};

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
  const names = [
    BEST_RUNES.primary.keystone.name,
    ...BEST_RUNES.primary.slots.map((slot) => slot.name),
    ...BEST_RUNES.secondary.slots.map((slot) => slot.name),
  ];
  return names.map((name) => ({ name, icon: RUNE_ICON_PATHS[name] ?? null }));
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
