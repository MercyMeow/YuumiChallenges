/**
 * Rune stat formatting utilities
 */

export interface RuneDetail {
  runeId: number;
  statType: string;
  value: number;
}

export type RuneDetailsByRuneId = Record<number, RuneDetail[]>;

const LABELS: Record<
  string,
  { label: string; unit?: string; percent?: boolean }
> = {
  adaptiveForce: { label: 'Adaptive Force' },
  abilityHaste: { label: 'Ability Haste' },
  cdr: { label: 'Ability Haste' },
  attackSpeed: { label: 'Attack Speed', percent: true },
  moveSpeed: { label: 'Move Speed', percent: true },
  tenacity: { label: 'Tenacity', percent: true },
  lifesteal: { label: 'Lifesteal', percent: true },
  omnivamp: { label: 'Omnivamp', percent: true },

  health: { label: 'Health' },
  hp: { label: 'Health' },
  armor: { label: 'Armor' },
  magicResist: { label: 'Magic Resist' },
  mr: { label: 'Magic Resist' },
  mana: { label: 'Mana' },

  damageDealt: { label: 'Damage Dealt' },
  damageToChampions: { label: 'Damage to Champions' },
  damageShielded: { label: 'Damage Shielded' },
  shielded: { label: 'Damage Shielded' },
  healed: { label: 'Healing' },

  // Fallbacks
  unknown: { label: 'Effect' },
};

function humanizeKey(key: string): string {
  if (!key) return 'Effect';
  if (LABELS[key]) return LABELS[key].label;
  // Fallback: split camelCase / words
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

export function formatRuneStat(statType: string, value: number): string {
  const meta = LABELS[statType] ?? LABELS['unknown'];
  const label = meta?.label ?? humanizeKey(statType);
  const v = Number(value) || 0;

  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  const abs = Math.abs(v);

  if (meta?.percent) {
    // Keep one decimal for small values, integer for typical percents
    const formatted =
      abs < 1
        ? abs.toFixed(2)
        : abs % 1 === 0
          ? abs.toFixed(0)
          : abs.toFixed(1);
    return `${sign}${formatted}% ${label}`;
  }

  // Plain numeric
  const formatted = abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(1);
  return `${sign}${formatted} ${label}`;
}

export function groupDetailsByRune(
  details: RuneDetail[] | undefined | null
): RuneDetailsByRuneId {
  const map: RuneDetailsByRuneId = {};
  if (!Array.isArray(details)) return map;
  for (const d of details) {
    if (typeof d?.runeId !== 'number') continue;
    if (!map[d.runeId]) {
      map[d.runeId] = [];
    }
    map[d.runeId]!.push(d);
  }
  return map;
}
