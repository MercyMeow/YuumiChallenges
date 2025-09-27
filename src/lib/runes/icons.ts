// Minimal icon map for the runes used in Yuumi pages.
// Update filenames to match your assets under `/public/runes/`.

const runeFilenameByName: Record<string, string> = {
  // Sorcery
  'Summon Aery': 'summon_aery.png',
  'Arcane Comet': 'arcane_comet.png',
  'Manaflow Band': 'manaflow_band.png',
  Transcendence: 'transcendence.png',
  'Absolute Focus': 'absolute_focus.png',
  Celerity: 'celerity.png',
  Scorch: 'scorch.png',
  'Gathering Storm': 'gathering_storm.png',

  // Resolve
  Guardian: 'guardian.png',
  'Font of Life': 'font_of_life.png',
  'Shield Bash': 'shield_bash.png',
  'Second Wind': 'second_wind.png',
  'Bone Plating': 'bone_plating.png',
  Revitalize: 'revitalize.png',

  // Inspiration
  'Biscuit Delivery': 'biscuit_delivery.png',
  'Cosmic Insight': 'cosmic_insight.png',
  'Magical Footwear': 'magical_footwear.png',
  "Future's Market": 'futures_market.png',

  // Domination (niche)
  'Cheap Shot': 'cheap_shot.png',
  'Taste of Blood': 'taste_of_blood.png',
  'Ingenious Hunter': 'ingenious_hunter.png',
  'Ultimate Hunter': 'ultimate_hunter.png',
};

export function getRuneIconPath(name: string) {
  const file = runeFilenameByName[name];
  return file ? `/runes/${file}` : '/runes/unknown_rune.png';
}
