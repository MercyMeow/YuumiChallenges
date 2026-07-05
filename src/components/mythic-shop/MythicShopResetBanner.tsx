'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Sparkles } from 'lucide-react';
import { getNextResetForSection } from '@/lib/mythic-shop/reset-schedule';
import type { MythicShopSectionId } from '@/lib/mythic-shop/types';

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

// Minute-tick time store for useSyncExternalStore. The server snapshot is
// `null` so SSR and the first client paint render the same placeholder, then
// the real timestamp is picked up once React subscribes after hydration.
let nowMsSnapshot: number | null = null;

function subscribeToMinuteTick(onStoreChange: () => void): () => void {
  nowMsSnapshot = Date.now();
  const interval = setInterval(() => {
    nowMsSnapshot = Date.now();
    onStoreChange();
  }, 60_000);
  return () => clearInterval(interval);
}

const getNowMsSnapshot = () => nowMsSnapshot;
const getServerNowMsSnapshot = () => null;

/**
 * Site-wide top banner showing the Mythic Shop reset countdowns.
 *
 * Riot has no public shop API, so the per-section timers are computed locally
 * (see reset-schedule) and the curated item list lives at /mythic-shop.
 */
export function MythicShopResetBanner() {
  // Renders the same value on server and first client paint to avoid
  // hydration mismatches, then ticks once a minute after subscribing.
  const nowMs = useSyncExternalStore(
    subscribeToMinuteTick,
    getNowMsSnapshot,
    getServerNowMsSnapshot
  );

  const now = nowMs === null ? new Date() : new Date(nowMs);
  const referenceMs = nowMs ?? now.getTime();

  return (
    <div className="relative z-40 border-b border-purple-500/20 bg-black/40 backdrop-blur-sm">
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
                <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <Clock className="h-3 w-3" />
                  {nowMs === null
                    ? '—'
                    : formatCountdown(nextReset, referenceMs)}
                </span>
              </li>
            );
          })}
        </ul>
        <Link
          href="/mythic-shop"
          className="flex items-center gap-1 text-xs text-white/60 transition-colors hover:text-white"
        >
          View rotation
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
