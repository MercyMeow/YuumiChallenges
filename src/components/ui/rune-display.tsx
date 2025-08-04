'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  className = '' 
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
          "bg-black/30 border border-gray-600/30 rounded animate-pulse",
          variant === 'keystone' && "border-purple-500/30 bg-purple-500/10",
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
          "bg-red-900/20 border border-red-500/30 rounded flex items-center justify-center",
          className
        )}
        style={{ width, height }}
      >
        <div className="w-4 h-4 bg-gray-600/30 rounded border border-gray-500/50">
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
        "border rounded overflow-hidden hover:border-opacity-70 transition-colors cursor-pointer",
        variant === 'keystone' 
          ? "border-purple-500/50 bg-purple-500/10 hover:border-purple-400/70 shadow-purple-500/20 shadow-sm" 
          : "border-gray-500/30 hover:border-gray-400/50",
        className
      )}
    >
      <Image
        src={imageUrl}
        alt={rune.name}
        width={width}
        height={height}
        className="object-cover w-full h-full"
        onError={() => setHasError(true)}
      />
    </div>
  );

  if (!showTooltip) {
    return content;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent className="max-w-80 p-4 backdrop-blur-md bg-black/85 border-purple-500/30 shadow-lg shadow-purple-500/20">
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
                  "rounded border",
                  variant === 'keystone' 
                    ? "border-purple-500/50 shadow-purple-500/20 shadow-sm" 
                    : "border-purple-500/30"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className={cn(
                "font-semibold text-base leading-tight",
                variant === 'keystone' ? "text-purple-300" : "text-white"
              )}>
                {rune.name}
              </div>
              {variant === 'keystone' && (
                <div className="text-xs text-purple-400 mt-1">Keystone</div>
              )}
            </div>
          </div>
          
          {/* Short Description */}
          {rune.shortDesc && (
            <div className="text-sm text-blue-300 leading-relaxed border-t border-purple-500/20 pt-3">
              {rune.shortDesc}
            </div>
          )}
          
          {/* Long Description */}
          {rune.longDesc && rune.longDesc !== rune.shortDesc && (
            <div className="text-xs text-gray-300 leading-relaxed border-t border-purple-500/10 pt-2">
              {rune.longDesc}
            </div>
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
  className = '' 
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
          "bg-red-900/20 border border-red-500/30 rounded flex items-center justify-center",
          className
        )}
        style={{ width, height }}
      >
        <span className="text-red-400 text-xs">?</span>
      </div>
    );
  }

  const content = (
    <div 
      className={cn(
        "border rounded flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity cursor-pointer",
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
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent className="max-w-60 p-3 backdrop-blur-md bg-black/85 border-purple-500/30 shadow-lg shadow-purple-500/20">
        <div className="space-y-2">
          <div className="font-semibold text-white text-sm">{statShard.name}</div>
          <div className="text-xs text-gray-300">{statShard.description}</div>
          <div className="text-xs text-purple-400 capitalize">{statShard.slot} Shard</div>
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
  className = '' 
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
      <div className={cn("flex items-center gap-2", className)}>
        <div 
          className="bg-black/30 border border-gray-600/30 rounded animate-pulse"
          style={{ width, height }}
        />
        {showName && (
          <div className="bg-black/30 h-4 w-16 rounded animate-pulse" />
        )}
      </div>
    );
  }

  if (hasError || !imageUrl || !tree) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div 
          className="bg-red-900/20 border border-red-500/30 rounded flex items-center justify-center"
          style={{ width, height }}
        >
          <span className="text-red-400 text-xs">?</span>
        </div>
        {showName && (
          <span className="text-red-400 text-sm">Unknown Tree</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="border border-gray-500/30 rounded overflow-hidden">
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
        <span className="text-white text-sm font-medium">{tree.name}</span>
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

export function RuneTreeDisplay({ perks, compact = false, className = '' }: RuneTreeDisplayProps) {
  const { getRuneTreeById } = useRuneData();

  if (!perks?.styles?.length) {
    return (
      <div className={cn("p-4 bg-red-900/20 border border-red-500/30 rounded text-center", className)}>
        <span className="text-red-400">No rune data available</span>
      </div>
    );
  }

  const primaryStyle = perks.styles[0];
  const secondaryStyle = perks.styles[1];
  const primaryTree = primaryStyle ? getRuneTreeById(primaryStyle.style) : null;
  const secondaryTree = secondaryStyle ? getRuneTreeById(secondaryStyle.style) : null;

  if (compact) {
    // Compact mode - show only keystone and stat shards
    const keystone = primaryStyle?.selections[0];
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {keystone && (
          <RuneIcon 
            runeId={keystone.perk} 
            size="sm" 
            variant="keystone"
          />
        )}
        <div className="flex gap-1">
          <StatShardIcon statShardId={perks.statPerks.offense} size="xs" />
          <StatShardIcon statShardId={perks.statPerks.flex} size="xs" />
          <StatShardIcon statShardId={perks.statPerks.defense} size="xs" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Primary Tree */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {primaryTree && (
            <RuneTreeIcon 
              treeId={primaryTree.id} 
              size="sm" 
              showName 
            />
          )}
          <span className="text-purple-400 text-sm font-medium">Primary Tree</span>
        </div>
        
        <div className="grid grid-cols-4 gap-3">
          {primaryStyle?.selections.map((selection, index) => (
            <div key={index} className="space-y-2">
              <RuneIcon 
                runeId={selection.perk} 
                size={index === 0 ? "lg" : "md"}
                variant={index === 0 ? "keystone" : "normal"}
              />
              
              {/* Show stat values if they exist */}
              {(selection.var1 > 0 || selection.var2 > 0 || selection.var3 > 0) && (
                <div className="text-xs text-center space-y-1">
                  {selection.var1 > 0 && (
                    <div className="text-green-400">+{selection.var1}</div>
                  )}
                  {selection.var2 > 0 && (
                    <div className="text-blue-400">+{selection.var2}</div>
                  )}
                  {selection.var3 > 0 && (
                    <div className="text-purple-400">+{selection.var3}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Tree */}
      {secondaryStyle && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {secondaryTree && (
              <RuneTreeIcon 
                treeId={secondaryTree.id} 
                size="sm" 
                showName 
              />
            )}
            <span className="text-blue-400 text-sm font-medium">Secondary Tree</span>
          </div>
          
          <div className="flex gap-3">
            {secondaryStyle.selections.map((selection, index) => (
              <div key={index} className="space-y-2">
                <RuneIcon 
                  runeId={selection.perk} 
                  size="md"
                />
                
                {/* Show stat values if they exist */}
                {(selection.var1 > 0 || selection.var2 > 0 || selection.var3 > 0) && (
                  <div className="text-xs text-center space-y-1">
                    {selection.var1 > 0 && (
                      <div className="text-green-400">+{selection.var1}</div>
                    )}
                    {selection.var2 > 0 && (
                      <div className="text-blue-400">+{selection.var2}</div>
                    )}
                    {selection.var3 > 0 && (
                      <div className="text-purple-400">+{selection.var3}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat Shards */}
      <div className="space-y-3">
        <span className="text-yellow-400 text-sm font-medium">Stat Shards</span>
        <div className="flex gap-4 justify-center">
          <div className="text-center space-y-2">
            <StatShardIcon statShardId={perks.statPerks.offense} size="md" />
            <div className="text-xs text-orange-400">Offense</div>
          </div>
          <div className="text-center space-y-2">
            <StatShardIcon statShardId={perks.statPerks.flex} size="md" />
            <div className="text-xs text-purple-400">Flex</div>
          </div>
          <div className="text-center space-y-2">
            <StatShardIcon statShardId={perks.statPerks.defense} size="md" />
            <div className="text-xs text-green-400">Defense</div>
          </div>
        </div>
      </div>
    </div>
  );
}