// Mapping utilities for summoner spell icons. Keep function names camelCase.

export type SummonerSpellKey =
  | 'Flash'
  | 'Heal'
  | 'Ignite'
  | 'Exhaust'
  | 'Cleanse'
  | 'Barrier'
  | 'Ghost'
  | 'Teleport'
  | 'Clarity'
  | 'Smite';

// If your project uses different filenames, update this mapping accordingly.
const filenameByName: Record<SummonerSpellKey, string> = {
  Flash: 'Flash.png',
  Heal: 'Heal.png',
  Ignite: 'Ignite.png',
  Exhaust: 'Exhaust.png',
  Cleanse: 'Cleanse.png',
  Barrier: 'Barrier.png',
  Ghost: 'Ghost.png',
  Teleport: 'Teleport.png',
  Clarity: 'Clarity.png',
  Smite: 'Smite.png',
};

export function getSummonerSpellIconPath(name: SummonerSpellKey) {
  return `/summoner-spells/${filenameByName[name]}`;
}

