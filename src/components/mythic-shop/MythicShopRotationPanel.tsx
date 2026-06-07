'use client';

import { useEffect, useState } from 'react';
import { Clock, ExternalLink, Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getNextResetForSection } from '@/lib/mythic-shop/reset-schedule';
import type { MythicShopSectionId } from '@/lib/mythic-shop/types';
import { MYTHIC_SHOP_TRACKER_URL } from '@/lib/utils/constants';

interface SectionMeta {
  id: MythicShopSectionId;
  label: string;
  contents: string;
}

// Section contents per Riot's "Shops Update" (cadence drives the countdown).
const SECTIONS: SectionMeta[] = [
  {
    id: 'featured',
    label: 'Featured',
    contents: 'New Prestige skins, Nexus Finishers & event titles',
  },
  {
    id: 'biweekly',
    label: 'Bi-weekly',
    contents: '12 Mythic & returning Prestige skins',
  },
  { id: 'weekly', label: 'Weekly', contents: '8 event & Mythic chromas' },
  { id: 'daily', label: 'Daily', contents: 'Emotes, icons & ward skins' },
];

/** Formats a future ISO timestamp as a compact "2d 3h" countdown string. */
function formatCountdown(targetIso: string | null, nowMs: number): string {
  if (!targetIso) {
    return 'Varies by event';
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
 * Always-visible panel showing the Mythic Shop reset countdowns.
 *
 * Riot has no public shop API, so we compute the per-section reset timers
 * locally and link out for the live item list (the in-game client is the
 * source of truth).
 */
export function MythicShopRotationPanel() {
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
    <Card className="bg-card/60 text-left backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          Mythic Shop Resets
        </CardTitle>
        <CardDescription>
          When each Mythic Shop category next rotates (00:00 UTC).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {SECTIONS.map((section) => {
            const nextReset = getNextResetForSection(section.id, now);
            return (
              <li
                key={section.id}
                className="border-border/50 bg-background/40 flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {section.label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {section.contents}
                  </p>
                </div>
                <span className="bg-primary/10 flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-primary">
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
          className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          View current items
          <ExternalLink className="h-3 w-3" />
        </a>
        <p className="text-muted-foreground/70 text-center text-[11px]">
          The in-game client (Loot tab) is the source of truth.
        </p>
      </CardContent>
    </Card>
  );
}
