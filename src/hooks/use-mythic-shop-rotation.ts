'use client';

import { useEffect, useState } from 'react';
import type { MythicShopRotation } from '@/lib/mythic-shop/types';

interface RotationResponse extends MythicShopRotation {
  cached?: boolean;
  error?: string;
}

interface UseMythicShopRotationReturn {
  rotation: MythicShopRotation | null;
  isLoading: boolean;
  error: string | null;
}

// Client-side cache aligned with the server TTL to avoid redundant fetches
// across navigations within the same session.
let clientRotationCache: MythicShopRotation | null = null;
let clientCacheTime = 0;
const CLIENT_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/** Fetches the current Mythic Shop rotation from the API with light caching. */
export function useMythicShopRotation(): UseMythicShopRotationReturn {
  const [rotation, setRotation] = useState<MythicShopRotation | null>(
    clientRotationCache
  );
  const [isLoading, setIsLoading] = useState(!clientRotationCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRotation = async () => {
      const now = Date.now();

      if (
        clientRotationCache &&
        now - clientCacheTime < CLIENT_CACHE_DURATION
      ) {
        setRotation(clientRotationCache);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/mythic-shop/rotation');
        if (!response.ok) {
          throw new Error(`Failed to fetch rotation: ${response.status}`);
        }

        const data: RotationResponse = await response.json();
        if (!data.sections || data.sections.length === 0) {
          throw new Error(data.error ?? 'Mythic Shop rotation unavailable');
        }

        clientRotationCache = data;
        clientCacheTime = now;
        setRotation(data);
      } catch (err) {
        console.error('Error fetching Mythic Shop rotation:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch rotation'
        );
        if (clientRotationCache) {
          setRotation(clientRotationCache);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRotation();
  }, []);

  return { rotation, isLoading, error };
}
