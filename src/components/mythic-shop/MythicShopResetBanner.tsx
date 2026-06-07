'use client';

import { useEffect, useState } from 'react';
import { Clock, ExternalLink, Sparkles } from 'lucide-react';
import { getNextResetForSection } from '@/lib/mythic-shop/reset-schedule';
import type { MythicShopSectionId } from '@/lib/mythic-shop/types';
import { MYTHIC_SHOP_TRACKER_URL } from '@/lib/utils/constants';

interface SectionMeta {
  id: MythicShopSectionId;
  label: string;
}

// Compact labels for the top banner; full descriptions live behind the link.
const SECTIONS: SectionMeta[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'biweekly', label: 'Bi-weekly' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'daily', label: 'Daily' },
];

/** Formats a future ISO timestamp as a compact "2d 3h" countdown string. */
function formatCountdown(targetIso: string | null, nowMs: number): string {
  if (!targetIso) {
    return 'Varies';
  }
  const diff = new Date(targetIso).getTime() - nowMs;
  if (diff <= 0) {
    return 'Resetting…';
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Site-wide top banner showing the Mythic Shop reset countdowns.
 *
 * Riot has no public shop API, so the per-section timers are computed locally
 * (see reset-schedule) and we link out for the live item list.
 */
export function MythicShopResetBanner() {
  // Render the same value on server and first client paint to avoid hydration
  // mismatches, then start ticking once mounted.
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    const interval = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const now = nowMs === null ? new Date() : new Date(nowMs);
  const referenceMs = nowMs ?? now.getTime();

  return (
    <div className="relative z-40 border-b border-purple-500/20 bg-black/40 backdrop-blur">
      <div className="container mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-2 text-sm">
        <span className="flex items-center gap-1.5 font-semibold text-purple-200">
          <Sparkles className="h-4 w-4 text-purple-300" />
          Mythic Shop Resets
        </span>
        <ul className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
          {SECTIONS.map((section) => {
            const nextReset = getNextResetForSection(section.id, now);
            return (
              <li key={section.id} className="flex items-center gap-1.5">
                <span className="text-white/60">{section.label}</span>
                <span className="bg-primary/10 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-primary">
                  <Clock className="h-3 w-3" />
                  {nowMs === null
                    ? '—'
                    : formatCountdown(nextReset, referenceMs)}
                </span>
              </li>
            );
          })}
        </ul>
        <a
          href={MYTHIC_SHOP_TRACKER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-white/60 transition-colors hover:text-white"
        >
          View items
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
