// Yuumi Build Data Module
// Contains recommended runes and item builds for Yuumi support

interface RuneSlot {
  id: number;
  name: string;
}

interface RuneData {
  primary: { keystone: RuneSlot; slots: RuneSlot[] };
  secondary: { slots: RuneSlot[] };
  shards: { id: number; name: string }[];
}

export const BEST_RUNES: RuneData = {
  primary: {
    keystone: { id: 8214, name: 'Summon Aery' },
    slots: [
      { id: 8226, name: 'Manaflow Band' },
      { id: 8210, name: 'Transcendence' },
      { id: 8237, name: 'Scorch' },
    ],
  },
  secondary: {
    slots: [
      { id: 8463, name: 'Font of Life' }, // Most picked Master+ secondary
      { id: 8453, name: 'Revitalize' },
    ],
  },
  shards: [
    { id: 5007, name: 'Ability Haste' },
    { id: 5008, name: 'Adaptive Force' },
    { id: 5001, name: 'Health' },
  ],
};

interface ItemBuildEntry {
  id: number;
  name: string;
  reason: string;
}

interface ItemBuildData {
  starter: ItemBuildEntry[];
  early: ItemBuildEntry[];
  core: ItemBuildEntry[];
  situational: ItemBuildEntry[];
}

export const BEST_ITEMS: ItemBuildData = {
  starter: [
    { id: 3860, name: 'World Atlas', reason: 'Quest + early gold generation' },
    { id: 2003, name: 'Health Potion', reason: 'Lane sustain' },
    { id: 2055, name: 'Control Ward', reason: 'Early vision control' },
  ],
  early: [
    { id: 3114, name: 'Forbidden Idol', reason: 'Early heal/shield power and regen' },
    { id: 3067, name: 'Kindlegem', reason: 'Ability haste + HP toward Moonstone' },
    { id: 2422, name: 'Boots', reason: 'Optional; only if detaching/roaming often' },
  ],
  core: [
    { id: 6617, name: 'Moonstone Renewer', reason: 'Top Master+/pro sustain; scales in extended fights' },
    { id: 3504, name: 'Ardent Censer', reason: 'Best with on-hit/AS carries (Jinx, Kog, Twitch, Zeri)' },
    { id: 4629, name: 'Staff of Flowing Water', reason: 'Best with AP carries or mixed damage comps' },
  ],
  situational: [
    {
      id: 3222,
      name: "Mikael's Blessing",
      reason: 'Cleanse hard CC on allies',
    },
    {
      id: 2065,
      name: "Shurelya's Battlesong",
      reason: 'Engage/disengage speed',
    },
    { id: 3107, name: 'Redemption', reason: 'Global heal + damage mitigation' },
    { id: 3011, name: 'Chemtech Putrifier', reason: 'Apply Grievous Wounds through heals/shields vs heavy sustain' },
    {
      id: 4643,
      name: 'Vigilant Wardstone',
      reason: 'Late game vision scaling',
    },
    {
      id: 3041,
      name: "Mejai's Soulstealer",
      reason: 'Snowball AP + heal scaling',
    },
  ],
};
