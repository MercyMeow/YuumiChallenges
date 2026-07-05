'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clock, ExternalLink, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getNextResetForSection } from '@/lib/mythic-shop/reset-schedule';
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

const SECTION_ACCENTS: Record<MythicShopSectionId, string> = {
  featured: 'rounded-sm bg-hx-black/60 border-hx-gold text-hx-gold-bright',
  biweekly: 'rounded-sm bg-hx-black/60 border-hx-gold-dark text-hx-gold',
  weekly: 'rounded-sm bg-hx-black/60 border-hx-magic/60 text-hx-magic-bright',
  daily: 'rounded-sm bg-hx-black/60 border-hx-magic/40 text-hx-magic',
};

function formatCountdown(targetIso: string | null, nowMs: number): string {
  if (!targetIso) return 'Varies';
  const diff = new Date(targetIso).getTime() - nowMs;
  if (diff <= 0) return 'Resetting…';
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Minute-tick store shared pattern (see MythicShopResetBanner).
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

function ItemCard({ item }: { item: MythicItem }) {
  const art = skinLoadingUrl(item);
  return (
    <div className="group hex-card relative overflow-hidden rounded-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-hx-gold">
      {art ? (
        <div className="relative aspect-[308/560] w-full overflow-hidden bg-black/40">
          <Image
            src={art}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="flex aspect-[308/560] w-full items-center justify-center bg-black/40">
          <Sparkles className="h-10 w-10 text-white/30" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 pt-8">
        <div className="text-sm font-semibold text-hx-parchment">
          {item.name}
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-white/60 capitalize">{item.kind}</span>
          <span className="font-medium text-hx-gold">{item.costME} ME</span>
        </div>
      </div>
    </div>
  );
}

export default function MythicShopPage() {
  const nowMs = useSyncExternalStore(
    subscribeToMinuteTick,
    getNowMsSnapshot,
    getServerNowMsSnapshot
  );
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
    <div className="min-h-screen hex-page-bg">
      <div className="container mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 text-center duration-500 animate-in fade-in slide-in-from-bottom-4">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-hx-gold transition-colors hover:text-hx-gold-bright"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-gradient-gold text-4xl font-black tracking-wide uppercase md:text-6xl">
            Mythic Shop
          </h1>
          <p className="mt-3 text-landing-text-secondary">
            Current rotation and reset timers · prices in Mythic Essence
          </p>
          {rotation?.patch && (
            <Badge
              variant="outline"
              className="mt-4 rounded-sm border-hx-gold-dark bg-hx-black/60 text-hx-gold"
            >
              Patch {rotation.patch}
            </Badge>
          )}
        </div>

        <div className="space-y-10">
          {SECTION_ORDER.map((sectionId) => {
            const items =
              rotation?.items.filter((item) => item.section === sectionId) ??
              [];
            const nextReset = getNextResetForSection(sectionId, now);
            return (
              <section key={sectionId}>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <h2 className="hex-title text-lg text-hx-gold">
                    {SECTION_LABELS[sectionId]}
                  </h2>
                  <Badge
                    variant="outline"
                    className={SECTION_ACCENTS[sectionId]}
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    {nowMs === null
                      ? '—'
                      : nextReset
                        ? `Resets in ${formatCountdown(nextReset, referenceMs)}`
                        : 'Varies with patches'}
                  </Badge>
                </div>
                {items.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {items.map((item) => (
                      <ItemCard
                        key={`${item.name}-${item.section}`}
                        item={item}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-sm border border-dashed border-hx-gold-dark/50 bg-hx-black/40 p-6 text-center text-sm text-hx-gold/60">
                    {loaded
                      ? 'Rotation for this section has not been published yet.'
                      : 'Loading rotation…'}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-12 text-center text-sm text-white/50">
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
    </div>
  );
}
