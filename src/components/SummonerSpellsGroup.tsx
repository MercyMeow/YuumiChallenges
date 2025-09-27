import React from 'react';
import SummonerSpellPill from './SummonerSpellPill';
import {
  getSummonerSpellIconPath,
  type SummonerSpellKey,
} from '../lib/summonerSpells';

type Props = {
  recommended: SummonerSpellKey[];
  alternates: SummonerSpellKey[];
  onSelect?: (name: SummonerSpellKey) => void;
  selected?: SummonerSpellKey | null;
};

export default function SummonerSpellsGroup({
  recommended,
  alternates,
  onSelect,
  selected = null,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="mb-1 text-xs font-medium text-zinc-400">Recommended</div>
        <div className="flex flex-wrap gap-2">
          {recommended.map((name) => (
            <SummonerSpellPill
              key={`rec-${name}`}
              name={name}
              iconSrc={getSummonerSpellIconPath(name)}
              selected={selected === name}
              onClick={onSelect ? () => onSelect(name) : undefined}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-zinc-400">Alternates</div>
        <div className="flex flex-wrap gap-2">
          {alternates.map((name) => (
            <SummonerSpellPill
              key={`alt-${name}`}
              name={name}
              iconSrc={getSummonerSpellIconPath(name)}
              selected={selected === name}
              onClick={onSelect ? () => onSelect(name) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

