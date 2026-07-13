'use client';

import { useState, useEffect } from 'react';
import {
  RuneTree,
  RuneData,
  StatShard,
  getRuneById,
  getRuneTreeById,
  getStatShardById,
  STAT_SHARDS,
} from '@/lib/apis/datadragon';

interface RuneDataResponse {
  runes: RuneTree[];
  cached: boolean;
  cacheAge?: number;
  timestamp?: string;
  treeCount?: number;
  totalRunes?: number;
  fallback?: boolean;
  error?: string;
}

interface UseRuneDataReturn {
  runeTrees: RuneTree[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;

  // Utility functions
  getRuneById: (runeId: number) => RuneData | null;
  getRuneTreeById: (treeId: number) => RuneTree | null;
  getStatShardById: (statShardId: number) => StatShard | null;
  getKeystoneRunes: () => RuneData[];
  getRunesByTreeAndSlot: (treeId: number, slotIndex: number) => RuneData[];
}

/**
 * Fetch rune data from the API. Pure network logic (no React state) so the
 * mount effect can consume it via a promise chain without synchronous
 * setState calls.
 */
// One request per page no matter how many icons mount at once: concurrent
// callers share the same in-flight promise. Cleared once settled so
// refetch() and later mounts still reach the network for fresh data.
let inflightRuneData: Promise<RuneDataResponse> | null = null;

function loadRuneDataShared(): Promise<RuneDataResponse> {
  if (!inflightRuneData) {
    inflightRuneData = loadRuneData().finally(() => {
      inflightRuneData = null;
    });
  }
  return inflightRuneData;
}

async function loadRuneData(): Promise<RuneDataResponse> {
  const response = await fetch('/api/data-dragon/runes', {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch rune data: ${response.status}`);
  }

  const data: RuneDataResponse = await response.json();

  if (data.error && !data.fallback) {
    throw new Error(data.error);
  }

  return data;
}

export function useRuneData(): UseRuneDataReturn {
  const [runeTrees, setRuneTrees] = useState<RuneTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Applies the fetch result to state. All setState calls happen inside
  // promise callbacks (asynchronously), never in the effect body itself.
  const executeFetch = () =>
    loadRuneDataShared()
      .then((data) => {
        setRuneTrees(data.runes);

        // Show warning if using fallback data
        if (data.fallback) {
          console.warn(
            'Using fallback rune data due to API issues:',
            data.error
          );
        }
      })
      .catch((err: unknown) => {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching rune data:', err);
      })
      .finally(() => {
        setLoading(false);
      });

  // Refetch entry point for consumers (event handlers), where resetting
  // loading/error synchronously is fine.
  const refetch = async () => {
    setLoading(true);
    setError(null);
    await executeFetch();
  };

  useEffect(() => {
    // Initial state already has loading=true and error=null, so no
    // synchronous state updates are needed before the async fetch.
    void executeFetch();
  }, []);

  // Utility functions that work with the current data
  const getRuneByIdLocal = (runeId: number): RuneData | null => {
    return getRuneById(runeTrees, runeId);
  };

  const getRuneTreeByIdLocal = (treeId: number): RuneTree | null => {
    return getRuneTreeById(runeTrees, treeId);
  };

  const getStatShardByIdLocal = (statShardId: number): StatShard | null => {
    return getStatShardById(statShardId);
  };

  const getKeystoneRunesLocal = (): RuneData[] => {
    return runeTrees.flatMap((tree) => tree.slots[0]?.runes || []);
  };

  const getRunesByTreeAndSlotLocal = (
    treeId: number,
    slotIndex: number
  ): RuneData[] => {
    const tree = getRuneTreeByIdLocal(treeId);
    if (!tree || !tree.slots[slotIndex]) {
      return [];
    }
    return tree.slots[slotIndex].runes;
  };

  return {
    runeTrees,
    loading,
    error,
    refetch,
    getRuneById: getRuneByIdLocal,
    getRuneTreeById: getRuneTreeByIdLocal,
    getStatShardById: getStatShardByIdLocal,
    getKeystoneRunes: getKeystoneRunesLocal,
    getRunesByTreeAndSlot: getRunesByTreeAndSlotLocal,
  };
}

/**
 * Hook for getting specific rune data by ID
 */
export function useRune(runeId: number | null) {
  const { loading, error, getRuneById } = useRuneData();

  const rune = runeId ? getRuneById(runeId) : null;

  return {
    rune,
    loading,
    error,
  };
}

/**
 * Hook for getting specific rune tree data by ID
 */
export function useRuneTree(treeId: number | null) {
  const { loading, error, getRuneTreeById } = useRuneData();

  const tree = treeId ? getRuneTreeById(treeId) : null;

  return {
    tree,
    loading,
    error,
  };
}

/**
 * Hook for getting keystone runes
 */
export function useKeystoneRunes() {
  const { loading, error, getKeystoneRunes } = useRuneData();

  const keystones = getKeystoneRunes();

  return {
    keystones,
    loading,
    error,
  };
}

/**
 * Hook for stat shard data (always available, no API call needed)
 */
export function useStatShards() {
  return {
    statShards: STAT_SHARDS,
    loading: false,
    error: null,
    getStatShardById,
  };
}
