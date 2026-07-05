// Default Yuumi guide builds — the single source of truth shared by the
// home page (static fallback) and convex/seed.ts (database seeding).
// Pure data: no React, safe to bundle into Convex functions.

import { BEST_ITEMS } from './yuumi';

export interface DefaultBuild {
  id: string;
  name: string;
  description: string;
  /** Icon identifier resolved by the UI ('star' | 'shield' | 'zap'). */
  icon: string;
  isRecommended?: boolean;
  runes: {
    name: string;
    primaryTree: string;
    keystone: string;
    primary: string[];
    secondaryTree: string;
    secondary: string[];
    shards: string[];
  };
  items: {
    starter: ReadonlyArray<{ id: number; name: string; reason: string }>;
    core: ReadonlyArray<{ id: number; name: string; reason: string }>;
    situational: ReadonlyArray<{ id: number; name: string; reason: string }>;
  };
  skillOrder: {
    priority: string;
    levels: string[];
    notes: string;
  };
}

export const DEFAULT_BUILDS: DefaultBuild[] = [
  {
    id: 'standard-aery',
    name: 'Standard Aery',
    description:
      'The most consistent build for general use. Great poke and sustain.',
    icon: 'star',
    isRecommended: true,
    runes: {
      name: 'Summon Aery',
      primaryTree: 'Sorcery',
      keystone: 'SummonAery',
      primary: ['ManaflowBand', 'Transcendence', 'Scorch'],
      secondaryTree: 'Resolve',
      secondary: ['FontOfLife', 'Revitalize'],
      shards: ['AbilityHaste', 'AdaptiveForce', 'HealthScaling'],
    },
    items: BEST_ITEMS,
    skillOrder: {
      priority: 'Q > E > W',
      levels: [
        'Q',
        'E',
        'Q',
        'E',
        'Q',
        'R',
        'Q',
        'E',
        'Q',
        'E',
        'R',
        'E',
        'W',
        'W',
        'W',
        'R',
        'W',
        'W',
      ],
      notes:
        'Max Q first for poke; E second for shields and mana restore. Take W after E is maxed (patch 16.13 standard).',
    },
  },
  {
    id: 'guardian-sustain',
    name: 'Guardian Sustain',
    description:
      'Defensive build for hard engage lanes. Prioritizes survival and shields.',
    icon: 'shield',
    runes: {
      name: 'Guardian',
      primaryTree: 'Resolve',
      keystone: 'Guardian',
      primary: ['FontOfLife', 'BonePlating', 'Revitalize'],
      secondaryTree: 'Sorcery',
      secondary: ['ManaflowBand', 'Transcendence'],
      shards: ['AdaptiveForce', 'Armor', 'HealthScaling'],
    },
    items: {
      starter: BEST_ITEMS.starter,
      core: [
        {
          id: 6617,
          name: 'Moonstone Renewer',
          reason: 'Chains heals/shields across the team in extended fights',
        },
        {
          id: 3107,
          name: 'Redemption',
          reason: 'Team-wide AoE healing and map impact from range',
        },
        {
          id: 3222,
          name: "Mikael's Blessing",
          reason: 'Cleanse the hard CC that threatens your host',
        },
      ],
      situational: BEST_ITEMS.situational,
    },
    skillOrder: {
      priority: 'R > E > Q > W',
      levels: [
        'E',
        'Q',
        'E',
        'W',
        'E',
        'R',
        'E',
        'Q',
        'E',
        'Q',
        'R',
        'Q',
        'Q',
        'W',
        'W',
        'R',
        'W',
        'W',
      ],
      notes:
        'Max E first for stronger shields and heals. Take Q second for some poke. Defensive playstyle.',
    },
  },
  {
    id: 'aggressive-comet',
    name: 'Aggressive Comet',
    description:
      'High damage build for lanes where you can poke freely. Snowball potential.',
    icon: 'zap',
    runes: {
      name: 'Arcane Comet',
      primaryTree: 'Sorcery',
      keystone: 'ArcaneComet',
      primary: ['ManaflowBand', 'AbsoluteFocus', 'Scorch'],
      secondaryTree: 'Domination',
      secondary: ['CheapShot', 'UltimateHunter'],
      shards: ['AdaptiveForce', 'AdaptiveForce', 'Armor'],
    },
    items: {
      starter: BEST_ITEMS.starter,
      core: [
        { id: 6655, name: "Luden's Companion", reason: 'Burst damage on poke' },
        {
          id: 3089,
          name: "Rabadon's Deathcap",
          reason: 'Maximize AP for healing and damage',
        },
        { id: 3135, name: 'Void Staff', reason: 'Magic penetration for tanks' },
      ],
      situational: [
        { id: 3165, name: 'Morellonomicon', reason: 'Anti-heal when needed' },
        {
          id: 3157,
          name: "Zhonya's Hourglass",
          reason: 'Survive burst when detached',
        },
        { id: 3102, name: "Banshee's Veil", reason: 'Block key CC abilities' },
      ],
    },
    skillOrder: {
      priority: 'R > Q > E > W',
      levels: [
        'Q',
        'E',
        'Q',
        'W',
        'Q',
        'R',
        'Q',
        'Q',
        'E',
        'E',
        'R',
        'E',
        'E',
        'W',
        'W',
        'R',
        'W',
        'W',
      ],
      notes:
        'Full Q max for maximum poke damage. Very aggressive playstyle - play around your Q cooldowns.',
    },
  },
];
