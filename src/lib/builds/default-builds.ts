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
];
