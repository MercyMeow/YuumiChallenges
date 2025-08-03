'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { summonerSpellImages } from '@/lib/apis/datadragon';

// Summoner spell mapping by ID
export const SUMMONER_SPELLS = {
  1: { id: 1, name: 'Cleanse', key: 'SummonerBoost' },
  3: { id: 3, name: 'Exhaust', key: 'SummonerExhaust' },
  4: { id: 4, name: 'Flash', key: 'SummonerFlash' },
  6: { id: 6, name: 'Ghost', key: 'SummonerHaste' },
  7: { id: 7, name: 'Heal', key: 'SummonerHeal' },
  11: { id: 11, name: 'Smite', key: 'SummonerSmite' },
  12: { id: 12, name: 'Teleport', key: 'SummonerTeleport' },
  13: { id: 13, name: 'Clarity', key: 'SummonerMana' },
  14: { id: 14, name: 'Ignite', key: 'SummonerDot' },
  21: { id: 21, name: 'Barrier', key: 'SummonerBarrier' },
  30: { id: 30, name: 'To the King!', key: 'SummonerPoroRecall' },
  31: { id: 31, name: 'Poro Toss', key: 'SummonerPoroThrow' },
  32: { id: 32, name: 'Mark', key: 'SummonerSnowball' },
  39: { id: 39, name: 'Mark', key: 'SummonerSnowURFSnowball_Mark' },
  54: { id: 54, name: 'Placeholder', key: 'Summoner_UltBookPlaceholder' },
  55: { id: 55, name: 'Placeholder and Attack-Smite', key: 'Summoner_UltBookSmitePlaceholder' },
} as const;

interface SummonerSpellProps {
  spellId: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

function SummonerSpell({ spellId, size = 'md', className = '' }: SummonerSpellProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const sizes = {
    xs: { width: 12, height: 12 },
    sm: { width: 16, height: 16 },
    md: { width: 20, height: 20 },
    lg: { width: 24, height: 24 },
    xl: { width: 32, height: 32 },
  };

  const { width, height } = sizes[size];
  const spell = SUMMONER_SPELLS[spellId as keyof typeof SUMMONER_SPELLS];

  useEffect(() => {
    const loadSpellImage = async () => {
      if (!spell) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);
        const url = await summonerSpellImages.icon(spell.key);
        setImageUrl(url);
      } catch (error) {
        console.error('Error loading summoner spell image:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadSpellImage();
  }, [spellId, spell]);

  if (isLoading) {
    return (
      <div 
        className={`bg-black/30 border border-gray-600/30 rounded animate-pulse ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (hasError || !imageUrl || !spell) {
    return (
      <div 
        className={`bg-red-900/20 border border-red-500/30 rounded flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-red-400 text-xs">?</span>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`border border-gray-500/30 rounded overflow-hidden hover:border-gray-400/50 transition-colors ${className}`}>
          <Image
            src={imageUrl}
            alt={spell.name}
            width={width}
            height={height}
            className="object-cover"
            onError={() => setHasError(true)}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{spell.name}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface SummonerSpellsProps {
  spell1Id: number;
  spell2Id: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function SummonerSpells({ 
  spell1Id, 
  spell2Id, 
  size = 'md', 
  className = '',
  orientation = 'horizontal'
}: SummonerSpellsProps) {
  const flexDirection = orientation === 'vertical' ? 'flex-col' : 'flex-row';
  const gap = orientation === 'vertical' ? 'gap-0.5' : 'gap-1';

  return (
    <div className={`flex ${flexDirection} ${gap} ${className}`}>
      <SummonerSpell spellId={spell1Id} size={size} />
      <SummonerSpell spellId={spell2Id} size={size} />
    </div>
  );
}

/**
 * Helper function to get summoner spell name by ID
 */
export function getSummonerSpellName(spellId: number): string {
  const spell = SUMMONER_SPELLS[spellId as keyof typeof SUMMONER_SPELLS];
  return spell?.name || `Unknown Spell (${spellId})`;
}

/**
 * Helper function to get summoner spell key by ID
 */
export function getSummonerSpellKey(spellId: number): string {
  const spell = SUMMONER_SPELLS[spellId as keyof typeof SUMMONER_SPELLS];
  return spell?.key || `Unknown_${spellId}`;
}

/**
 * Helper function to check if summoner spell is valid
 */
export function isValidSummonerSpell(spellId: number): boolean {
  return spellId in SUMMONER_SPELLS;
}

/**
 * Gets the most common summoner spell combinations for different roles
 */
export function getCommonSpellCombinations() {
  return {
    adc: [
      { spell1: 4, spell2: 7 }, // Flash + Heal
      { spell1: 4, spell2: 21 }, // Flash + Barrier
    ],
    support: [
      { spell1: 4, spell2: 14 }, // Flash + Ignite
      { spell1: 4, spell2: 3 }, // Flash + Exhaust
    ],
    mid: [
      { spell1: 4, spell2: 14 }, // Flash + Ignite
      { spell1: 4, spell2: 12 }, // Flash + Teleport
    ],
    jungle: [
      { spell1: 4, spell2: 11 }, // Flash + Smite
      { spell1: 6, spell2: 11 }, // Ghost + Smite
    ],
    top: [
      { spell1: 4, spell2: 12 }, // Flash + Teleport
      { spell1: 4, spell2: 14 }, // Flash + Ignite
      { spell1: 6, spell2: 12 }, // Ghost + Teleport
    ],
    aram: [
      { spell1: 32, spell2: 7 }, // Mark + Heal
      { spell1: 32, spell2: 14 }, // Mark + Ignite
      { spell1: 32, spell2: 1 }, // Mark + Cleanse
    ],
  };
}