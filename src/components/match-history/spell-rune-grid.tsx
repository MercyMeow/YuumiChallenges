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
  // Collect only valid items with proper typing
  const validItems: Array<
    | { type: 'spell'; data: number; key: string }
    | { type: 'rune'; data: { perk: number; var1: number; var2: number; var3: number }; key: string }
  > = [];

  // Add valid spells
  if (summoner_spells?.spell1Id && summoner_spells.spell1Id > 0) {
    validItems.push({
      type: 'spell',
      data: summoner_spells.spell1Id,
      key: 'spell1'
    });
  }
  if (summoner_spells?.spell2Id && summoner_spells.spell2Id > 0) {
    validItems.push({
      type: 'spell',
      data: summoner_spells.spell2Id,
      key: 'spell2'
    });
  }

  // Add valid runes
  const keystone = runes?.primarySelections?.[0];
  if (keystone?.perk && keystone.perk > 0) {
    validItems.push({
      type: 'rune',
      data: keystone,
      key: 'keystone'
    });
  }
  
  const secondaryRune = runes?.subSelections?.[0];
  if (secondaryRune?.perk && secondaryRune.perk > 0) {
    validItems.push({
      type: 'rune',
      data: secondaryRune,
      key: 'secondary'
    });
  }

  // Don't render if no valid items
  if (validItems.length === 0) {
    return null;
  }

  // Dynamic grid layout based on item count
  const getGridLayout = (itemCount: number) => {
    switch (itemCount) {
      case 1:
        return 'grid grid-cols-1 gap-1 w-8 h-8'; // Single item
      case 2:
        return 'grid grid-cols-2 gap-1 w-16 h-8'; // Two items horizontally
      case 3:
      case 4:
        return 'grid grid-cols-2 gap-1 w-16 h-16'; // 2x2 grid
      default:
        return 'grid grid-cols-2 gap-1 w-16 h-16';
    }
  };

  return (
    <div className={getGridLayout(validItems.length)}>
      {validItems.map((item) => (
        item.type === 'spell' ? (
          <SummonerSpell key={item.key} spellId={item.data} size={size} />
        ) : (
          <RuneSlot key={item.key} rune={item.data} size={size} />
        )
      ))}
    </div>
  );
}