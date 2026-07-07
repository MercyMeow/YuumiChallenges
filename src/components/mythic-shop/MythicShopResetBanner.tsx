'use client';

import { Clock, Sparkles } from 'lucide-react';
import { getNextResetForSection } from '@/lib/mythic-shop/reset-schedule';
import { formatCountdown, useNowMs } from '@/lib/mythic-shop/countdown';
import type { MythicShopSectionId } from '@/lib/mythic-shop/types';

interface SectionMeta {
  id: MythicShopSectionId;
  label: string;
}

const SECTIONS: SectionMeta[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'biweekly', label: 'Bi-weekly' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'daily', label: 'Daily' },
];

/**
 * Site-wide top banner showing the Mythic Shop reset countdowns. Riot has no
 * public shop API, so the per-section timers are computed locally
 * (see reset-schedule).
 */
export function MythicShopResetBanner() {
  // Renders the same value on server and first client paint to avoid
  // hydration mismatches, then ticks once a minute after subscribing.
  const nowMs = useNowMs();

  const now = nowMs === null ? new Date() : new Date(nowMs);
  const referenceMs = nowMs ?? now.getTime();

  return (
    <div className="relative z-40 border-b border-hx-gold-dark/40 bg-hx-black/70 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm md:px-6">
        <span className="flex items-center gap-1.5 hex-label">
          <Sparkles className="h-3.5 w-3.5 text-hx-magic" />
          Mythic Shop Resets
        </span>
        <ul className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
          {SECTIONS.map((section) => {
            const nextReset = getNextResetForSection(section.id, now);
            return (
              <li key={section.id} className="flex items-center gap-1.5">
                <span className="text-xs text-hx-parchment/60">
                  {section.label}
                </span>
                <span className="hex-chip-magic">
                  <Clock className="h-3 w-3" />
                  {nowMs === null
                    ? '—'
                    : formatCountdown(nextReset, referenceMs)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
