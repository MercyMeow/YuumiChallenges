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
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
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
          ? 'border-purple-500/50 bg-purple-500/10 shadow-sm shadow-purple-500/20 hover:border-purple-400/70'
          : 'border-gray-500/30 hover:border-gray-400/50',
        className
      )}
    >
      <Image
        src={imageUrl}
        alt={rune.name}
        width={width}
        height={height}
        className="h-full w-full object-cover"
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
  size?: 'xs' | 'sm' | 'md' | 'lg';
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
  };

  const { width, height } = sizes[size];

  // Static stat shard icon based on type (since these don't have individual images)
  const getStatShardIcon = (shard: StatShard) => {
    switch (shard.slot) {
      case 'offense':
        return '⚔️';
      case 'flex':
        return '🛡️';
      case 'defense':
        return '❤️';
      default:
        return '?';
    }
  };

  const getStatShardColor = (shard: StatShard) => {
    switch (shard.slot) {
      case 'offense':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'flex':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'defense':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
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
        'flex cursor-pointer items-center justify-center rounded border text-xs font-bold transition-opacity hover:opacity-80',
        getStatShardColor(statShard),
        className
      )}
      style={{ width, height }}
    >
      {getStatShardIcon(statShard)}
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
}

export function RuneTreeDisplay({
  perks,
  compact = false,
  className = '',
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
  // - Two-column card: left = Primary, right = Secondary
  // - Each tree shows header badge, keystone prominent, minor runes grouped per row
  // - Stat shards as compact pill row with labels
  return (
    <div className={cn('grid grid-cols-1 gap-6 lg:grid-cols-3', className)}>
      {/* Primary and Secondary Column Container */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:col-span-2">
        {/* Primary */}
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
              <div className="flex items-center gap-3">
                <RuneIcon
                  runeId={primaryStyle.selections[0].perk}
                  size="xl"
                  variant="keystone"
                  className="shrink-0"
                />
                <div className="text-xs text-purple-300">Keystone</div>
              </div>
            )}
          </div>

          {/* Minor runes grid (3 remaining selections) */}
          <div className="grid grid-cols-3 gap-3">
            {primaryStyle?.selections.slice(1).map((selection, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-1 rounded-md border border-white/5 bg-white/5 p-2"
              >
                <RuneIcon runeId={selection.perk} size="md" />
                {(selection.var1 > 0 ||
                  selection.var2 > 0 ||
                  selection.var3 > 0) && (
                  <div className="grid grid-cols-3 gap-0.5 text-[10px] leading-none">
                    {selection.var1 > 0 && (
                      <span className="text-accessible-green">
                        +{selection.var1}
                      </span>
                    )}
                    {selection.var2 > 0 && (
                      <span className="text-accessible-blue">
                        +{selection.var2}
                      </span>
                    )}
                    {selection.var3 > 0 && (
                      <span className="text-purple-300">+{selection.var3}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Secondary */}
        <div className="rounded-lg border border-blue-500/20 bg-black/20 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {secondaryTree && (
                <RuneTreeIcon treeId={secondaryTree.id} size="sm" showName />
              )}
            </div>
            <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-300">
              Secondary
            </span>
          </div>

          {/* Secondary runes (2 picks) */}
          <div className="grid grid-cols-2 gap-3">
            {secondaryStyle?.selections.map((selection, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-1 rounded-md border border-white/5 bg-white/5 p-2"
              >
                <RuneIcon runeId={selection.perk} size="md" />
                {(selection.var1 > 0 ||
                  selection.var2 > 0 ||
                  selection.var3 > 0) && (
                  <div className="grid grid-cols-3 gap-0.5 text-[10px] leading-none">
                    {selection.var1 > 0 && (
                      <span className="text-accessible-green">
                        +{selection.var1}
                      </span>
                    )}
                    {selection.var2 > 0 && (
                      <span className="text-accessible-blue">
                        +{selection.var2}
                      </span>
                    )}
                    {selection.var3 > 0 && (
                      <span className="text-purple-300">+{selection.var3}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat shards side panel */}
      <div className="rounded-lg border border-yellow-500/20 bg-black/20 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-yellow-300">
            Stat Shards
          </span>
          <span className="text-xxs rounded-md border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-yellow-300">
            3 Picks
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatShardIcon statShardId={perks.statPerks.offense} size="lg" />
            <div className="leading-tight">
              <div className="text-xs text-orange-300">Offense</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatShardIcon statShardId={perks.statPerks.flex} size="lg" />
            <div className="leading-tight">
              <div className="text-xs text-purple-300">Flex</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatShardIcon statShardId={perks.statPerks.defense} size="lg" />
            <div className="leading-tight">
              <div className="text-xs text-green-300">Defense</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="text-xxs mt-4 grid grid-cols-3 gap-2 text-white/60">
          <div className="rounded border border-orange-500/20 bg-orange-500/5 p-2 text-center">
            Damage
          </div>
          <div className="rounded border border-purple-500/20 bg-purple-500/5 p-2 text-center">
            Adaptive
          </div>
          <div className="rounded border border-green-500/20 bg-green-500/5 p-2 text-center">
            Defense
          </div>
        </div>
      </div>
    </div>
  );
}
