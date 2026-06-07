'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Sparkles } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useMythicShopRotation } from '@/hooks/use-mythic-shop-rotation';
import type { MythicShopSection } from '@/lib/mythic-shop/types';

/** Formats a future ISO timestamp as a compact "2d 3h" countdown string. */
function formatCountdown(targetIso: string | null, nowMs: number): string {
  if (!targetIso) {
    return 'Ad hoc';
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

function SectionBlock({
  section,
  nowMs,
}: {
  section: MythicShopSection;
  nowMs: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {section.label}
        </h3>
        <span className="text-xs text-muted-foreground">
          Resets in {formatCountdown(section.nextResetAt, nowMs)}
        </span>
      </div>
      <ul className="space-y-1.5">
        {section.items.map((item) => (
          <li
            key={`${section.id}-${item.name}`}
            className="border-border/50 bg-background/40 flex items-center justify-between gap-3 rounded-md border px-3 py-1.5"
          >
            <span className="truncate text-sm text-foreground">
              {item.name}
            </span>
            <span className="bg-primary/10 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-primary">
              {item.cost} ME
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="bg-muted/40 h-10 animate-pulse rounded-md"
        />
      ))}
    </div>
  );
}

/** Always-visible panel showing the current Mythic Shop rotation. */
export function MythicShopRotationPanel() {
  const { rotation, isLoading, error } = useMythicShopRotation();
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Refresh countdowns once a minute; precise to-the-second is unnecessary.
  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-card/60 text-left backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Mythic Shop Rotation
          </CardTitle>
          {rotation?.source && (
            <a
              href={rotation.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Source
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <CardDescription>
          Current items available for Mythic Essence in the League client.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && !rotation && <PanelSkeleton />}

        {!isLoading && !rotation && (
          <p className="text-sm text-muted-foreground">
            {error ?? 'Rotation data is currently unavailable.'}
          </p>
        )}

        {rotation?.stale && (
          <p className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Showing the last known rotation; the live source could not be
            reached. The in-game client is always the source of truth.
          </p>
        )}

        {rotation?.sections.map((section) => (
          <SectionBlock key={section.id} section={section} nowMs={nowMs} />
        ))}
      </CardContent>
    </Card>
  );
}
