// Yuumi build data for patch 16.13
// Source emphasis: Lolalytics. Cross-checked with OP.GG, Mobalytics where applicable.
// Note: Item identifiers are provided as canonical names; map these to your app's item ID/icon system.

export type ChampionBuildData = {
  champion: 'Yuumi';
  patch: string;
  sources: string[];
  updatedAt: string; // ISO date
  starter: string[]; // support income path, early components
  core: string[]; // common first/second big purchases
  boots: string[]; // frequently purchased boots
  situational: string[]; // all situational items surfaced for Yuumi
  notes?: string[];
};

export const yuumiBuild: ChampionBuildData = {
  champion: 'Yuumi',
  patch: '16.13',
  sources: [
    'https://lolalytics.com/lol/yuumi/build/',
    'https://lolalytics.com/lol/yuumi/build/?tier=1trick',
  ],
  updatedAt: '2026-07-05T00:00:00.000Z',
  starter: [
    'World Atlas',
    'Runic Compass',
    'Bounty of Worlds',
    'Spellthief base (if applicable)',
  ],
  core: [
    'Dream Maker',
    'Moonstone Renewer',
    'Ardent Censer',
    "Mikael's Blessing",
  ],
  boots: ['Ionian Boots of Lucidity'],
  situational: [
    'Dawncore',
    'Staff of Flowing Water',
    'Imperial Mandate',
    'Redemption',
    "Shurelya's Battlesong",
    'Locket of the Iron Solari',
    "Knight's Vow",
    'Vigilant Wardstone',
    "Mejai's Soulstealer",
    'Echoes of Helia',
  ],
  notes: [
    'Rush support income; prioritize Forbidden Idol and Kindlegem components early.',
    'Dream Maker into Moonstone Renewer is the most common backbone in 16.13.',
    "Buy Ionian Boots when you actually need CDR and can afford leaving host; it's often skipped.",
    "Pick Mikael's vs heavy CC, Ardent/Staff for synergy with carry damage profile.",
    "Dawncore and Imperial Mandate are the highest-winrate late picks; Shurelya's for engage, Locket for burst mitigation, Knight's Vow when pocketing a single hyper-carry.",
    'Vigilant Wardstone as late-game utility slot; Mejai for snowball if stacks are stable.',
  ],
};

export default yuumiBuild;

// Back-compat exports used by the guide Build tab
// BEST_RUNES and BEST_ITEMS mirror the shapes consumed in src/app/page.tsx

export const BEST_RUNES = {
  primary: {
    tree: 'Sorcery',
    // `key` is the Data Dragon rune key; icon paths derive from tree + key.
    keystone: { id: 8214, name: 'Summon Aery', key: 'SummonAery' },
    slots: [
      { id: 8226, name: 'Manaflow Band', key: 'ManaflowBand' },
      { id: 8210, name: 'Transcendence', key: 'Transcendence' },
      { id: 8237, name: 'Scorch', key: 'Scorch' },
    ],
  },
  secondary: {
    tree: 'Resolve',
    slots: [
      { id: 8463, name: 'Font of Life', key: 'FontOfLife' },
      { id: 8453, name: 'Revitalize', key: 'Revitalize' },
    ],
  },
  shards: [
    { id: 5007, name: 'Ability Haste' },
    { id: 5008, name: 'Adaptive Force' },
    { id: 5001, name: 'Health' },
  ],
} as const;

export const BEST_ITEMS = {
  starter: [
    {
      id: 3865,
      name: 'World Atlas',
      reason: 'Support income start; upgrade path to Bounty of Worlds.',
    },
    {
      id: 1004,
      name: 'Faerie Charm',
      reason: 'Early mana sustain to smooth laning spell usage.',
    },
    {
      id: 2003,
      name: 'Health Potion',
      reason: 'Baseline sustain for early trades and poke lanes.',
    },
  ],
  early: [
    {
      id: 3866,
      name: 'Runic Compass',
      reason: 'First upgrade of support item; maintain quest tempo.',
    },
    {
      id: 3867,
      name: 'Bounty of Worlds',
      reason: 'Final support income upgrade; frees slots and gold later.',
    },
    {
      id: 4642,
      name: 'Bandleglass Mirror',
      reason: 'Cheap CDR + mana regen component for enchanter paths.',
    },
  ],
  core: [
    {
      id: 3870,
      name: 'Dream Maker',
      reason:
        'Support quest backbone; synergistic with shielding/healing windows.',
    },
    {
      id: 6617,
      name: 'Moonstone Renewer',
      reason: 'Top second item; chain heals/shields across the team in fights.',
    },
    {
      id: 3504,
      name: 'Ardent Censer',
      reason: 'AA carry synergy; amplifies heals/shields into on-hit damage.',
    },
    {
      id: 3222,
      name: "Mikael's Blessing",
      reason: 'Pick vs. heavy CC to cleanse and protect your host.',
    },
  ],
  situational: [
    {
      id: 6621,
      name: 'Dawncore',
      reason: 'Highest-winrate late pick; scales total heal/shield power.',
    },
    {
      id: 6616,
      name: 'Staff of Flowing Water',
      reason: 'AP carry synergy; gives AP + haste after shielding/healing.',
    },
    {
      id: 4005,
      name: 'Imperial Mandate',
      reason: 'Q slow procs the mark; strong damage/utility on poke comps.',
    },
    {
      id: 3107,
      name: 'Redemption',
      reason: 'Teamfight sustain and map impact from range.',
    },
    {
      id: 2065,
      name: "Shurelya's Battlesong",
      reason: 'Engage/speed comps; enables rotations and picks.',
    },
    {
      id: 3190,
      name: 'Locket of the Iron Solari',
      reason: 'Burst mitigation vs. AoE threats and assassins.',
    },
    {
      id: 3109,
      name: "Knight's Vow",
      reason: 'Pocket a single hyper-carry; damage redirection utility.',
    },
    {
      id: 4643,
      name: 'Vigilant Wardstone',
      reason: 'Late-game vision and stat slot when inventory is full.',
    },
    {
      id: 3041,
      name: "Mejai's Soulstealer",
      reason: 'Snowball option when stacks are stable and deaths are rare.',
    },
    {
      id: 6620,
      name: 'Echoes of Helia',
      reason: 'Sustain-focused alternative when you want extra healing tempo.',
    },
  ],
} as const;
