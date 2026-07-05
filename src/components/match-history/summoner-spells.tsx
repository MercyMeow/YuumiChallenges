'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { summonerSpellImages } from '@/lib/apis/datadragon';
import { useSummonerSpells } from '@/hooks/use-summoner-spells';

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
  55: {
    id: 55,
    name: 'Placeholder and Attack-Smite',
    key: 'Summoner_UltBookSmitePlaceholder',
  },
} as const;

interface SummonerSpellProps {
  spellId: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function SummonerSpell({
  spellId,
  size = 'md',
  className = '',
}: SummonerSpellProps) {
  const { byNumericId } = useSummonerSpells();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const sizes = {
    xs: { width: 12, height: 12 },
    sm: { width: 20, height: 20 },
    md: { width: 24, height: 24 },
    lg: { width: 32, height: 32 },
    xl: { width: 40, height: 40 },
  };

  const { width, height } = sizes[size];
  const staticSpell = SUMMONER_SPELLS[spellId as keyof typeof SUMMONER_SPELLS];
  const ddragonSpell = byNumericId[spellId];
  const spell = ddragonSpell || staticSpell;

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
        const url = await summonerSpellImages.icon(
          typeof spell.id === 'string' ? spell.id : spell.key
        );
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
        className={`animate-pulse rounded border border-gray-600/30 bg-black/30 ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (hasError || !imageUrl || !spell) {
    return (
      <div
        className={`flex items-center justify-center rounded border border-red-500/30 bg-red-900/20 ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs text-red-400">?</span>
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`overflow-hidden rounded border border-gray-500/30 transition-colors hover:border-gray-400/50 ${className}`}
        >
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
      <TooltipContent className="max-w-96 border-purple-500/30 bg-black/85 p-4 shadow-lg shadow-purple-500/20 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <Image
              src={imageUrl}
              alt={spell.name}
              width={28}
              height={28}
              className="rounded border border-purple-500/30"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold leading-tight text-white">
              {spell.name}
            </div>
            {ddragonSpell?.description && (
              <div className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-white/90">
                {ddragonSpell.description.replace(/<[^>]+>/g, '')}
              </div>
            )}
          </div>
        </div>
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
  orientation = 'horizontal',
}: SummonerSpellsProps) {
  const flexDirection = orientation === 'vertical' ? 'flex-col' : 'flex-row';
  const gap = orientation === 'vertical' ? 'gap-1' : 'gap-1';

  // Enhanced vertical layout for match card display
  const verticalContainerClasses =
    orientation === 'vertical' ? 'w-8 justify-center items-center' : '';

  // Validate that both spell IDs are valid before rendering
  if (!isValidSummonerSpell(spell1Id) || !isValidSummonerSpell(spell2Id)) {
    return null;
  }

  return (
    <div
      className={`flex ${flexDirection} ${gap} ${verticalContainerClasses} ${className}`}
    >
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
