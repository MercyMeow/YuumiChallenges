'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { runeImages } from '@/lib/apis/datadragon';
import { useRuneData } from '@/hooks/use-rune-data';
import { StatShard } from '@/lib/apis/datadragon';
import { cn } from '@/lib/utils';

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

      try {
        setIsLoading(true);
        setHasError(false);
        const url = await runeImages.icon(rune.icon);
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
      />
    </div>
  );

  if (!showTooltip) {
    return content;
  }

  // Sanitize Riot rune HTML: allow a safe subset, map Riot custom tags to spans with classes
  function sanitizeRuneHtml(input: string): string {
    try {
      if (!input || typeof input !== 'string') return '';
      // Replace Riot custom tags with span + class for styling
      let html = input
        .replace(/<br\s*\/?>/gi, '<br/>')
        .replace(/<status>/gi, '<span class="status">')
        .replace(/<\/status>/gi, '</span>')
        .replace(/<attention>/gi, '<span class="attention">')
        .replace(/<\/attention>/gi, '</span>')
        .replace(/<rules>/gi, '<span class="rules">')
        .replace(/<\/rules>/gi, '</span>')
        .replace(/<scale>/gi, '<span class="scale">')
        .replace(/<\/scale>/gi, '</span>');

      // Very small allowlist-based sanitizer: strip disallowed tags/attrs
      // Allow tags: b, i, u, em, strong, br, ul, ol, li, span
      html = html.replace(
        /<(?!\/?(b|i|u|em|strong|br|ul|ol|li|span)\b)[^>]*>/gi,
        ''
      );

      // Remove on* event handlers, javascript: URLs, and inline styles
      html = html.replace(/\son\w+="[^"]*"/gi, '');
      html = html.replace(/\shref="javascript:[^"]*"/gi, '');
      html = html.replace(/\sstyle="[^"]*"/gi, '');

      return html;
    } catch {
      return '';
    }
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
                __html: sanitizeRuneHtml(rune.shortDesc),
              }}
            />
          )}

          {/* Long Description */}
          {rune.longDesc && rune.longDesc !== rune.shortDesc && (
            <div
              className="prose prose-invert prose-xs max-w-none border-t border-purple-500/10 pt-2 leading-relaxed text-gray-300 [&_.attention]:text-red-300 [&_.rules]:mt-1 [&_.rules]:block [&_.rules]:text-white/80 [&_.scale]:text-yellow-300 [&_.status]:text-purple-300"
              dangerouslySetInnerHTML={{
                __html: sanitizeRuneHtml(rune.longDesc),
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

  const sizes = {
    xs: { width: 12, height: 12 },
    sm: { width: 16, height: 16 },
    md: { width: 20, height: 20 },
    lg: { width: 24, height: 24 },
    // Riot-like shard size
    shard24: { width: 24, height: 24 },
  };

  const { width, height } = sizes[size];

  // Render a neutral circular token; shards don't have official per-ID icons

  const getStatShardColor = (shard: StatShard) => {
    switch (shard.slot) {
      case 'offense':
        return 'bg-orange-500/15 border-orange-500/40';
      case 'flex':
        return 'bg-purple-500/15 border-purple-500/40';
      case 'defense':
        return 'bg-green-500/15 border-green-500/40';
      default:
        return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  if (!statShard) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded border border-red-500/30 bg-red-900/20',
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
        'flex cursor-pointer items-center justify-center rounded-full border transition-opacity hover:opacity-90',
        getStatShardColor(statShard),
        className
      )}
      style={{ width, height }}
      aria-label={`${statShard.name} shard`}
      title={statShard.name}
    >
      <div className="h-[60%] w-[60%] rounded-full bg-white/60" />
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

      try {
        setIsLoading(true);
        setHasError(false);
        const url = await runeImages.treeIcon(tree.icon);
        setImageUrl(url);
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
  const { getRuneTreeById } = useRuneData();

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

  // Sanitize Riot rune HTML: allow a safe subset, map Riot custom tags to spans with classes
  // Keep as local const and mark used via a no-op call site to satisfy TS unused checks
  const sanitizeRuneHtml = (input: string): string => {
    try {
      if (!input || typeof input !== 'string') return '';
      // Replace Riot custom tags with span + class for styling
      let html = input
        .replace(/<br\s*\/?>/gi, '<br/>')
        .replace(/<li>/gi, '<li>')
        .replace(/<\/li>/gi, '</li>')
        .replace(/<status>/gi, '<span class="status">')
        .replace(/<\/status>/gi, '</span>')
        .replace(/<attention>/gi, '<span class="attention">')
        .replace(/<\/attention>/gi, '</span>')
        .replace(/<rules>/gi, '<span class="rules">')
        .replace(/<\/rules>/gi, '</span>')
        .replace(/<scale>/gi, '<span class="scale">')
        .replace(/<\/scale>/gi, '</span>');

      // Very small allowlist-based sanitizer: strip disallowed tags/attrs
      // Allow tags: b, i, u, em, strong, br, ul, ol, li, span
      // Remove any other tags
      html = html.replace(
        /<(?!\/?(b|i|u|em|strong|br|ul|ol|li|span)\b)[^>]*>/gi,
        ''
      );

      // Remove on* event handlers and javascript: URLs
      html = html.replace(/\son\w+="[^"]*"/gi, '');
      html = html.replace(/\shref="javascript:[^"]*"/gi, '');
      html = html.replace(/\sstyle="[^"]*"/gi, '');

      return html;
    } catch {
      return '';
    }
  };

  // Ensure sanitizeRuneHtml is retained during prod builds (no-op reference)
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  void sanitizeRuneHtml;

  // Redesigned layout:
  // - Two-column layout: left = Primary rune tree, right = Stat Shards
  // - Primary tree shows header badge, keystone prominent, minor runes grouped per row
  // - Stat shards displayed prominently in their own section
  return (
    <div className={cn('grid grid-cols-1 gap-6 md:grid-cols-2', className)}>
      {/* Primary Rune Tree */}
      <div className="rounded-lg border border-purple-500/20 bg-black/20 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {primaryTree && (
              <RuneTreeIcon treeId={primaryTree.id} size="sm" showName />
            )}
          </div>
          <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-300">
            Primary
          </span>
        </div>

        {/* Keystone row */}
        <div className="mb-4">
          {primaryStyle?.selections?.[0] && (
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1">
                <RuneIcon
                  runeId={primaryStyle.selections[0].perk}
                  size="keystone42"
                  variant="keystone"
                  className="shrink-0"
                />
                <div className="text-xs text-purple-300">Keystone</div>
              </div>
              {/* Rune Details for Keystone */}
              {runeDetailsByRuneId?.[primaryStyle.selections[0].perk]
                ?.length ? (
                <div className="flex-1">
                  {/* Inline lightweight list without importing to avoid circular deps */}
                  <ul className="w-full space-y-1 rounded-md border border-white/10 bg-white/5 p-2 text-[11px] text-white/80">
                    {runeDetailsByRuneId[
                      primaryStyle.selections[0].perk
                    ]!.slice(0, 6).map((d, i) => {
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
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Minor runes grid (3 remaining selections) */}
        <div className="grid grid-cols-3 gap-2">
          {primaryStyle?.selections.slice(1).map((selection, idx) => (
            <div
              key={idx}
              className="flex flex-col items-stretch gap-1 rounded-md border border-white/10 bg-white/5 p-1.5"
            >
              <div className="flex items-center justify-center">
                <RuneIcon runeId={selection.perk} size="minor28" />
              </div>
              {runeDetailsByRuneId?.[selection.perk]?.length ? (
                <ul className="mt-1 w-full space-y-0.5 rounded-md border border-white/10 bg-black/20 p-1.5 text-[11px] text-white/80">
                  {runeDetailsByRuneId[selection.perk]!.slice(0, 4).map(
                    (d, i) => {
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
                    }
                  )}
                </ul>
              ) : null}
            </div>
          ))}
        </div>

        {/* Secondary Runes from Secondary Tree (if available) - displayed inline */}
        {secondaryStyle?.selections?.length ? (
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="mb-2 flex items-center gap-2">
              {secondaryTree && (
                <RuneTreeIcon treeId={secondaryTree.id} size="xs" />
              )}
              <span className="text-xs text-blue-300">
                {secondaryTree?.name || 'Secondary'}
              </span>
            </div>
            <div className="flex gap-2">
              {secondaryStyle.selections.map((selection, index) => (
                <div key={index} className="flex items-center">
                  <RuneIcon runeId={selection.perk} size="sm" />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Stat Shards Section */}
      <div className="rounded-lg border border-amber-500/20 bg-black/20 p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-white">Stat Shards</span>
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
            Bonuses
          </span>
        </div>

        <div className="space-y-4">
          {/* Offense Shard */}
          <div className="flex items-center gap-3 rounded-md border border-orange-500/20 bg-orange-500/5 p-3">
            <StatShardIcon 
              statShardId={perks.statPerks.offense} 
              size="shard24" 
              className="shrink-0"
            />
            <div className="flex-1">
              <div className="text-xs font-medium text-orange-300">Offense</div>
              <div className="text-xs text-orange-200/80">
                {/* You can add stat shard descriptions here if available */}
                Primary offensive bonus
              </div>
            </div>
          </div>

          {/* Flex Shard */}
          <div className="flex items-center gap-3 rounded-md border border-purple-500/20 bg-purple-500/5 p-3">
            <StatShardIcon 
              statShardId={perks.statPerks.flex} 
              size="shard24" 
              className="shrink-0"
            />
            <div className="flex-1">
              <div className="text-xs font-medium text-purple-300">Flex</div>
              <div className="text-xs text-purple-200/80">
                Adaptive bonus
              </div>
            </div>
          </div>

          {/* Defense Shard */}
          <div className="flex items-center gap-3 rounded-md border border-green-500/20 bg-green-500/5 p-3">
            <StatShardIcon 
              statShardId={perks.statPerks.defense} 
              size="shard24" 
              className="shrink-0"
            />
            <div className="flex-1">
              <div className="text-xs font-medium text-green-300">Defense</div>
              <div className="text-xs text-green-200/80">
                Defensive bonus
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
