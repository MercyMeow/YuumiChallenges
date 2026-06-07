'use client';

import { useState, useEffect } from 'react';
import { ItemData } from '@/lib/apis/datadragon';

interface ItemDataResponse {
  items: Record<string, ItemData>;
  cached: boolean;
  cacheAge?: number;
  timestamp?: string;
  itemCount?: number;
  fallback?: boolean;
  error?: string;
}

// Client-side cache for item data
let clientItemCache: Record<string, ItemData> | null = null;
let clientCacheTime = 0;
const CLIENT_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function useItemData() {
  const [itemData, setItemData] = useState<Record<string, ItemData> | null>(
    clientItemCache
  );
  const [isLoading, setIsLoading] = useState(!clientItemCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchItemData = async () => {
      const now = Date.now();

      // Use cached data if still valid
      if (clientItemCache && now - clientCacheTime < CLIENT_CACHE_DURATION) {
        setItemData(clientItemCache);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/data-dragon/items', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch item data: ${response.status}`);
        }

        const data: ItemDataResponse = await response.json();

        // Update client cache
        clientItemCache = data.items;
        clientCacheTime = now;

        setItemData(data.items);
      } catch (err) {
        console.error('Error fetching item data:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch item data'
        );

        // Use cached data if available, even if expired
        if (clientItemCache) {
          setItemData(clientItemCache);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchItemData();
  }, []);

  // Helper function to get a specific item
  const getItem = (itemId: string | number): ItemData | null => {
    if (!itemData) return null;
    const id = itemId.toString();
    return itemData[id] || null;
  };

  // Helper function to strip HTML tags from description
  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, '');
  };

  return {
    itemData,
    isLoading,
    error,
    getItem,
    stripHtml,
  };
}

// Hook for getting a specific item (useful for single item components)
export function useItem(itemId: string | number) {
  const { isLoading, error, getItem, stripHtml } = useItemData();

  const item = itemId && itemId !== 0 ? getItem(itemId) : null;

  return {
    item,
    isLoading,
    error,
    stripHtml,
  };
}
