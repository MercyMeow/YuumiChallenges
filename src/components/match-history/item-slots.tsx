'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { itemImages, getLatestVersion } from '@/lib/apis/datadragon';
import { useItem } from '@/hooks/use-item-data';

interface ItemSlotProps {
  itemId: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function ItemSlot({ itemId, size = 'md', className = '' }: ItemSlotProps) {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  // Get item data for tooltips
  const { item, isLoading: itemDataLoading, stripHtml } = useItem(itemId);

  const sizes = {
    sm: { width: 20, height: 20 },
    md: { width: 24, height: 24 },
    lg: { width: 32, height: 32 },
  };

  const { width, height } = sizes[size];

  useEffect(() => {
    const loadItemImage = async () => {
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

  if (itemId === 0) {
    return (
      <div 
        className={`bg-black/30 border border-gray-600/30 rounded flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="w-2 h-2 bg-gray-600/50 rounded-full" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div 
        className={`bg-black/30 border border-gray-600/30 rounded animate-pulse ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (hasError || !imageUrl) {
    return (
      <div 
        className={`bg-red-900/20 border border-red-500/30 rounded flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-red-400 text-xs">?</span>
      </div>
    );
  }

  // Format gold value with commas
  const formatGold = (gold: number): string => {
    return gold.toLocaleString();
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`border border-gray-500/30 rounded overflow-hidden hover:border-gray-400/50 transition-colors ${className}`}>
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
      <TooltipContent className="max-w-80 p-3">
        {itemDataLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-purple-400/50 border-t-purple-400 rounded-full animate-spin" />
            <span className="text-sm text-gray-300">Loading item data...</span>
          </div>
        ) : item ? (
          <div className="space-y-2">
            {/* Item Name */}
            <div className="font-semibold text-white text-base">{item.name}</div>
            
            {/* Cost */}
            {item.gold && item.gold.total > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <span className="text-yellow-400">⬟</span>
                <span className="text-yellow-300">{formatGold(item.gold.total)} gold</span>
                {!item.gold.purchasable && (
                  <span className="text-gray-400 text-xs">(Not purchasable)</span>
                )}
              </div>
            )}
            
            {/* Description */}
            {item.description && (
              <div className="text-sm text-gray-300 leading-relaxed border-t border-gray-600/30 pt-2">
                {stripHtml(item.description)}
              </div>
            )}
            
            {/* Sell Value */}
            {item.gold && item.gold.sell > 0 && (
              <div className="text-xs text-gray-400 border-t border-gray-600/30 pt-1">
                Sells for {formatGold(item.gold.sell)} gold
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400">
            Item ID: {itemId}
            <div className="text-xs text-gray-500 mt-1">Item data not available</div>
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

interface ItemSlotsProps {
  items: number[]; // Array of 7 item IDs (6 items + trinket)
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showTrinketSeparately?: boolean;
}

export function ItemSlots({ 
  items, 
  size = 'md', 
  className = '',
  showTrinketSeparately = false 
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

  if (showTrinketSeparately) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="flex gap-1">
          {regularItems.map((itemId, index) => (
            <ItemSlot 
              key={index} 
              itemId={itemId} 
              size={size}
            />
          ))}
        </div>
        <div className="w-px h-4 bg-gray-500/30 mx-1" />
        <ItemSlot itemId={trinket} size={size} />
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
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TrinketSlot({ trinketId, size = 'md', className = '' }: TrinketSlotProps) {
  return (
    <div className={`ring-1 ring-yellow-500/30 rounded ${className}`}>
      <ItemSlot itemId={trinketId} size={size} />
    </div>
  );
}

// Common trinket item IDs for reference
export const TRINKET_IDS = {
  YELLOW_TRINKET: 3340, // Stealth Ward
  BLUE_TRINKET: 3363,   // Farsight Alteration
  RED_TRINKET: 3364,    // Oracle Lens
  // Upgraded trinkets
  YELLOW_UPGRADED: 3341,
  BLUE_UPGRADED: 3363,  // Same as base
  RED_UPGRADED: 3364,   // Same as base
} as const;

/**
 * Helper function to check if an item ID is a trinket
 */
export function isTrinket(itemId: number): boolean {
  return Object.values(TRINKET_IDS).includes(itemId as any);
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