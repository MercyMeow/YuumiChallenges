'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  championImages,
  abilityImages,
  getChampionDetails,
  FALLBACK_IMAGE,
} from '@/lib/apis/datadragon';
import type { ChampionData } from '@/lib/apis/datadragon';
import { sanitizeRiotHtml } from '@/lib/utils/sanitize-html';

interface DataDragonImageProps {
  championId: string;
  type: 'icon' | 'splash' | 'loading' | 'square';
  skinNum?: number;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  onError?: () => void;
}

export function DataDragonImage({
  championId,
  type,
  skinNum = 0,
  alt,
  className,
  width = 64,
  height = 64,
  priority = false,
  onError,
}: DataDragonImageProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        let url: string;

        switch (type) {
          case 'icon':
          case 'square':
            url = await championImages.icon(championId);
            break;
          case 'splash':
            url = championImages.splash(championId, skinNum);
            break;
          case 'loading':
            url = championImages.loading(championId, skinNum);
            break;
          default:
            url = await championImages.icon(championId);
        }

        setImageUrl(url);
      } catch (error) {
        console.error('Error loading DataDragon image:', error);
        setHasError(true);
        onError?.();
      } finally {
        setIsLoading(false);
      }
    };

    if (championId) {
      loadImage();
    }
  }, [championId, type, skinNum, onError]);

  const handleImageError = () => {
    setHasError(true);
    onError?.();
  };

  if (isLoading) {
    return (
      <div
        className={`flex-shrink-0 animate-pulse rounded bg-muted ${className || ''}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          minWidth: `${width}px`,
          minHeight: `${height}px`,
          maxWidth: `${width}px`,
          maxHeight: `${height}px`,
        }}
      />
    );
  }

  return (
    <div
      className={`relative flex-shrink-0 overflow-hidden rounded ${className || ''}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`,
        maxWidth: `${width}px`,
        maxHeight: `${height}px`,
      }}
    >
      <Image
        src={hasError || !imageUrl ? FALLBACK_IMAGE : imageUrl}
        alt={alt || `${championId} ${type} image`}
        width={width}
        height={height}
        priority={priority}
        className="h-full w-full object-cover"
        onError={handleImageError}
        sizes={`${width}px`}
      />
    </div>
  );
}

interface ChampionIconProps {
  championId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

export function ChampionIcon({
  championId,
  size = 'md',
  className,
  alt,
}: ChampionIconProps) {
  const sizes = {
    xs: { width: 24, height: 24 },
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  };

  const { width, height } = sizes[size];

  return (
    <div
      className={`relative inline-block flex-shrink-0 ${className || ''}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`,
        maxWidth: `${width}px`,
        maxHeight: `${height}px`,
      }}
    >
      <DataDragonImage
        championId={championId}
        type="icon"
        width={width}
        height={height}
        alt={alt || `Champion ${championId}`}
      />
    </div>
  );
}

interface ChampionSplashProps {
  championId: string;
  skinNum?: number;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export function ChampionSplash({
  championId,
  skinNum = 0,
  className,
  alt,
  width = 1215,
  height = 717,
}: ChampionSplashProps) {
  return (
    <DataDragonImage
      championId={championId}
      type="splash"
      skinNum={skinNum}
      width={width}
      height={height}
      {...(className ? { className } : {})}
      alt={alt || `Champion ${championId} splash art`}
    />
  );
}

interface YuumiImageProps {
  skinNum?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

export function YuumiIcon({
  size = 'md',
  className,
  alt = 'Yuumi',
}: Omit<YuumiImageProps, 'skinNum'>) {
  return (
    <ChampionIcon
      championId="Yuumi"
      size={size}
      {...(className ? { className } : {})}
      alt={alt}
    />
  );
}

export function YuumiSplash({
  skinNum = 0,
  className,
  alt = 'Yuumi splash art',
  width = 1215,
  height = 717,
}: Omit<YuumiImageProps, 'size'> & { width?: number; height?: number }) {
  return (
    <ChampionSplash
      championId="Yuumi"
      skinNum={skinNum}
      {...(className ? { className } : {})}
      alt={alt}
      width={width}
      height={height}
    />
  );
}

interface AbilityIconProps {
  championId: string;
  ability: 'P' | 'Q' | 'W' | 'E' | 'R';
  size?: number;
  className?: string;
  alt?: string;
  showTooltip?: boolean;
}

type ChampionSpell = NonNullable<ChampionData['spells']>[number];
type ChampionPassive = NonNullable<ChampionData['passive']>;

const isChampionSpell = (
  abilityInfo: ChampionPassive | ChampionSpell
): abilityInfo is ChampionSpell => 'cooldownBurn' in abilityInfo;

export function AbilityIcon({
  championId,
  ability,
  size = 36,
  className,
  alt,
  showTooltip = false,
}: AbilityIconProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [abilityData, setAbilityData] = useState<{
    name: string;
    description: string;
    cooldownBurn?: string;
    costBurn?: string;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        // Load image
        let url: string;
        if (ability === 'P') {
          url = await abilityImages.passive(`${championId}P2.png`);
        } else {
          url = await abilityImages.spell(`${championId}${ability}.png`);
        }
        setImageUrl(url);

        // Load ability data for tooltip if requested
        if (showTooltip) {
          const championData = await getChampionDetails(championId);
          let abilityInfo;

          if (ability === 'P') {
            abilityInfo = championData.passive;
          } else {
            // Find the spell by id (Q, W, E, R correspond to spells[0], [1], [2], [3])
            const spellIndex = ['Q', 'W', 'E', 'R'].indexOf(ability);
            abilityInfo = championData.spells?.[spellIndex];
          }

          if (abilityInfo) {
            if (isChampionSpell(abilityInfo)) {
              setAbilityData({
                name: abilityInfo.name,
                description: abilityInfo.description,
                cooldownBurn: abilityInfo.cooldownBurn,
                costBurn: abilityInfo.costBurn,
              });
            } else {
              setAbilityData({
                name: abilityInfo.name,
                description: abilityInfo.description,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading ability data:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [championId, ability, showTooltip]);

  if (isLoading) {
    return (
      <div
        className={`animate-pulse rounded bg-muted ${className || ''}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const iconElement = (
    <div
      className={`relative overflow-hidden rounded ${className || ''}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={hasError || !imageUrl ? '/images/item-placeholder.svg' : imageUrl}
        alt={alt || `${championId} ${ability} ability`}
        width={size}
        height={size}
        className="h-full w-full object-cover"
      />
    </div>
  );

  if (!showTooltip || !abilityData) {
    return iconElement;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help">{iconElement}</div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs border-purple-500/30 bg-black/85 text-white">
        <div className="space-y-2">
          <div className="font-semibold text-purple-300">
            {abilityData.name}
          </div>
          <div
            className="text-sm text-white/90"
            dangerouslySetInnerHTML={{
              __html: sanitizeRiotHtml(abilityData.description),
            }}
          />
          {(abilityData.cooldownBurn || abilityData.costBurn) && (
            <div className="flex gap-4 text-xs text-white/70">
              {abilityData.cooldownBurn && (
                <div>Cooldown: {abilityData.cooldownBurn}s</div>
              )}
              {abilityData.costBurn && <div>Cost: {abilityData.costBurn}</div>}
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
