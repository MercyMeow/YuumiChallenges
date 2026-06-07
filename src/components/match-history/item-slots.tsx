'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { itemImages } from '@/lib/apis/datadragon';
import { useItem } from '@/hooks/use-item-data';
import { sanitizeRiotHtml } from '@/lib/utils/sanitize-html';

interface ItemSlotProps {
  itemId: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ItemSlot({
  itemId,
  size = 'md',
  className = '',
}: ItemSlotProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Get item data for tooltips
  const { item, isLoading: itemDataLoading } = useItem(itemId);

  const sizes = {
    sm: { width: 20, height: 20 },
    md: { width: 24, height: 24 },
    lg: { width: 32, height: 32 },
    xl: { width: 40, height: 40 },
  };

  const { width, height } = sizes[size];

  useEffect(() => {
    // Development diagnostics
    if (process.env.NODE_ENV !== 'production') {
      if (
        itemId == null ||
        Number.isNaN(itemId) ||
        typeof itemId !== 'number'
      ) {
        console.error('[ItemSlot] Invalid itemId provided:', itemId);
      }
    }

    const loadItemImage = async () => {
      // Treat invalid ids like empty slot to avoid invalid renders
      if (typeof itemId !== 'number' || Number.isNaN(itemId) || itemId < 0) {
        setImageUrl('');
        setIsLoading(false);
        setHasError(true);
        return;
      }

      if (itemId === 0) {
        setImageUrl('');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setHasError(false);
        const url = await itemImages.icon(itemId.toString());
        setImageUrl(url);
      } catch (error) {
        console.error('Error loading item image:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadItemImage();
  }, [itemId]);

  if (
    itemId === 0 ||
    typeof itemId !== 'number' ||
    Number.isNaN(itemId) ||
    itemId < 0
  ) {
    return (
      <div
        className={`flex items-center justify-center rounded border border-gray-600/30 bg-black/30 ${className}`}
        style={{ width, height }}
        title={
          process.env.NODE_ENV !== 'production' &&
          (typeof itemId !== 'number' || Number.isNaN(itemId) || itemId < 0)
            ? 'Invalid item id'
            : undefined
        }
      >
        <div className="h-2 w-2 rounded-full bg-gray-600/50" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`animate-pulse rounded border border-gray-600/30 bg-black/30 ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (hasError || !imageUrl) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[ItemSlot] Failed to resolve image URL for itemId:',
        itemId,
        { hasError, imageUrl }
      );
    }
    return (
      <div
        className={`flex items-center justify-center rounded border border-red-500/30 bg-red-900/20 ${className}`}
        style={{ width, height }}
        title="Image not available"
      >
        <span className="text-xs text-red-400">?</span>
      </div>
    );
  }

  // Format gold value with commas
  const formatGold = (gold: number): string => {
    return gold.toLocaleString();
  };

  // Enhanced HTML parser with stat-based coloring
  const parseItemDescription = (html: string): React.JSX.Element => {
    if (!html) return <span></span>;

    // Parse HTML and apply color-coding based on stat types
    const processedHtml = html
      // Handle passive/active ability headers
      .replace(
        /<font color="#([^"]+)"[^>]*>([^<]*)<\/font>/gi,
        (_, color, text) => {
          // Preserve original color for special formatting
          return `<span style="color: #${color}">${text}</span>`;
        }
      )
      // Color damage/AD stats
      .replace(
        /\b(\+?\d+(?:\.\d+)?(?:%)?\s*(?:attack damage|ad|physical damage|damage|lethality))\b/gi,
        '<span class="text-accessible-red">$1</span>'
      )
      // Color ability power stats
      .replace(
        /\b(\+?\d+(?:\.\d+)?(?:%)?\s*(?:ability power|ap|magic damage|spell damage))\b/gi,
        '<span class="text-accessible-blue">$1</span>'
      )
      // Color health stats
      .replace(
        /\b(\+?\d+(?:\.\d+)?(?:%)?\s*(?:health|hp|health regeneration|health regen))\b/gi,
        '<span class="text-accessible-green">$1</span>'
      )
      // Color magic resistance
      .replace(
        /\b(\+?\d+(?:\.\d+)?(?:%)?\s*(?:magic resist|magic resistance|mr))\b/gi,
        '<span class="text-accessible-purple">$1</span>'
      )
      // Color armor
      .replace(
        /\b(\+?\d+(?:\.\d+)?(?:%)?\s*armor)\b/gi,
        '<span class="text-accessible-yellow">$1</span>'
      )
      // Color movement speed
      .replace(
        /\b(\+?\d+(?:\.\d+)?(?:%)?\s*(?:movement speed|move speed|ms))\b/gi,
        '<span class="text-accessible-cyan">$1</span>'
      )
      // Color cooldown reduction
      .replace(
        /\b(\+?\d+(?:\.\d+)?(?:%)?\s*(?:cooldown reduction|cdr|ability haste|ah))\b/gi,
        '<span class="text-accessible-blue">$1</span>'
      )
      // Color critical strike
      .replace(
        /\b(\+?\d+(?:\.\d+)?(?:%)?\s*(?:critical strike|crit|critical strike chance))\b/gi,
        '<span class="text-accessible-orange">$1</span>'
      )
      // Color attack speed
      .replace(
        /\b(\+?\d+(?:\.\d+)?(?:%)?\s*(?:attack speed|as))\b/gi,
        '<span class="text-accessible-orange">$1</span>'
      )
      // Color mana and mana regen
      .replace(
        /\b(\+?\d+(?:\.\d+)?(?:%)?\s*(?:mana|mana regeneration|mana regen|mp5))\b/gi,
        '<span class="text-accessible-blue">$1</span>'
      )
      // Color life steal and omnivamp
      .replace(
        /\b(\+?\d+(?:\.\d+)?(?:%)?\s*(?:life steal|lifesteal|omnivamp|spell vamp))\b/gi,
        '<span class="text-accessible-red">$1</span>'
      )
      // Clean up remaining HTML tags but preserve our styled spans
      .replace(/<(?!\/?(span|br)\b)[^>]*>/gi, '')
      // Handle line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Handle HTML entities
      .replace(/&nbsp;/gi, ' ')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");

    // Split by newlines and render as separate elements
    const lines = processedHtml.split('\n').filter((line) => line.trim());

    return (
      <div className="space-y-1">
        {lines.map((line, index) => {
          // Check if line contains styled spans
          if (line.includes('<span')) {
            return (
              <div
                key={index}
                dangerouslySetInnerHTML={{
                  __html: sanitizeRiotHtml(line.trim()),
                }}
                className="leading-relaxed"
              />
            );
          }
          return (
            <div key={index} className="leading-relaxed text-gray-300">
              {line.trim()}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`overflow-hidden rounded border border-gray-500/30 transition-colors hover:border-gray-400/50 ${className}`}
        >
          <Image
            src={imageUrl}
            alt={item?.name || `Item ${itemId}`}
            width={width}
            height={height}
            className="object-cover"
            onError={() => setHasError(true)}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-80 border-purple-500/30 bg-black/85 p-4 shadow-lg shadow-purple-500/20 backdrop-blur-md">
        {itemDataLoading ? (
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 animate-spin rounded-full border border-purple-400/50 border-t-purple-400" />
            <span className="text-sm text-purple-300">
              Loading item data...
            </span>
          </div>
        ) : item ? (
          <div className="space-y-3">
            {/* Header with Item Icon and Name */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={item.name}
                    width={32}
                    height={32}
                    className="rounded border border-purple-500/30"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold leading-tight text-white">
                  {item.name}
                </div>
                {/* Cost */}
                {item.gold && item.gold.total > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-sm">
                    <span className="text-yellow-400">⬟</span>
                    <span className="text-yellow-300">
                      {formatGold(item.gold.total)} gold
                    </span>
                    {!item.gold.purchasable && (
                      <span className="text-xs text-gray-400">
                        (Not purchasable)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div className="border-t border-purple-500/20 pt-3 text-sm leading-relaxed">
                {parseItemDescription(item.description)}
              </div>
            )}

            {/* Sell Value */}
            {item.gold && item.gold.sell > 0 && (
              <div className="border-t border-purple-500/10 pt-2 text-xs text-gray-400">
                Sells for {formatGold(item.gold.sell)} gold
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-300">
            Item ID: {itemId}
            <div className="mt-1 text-xs text-gray-400">
              Item data not available
            </div>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

interface ItemSlotsProps {
  items: number[]; // Array of 7 item IDs (6 items + trinket)
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTrinketSeparately?: boolean;
  gridLayout?: boolean; // New prop for 3x2 grid layout
}

export function ItemSlots({
  items,
  size = 'md',
  className = '',
  showTrinketSeparately = false,
  gridLayout = false,
}: ItemSlotsProps) {
  // Ensure we have exactly 7 slots (6 items + trinket)
  // Safe spread operation - handle undefined/null items array
  const safeItems = Array.isArray(items) ? items : [];
  const paddedItems = [...safeItems];
  while (paddedItems.length < 7) {
    paddedItems.push(0);
  }
  paddedItems.length = 7; // Truncate if more than 7

  const regularItems = paddedItems.slice(0, 6);
  const trinket = paddedItems[6];

  // Grid layout (3x2 + trinket separately)
  if (gridLayout) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="grid grid-cols-3 gap-1">
          {regularItems.map((itemId, index) => (
            <ItemSlot key={index} itemId={itemId} size={size} />
          ))}
        </div>
        <div className="mx-1 h-6 w-px bg-gray-500/30" />
        <ItemSlot
          itemId={trinket || 0}
          size={size}
          className="ring-1 ring-yellow-500/30"
        />
      </div>
    );
  }

  if (showTrinketSeparately) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="flex gap-1">
          {regularItems.map((itemId, index) => (
            <ItemSlot key={index} itemId={itemId} size={size} />
          ))}
        </div>
        <div className="mx-1 h-4 w-px bg-gray-500/30" />
        <ItemSlot itemId={trinket || 0} size={size} />
      </div>
    );
  }

  return (
    <div className={`flex gap-1 ${className}`}>
      {paddedItems.map((itemId, index) => (
        <ItemSlot
          key={index}
          itemId={itemId}
          size={size}
          className={index === 6 ? 'ring-1 ring-yellow-500/30' : ''}
        />
      ))}
    </div>
  );
}

interface TrinketSlotProps {
  trinketId: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function TrinketSlot({
  trinketId,
  size = 'md',
  className = '',
}: TrinketSlotProps) {
  return (
    <div className={`rounded ring-1 ring-yellow-500/30 ${className}`}>
      <ItemSlot itemId={trinketId} size={size} />
    </div>
  );
}

// Common trinket item IDs for reference
export const TRINKET_IDS = {
  YELLOW_TRINKET: 3340, // Stealth Ward
  BLUE_TRINKET: 3363, // Farsight Alteration
  RED_TRINKET: 3364, // Oracle Lens
  // Upgraded trinkets
  YELLOW_UPGRADED: 3341,
  BLUE_UPGRADED: 3363, // Same as base
  RED_UPGRADED: 3364, // Same as base
} as const;

/**
 * Helper function to check if an item ID is a trinket
 */
export function isTrinket(itemId: number): boolean {
  return Object.values(TRINKET_IDS).includes(
    itemId as (typeof TRINKET_IDS)[keyof typeof TRINKET_IDS]
  );
}

/**
 * Helper function to get trinket display name
 */
export function getTrinketName(trinketId: number): string {
  switch (trinketId) {
    case TRINKET_IDS.YELLOW_TRINKET:
    case TRINKET_IDS.YELLOW_UPGRADED:
      return 'Stealth Ward';
    case TRINKET_IDS.BLUE_TRINKET:
    case TRINKET_IDS.BLUE_UPGRADED:
      return 'Farsight Alteration';
    case TRINKET_IDS.RED_TRINKET:
    case TRINKET_IDS.RED_UPGRADED:
      return 'Oracle Lens';
    default:
      return `Trinket ${trinketId}`;
  }
}
