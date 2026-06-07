/**
 * CORRECTED Rune Variables Mapping
 * Based on actual Riot API data, League Wiki, and community-verified sources
 *
 * IMPORTANT: var values represent RAW NUMBERS from game stats
 * - Damage/Healing values are actual HP amounts
 * - Times are in SECONDS (not milliseconds)
 * - Stacks/counts are integers
 * - Some runes don't use all 3 vars
 *
 * Sources:
 * - Riot Games Match-V5 API
 * - League of Legends Wiki (fandom.com)
 * - Community Dragon data mining
 * - In-game testing and verification
 */

import { recordUnknownRuneVar } from './rune-variable-instrumentation';

export interface RuneVarInfo {
  var1?: {
    label: string;
    format:
      | 'damage'
      | 'healing'
      | 'gold'
      | 'shielding'
      | 'time'
      | 'percent'
      | 'count'
      | 'value'
      | 'cdr';
    description: string;
  };
  var2?: {
    label: string;
    format:
      | 'damage'
      | 'healing'
      | 'gold'
      | 'shielding'
      | 'time'
      | 'percent'
      | 'count'
      | 'value'
      | 'cdr';
    description: string;
  };
  var3?: {
    label: string;
    format:
      | 'damage'
      | 'healing'
      | 'gold'
      | 'shielding'
      | 'time'
      | 'percent'
      | 'count'
      | 'value'
      | 'cdr';
    description: string;
  };
}

export const RUNE_VARIABLES: Record<number, RuneVarInfo> = {
  // ============================================
  // PRECISION TREE (8000)
  // ============================================

  // Keystones
  8005: {
    // Press the Attack
    var1: {
      label: 'Total Damage',
      format: 'damage',
      description: 'Total damage dealt to exposed enemies',
    },
    var2: {
      label: 'Bonus Damage',
      format: 'damage',
      description: 'Additional damage applied from the expose debuff',
    },
  },
  8008: {
    // Lethal Tempo
    var1: {
      label: 'Max Attack Speed Uptime',
      format: 'time',
      description: 'Total time at maximum attack speed bonus (seconds)',
    },
    var2: {
      label: 'Damage Dealt',
      format: 'damage',
      description: 'Damage dealt while empowered by Lethal Tempo',
    },
  },
  8021: {
    // Fleet Footwork
    var1: {
      label: 'Total Healing',
      format: 'healing',
      description: 'Total healing from procs',
    },
  },
  8010: {
    // Conqueror
    var1: {
      label: 'Total Healing',
      format: 'healing',
      description: 'Total healing granted by Conqueror',
    },
  },

  // Slot 1
  9101: {
    // Absorb Life
    var1: {
      label: 'Total Healing',
      format: 'healing',
      description: 'Healing provided when shields expire',
    },
  },
  9111: {
    // Triumph
    var1: {
      label: 'Total Health Restored',
      format: 'healing',
      description: 'Health restored on takedowns',
    },
    var2: {
      label: 'Total Bonus Gold Granted',
      format: 'gold',
      description: 'Bonus gold earned from takedowns',
    },
  },
  8009: {
    // Presence of Mind
    var1: {
      label: 'Resource Restored',
      format: 'value',
      description: 'Total mana or energy restored from takedowns and damage',
    },
  },

  // Slot 2
  9104: {
    // Legend: Alacrity
    var1: {
      label: 'Time Completed',
      format: 'time',
      description: 'Game time when full stacks were completed (seconds)',
    },
  },
  9105: {
    // Legend: Tenacity
    var1: {
      label: 'Time Completed',
      format: 'time',
      description: 'Game time when full stacks were completed (seconds)',
    },
  },
  9103: {
    // Legend: Bloodline
    var1: {
      label: 'Time Completed',
      format: 'time',
      description: 'Game time when full stacks were completed (seconds)',
    },
  },

  // Slot 3
  8014: {
    // Coup de Grace
    var1: {
      label: 'Total Bonus Damage',
      format: 'damage',
      description: 'Bonus damage dealt to low health enemies',
    },
  },
  8017: {
    // Cut Down
    var1: {
      label: 'Total Bonus Damage',
      format: 'damage',
      description: 'Bonus damage dealt to higher max health targets',
    },
  },
  8299: {
    // Last Stand
    var1: {
      label: 'Total Bonus Damage',
      format: 'damage',
      description: 'Bonus damage dealt while at low health',
    },
  },

  // ============================================
  // DOMINATION TREE (8100)
  // ============================================

  // Keystones
  8112: {
    // Electrocute
    var1: {
      label: 'Total Damage Dealt',
      format: 'damage',
      description: 'Total damage dealt',
    },
  },
  8124: {
    // Predator
    var1: {
      label: 'Total Damage to Champions',
      format: 'damage',
      description: 'Damage during Predator',
    },
  },
  8128: {
    // Dark Harvest
    var1: {
      label: 'Total Damage Dealt',
      format: 'damage',
      description: 'Damage dealt by Dark Harvest procs',
    },
    var2: {
      label: 'Total Souls Harvested',
      format: 'count',
      description: 'Souls collected from unique takedowns',
    },
  },
  9923: {
    // Hail of Blades
    var1: {
      label: 'Attacks with Bonus Attack Speed',
      format: 'count',
      description: 'Attacks made while the rune was active',
    },
    var2: {
      label: 'Hit Rate',
      format: 'percent',
      description: 'Percentage of empowered attacks that landed',
    },
  },

  // Slot 1
  8126: {
    // Cheap Shot
    var1: {
      label: 'Total Damage',
      format: 'damage',
      description: 'Bonus true damage dealt',
    },
  },
  8139: {
    // Taste of Blood
    var1: {
      label: 'Total Healing',
      format: 'healing',
      description: 'Total healing from procs',
    },
  },
  8143: {
    // Sudden Impact
    var1: {
      label: 'Bonus Damage',
      format: 'damage',
      description: 'Bonus damage dealt while active',
    },
  },

  // Slot 2
  8136: {
    // Zombie Ward
    var1: {
      label: 'Wards Spawned',
      format: 'count',
      description: 'Zombie wards created',
    },
    var2: {
      label: 'Adaptive Force Gained',
      format: 'value',
      description: 'Adaptive force gained from takedowns',
    },
  },
  8120: {
    // Ghost Poro
    var1: {
      label: 'Enemies Spotted',
      format: 'count',
      description: 'Enemy champions revealed by Ghost Poro',
    },
    var3: {
      label: 'Ghost Poros Spawned',
      format: 'count',
      description: 'Total ghost poros spawned',
    },
  },
  8138: {
    // Eyeball Collection
    var1: {
      label: 'Total Bonus AD/AP',
      format: 'value',
      description: 'Adaptive force granted by collected eyeballs',
    },
  },

  // Slot 3
  8135: {
    // Treasure Hunter
    var1: {
      label: 'Gold Collected',
      format: 'gold',
      description: 'Bonus gold earned from unique takedowns',
    },
    var2: {
      label: 'Total Stacks',
      format: 'count',
      description: 'Unique takedowns achieved',
    },
  },
  8134: {
    // Ingenious Hunter
    var1: {
      label: 'Total Item Activations',
      format: 'count',
      description: 'Item and trinket activations while rune was active',
    },
    var2: {
      label: 'Total Stacks',
      format: 'count',
      description: 'Unique takedowns achieved',
    },
  },
  8105: {
    // Relentless Hunter
    var2: {
      label: 'Total Stacks',
      format: 'count',
      description: 'Unique takedowns achieved',
    },
  },
  8106: {
    // Ultimate Hunter
    var1: {
      label: 'Total Stacks',
      format: 'count',
      description: 'Unique takedowns achieved',
    },
    var2: {
      label: 'Ultimate Haste',
      format: 'cdr',
      description: 'Ultimate ability haste granted from stacks',
    },
  },

  // ============================================
  // SORCERY TREE (8200)
  // ============================================

  // Keystones
  8214: {
    // Summon Aery
    var1: {
      label: 'Damage Dealt',
      format: 'damage',
      description: 'Damage dealt by Aery',
    },
    var2: {
      label: 'Total Shielding',
      format: 'shielding',
      description: 'Shielding provided by Aery',
    },
  },
  8229: {
    // Arcane Comet
    var1: {
      label: 'Total Damage Dealt',
      format: 'damage',
      description: 'Damage dealt by Arcane Comet impacts',
    },
  },
  8230: {
    // Phase Rush
    var1: {
      label: 'Total Activations',
      format: 'count',
      description: 'Times Phase Rush was triggered',
    },
  },

  // Slot 1
  8224: {
    // Axiom Arcanist
    var1: {
      label: 'Ultimate Cooldown Reduced',
      format: 'cdr',
      description: 'Ultimate cooldown time refunded',
    },
    var2: {
      label: 'Bonus Ultimate Damage/Healing/Shielding To Champions',
      format: 'damage',
      description: 'Additional ultimate effectiveness granted',
    },
  },
  8226: {
    // Manaflow Band
    var1: {
      label: 'Total Bonus Mana',
      format: 'value',
      description: 'Permanent mana gained from procs',
    },
    var2: {
      label: 'Total Mana Restored',
      format: 'value',
      description: 'Mana restored from hitting enemies',
    },
  },
  8275: {
    // Nimbus Cloak
    var1: {
      label: 'Times Activated',
      format: 'count',
      description: 'Number of times Nimbus Cloak triggered',
    },
  },

  // Slot 2
  8210: {
    // Transcendence
    var1: {
      label: 'Seconds Refunded',
      format: 'time',
      description: 'Seconds of cooldown refunded on takedowns',
    },
  },
  8234: {
    // Celerity
    var1: {
      label: 'Extra Distance Travelled',
      format: 'value',
      description: 'Distance travelled with bonus movement speed',
    },
  },
  8233: {
    // Absolute Focus
    var1: {
      label: 'Total Time Active',
      format: 'time',
      description: 'Time spent above the health threshold for the bonus',
    },
  },

  // Slot 3
  8237: {
    // Scorch
    var1: {
      label: 'Total Bonus Damage',
      format: 'damage',
      description: 'Total damage dealt by Scorch burns',
    },
  },
  8232: {
    // Waterwalking
    var1: {
      label: 'Total Time Active',
      format: 'time',
      description: 'Time spent with Waterwalking bonus in the river',
    },
  },
  8236: {
    // Gathering Storm
    var1: {
      label: 'Total Bonus AD/AP',
      format: 'value',
      description: 'Adaptive force granted over the course of the game',
    },
  },

  // ============================================
  // RESOLVE TREE (8400)
  // ============================================

  // Keystones
  8437: {
    // Grasp of the Undying
    var1: {
      label: 'Total Damage',
      format: 'damage',
      description: 'Damage dealt by Grasp of the Undying',
    },
    var2: {
      label: 'Total Healing',
      format: 'healing',
      description: 'Healing granted by Grasp of the Undying',
    },
  },
  8439: {
    // Aftershock
    var1: {
      label: 'Total Damage Dealt',
      format: 'damage',
      description: 'Damage dealt during Aftershock burst',
    },
    var2: {
      label: 'Total Damage Mitigated',
      format: 'damage',
      description: 'Damage prevented while the rune was active',
    },
  },
  8465: {
    // Guardian
    var1: {
      label: 'Total Shield Strength',
      format: 'shielding',
      description: 'Shielding provided by Guardian procs',
    },
  },

  // Slot 1
  8446: {
    // Demolish
    var1: {
      label: 'Total Bonus Damage',
      format: 'damage',
      description: 'Bonus structure damage',
    },
  },
  8463: {
    // Font of Life
    var1: {
      label: 'Total Ally Healing',
      format: 'healing',
      description: 'Healing provided to allies',
    },
  },
  8401: {
    // Shield Bash
    var1: {
      label: 'Total Damage',
      format: 'damage',
      description: 'Bonus damage from shields',
    },
  },

  // Slot 2
  8429: {
    // Conditioning
    var1: {
      label: 'Percent of Game Active',
      format: 'percent',
      description: 'Percentage of the match with Conditioning active',
    },
    var2: {
      label: 'Total Bonus Armor',
      format: 'value',
      description: 'Bonus armor granted by Conditioning',
    },
    var3: {
      label: 'Total Bonus Magic Resist',
      format: 'value',
      description: 'Bonus magic resist granted by Conditioning',
    },
  },
  8444: {
    // Second Wind
    var1: {
      label: 'Total Healing',
      format: 'healing',
      description: 'Total healing from procs',
    },
  },
  8473: {
    // Bone Plating
    var1: {
      label: 'Total Damage Blocked',
      format: 'damage',
      description: 'Damage prevented by Bone Plating',
    },
  },

  // Slot 3
  8451: {
    // Overgrowth
    var1: {
      label: 'Total Bonus Max Health',
      format: 'value',
      description: 'Permanent max health gained from Overgrowth',
    },
  },
  8453: {
    // Revitalize
    var1: {
      label: 'Bonus Healing',
      format: 'healing',
      description: 'Additional healing granted to allies',
    },
    var2: {
      label: 'Bonus Shielding',
      format: 'shielding',
      description: 'Additional shielding granted to allies',
    },
  },
  8242: {
    // Unflinching
    var1: {
      label: 'Total Bonus Damage',
      format: 'time',
      description: 'Time spent benefiting from additional resistances',
    },
  },

  // ============================================
  // INSPIRATION TREE (8300)
  // ============================================

  // Keystones
  8351: {
    // Glacial Augment
    var1: {
      label: 'Duration Enemy Champs Slowed',
      format: 'time',
      description: 'Total time enemies were slowed by Glacial zones',
    },
    var2: {
      label: 'Damage Reduced',
      format: 'damage',
      description: 'Damage prevented by slowing zones',
    },
  },
  8360: {
    // Unsealed Spellbook
    var1: {
      label: 'Summoner Spells Swapped',
      format: 'count',
      description: 'Number of summoner spell swaps performed',
    },
  },
  8369: {
    // First Strike
    var1: {
      label: 'Damage Dealt',
      format: 'damage',
      description: 'Damage dealt while First Strike was active',
    },
    var2: {
      label: 'Gold Gained',
      format: 'gold',
      description: 'Bonus gold earned from First Strike',
    },
  },

  // Slot 1
  8306: {
    // Hextech Flashtraption
    var1: {
      label: 'Times Hexflashed',
      format: 'count',
      description: 'Number of Hexflash casts',
    },
  },
  8304: {
    // Magical Footwear
    var1: {
      label: 'Boots Arrival Time',
      format: 'time',
      description: 'Game time when the free boots arrived (seconds)',
    },
  },
  8313: {
    // Triple Tonic
    var1: {
      label: 'Items Gained',
      format: 'count',
      description: 'Total consumable items received',
    },
  },

  // Slot 2
  8321: {
    // Cash Back
    var1: {
      label: 'Gold Gained',
      format: 'gold',
      description: 'Total gold refunded from the rune effect',
    },
  },
  8316: {
    // Jack Of All Trades
    var1: {
      label: 'Bonus Stats Gained',
      format: 'value',
      description: 'Total permanent stats granted',
    },
  },
  8345: {
    // Biscuit Delivery
    var1: {
      label: 'Biscuits Received',
      format: 'count',
      description: 'Total biscuits granted',
    },
    var3: {
      label: 'Total Healing',
      format: 'healing',
      description: 'Instant healing provided by biscuits',
    },
  },

  // Slot 3
  8347: {
    // Cosmic Insight
    // No end-of-game vars reported by the API
  },
  8410: {
    // Approach Velocity
    var1: {
      label: 'Time Spent Hasted',
      format: 'time',
      description: 'Total time benefited from bonus movement speed',
    },
  },
  8352: {
    // Time Warp Tonic
    var2: {
      label: 'Instant Health Restored',
      format: 'healing',
      description: 'Immediate healing gained from consuming tonics',
    },
  },
};

/**
 * Format a rune variable value based on its type
 */
export function formatRuneVarValue(
  value: number,
  format:
    | 'damage'
    | 'healing'
    | 'gold'
    | 'shielding'
    | 'time'
    | 'percent'
    | 'count'
    | 'value'
    | 'cdr'
): string {
  if (!value || value === 0) return '0';

  switch (format) {
    case 'damage':
    case 'healing':
    case 'shielding':
      // Large numbers in thousands
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
      }
      return value.toFixed(0);

    case 'gold':
      return `${value.toFixed(0)}g`;

    case 'time':
    case 'cdr':
      // Seconds
      return `${value.toFixed(0)}s`;

    case 'percent':
      // Percentage - API often gives raw values
      return `${value.toFixed(1)}%`;

    case 'count':
    case 'value':
      // Whole numbers
      return value.toFixed(0);

    default:
      return value.toFixed(0);
  }
}

/**
 * Get formatted rune variable information
 */
export function getRuneVarInfo(
  runeId: number,
  varName: 'var1' | 'var2' | 'var3',
  value: number
): string | null {
  const runeInfo = RUNE_VARIABLES[runeId];
  if (!runeInfo || !runeInfo[varName] || value <= 0) {
    // Instrument unknown rune or unmapped var for future analysis
    if (!runeInfo) {
      recordUnknownRuneVar({ runeId, var: varName, value });
    }
    return null;
  }

  const varInfo = runeInfo[varName]!;
  const formattedValue = formatRuneVarValue(value, varInfo.format);

  return `${formattedValue} ${varInfo.label}`;
}

/**
 * Get all (known) rune variable metrics for a rune as an ordered array.
 * Order: var1, var2, var3 (only those with a mapping AND positive value).
 * When debug flag NEXT_PUBLIC_RUNE_DEBUG === '1', also include any unmapped
 * non-zero var values as Raw VarX entries (so we can visually inspect in UI).
 */
export function getAllRuneVarInfos(
  runeId: number,
  vars: { var1: number; var2: number; var3: number },
  options?: { includeRawUnknown?: boolean }
): Array<{
  label: string;
  value: number;
  formatted: string;
  varKey: 'var1' | 'var2' | 'var3';
  known: boolean;
}> {
  const runeInfo = RUNE_VARIABLES[runeId];
  const result: Array<{
    label: string;
    value: number;
    formatted: string;
    varKey: 'var1' | 'var2' | 'var3';
    known: boolean;
  }> = [];
  const debug = process.env.NEXT_PUBLIC_RUNE_DEBUG === '1';
  const wantRaw = options?.includeRawUnknown ?? debug;

  (['var1', 'var2', 'var3'] as const).forEach((varKey) => {
    const rawVal = vars[varKey];
    if (!rawVal || rawVal <= 0) return;

    if (runeInfo && runeInfo[varKey]) {
      const info = runeInfo[varKey]!;
      result.push({
        label: info.label,
        value: rawVal,
        formatted: `${formatRuneVarValue(rawVal, info.format)} ${info.label}`,
        varKey,
        known: true,
      });
    } else if (wantRaw) {
      // Provide a raw entry for visibility (instrumentation already handles logging)
      result.push({
        label: `Raw ${varKey.toUpperCase()}`,
        value: rawVal,
        formatted: `${rawVal} (Raw ${varKey})`,
        varKey,
        known: false,
      });
    }
  });

  return result;
}
