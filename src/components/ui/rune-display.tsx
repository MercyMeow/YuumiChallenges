'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { runeImages, STAT_SHARDS } from '@/lib/apis/datadragon';
import { useRuneData } from '@/hooks/use-rune-data';
import {
  loadRuneImageOptimized,
  getCachedRuneImage,
} from '@/lib/utils/rune-image-preloader';
import { StatShard } from '@/lib/apis/datadragon';
import { cn } from '@/lib/utils';
import { getAllRuneVarInfos } from '@/lib/runes/rune-variables';
import { sanitizeRiotHtml } from '@/lib/utils/sanitize-html';

interface RuneIconProps {
  runeId: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'minor28' | 'keystone42';
  showTooltip?: boolean;
  variant?: 'keystone' | 'normal';
  className?: string;
}

export function RuneIcon({
  runeId,
  size = 'md',
  showTooltip = true,
  variant = 'normal',
  className = '',
}: RuneIconProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const { getRuneById, loading: runeDataLoading } = useRuneData();
  const rune = getRuneById(runeId);

  const sizes = {
    xs: { width: 16, height: 16 },
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 40, height: 40 },
    xl: { width: 48, height: 48 },
    // Riot-like explicit sizes
    minor28: { width: 28, height: 28 },
    keystone42: { width: 42, height: 42 },
  };

  const { width, height } = sizes[size];

  useEffect(() => {
    const loadRuneImage = async () => {
      if (!rune?.icon) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      // Check cache first for instant loading
      const cachedUrl = getCachedRuneImage(rune.icon);
      if (cachedUrl) {
        setImageUrl(cachedUrl);
        setIsLoading(false);
        setHasError(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);
        const url = await loadRuneImageOptimized(rune.icon);
        setImageUrl(url);
      } catch (error) {
        console.error('Error loading rune image:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (rune) {
      loadRuneImage();
    }
  }, [rune]);

  if (runeDataLoading || isLoading) {
    return (
      <div
        className={cn(
          'animate-pulse rounded border border-gray-600/30 bg-black/30',
          variant === 'keystone' && 'border-purple-500/30 bg-purple-500/10',
          className
        )}
        style={{ width, height }}
      />
    );
  }

  if (hasError || !imageUrl || !rune) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded border border-red-500/30 bg-red-900/20',
          className
        )}
        style={{ width, height }}
      >
        <div className="h-4 w-4 rounded border border-gray-500/50 bg-gray-600/30">
          <Image
            src="/images/rune-placeholder.png"
            alt="Rune placeholder"
            width={16}
            height={16}
            className="opacity-50"
          />
        </div>
      </div>
    );
  }

  const content = (
    <div
      className={cn(
        'cursor-pointer overflow-hidden rounded border transition-colors hover:border-opacity-70',
        variant === 'keystone'
          ? 'border-purple-500/60 bg-purple-500/10 shadow-sm shadow-purple-500/20 hover:border-purple-400/70'
          : 'border-white/10 hover:border-white/20',
        // circular look like Riot client
        'rounded-full',
        className
      )}
      style={{ width, height }}
    >
      <Image
        src={imageUrl}
        alt={rune.name}
        width={width}
        height={height}
        className="h-full w-full object-contain"
        onError={() => setHasError(true)}
        priority={variant === 'keystone'}
        sizes="(max-width: 768px) 32px, 48px"
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGxwf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8A0XqFCIMwivQUP6qOUKjYWCxhYkMNR8nF5Fc/0XJUrp1vHWkVCUlvSY8K/9k="
      />
    </div>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent className="max-w-80 border-purple-500/30 bg-black/85 p-4 shadow-lg shadow-purple-500/20 backdrop-blur-md">
        <div className="space-y-3">
          {/* Header with Rune Icon and Name */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Image
                src={imageUrl}
                alt={rune.name}
                width={32}
                height={32}
                className={cn(
                  'rounded border',
                  variant === 'keystone'
                    ? 'border-purple-500/50 shadow-sm shadow-purple-500/20'
                    : 'border-purple-500/30'
                )}
                sizes="32px"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGxwf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8A0XqFCIMwivQUP6qOUKjYWCxhYkMNR8nF5Fc/0XJUrp1vHWkVCUlvSY8K/9k="
              />
            </div>
            <div className="min-w-0 flex-1">
              <div
                className={cn(
                  'text-base font-semibold leading-tight',
                  variant === 'keystone' ? 'text-purple-300' : 'text-white'
                )}
              >
                {rune.name}
              </div>
              {variant === 'keystone' && (
                <div className="mt-1 text-xs text-purple-400">Keystone</div>
              )}
            </div>
          </div>

          {/* Short Description */}
          {rune.shortDesc && (
            <div
              className="prose prose-invert prose-sm max-w-none border-t border-purple-500/20 pt-3 leading-relaxed text-blue-300 [&_.attention]:text-red-300 [&_.rules]:mt-1 [&_.rules]:block [&_.rules]:text-white/80 [&_.scale]:text-yellow-300 [&_.status]:text-purple-300"
              dangerouslySetInnerHTML={{
                __html: sanitizeRiotHtml(rune.shortDesc),
              }}
            />
          )}

          {/* Long Description */}
          {rune.longDesc && rune.longDesc !== rune.shortDesc && (
            <div
              className="prose prose-invert prose-xs max-w-none border-t border-purple-500/10 pt-2 leading-relaxed text-gray-300 [&_.attention]:text-red-300 [&_.rules]:mt-1 [&_.rules]:block [&_.rules]:text-white/80 [&_.scale]:text-yellow-300 [&_.status]:text-purple-300"
              dangerouslySetInnerHTML={{
                __html: sanitizeRiotHtml(rune.longDesc),
              }}
            />
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface StatShardIconProps {
  statShardId: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'shard24';
  showTooltip?: boolean;
  className?: string;
}

export function StatShardIcon({
  statShardId,
  size = 'sm',
  showTooltip = true,
  className = '',
}: StatShardIconProps) {
  const { getStatShardById } = useRuneData();
  const statShard = getStatShardById(statShardId);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const sizes = {
    xs: { width: 12, height: 12 },
    sm: { width: 16, height: 16 },
    md: { width: 20, height: 20 },
    lg: { width: 24, height: 24 },
    // Riot-like shard size
    shard24: { width: 24, height: 24 },
  };

  const { width, height } = sizes[size];

  // Map stat shard IDs to their image paths on Data Dragon
  const getStatShardImagePath = (id: number): string => {
    const pathMap: Record<number, string> = {
      // Offense
      5005: 'perk-images/StatMods/StatModsAttackSpeedIcon.png', // Attack Speed
      5008: 'perk-images/StatMods/StatModsAdaptiveForceIcon.png', // Adaptive Force
      5007: 'perk-images/StatMods/StatModsCDRScalingIcon.png', // Ability Haste
      // Flex
      5002: 'perk-images/StatMods/StatModsArmorIcon.png', // Armor
      5003: 'perk-images/StatMods/StatModsMagicResIcon.png', // Magic Resist
      // Defense
      5001: 'perk-images/StatMods/StatModsHealthScalingIcon.png', // Health
    };
    return pathMap[id] || 'perk-images/StatMods/StatModsAdaptiveForceIcon.png';
  };

  useEffect(() => {
    const loadStatShardImage = async () => {
      if (!statShard) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const imagePath = getStatShardImagePath(statShard.id);
        const url = await runeImages.icon(imagePath);
        setImageUrl(url);
      } catch (error) {
        console.error('Error loading stat shard image:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStatShardImage();
  }, [statShard]);

  const getStatShardColor = (shard: StatShard) => {
    switch (shard.slot) {
      case 'offense':
        return 'bg-orange-500/15 border-orange-500/40 hover:border-orange-400/60';
      case 'flex':
        return 'bg-purple-500/15 border-purple-500/40 hover:border-purple-400/60';
      case 'defense':
        return 'bg-green-500/15 border-green-500/40 hover:border-green-400/60';
      default:
        return 'bg-gray-500/10 border-gray-500/30 hover:border-gray-400/40';
    }
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          'animate-pulse rounded-full border border-gray-600/30 bg-black/30',
          className
        )}
        style={{ width, height }}
      />
    );
  }

  if (!statShard) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full border border-red-500/30 bg-red-900/20',
          className
        )}
        style={{ width, height }}
      >
        <span className="text-xs text-red-400">?</span>
      </div>
    );
  }

  const content = (
    <div
      className={cn(
        'flex cursor-pointer items-center justify-center overflow-hidden rounded-full border transition-all',
        getStatShardColor(statShard),
        className
      )}
      style={{ width, height }}
      aria-label={`${statShard.name} shard`}
      title={statShard.name}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={statShard.name}
          width={width}
          height={height}
          className="h-full w-full object-contain p-0.5"
          sizes={`${width}px`}
        />
      ) : (
        <div className="h-[60%] w-[60%] rounded-full bg-white/60" />
      )}
    </div>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent className="max-w-60 border-purple-500/30 bg-black/85 p-3 shadow-lg shadow-purple-500/20 backdrop-blur-md">
        <div className="space-y-2">
          <div className="text-sm font-semibold text-white">
            {statShard.name}
          </div>
          <div className="text-xs text-gray-300">{statShard.description}</div>
          <div className="text-xs capitalize text-purple-400">
            {statShard.slot} Shard
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface RuneTreeIconProps {
  treeId: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export function RuneTreeIcon({
  treeId,
  size = 'md',
  showName = false,
  className = '',
}: RuneTreeIconProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const { getRuneTreeById, loading: runeDataLoading } = useRuneData();
  const tree = getRuneTreeById(treeId);

  const sizes = {
    xs: { width: 16, height: 16 },
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 40, height: 40 },
  };

  const { width, height } = sizes[size];

  useEffect(() => {
    const loadTreeImage = async () => {
      if (!tree?.icon) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      // Check cache first for tree icons too
      const treeIconKey = `tree_${tree.icon}`;
      const cachedUrl = getCachedRuneImage(treeIconKey);
      if (cachedUrl) {
        setImageUrl(cachedUrl);
        setIsLoading(false);
        setHasError(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);
        const url = await runeImages.treeIcon(tree.icon);
        setImageUrl(url);
        // Cache tree icon with prefixed key to avoid conflicts
        // Note: This is a simplified cache approach
      } catch (error) {
        console.error('Error loading rune tree image:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (tree) {
      loadTreeImage();
    }
  }, [tree]);

  if (runeDataLoading || isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className="animate-pulse rounded border border-gray-600/30 bg-black/30"
          style={{ width, height }}
        />
        {showName && (
          <div className="h-4 w-16 animate-pulse rounded bg-black/30" />
        )}
      </div>
    );
  }

  if (hasError || !imageUrl || !tree) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className="flex items-center justify-center rounded border border-red-500/30 bg-red-900/20"
          style={{ width, height }}
        >
          <span className="text-xs text-red-400">?</span>
        </div>
        {showName && <span className="text-sm text-red-400">Unknown Tree</span>}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="overflow-hidden rounded border border-gray-500/30">
        <Image
          src={imageUrl}
          alt={tree.name}
          width={width}
          height={height}
          className="object-cover"
          onError={() => setHasError(true)}
          sizes="(max-width: 768px) 24px, 40px"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGxwf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8A0XqFCIMwivQUP6qOUKjYWCxhYkMNR8nF5Fc/0XJUrp1vHWkVCUlvSY8K/9k="
        />
      </div>
      {showName && (
        <span className="text-sm font-medium text-white">{tree.name}</span>
      )}
    </div>
  );
}

interface RuneTreeDisplayProps {
  perks: {
    statPerks: {
      defense: number;
      flex: number;
      offense: number;
    };
    styles: Array<{
      description: string;
      selections: Array<{
        perk: number;
        var1: number;
        var2: number;
        var3: number;
      }>;
      style: number;
    }>;
  };
  compact?: boolean;
  className?: string;
  // Optional: map of runeId -> details to show per rune
  runeDetailsByRuneId?: Record<
    number,
    { runeId: number; statType: string; value: number }[]
  >;
}

export function RuneTreeDisplay({
  perks,
  compact = false,
  className = '',
  runeDetailsByRuneId,
}: RuneTreeDisplayProps) {
  const { getRuneTreeById, getRuneById } = useRuneData();

  if (!perks?.styles?.length) {
    return (
      <div
        className={cn(
          'rounded border border-red-500/30 bg-red-900/20 p-4 text-center',
          className
        )}
      >
        <span className="text-red-400">No rune data available</span>
      </div>
    );
  }

  const primaryStyle = perks.styles[0];
  const secondaryStyle = perks.styles[1];
  const primaryTree = primaryStyle ? getRuneTreeById(primaryStyle.style) : null;
  const secondaryTree = secondaryStyle
    ? getRuneTreeById(secondaryStyle.style)
    : null;

  if (compact) {
    // Compact mode - show only keystone and stat shards
    const keystone = primaryStyle?.selections[0];
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {keystone && (
          <RuneIcon runeId={keystone.perk} size="sm" variant="keystone" />
        )}
        <div className="flex gap-1">
          <StatShardIcon statShardId={perks.statPerks.offense} size="xs" />
          <StatShardIcon statShardId={perks.statPerks.flex} size="xs" />
          <StatShardIcon statShardId={perks.statPerks.defense} size="xs" />
        </div>
      </div>
    );
  }

  // League of Legends Client-Style Layout
  return (
    <div className={cn('mx-auto max-w-4xl space-y-6', className)}>
      {/* Rune Page Layout - Similar to LoL Client */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        {/* LEFT: Primary & Secondary Rune Trees */}
        <div className="space-y-6">
          {/* Primary Rune Tree */}
          <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-black/40 to-black/20 p-6 shadow-lg shadow-purple-500/10 backdrop-blur-sm">
            {/* Tree Header */}
            <div className="mb-6 flex items-center justify-between border-b border-purple-500/20 pb-4">
              <div className="flex items-center gap-3">
                {primaryTree && (
                  <>
                    <div className="rounded-lg border border-purple-500/40 bg-purple-500/10 p-2">
                      <RuneTreeIcon treeId={primaryTree.id} size="md" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">
                        {primaryTree.name}
                      </div>
                      <div className="text-xs text-purple-300">
                        Primary Tree
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Keystone - Large and Prominent */}
            {primaryStyle?.selections?.[0] &&
              (() => {
                const keystoneRune = getRuneById(
                  primaryStyle.selections[0].perk
                );
                return (
                  <div className="mb-6">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
                      Keystone
                    </div>
                    <div className="flex items-start gap-4 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
                      <div className="shrink-0">
                        <RuneIcon
                          runeId={primaryStyle.selections[0].perk}
                          size="keystone42"
                          variant="keystone"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 text-base font-semibold text-white">
                          {keystoneRune?.name || 'Unknown Rune'}
                        </div>
                        <div className="space-y-1">
                          {/* Multi-var metrics */}
                          {(() => {
                            const selection = primaryStyle.selections[0];
                            const metrics = getAllRuneVarInfos(
                              selection.perk,
                              {
                                var1: selection.var1,
                                var2: selection.var2,
                                var3: selection.var3,
                              },
                              { includeRawUnknown: false }
                            );
                            return metrics.length ? (
                              <ul className="space-y-0.5 text-xs text-amber-300">
                                {metrics.map((m) => (
                                  <li key={m.varKey + m.label}>
                                    • {m.formatted}
                                  </li>
                                ))}
                              </ul>
                            ) : null;
                          })()}

                          {/* Show detailed stats from runeDetailsByRuneId */}
                          {runeDetailsByRuneId?.[
                            primaryStyle.selections[0].perk
                          ]?.length ? (
                            <ul className="space-y-1 text-xs text-green-300">
                              {runeDetailsByRuneId[
                                primaryStyle.selections[0].perk
                              ]!.slice(0, 5).map((d, i) => {
                                const v = Number(d.value ?? 0);
                                const sign = v > 0 ? '+' : v < 0 ? '−' : '';
                                const abs = Math.abs(v);
                                const isTime = /time|duration|active/i.test(
                                  d.statType || ''
                                );
                                const val = isTime
                                  ? `${abs}s`
                                  : abs % 1 === 0
                                    ? abs.toFixed(0)
                                    : abs.toFixed(1);
                                const label = (d.statType || '')
                                  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
                                  .replace(/[_\-]+/g, ' ')
                                  .trim()
                                  .replace(/^./, (c) => c.toUpperCase());
                                return (
                                  <li
                                    key={`${d.statType}-${i}`}
                                    className={
                                      v >= 0 ? 'text-green-300' : 'text-red-300'
                                    }
                                  >
                                    {`${sign}${val} ${label}`}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <div className="text-xs text-purple-300/70">
                              {keystoneRune?.shortDesc?.replace(
                                /<[^>]*>/g,
                                ''
                              ) || 'No description available'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* Minor Runes - 3 rows */}
            <div className="space-y-4">
              {primaryStyle?.selections.slice(1).map((selection, idx) => {
                const rune = getRuneById(selection.perk);
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="shrink-0">
                      <RuneIcon runeId={selection.perk} size="md" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 text-sm font-medium text-white">
                        {rune?.name || 'Unknown Rune'}
                      </div>
                      <div className="space-y-1">
                        {/* Multi-var metrics */}
                        {(() => {
                          const metrics = getAllRuneVarInfos(
                            selection.perk,
                            {
                              var1: selection.var1,
                              var2: selection.var2,
                              var3: selection.var3,
                            },
                            { includeRawUnknown: false }
                          );
                          return metrics.length ? (
                            <ul className="space-y-0.5 text-xs text-amber-300">
                              {metrics.map((m) => (
                                <li key={m.varKey + m.label}>
                                  • {m.formatted}
                                </li>
                              ))}
                            </ul>
                          ) : null;
                        })()}

                        {/* Show detailed stats from runeDetailsByRuneId */}
                        {runeDetailsByRuneId?.[selection.perk]?.length ? (
                          <ul className="space-y-0.5 text-xs text-green-300">
                            {runeDetailsByRuneId[selection.perk]!.slice(
                              0,
                              3
                            ).map((d, i) => {
                              const v = Number(d.value ?? 0);
                              const sign = v > 0 ? '+' : v < 0 ? '−' : '';
                              const abs = Math.abs(v);
                              const isTime = /time|duration|active/i.test(
                                d.statType || ''
                              );
                              const val = isTime
                                ? `${abs}s`
                                : abs % 1 === 0
                                  ? abs.toFixed(0)
                                  : abs.toFixed(1);
                              const label = (d.statType || '')
                                .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
                                .replace(/[_\-]+/g, ' ')
                                .trim()
                                .replace(/^./, (c) => c.toUpperCase());
                              return (
                                <li
                                  key={`${selection.perk}-${d.statType}-${i}`}
                                  className={
                                    v >= 0 ? 'text-green-300' : 'text-red-300'
                                  }
                                >
                                  {`${sign}${val} ${label}`}
                                </li>
                              );
                            })}
                          </ul>
                        ) : null}

                        {/* Show description only if no other data */}
                        {!runeDetailsByRuneId?.[selection.perk]?.length &&
                          (() => {
                            const hasVarValues =
                              selection.var1 > 0 ||
                              selection.var2 > 0 ||
                              selection.var3 > 0;
                            return !hasVarValues ? (
                              <div className="text-xs text-white/60">
                                {rune?.shortDesc
                                  ?.replace(/<[^>]*>/g, '')
                                  .slice(0, 100) || 'No description available'}
                              </div>
                            ) : null;
                          })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Secondary Rune Tree */}
          {secondaryStyle?.selections?.length ? (
            <div className="rounded-xl border border-blue-500/30 bg-gradient-to-br from-blue-900/20 via-black/40 to-black/20 p-6 shadow-lg shadow-blue-500/10 backdrop-blur-sm">
              {/* Tree Header */}
              <div className="mb-6 flex items-center gap-3 border-b border-blue-500/20 pb-4">
                {secondaryTree && (
                  <>
                    <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-2">
                      <RuneTreeIcon treeId={secondaryTree.id} size="sm" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">
                        {secondaryTree.name}
                      </div>
                      <div className="text-xs text-blue-300">
                        Secondary Tree
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Secondary Runes - 2 selections */}
              <div className="space-y-3">
                {secondaryStyle.selections.map((selection, index) => {
                  const rune = getRuneById(selection.perk);
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-4 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="shrink-0">
                        <RuneIcon runeId={selection.perk} size="sm" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 text-sm font-medium text-white">
                          {rune?.name || 'Unknown Rune'}
                        </div>
                        <div className="space-y-1">
                          {/* Multi-var metrics */}
                          {(() => {
                            const metrics = getAllRuneVarInfos(
                              selection.perk,
                              {
                                var1: selection.var1,
                                var2: selection.var2,
                                var3: selection.var3,
                              },
                              { includeRawUnknown: false }
                            );
                            return metrics.length ? (
                              <ul className="space-y-0.5 text-xs text-amber-300">
                                {metrics.map((m) => (
                                  <li key={m.varKey + m.label}>
                                    • {m.formatted}
                                  </li>
                                ))}
                              </ul>
                            ) : null;
                          })()}

                          {/* Show detailed stats from runeDetailsByRuneId */}
                          {runeDetailsByRuneId?.[selection.perk]?.length ? (
                            <ul className="space-y-0.5 text-xs text-green-300">
                              {runeDetailsByRuneId[selection.perk]!.slice(
                                0,
                                3
                              ).map((d, i) => {
                                const v = Number(d.value ?? 0);
                                const sign = v > 0 ? '+' : v < 0 ? '−' : '';
                                const abs = Math.abs(v);
                                const isTime = /time|duration|active/i.test(
                                  d.statType || ''
                                );
                                const val = isTime
                                  ? `${abs}s`
                                  : abs % 1 === 0
                                    ? abs.toFixed(0)
                                    : abs.toFixed(1);
                                const label = (d.statType || '')
                                  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
                                  .replace(/[_\-]+/g, ' ')
                                  .trim()
                                  .replace(/^./, (c) => c.toUpperCase());
                                return (
                                  <li
                                    key={`${selection.perk}-${d.statType}-${i}`}
                                    className={
                                      v >= 0 ? 'text-green-300' : 'text-red-300'
                                    }
                                  >
                                    {`${sign}${val} ${label}`}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : null}

                          {/* Show description only if no other data */}
                          {!runeDetailsByRuneId?.[selection.perk]?.length &&
                            (() => {
                              const hasVarValues =
                                selection.var1 > 0 ||
                                selection.var2 > 0 ||
                                selection.var3 > 0;
                              return !hasVarValues ? (
                                <div className="text-xs text-white/60">
                                  {rune?.shortDesc
                                    ?.replace(/<[^>]*>/g, '')
                                    .slice(0, 100) ||
                                    'No description available'}
                                </div>
                              ) : null;
                            })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* RIGHT: Stat Shards Section */}
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 via-black/40 to-black/20 p-6 shadow-lg shadow-amber-500/10 backdrop-blur-sm">
          <div className="mb-6 border-b border-amber-500/20 pb-4">
            <div className="text-lg font-bold text-white">Stat Shards</div>
            <div className="text-xs text-amber-300">Bonus Stats</div>
          </div>

          <div className="space-y-4">
            {/* Offense Shard */}
            <div className="rounded-lg border border-orange-500/30 bg-gradient-to-br from-orange-900/20 to-orange-900/10 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
                  Offense
                </span>
                <StatShardIcon
                  statShardId={perks.statPerks.offense}
                  size="shard24"
                />
              </div>
              <div className="text-sm font-medium text-orange-200">
                {STAT_SHARDS[perks.statPerks.offense]?.name || 'Unknown'}
              </div>
              <div className="mt-1 text-xs text-orange-300/80">
                {STAT_SHARDS[perks.statPerks.offense]?.description ||
                  'No description'}
              </div>
            </div>

            {/* Flex Shard */}
            <div className="rounded-lg border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-purple-900/10 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                  Flex
                </span>
                <StatShardIcon
                  statShardId={perks.statPerks.flex}
                  size="shard24"
                />
              </div>
              <div className="text-sm font-medium text-purple-200">
                {STAT_SHARDS[perks.statPerks.flex]?.name || 'Unknown'}
              </div>
              <div className="mt-1 text-xs text-purple-300/80">
                {STAT_SHARDS[perks.statPerks.flex]?.description ||
                  'No description'}
              </div>
            </div>

            {/* Defense Shard */}
            <div className="rounded-lg border border-green-500/30 bg-gradient-to-br from-green-900/20 to-green-900/10 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-green-400">
                  Defense
                </span>
                <StatShardIcon
                  statShardId={perks.statPerks.defense}
                  size="shard24"
                />
              </div>
              <div className="text-sm font-medium text-green-200">
                {STAT_SHARDS[perks.statPerks.defense]?.name || 'Unknown'}
              </div>
              <div className="mt-1 text-xs text-green-300/80">
                {STAT_SHARDS[perks.statPerks.defense]?.description ||
                  'No description'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
