// Yuumi build data for patch 15.18
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

export const yuumiBuild1518: ChampionBuildData = {
  champion: 'Yuumi',
  patch: '15.18',
  sources: [
    'https://lolalytics.com/lol/yuumi/build/',
    'https://lolalytics.com/lol/yuumi/build/?tier=1trick',
  ],
  updatedAt: new Date().toISOString(),
  starter: [
    'World Atlas',
    'Runic Compass',
    'Bounty of Worlds',
    'Spellthief base (if applicable)',
  ],
  core: ['Dawncore', 'Dream Maker', "Mikael's Blessing", 'Redemption'],
  boots: ['Ionian Boots of Lucidity'],
  situational: [
    'Ardent Censer',
    'Staff of Flowing Water',
    "Shurelya's Battlesong",
    'Locket of the Iron Solari',
    "Knight's Vow",
    'Vigilant Wardstone',
    "Mejai's Soulstealer",
    // niche or comp-dependent picks occasionally surfaced
    'Imperial Mandate',
  ],
  notes: [
    'Rush support income; prioritize Forbidden Idol and Kindlegem components early.',
    'Dawncore into Dream Maker is the most common backbone in 15.18.',
    "Buy Ionian Boots when you actually need CDR and can afford leaving host; it's often skipped.",
    "Pick Mikael's vs heavy CC, Ardent/Staff for synergy with carry damage profile.",
    "Shurelya's for engage/speed comps; Locket for burst mitigation; Knight's Vow when pocketing a single hyper-carry.",
    'Vigilant Wardstone as late-game utility slot; Mejai for snowball if stacks are stable.',
  ],
};

export default yuumiBuild1518;

// Back-compat exports used by the guide Build tab
// BEST_RUNES and BEST_ITEMS mirror the shapes consumed in src/app/page.tsx

export const BEST_RUNES = {
  primary: {
    tree: 'Sorcery',
    keystone: { id: 8214, name: 'Summon Aery' },
    slots: [
      { id: 8226, name: 'Manaflow Band' },
      { id: 8210, name: 'Transcendence' },
      { id: 8237, name: 'Scorch' },
    ],
  },
  secondary: {
    tree: 'Resolve',
    slots: [
      { id: 8473, name: 'Bone Plating' },
      { id: 8453, name: 'Revitalize' },
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
      id: 226621,
      name: 'Dawncore',
      reason: 'Top-performing mythic backbone for Yuumi in 15.18.',
    },
    {
      id: 3870,
      name: 'Dream Maker',
      reason: 'Highly synergistic with shielding/healing windows.',
    },
    {
      id: 223222,
      name: "Mikael's Blessing",
      reason: 'Pick early vs. heavy CC to protect your host.',
    },
    {
      id: 223107,
      name: 'Redemption',
      reason: 'Teamfight sustain and map impact from range.',
    },
  ],
  situational: [
    {
      id: 223504,
      name: 'Ardent Censer',
      reason: 'AA carry synergy; amplifies heals/shields into on-hit.',
    },
    {
      id: 226616,
      name: 'Staff of Flowing Water',
      reason: 'AP carry synergy; gives AP + haste after shielding/healing.',
    },
    {
      id: 2065,
      name: "Shurelya's Battlesong",
      reason: 'Engage/speed comps; enables rotations and picks.',
    },
    {
      id: 223190,
      name: 'Locket of the Iron Solari',
      reason: 'Burst mitigation vs. AoE threats and assassins.',
    },
    {
      id: 223109,
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
      id: 224005,
      name: 'Imperial Mandate',
      reason: 'Niche; Q slow can proc, but generally lower prio in 15.18.',
    },
    {
      id: 223158,
      name: 'Ionian Boots of Lucidity',
      reason: 'Common boots if purchased; often delayed or skipped.',
    },
  ],
} as const;
