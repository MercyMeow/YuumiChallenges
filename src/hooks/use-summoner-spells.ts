'use client';

import { useEffect, useMemo, useState } from 'react';

export interface SummonerSpell {
  id: string; // e.g., SummonerFlash
  name: string; // Flash
  description: string;
  tooltip?: string;
  key: string; // numeric id string, e.g., '4'
  image?: { full: string };
}

type SpellMap = Record<string, SummonerSpell>;

let clientCache: SpellMap | null = null;
let cacheTime = 0;
const TTL = 25 * 60 * 1000;

function isCacheFresh(): boolean {
  return clientCache !== null && Date.now() - cacheTime < TTL;
}

export function useSummonerSpells() {
  const [spells, setSpells] = useState<SpellMap | null>(clientCache);
  // Loading whenever a fetch will run on mount (no cache, or stale cache).
  const [loading, setLoading] = useState(() => !isCacheFresh());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isCacheFresh()) {
      // State was already initialized from the fresh cache.
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/data-dragon/summoner-spells', {
          cache: 'no-store',
        });
        const data = await res.json();
        clientCache = data.spells || {};
        cacheTime = Date.now();
        setSpells(clientCache);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : 'Failed to load summoner spells'
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const byNumericId = useMemo(() => {
    if (!spells) return {} as Record<number, SummonerSpell>;
    const map: Record<number, SummonerSpell> = {};
    for (const s of Object.values(spells)) {
      const id = Number(s.key);
      if (!Number.isNaN(id)) map[id] = s;
    }
    return map;
  }, [spells]);

  return { spells, byNumericId, loading, error } as const;
}
