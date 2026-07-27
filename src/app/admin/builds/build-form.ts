// Shared types + constants for the builds editor form (page.tsx renders the
// list + dialog shell; build-form-tabs.tsx renders the tab panels).

import {
  ADMIN_BUILD_ICON_KEYS,
  type AdminBuildIcon,
} from '@/lib/admin/build-icons';

export type ItemCategory = 'starter' | 'core' | 'situational';

export interface BuildItem {
  id: number;
  name: string;
  reason: string;
}

export interface BuildFormData {
  id?: string;
  name: string;
  description: string;
  icon: AdminBuildIcon;
  color: string;
  borderColor: string;
  isRecommended: boolean;
  isActive: boolean;
  priority: string;
  runes: {
    name: string;
    primaryTree: string;
    keystone: string;
    primary: string[];
    secondaryTree: string;
    secondary: string[];
    shards: string[];
  };
  items: Record<ItemCategory, BuildItem[]>;
  skillOrder: {
    priority: string;
    levels: string[];
    notes: string;
  };
}

export interface NewItemState {
  category: ItemCategory;
  id: string;
  name: string;
  reason: string;
}

export const DEFAULT_SKILL_LEVELS = [
  'E',
  'W',
  'Q',
  'E',
  'E',
  'R',
  'E',
  'W',
  'E',
  'W',
  'R',
  'W',
  'W',
  'Q',
  'Q',
  'R',
  'Q',
  'Q',
];

export const RUNE_TREES = [
  'Sorcery',
  'Resolve',
  'Domination',
  'Precision',
  'Inspiration',
];

export const KEYSTONES: Record<string, string[]> = {
  Sorcery: ['SummonAery', 'ArcaneComet', 'PhaseRush'],
  Resolve: ['GraspOfTheUndying', 'Aftershock', 'Guardian'],
  Domination: ['Electrocute', 'Predator', 'DarkHarvest', 'HailOfBlades'],
  Precision: ['PressTheAttack', 'LethalTempo', 'FleetFootwork', 'Conqueror'],
  Inspiration: ['GlacialAugment', 'UnsealedSpellbook', 'FirstStrike'],
};

export const ICONS = ADMIN_BUILD_ICON_KEYS;

export const initialFormData: BuildFormData = {
  name: '',
  description: '',
  icon: 'star',
  color: 'bg-purple-500/20',
  borderColor: 'border-purple-500/50',
  isRecommended: false,
  isActive: true,
  priority: '0',
  runes: {
    name: 'New Rune Page',
    primaryTree: 'Sorcery',
    keystone: 'SummonAery',
    primary: ['ManaflowBand', 'Transcendence', 'Scorch'],
    secondaryTree: 'Resolve',
    secondary: ['FontOfLife', 'Revitalize'],
    shards: ['AdaptiveForce', 'AdaptiveForce', 'Health'],
  },
  items: {
    starter: [
      { id: 3850, name: "Spellthief's Edge", reason: 'Starting support item' },
    ],
    core: [],
    situational: [],
  },
  skillOrder: {
    priority: 'E > W > Q',
    levels: [...DEFAULT_SKILL_LEVELS],
    notes: '',
  },
};
