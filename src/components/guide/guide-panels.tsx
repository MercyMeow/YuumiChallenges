'use client';

// Self-contained panels for the Yuumi guide's right rail and ability section.
// Extracted from app/page.tsx to keep the page component focused on layout;
// each panel owns its own data/fetching and is rendered in both the wide
// sidebar and the narrow-screen grid.

import { Clock, ExternalLink, ScrollText, Star } from 'lucide-react';
import { HextechPanel } from '@/components/ui/hextech-panel';
import { GameTermText } from '@/components/guide/game-terms';
import { type AutoBuild } from '@/lib/builds/auto-build';
import { yuumiBuild } from '@/lib/builds/yuumi';
import { GUIDE_PATCH } from '@/lib/guide/patch';
import { useNowMs } from '@/lib/mythic-shop/countdown';

const RIOT_PATCH_NOTES_URL =
  'https://www.leagueoflegends.com/en-us/news/tags/patch-notes/';

const QUICK_TIPS: ReadonlyArray<{ title: string; tip: string }> = [
  {
    title: 'Best Friend Bond',
    tip: 'Stack friendship on your carry — enhanced Q slow, W on-hit heals, and boosted R healing are your win condition.',
  },
  {
    title: 'Empowered Q',
    tip: 'Curve Prowling Projectile while attached; after ~1.35s it accelerates for bonus damage and a stronger slow.',
  },
  {
    title: 'Zoomies Timing',
    tip: 'E shields and restores mana — buffer it before burst, not after. Healing comes from R waves and passive.',
  },
  {
    title: 'Stay Untargetable',
    tip: 'Immobilize while detached locks W. Carry control wards, but a dead cat heals nobody.',
  },
];

/** "3h ago"-style age for build freshness stamps. */
function formatRelativeAge(thenMs: number, nowMs: number): string {
  const minutes = Math.floor(Math.max(0, nowMs - thenMs) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Full date + time a build timestamp resolves to, in the viewer's locale. */
function formatUpdatedStamp(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Freshness chip under the builds heading: when the displayed build data was
 * last refreshed (auto-scrape timestamp, or the curated dataset's date).
 */
export function BuildUpdatedStamp({
  autoBuild,
}: {
  autoBuild: AutoBuild | null;
}) {
  const nowMs = useNowMs();
  const updatedMs = autoBuild?.updatedAt ?? Date.parse(yuumiBuild.updatedAt);
  return (
    <div className="flex justify-center">
      <span
        className="hex-chip"
        title={autoBuild ? 'Auto-updated daily' : 'Curated build data'}
        suppressHydrationWarning
      >
        <Clock className="h-3 w-3" />
        Updated {formatUpdatedStamp(updatedMs)}
        {nowMs !== null && ` · ${formatRelativeAge(updatedMs, nowMs)}`}
      </span>
    </div>
  );
}

export function PatchPanel({
  patch,
  autoBuild,
  outdated,
}: {
  patch: string;
  autoBuild: AutoBuild | null;
  outdated: boolean;
}) {
  return (
    <HextechPanel
      title="Patch Status"
      icon={<ScrollText className="h-4 w-4" />}
      contentClassName="space-y-3 p-4"
    >
      <div className="flex items-end justify-between">
        <span className="text-gradient-gold text-4xl font-black">{patch}</span>
        <span className="hex-chip-magic">
          <span
            className="h-1.5 w-1.5 rotate-45 animate-gem-pulse bg-hx-magic"
            aria-hidden
          />
          Live
        </span>
      </div>
      <div className="hex-divider" />
      <dl className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-hx-gold/60">Builds verified</dt>
          <dd className="font-semibold text-hx-parchment">
            {autoBuild?.patch ?? GUIDE_PATCH}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-hx-gold/60">Build data</dt>
          <dd className="font-semibold text-hx-parchment">
            {autoBuild ? 'Live · auto-updated' : 'Curated'}
          </dd>
        </div>
        {autoBuild && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-hx-gold/60">Updated</dt>
            <dd
              className="font-semibold text-hx-parchment"
              suppressHydrationWarning
            >
              {formatUpdatedStamp(autoBuild.updatedAt)}
            </dd>
          </div>
        )}
      </dl>
      {outdated && (
        <p className="border-l-2 border-amber-400/70 bg-amber-500/10 px-2.5 py-1.5 text-[11px] leading-snug text-amber-200/90">
          Builds trail the live patch — Yuumi&apos;s meta rarely shifts between
          patches.
        </p>
      )}
      <a
        href={RIOT_PATCH_NOTES_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-hextech flex w-full items-center justify-center gap-1.5 rounded-sm px-4 py-2 text-xs"
      >
        Official Patch Notes
        <ExternalLink className="h-3 w-3" />
      </a>
    </HextechPanel>
  );
}

export function QuickTipsPanel() {
  return (
    <HextechPanel
      title="Quick Tips"
      icon={<Star className="h-4 w-4" />}
      contentClassName="space-y-3 p-4"
    >
      {QUICK_TIPS.map((tip) => (
        <div key={tip.title} className="flex gap-2.5">
          <span
            className="mt-1.5 hex-diamond shrink-0 opacity-80"
            aria-hidden
          />
          <div>
            <div className="text-xs font-bold tracking-wide text-hx-gold">
              {tip.title}
            </div>
            <p className="text-xs leading-snug text-hx-parchment/70">
              <GameTermText text={tip.tip} yuumiKit />
            </p>
          </div>
        </div>
      ))}
    </HextechPanel>
  );
}
