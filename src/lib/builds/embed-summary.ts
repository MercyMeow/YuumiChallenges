// Single source of truth for share embeds (OpenGraph/Discord).
// Derives everything from the guide build data so embeds never go stale
// when the recommended build changes.

import { BEST_ITEMS, BEST_RUNES } from './yuumi';

export const SKILL_ORDER = ['Q', 'E', 'W'] as const;

// Data Dragon rune icon paths (stable across patches), keyed by rune name.
// Base URL: https://ddragon.leagueoflegends.com/cdn/img/
export const RUNE_ICON_PATHS: Record<string, string> = {
  'Summon Aery': 'perk-images/Styles/Sorcery/SummonAery/SummonAery.png',
  'Manaflow Band': 'perk-images/Styles/Sorcery/ManaflowBand/ManaflowBand.png',
  Transcendence: 'perk-images/Styles/Sorcery/Transcendence/Transcendence.png',
  Scorch: 'perk-images/Styles/Sorcery/Scorch/Scorch.png',
  'Font of Life': 'perk-images/Styles/Resolve/FontOfLife/FontOfLife.png',
  Revitalize: 'perk-images/Styles/Resolve/Revitalize/Revitalize.png',
};

export function getPrimaryRuneNames(): string[] {
  return [
    BEST_RUNES.primary.keystone.name,
    ...BEST_RUNES.primary.slots.map((slot) => slot.name),
  ];
}

export function getSecondaryRuneNames(): string[] {
  return BEST_RUNES.secondary.slots.map((slot) => slot.name);
}

export function getCoreItems(): { id: number; name: string }[] {
  return BEST_ITEMS.core.map((item) => ({ id: item.id, name: item.name }));
}

/** One-line share description for og:description / twitter:description. */
export function buildShareDescription(patch: string): string {
  const runes = `${getPrimaryRuneNames().join(', ')} + ${getSecondaryRuneNames().join(', ')}`;
  const core = getCoreItems()
    .map((item) => item.name)
    .join(' → ');
  return `Patch ${patch} Yuumi build · Runes: ${runes} · Core: ${core} · Skills: ${SKILL_ORDER.join(' > ')}`;
}

/** Markdown block for the Discord bot embed payload. */
export function buildDiscordBuildField(): string {
  return [
    `**Runes:** ${getPrimaryRuneNames().join(', ')} + ${getSecondaryRuneNames().join(', ')}`,
    `**Core:** ${getCoreItems()
      .map((item) => item.name)
      .join(' → ')}`,
    `**Skills:** ${SKILL_ORDER.join(' > ')}`,
  ].join('\n');
}
