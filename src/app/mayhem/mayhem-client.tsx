'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Sparkles, X } from 'lucide-react';
import { HextechPanel, OrnateHeading } from '@/components/ui/hextech-panel';
import { PanelSkeleton } from '@/components/ui/skeleton';
import { filterBestForChampion, sortByMetaTier } from '@/lib/mayhem/enrich';
import { groupBestByRarity, FEATURED_COUNT, TOTAL_COUNT } from '@/lib/mayhem/rarity';
import { tierChipClass, tierLabel } from '@/lib/mayhem/tiers';
import type {
  MayhemAugment,
  MayhemAugmentsResponse,
  MayhemChampion,
  MayhemTier,
} from '@/lib/mayhem/types';
import { cn } from '@/lib/utils';

/** Small S–D chip for meta / champ tiers. */
function TierChip({ tier, label }: { tier: MayhemTier; label?: string }) {
  return (
    <span className={cn(tierChipClass(tier), 'shrink-0')}>
      {label ?? tierLabel(tier)}
    </span>
  );
}

/** Champ-specific tier for an augment, if present. */
function champTierFor(
  augment: MayhemAugment,
  championId: string
): MayhemTier | undefined {
  return augment.topChampions.find((c) => c.id === championId)?.tier;
}

/** Featured (large) augment card for Best-for-champ. */
function FeaturedAugmentCard({
  augment,
  champTier,
  rank,
  highlighted,
}: {
  augment: MayhemAugment;
  champTier?: MayhemTier;
  rank: number;
  highlighted?: boolean;
}) {
  return (
    <li
      className={cn(
        'flex flex-col gap-2 rounded-sm border bg-hx-navy/40 p-3',
        highlighted
          ? 'border-hx-magic/50 bg-hx-magic/5'
          : 'border-hx-gold-dark/35'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-1 w-4 shrink-0 hex-label text-hx-gold/50">
          {rank}
        </span>
        <Image
          src={augment.iconUrl}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 shrink-0 rounded-sm border border-hx-gold-dark/40"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm tracking-wide text-hx-parchment">
            {augment.name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="hex-label text-[0.6rem]">Meta</span>
            <TierChip tier={augment.metaTier} />
            {champTier !== undefined && (
              <>
                <span className="hex-label text-[0.6rem]">Champ</span>
                <TierChip tier={champTier} />
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/** Compact augment tile for the top-20 list. */
function CompactAugmentTile({
  augment,
  champTier,
  rank,
  highlighted,
}: {
  augment: MayhemAugment;
  champTier?: MayhemTier;
  rank: number;
  highlighted?: boolean;
}) {
  return (
    <li
      className={cn(
        'flex items-center gap-1.5 rounded-sm border px-1.5 py-1.5',
        highlighted
          ? 'border-hx-magic/40 bg-hx-magic/5'
          : 'border-hx-gold-dark/25 bg-hx-black/30'
      )}
      title={augment.name}
    >
      <span className="w-3 shrink-0 text-center text-[0.6rem] text-hx-gold/40">
        {rank}
      </span>
      <Image
        src={augment.iconUrl}
        alt=""
        width={28}
        height={28}
        className="h-7 w-7 shrink-0 rounded-sm border border-hx-gold-dark/30"
      />
      <span className="min-w-0 flex-1 truncate text-[0.7rem] text-hx-parchment/85">
        {augment.name}
      </span>
      <TierChip tier={augment.metaTier} />
      {champTier !== undefined && <TierChip tier={champTier} />}
    </li>
  );
}

/** One augment row for the full All list. */
function AugmentRow({
  augment,
  champTier,
  highlighted,
  showTopChamps,
}: {
  augment: MayhemAugment;
  champTier?: MayhemTier;
  highlighted?: boolean;
  showTopChamps?: boolean;
}) {
  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-3 border-b border-hx-gold-dark/20 px-2 py-3 last:border-b-0',
        highlighted && 'rounded-sm border border-hx-magic/40 bg-hx-magic/5'
      )}
    >
      <Image
        src={augment.iconUrl}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-sm border border-hx-gold-dark/40"
      />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm tracking-wide text-hx-parchment">
          {augment.name}
        </p>
        {showTopChamps && augment.topChampions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {augment.topChampions.map((champ) => (
              <Image
                key={champ.id}
                src={champ.squareUrl}
                alt={champ.name}
                title={`${champ.name} (${tierLabel(champ.tier)})`}
                width={22}
                height={22}
                className="h-[22px] w-[22px] rounded-sm border border-hx-gold-dark/30"
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="hex-label text-[0.65rem]">Meta</span>
        <TierChip tier={augment.metaTier} />
        {champTier !== undefined && (
          <>
            <span className="hex-label text-[0.65rem]">Champ</span>
            <TierChip tier={champTier} />
          </>
        )}
      </div>
    </li>
  );
}

/** Champion-first ARAM Mayhem augment browser. */
export function MayhemClient() {
  const [data, setData] = useState<MayhemAugmentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [champQuery, setChampQuery] = useState('');
  const [augmentQuery, setAugmentQuery] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/mayhem/augments');
        const body = (await response.json()) as
          MayhemAugmentsResponse | { error: string };
        if (!response.ok || 'error' in body) {
          throw new Error(
            'error' in body ? body.error : `Request failed (${response.status})`
          );
        }
        if (cancelled) return;
        setData(body);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setData(null);
        setError(
          err instanceof Error ? err.message : 'Failed to load Mayhem data'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const selected = useMemo(
    () => data?.champions.find((c) => c.id === selectedId) ?? null,
    [data, selectedId]
  );

  const best = useMemo(
    () =>
      selectedId ? filterBestForChampion(data?.augments ?? [], selectedId) : [],
    [data, selectedId]
  );
  const bestByRarity = useMemo(
    () =>
      selectedId ? groupBestByRarity(data?.augments ?? [], selectedId) : [],
    [data, selectedId]
  );
  const bestIds = useMemo(() => new Set(best.map((a) => a.id)), [best]);

  const allSorted = useMemo(() => sortByMetaTier(data?.augments ?? []), [data]);
  const allFiltered = useMemo(() => {
    const q = augmentQuery.trim().toLowerCase();
    if (!q) return allSorted;
    return allSorted.filter((a) => a.name.toLowerCase().includes(q));
  }, [allSorted, augmentQuery]);

  const filteredChamps = useMemo(() => {
    const q = champQuery.trim().toLowerCase();
    const list = data?.champions ?? [];
    if (!q) return list;
    return list.filter(
      (c) => c.name.toLowerCase().includes(q) || c.key.toLowerCase().includes(q)
    );
  }, [data, champQuery]);

  const handleSelectChamp = (champ: MayhemChampion) => {
    setSelectedId(champ.id);
    setAugmentQuery('');
  };

  const handleClear = () => {
    setSelectedId(null);
    setAugmentQuery('');
  };

  const updatedLabel = data?.generatedAt
    ? new Date(data.generatedAt).toLocaleString()
    : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <OrnateHeading as="h1" eyebrow="ARAM: Mayhem">
        ARAM Mayhem
      </OrnateHeading>
      <p className="mt-3 text-center text-xs tracking-wide text-hx-gold/60">
        {data?.patch ? `Patch ${data.patch}` : 'Loading patch…'}
        {updatedLabel ? ` · Updated ${updatedLabel}` : ''}
        {' · '}
        Pick a champion to see their best augments by rarity
      </p>

      {loading && (
        <HextechPanel title="Loading" className="mt-8">
          <div className="space-y-3 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <PanelSkeleton key={i} className="h-14" />
            ))}
          </div>
        </HextechPanel>
      )}

      {!loading && error && (
        <HextechPanel title="Could not load Mayhem data" className="mt-8">
          <p className="text-sm text-hx-parchment/80">{error}</p>
          <button
            type="button"
            className="btn-hextech mt-4"
            onClick={handleRetry}
          >
            Retry
          </button>
        </HextechPanel>
      )}

      {!loading && !error && data && (
        <>
          <HextechPanel
            title="Choose a champion"
            icon={<Sparkles className="h-4 w-4" aria-hidden />}
            className="mt-8"
            action={
              selected ? (
                <button
                  type="button"
                  className="hex-chip-magic inline-flex items-center gap-1.5"
                  onClick={handleClear}
                >
                  <Image
                    src={selected.squareUrl}
                    alt=""
                    width={18}
                    height={18}
                    className="h-[18px] w-[18px] rounded-sm"
                  />
                  {selected.name}
                  <X className="h-3.5 w-3.5" aria-hidden />
                  <span className="sr-only">Clear selection</span>
                </button>
              ) : (
                <span className="hex-label">
                  {data.champions.length} champs
                </span>
              )
            }
          >
            <label className="sr-only" htmlFor="mayhem-champ-search">
              Search champions
            </label>
            <input
              id="mayhem-champ-search"
              type="search"
              value={champQuery}
              onChange={(e) => setChampQuery(e.target.value)}
              placeholder="Search champions…"
              className="mb-4 w-full hex-input"
            />
            <div className="grid max-h-72 hex-scroll grid-cols-4 gap-2 overflow-y-auto sm:grid-cols-6 md:grid-cols-8">
              {filteredChamps.map((champ) => {
                const active = champ.id === selectedId;
                return (
                  <button
                    key={champ.id}
                    type="button"
                    onClick={() => handleSelectChamp(champ)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-sm border p-1.5 transition-colors',
                      active
                        ? 'border-hx-magic/60 bg-hx-magic/10'
                        : 'border-hx-gold-dark/30 hover:border-hx-gold/50 hover:bg-hx-navy/40'
                    )}
                    title={champ.name}
                  >
                    <Image
                      src={champ.squareUrl}
                      alt={champ.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-sm"
                    />
                    <span className="w-full truncate text-center text-[0.65rem] text-hx-parchment/80">
                      {champ.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </HextechPanel>

          {!selected && (
            <p className="mt-6 text-center text-sm text-hx-gold/50">
              Select a champion above to reveal ranked Mayhem augments.
            </p>
          )}

          {selected && (
            <>
              <HextechPanel
                title={`Best for ${selected.name}`}
                accent="magic"
                className="mt-8"
                action={
                  <span className="hex-label">
                    {bestByRarity.length} rarities · {FEATURED_COUNT} /{' '}
                    {TOTAL_COUNT} each
                  </span>
                }
              >
                {bestByRarity.length === 0 ? (
                  <p className="px-2 py-4 text-sm text-hx-parchment/70">
                    No ranked rarities available for {selected.name} in the
                    current feed.
                  </p>
                ) : (
                  <div className="space-y-8">
                    {bestByRarity.map((bucket) => (
                      <section key={bucket.id}>
                        <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-hx-gold-dark/30 pb-2">
                          <h3 className="font-display text-base tracking-wide text-hx-gold">
                            {bucket.label}
                          </h3>
                          <span className="hex-label">
                            {bucket.featured.length} / {bucket.top20.length}
                          </span>
                        </div>

                        <p className="mb-2 hex-label">
                          Top {bucket.featured.length}
                        </p>
                        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {bucket.featured.map((augment, index) => {
                            const champTier = champTierFor(
                              augment,
                              selected.id
                            );
                            return (
                              <FeaturedAugmentCard
                                key={augment.id}
                                augment={augment}
                                rank={index + 1}
                                highlighted={bestIds.has(augment.id)}
                                {...(champTier !== undefined
                                  ? { champTier }
                                  : {})}
                              />
                            );
                          })}
                        </ol>

                        <p className="mt-5 mb-2 hex-label">
                          Top {bucket.top20.length}
                        </p>
                        <ol className="grid gap-1.5 sm:grid-cols-2">
                          {bucket.top20.map((augment, index) => {
                            const champTier = champTierFor(
                              augment,
                              selected.id
                            );
                            return (
                              <CompactAugmentTile
                                key={augment.id}
                                augment={augment}
                                rank={index + 1}
                                highlighted={bestIds.has(augment.id)}
                                {...(champTier !== undefined
                                  ? { champTier }
                                  : {})}
                              />
                            );
                          })}
                        </ol>
                      </section>
                    ))}
                  </div>
                )}
              </HextechPanel>

              <HextechPanel
                title="All augments"
                className="mt-8"
                action={
                  <span className="hex-label">
                    {allFiltered.length} / {allSorted.length}
                  </span>
                }
              >
                <label className="sr-only" htmlFor="mayhem-augment-search">
                  Filter augments by name
                </label>
                <input
                  id="mayhem-augment-search"
                  type="search"
                  value={augmentQuery}
                  onChange={(e) => setAugmentQuery(e.target.value)}
                  placeholder="Filter augments by name…"
                  className="mb-4 w-full hex-input"
                />
                <ul>
                  {allFiltered.map((augment) => (
                    <AugmentRow
                      key={augment.id}
                      augment={augment}
                      highlighted={bestIds.has(augment.id)}
                      showTopChamps
                    />
                  ))}
                </ul>
              </HextechPanel>
            </>
          )}
        </>
      )}
    </div>
  );
}
