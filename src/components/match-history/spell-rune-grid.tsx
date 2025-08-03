'use client';

import { SummonerSpell } from './summoner-spells';
import { RuneSlot } from './rune-slots';

interface SpellRuneGridProps {
  summoner_spells?: {
    spell1Id: number;
    spell2Id: number;
  } | undefined;
  runes?: {
    primarySelections: Array<{ perk: number; var1: number; var2: number; var3: number }>;
    subSelections: Array<{ perk: number; var1: number; var2: number; var3: number }>;
  } | undefined;
  size?: 'sm' | 'md' | 'lg';
}

export function SpellRuneGrid({ 
  summoner_spells,
  runes, 
  size = 'lg' 
}: SpellRuneGridProps) {
  const spell1Id = summoner_spells?.spell1Id || 0;
  const spell2Id = summoner_spells?.spell2Id || 0;
  const keystone = runes?.primarySelections?.[0];
  const secondaryRune = runes?.subSelections?.[0];

  return (
    <div className="grid grid-cols-2 gap-1">
      <SummonerSpell spellId={spell1Id} size={size} />
      <SummonerSpell spellId={spell2Id} size={size} />
      <RuneSlot rune={keystone} size={size} />
      <RuneSlot rune={secondaryRune} size={size} />
    </div>
  );
}