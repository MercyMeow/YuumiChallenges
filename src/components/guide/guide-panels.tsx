'use client';

// Self-contained panels for the Yuumi guide's right rail and ability section.
// Extracted from app/page.tsx to keep the page component focused on layout;
// each panel owns its own data/fetching and is rendered in both the wide
// sidebar and the narrow-screen grid.

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, ExternalLink, ScrollText, Sparkles, Star } from 'lucide-react';
import { HextechPanel } from '@/components/ui/hextech-panel';
import { AbilityIcon } from '@/components/ui/datadragon-image';
import { type AutoBuild } from '@/lib/builds/auto-build';
import { GUIDE_PATCH } from '@/lib/guide/patch';
import { YUUMI_SPELL_TIPS } from '@/lib/guide/spell-tips';
import { formatCountdown, useNowMs } from '@/lib/mythic-shop/countdown';
import { getNextResetForSection } from '@/lib/mythic-shop/reset-schedule';
import {
  fetchMythicRotation,
  skinLoadingUrl,
  type MythicRotation,
} from '@/lib/mythic-shop/rotation';

const RIOT_PATCH_NOTES_URL =
  'https://www.leagueoflegends.com/en-us/news/tags/patch-notes/';

const QUICK_TIPS: ReadonlyArray<{ title: string; tip: string }> = [
  {
    title: 'Best Friend Bond',
    tip: 'Stack friendship on your carry — empowered Q slow, W on-hit heal, and steerable R are your win condition.',
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

/** Right rail: current Mythic Shop rotation teaser with reset countdown. */
export function MythicShopPreview() {
  const nowMs = useNowMs();
  const [rotation, setRotation] = useState<MythicRotation | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchMythicRotation().then((data) => {
      if (!cancelled) setRotation(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const now = nowMs === null ? new Date() : new Date(nowMs);
  const featured = rotation?.items.filter((i) => i.section === 'featured');
  const showingFeatured = Boolean(featured && featured.length > 0);
  const display = (
    showingFeatured ? featured! : (rotation?.items ?? [])
  ).slice(0, 3);
  // Match the countdown label to what is actually displayed: featured items
  // rotate ad hoc (getNextResetForSection returns null → 'Varies').
  const countdownSection = showingFeatured ? 'featured' : 'daily';
  const nextReset = getNextResetForSection(countdownSection, now);

  return (
    <HextechPanel
      title="Mythic Shop"
      icon={<Sparkles className="h-4 w-4" />}
      accent="magic"
      contentClassName="space-y-3 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="hex-label opacity-70">
          {showingFeatured ? 'Featured rotation' : 'Daily reset'}
        </span>
        <span className="hex-chip-magic">
          <Clock className="h-3 w-3" />
          {nowMs === null ? '—' : formatCountdown(nextReset, nowMs)}
        </span>
      </div>
      {display.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {display.map((item) => {
            const art = skinLoadingUrl(item);
            return (
              <div
                key={`${item.name}-${item.section}`}
                className="group hex-frame-art relative aspect-[3/5] overflow-hidden rounded-sm"
                title={item.name}
              >
                {art ? (
                  <Image
                    src={art}
                    alt={item.name}
                    fill
                    sizes="90px"
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-hx-black/60">
                    <Sparkles className="h-5 w-5 text-hx-gold/40" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-hx-black via-hx-black/70 to-transparent px-1 pt-4 pb-1 text-center">
                  <span className="text-[10px] font-semibold text-hx-gold">
                    {item.costME} ME
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-2 text-center text-xs text-hx-gold/50">
          Rotation not published yet.
        </p>
      )}
      <Link
        href="/mythic-shop"
        className="btn-hextech-magic block w-full rounded-sm px-4 py-2 text-center text-xs"
      >
        View Mythic Shop
      </Link>
    </HextechPanel>
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
            {autoBuild ? `Live · ${autoBuild.source}` : 'Curated'}
          </dd>
        </div>
        {autoBuild && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-hx-gold/60">Updated</dt>
            <dd className="font-semibold text-hx-parchment">
              {new Date(autoBuild.updatedAt).toLocaleDateString()}
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
              {tip.tip}
            </p>
          </div>
        </div>
      ))}
    </HextechPanel>
  );
}

export function SpellTipsPanel() {
  return (
    <HextechPanel
      title="Ability Guide"
      icon={<Sparkles className="h-4 w-4" />}
      contentClassName="space-y-4 p-4 sm:p-6"
    >
      {YUUMI_SPELL_TIPS.map((spell) => (
        <div
          key={spell.key}
          className="rounded-sm border border-hx-gold-dark/25 bg-hx-panel/30 p-3"
        >
          <div className="mb-2 flex items-center gap-2.5">
            <AbilityIcon championId="Yuumi" ability={spell.key} size={28} />
            <div>
              <div className="hex-title text-sm text-hx-parchment">
                {spell.name}
              </div>
              <p className="text-[11px] leading-snug text-hx-parchment/60">
                {spell.summary}
              </p>
            </div>
          </div>
          <ul className="space-y-1.5">
            {spell.tips.map((tip) => (
              <li
                key={tip}
                className="flex items-start gap-2 text-xs leading-snug text-hx-parchment/75"
              >
                <span
                  className="mt-1.5 hex-diamond shrink-0 opacity-60"
                  aria-hidden
                />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </HextechPanel>
  );
}
