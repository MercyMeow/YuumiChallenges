import type { RunePage } from './types';

export const yuumiRunePages: RunePage[] = [
  {
    name: 'Aery + Resolve (Standard)',
    patch: '16.13',
    primary: {
      tree: 'Sorcery',
      keystone: 'Summon Aery',
      primaries: ['Manaflow Band', 'Transcendence', 'Scorch'],
    },
    secondary: {
      tree: 'Resolve',
      runes: ['Bone Plating', 'Revitalize'],
    },
    shards: {
      offense: 'Ability Haste',
      flex: 'Adaptive Force',
      defense: 'Health',
    },
    notes:
      'Default high-pick page; Scorch for lane pressure, Bone Plating vs burst, Revitalize amplifies heals/shields.',
    sources: [
      'https://lolalytics.com/lol/yuumi/build/',
      'https://lolalytics.com/lol/yuumi/build/?tier=1trick',
    ],
  },
  {
    name: 'Aery + Resolve (Sustain)',
    patch: '16.13',
    primary: {
      tree: 'Sorcery',
      keystone: 'Summon Aery',
      primaries: ['Manaflow Band', 'Transcendence', 'Scorch'],
    },
    secondary: {
      tree: 'Resolve',
      runes: ['Second Wind', 'Revitalize'],
    },
    shards: {
      offense: 'Ability Haste',
      flex: 'Adaptive Force',
      defense: 'Health',
    },
    notes: 'Swap Bone Plating for Second Wind against sustained poke lanes.',
  },
  {
    name: 'Aery + Inspiration (Utility)',
    patch: '16.13',
    primary: {
      tree: 'Sorcery',
      keystone: 'Summon Aery',
      primaries: ['Manaflow Band', 'Transcendence', 'Scorch'],
    },
    secondary: {
      tree: 'Inspiration',
      runes: ['Biscuit Delivery', 'Cosmic Insight'],
    },
    shards: {
      offense: 'Ability Haste',
      flex: 'Adaptive Force',
      defense: 'Health',
    },
    notes: 'Biscuit + Cosmic for mana and summoner spell haste utility.',
  },
  {
    name: 'Guardian + Sorcery (Peel)',
    patch: '16.13',
    primary: {
      tree: 'Resolve',
      keystone: 'Guardian',
      primaries: ['Font of Life', 'Bone Plating', 'Revitalize'],
    },
    secondary: {
      tree: 'Sorcery',
      runes: ['Manaflow Band', 'Transcendence'],
    },
    shards: {
      offense: 'Ability Haste',
      flex: 'Adaptive Force',
      defense: 'Health',
    },
    notes: 'Take Guardian into dive/burst comps to further protect your host.',
  },
  {
    name: 'Aery + Domination (Niche CDR/Ult)',
    patch: '16.13',
    primary: {
      tree: 'Sorcery',
      keystone: 'Summon Aery',
      primaries: ['Manaflow Band', 'Transcendence', 'Scorch'],
    },
    secondary: {
      tree: 'Domination',
      runes: ['Taste of Blood', 'Ultimate Hunter'],
    },
    shards: {
      offense: 'Ability Haste',
      flex: 'Adaptive Force',
      defense: 'Health',
    },
    notes:
      'Less common; Ultimate Hunter for more frequent R windows if your comp relies on it.',
  },
];

export default yuumiRunePages;
