'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Clock, ExternalLink, Sparkles } from 'lucide-react';
import { OrnateHeading } from '@/components/ui/hextech-panel';
import { getNextResetForSection } from '@/lib/mythic-shop/reset-schedule';
import { formatCountdown, useNowMs } from '@/lib/mythic-shop/countdown';
import type { MythicShopSectionId } from '@/lib/mythic-shop/types';
import {
  fetchMythicRotation,
  skinLoadingUrl,
  SECTION_LABELS,
  type MythicItem,
  type MythicRotation,
} from '@/lib/mythic-shop/rotation';
import { MYTHIC_SHOP_TRACKER_URL } from '@/lib/utils/constants';

const SECTION_ORDER: MythicShopSectionId[] = [
  'featured',
  'biweekly',
  'weekly',
  'daily',
];

const SECTION_CHIP: Record<MythicShopSectionId, string> = {
  featured: 'hex-chip border-hx-gold text-hx-gold-bright',
  biweekly: 'hex-chip',
  weekly: 'hex-chip-magic',
  daily: 'hex-chip-magic opacity-90',
};

function ItemCard({ item }: { item: MythicItem }) {
  const art = skinLoadingUrl(item);
  return (
    <div className="group hex-card hex-corners relative overflow-hidden rounded-sm transition-all duration-300 hover:-translate-y-1 hover:border-hx-gold hover:shadow-[0_0_20px_oklch(var(--hx-gold)_/_0.25)]">
      {art ? (
        <div className="relative aspect-[308/560] w-full overflow-hidden bg-hx-black/60">
          <Image
            src={art}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-hx-black via-transparent to-transparent opacity-80" />
        </div>
      ) : (
        <div className="flex aspect-[308/560] w-full items-center justify-center bg-hx-black/60">
          <Sparkles className="h-10 w-10 text-hx-gold/25" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="mb-2 hex-divider opacity-60" />
        <div className="truncate text-sm font-semibold text-hx-parchment">
          {item.name}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="tracking-wide text-hx-gold/60 uppercase">
            {item.kind}
          </span>
          <span className="flex items-center gap-1 font-bold text-hx-gold">
            <span
              className="h-1.5 w-1.5 rotate-45 bg-hx-magic shadow-[0_0_6px_oklch(var(--hx-magic))]"
              aria-hidden
            />
            {item.costME} ME
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MythicShopPage() {
  const nowMs = useNowMs();
  const [rotation, setRotation] = useState<MythicRotation | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMythicRotation()
      .then((data) => {
        if (!cancelled) setRotation(data);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const now = nowMs === null ? new Date() : new Date(nowMs);
  const referenceMs = nowMs ?? now.getTime();

  return (
    <div className="py-10 md:py-14">
      <div className="mb-12 text-center duration-500 animate-in fade-in slide-in-from-bottom-4">
        <OrnateHeading eyebrow="Mythic Essence emporium" as="h1">
          Mythic Shop
        </OrnateHeading>
        <p className="mt-3 text-sm text-landing-text-secondary">
          Current rotation and reset timers · prices in Mythic Essence
        </p>
        {rotation?.patch && (
          <span className="mt-4 hex-chip">Patch {rotation.patch}</span>
        )}
      </div>

      <div className="space-y-12">
        {SECTION_ORDER.map((sectionId) => {
          const items =
            rotation?.items.filter((item) => item.section === sectionId) ?? [];
          const nextReset = getNextResetForSection(sectionId, now);
          return (
            <section key={sectionId}>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="hex-diamond shrink-0" aria-hidden />
                <h2 className="hex-title text-lg text-hx-gold">
                  {SECTION_LABELS[sectionId]}
                </h2>
                <span className={SECTION_CHIP[sectionId]}>
                  <Clock className="h-3 w-3" />
                  {nowMs === null
                    ? '—'
                    : nextReset
                      ? `Resets in ${formatCountdown(nextReset, referenceMs)}`
                      : 'Varies with patches'}
                </span>
                <span className="hex-divider min-w-8 flex-1" aria-hidden />
              </div>
              {items.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
                  {items.map((item) => (
                    <ItemCard
                      key={`${item.name}-${item.section}`}
                      item={item}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-sm border-dashed p-8 text-center text-sm text-hx-gold/60 hex-card-inset">
                  {loaded
                    ? 'Rotation for this section has not been published yet.'
                    : 'Loading rotation…'}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="mt-14 text-center text-sm text-hx-parchment/50">
        Riot has no public Mythic Shop API — this rotation is curated by the
        site team.{' '}
        <a
          href={MYTHIC_SHOP_TRACKER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-hx-gold transition-colors hover:text-hx-gold-bright"
        >
          Cross-check externally
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
