'use client';

import { useEffect, useState } from 'react';
import { toGuidePatch } from '@/lib/utils/live-patch';

/**
 * Live patch label ('16.13') from the Data Dragon proxy route.
 * Returns null until resolved; callers show their own fallback.
 */
export function useLivePatch(): string | null {
  const [patch, setPatch] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/data-dragon/version')
      .then((res) => res.json())
      .then((data: { version?: string }) => {
        if (cancelled || typeof data.version !== 'string') return;
        setPatch(toGuidePatch(data.version));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return patch;
}
