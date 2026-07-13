'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { Trophy } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { HextechPanel, OrnateHeading } from '@/components/ui/hextech-panel';
import { GameCard } from '@/components/highelo/game-card';
import { HextechSelect } from '@/components/highelo/hextech-select';
import { HighEloTabs } from '@/components/highelo/high-elo-tabs';
import { PanelSkeleton } from '@/components/ui/skeleton';
import { MAJOR_PLATFORMS, platformLabel } from '@/lib/highelo/regions';
import { useLivePatch } from '@/lib/hooks/use-live-patch';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 50;

type WinFilter = 'all' | 'wins' | 'losses';

export function GamesClient() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [region, setRegion] = useState('all');
  const [showAllRegions, setShowAllRegions] = useState(false);
  const [patchFilter, setPatchFilter] = useState('all');
  const [winFilter, setWinFilter] = useState<WinFilter>('all');
  const games = useQuery(api.highelo.listGames, { limit });
  const livePatch = useLivePatch();

  // Convex unreachable -> useQuery stays undefined forever; show a notice
  // instead of skeletons after a grace period.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (games !== undefined) return;
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [games]);

  // Hold the last defined result so "Load more" (which makes useQuery return
  // undefined while the bigger page loads) keeps existing cards visible, and
  // reset the timeout notice once data arrives. Render-time adjustment keeps
  // the React Compiler happy (same pattern as TopNav).
  const [prevGames, setPrevGames] = useState<typeof games>(undefined);
  if (games !== undefined) {
    if (games !== prevGames) setPrevGames(games);
    if (timedOut) setTimedOut(false);
  }
  const shown = games ?? prevGames;

  const regions = useMemo(
    () =>
      [...new Set((shown ?? []).map((g) => g.platform))]
        .filter((r) => showAllRegions || MAJOR_PLATFORMS.includes(r))
        .sort(),
    [shown, showAllRegions]
  );
  const patches = useMemo(
    () =>
      [...new Set((shown ?? []).map((g) => g.patch))].sort((a, b) =>
        b.localeCompare(a, undefined, { numeric: true })
      ),
    [shown]
  );

  const filtered = useMemo(
    () =>
      (shown ?? []).filter(
        (g) =>
          (showAllRegions || MAJOR_PLATFORMS.includes(g.platform)) &&
          (region === 'all' || g.platform === region) &&
          (patchFilter === 'all' || g.patch === patchFilter) &&
          (winFilter === 'all' || (winFilter === 'wins') === g.win)
      ),
    [shown, region, showAllRegions, patchFilter, winFilter]
  );

  const toggleAllRegions = (checked: boolean) => {
    setShowAllRegions(checked);
    // A minor region stays selectable only while "All regions" is on.
    if (!checked && region !== 'all' && !MAJOR_PLATFORMS.includes(region)) {
      setRegion('all');
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <OrnateHeading as="h1" eyebrow="Live from the ladder">
        Master+ Yuumi Games
      </OrnateHeading>
      <p className="mt-3 text-center text-xs tracking-wide text-hx-gold/60">
        Every Master+ solo queue Yuumi game across all regions on patch{' '}
        {livePatch ?? '…'} and the one before · refreshed around the clock,
        region by region
      </p>

      <HighEloTabs />

      <HextechPanel
        title="Game Feed"
        icon={<Trophy className="h-4 w-4" aria-hidden />}
        className="mt-8"
        action={
          <span className="hex-label">
            {shown ? `${filtered.length} games` : '…'}
          </span>
        }
      >
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <HextechSelect
            value={region}
            onValueChange={setRegion}
            ariaLabel="Filter by region"
            options={[
              {
                value: 'all',
                label: showAllRegions ? 'All regions' : 'Major regions',
              },
              ...regions.map((r) => ({ value: r, label: platformLabel(r) })),
            ]}
          />
          <label className="flex cursor-pointer items-center gap-1.5 rounded-sm border border-hx-gold-dark/40 px-2.5 py-1.5 text-xs tracking-wide text-hx-gold/60 transition-colors hover:text-hx-gold has-checked:border-hx-gold has-checked:bg-hx-gold/10 has-checked:text-hx-gold-bright">
            <input
              type="checkbox"
              checked={showAllRegions}
              onChange={(e) => toggleAllRegions(e.target.checked)}
              className="size-3.5 accent-hx-gold"
            />
            All regions
          </label>
          <HextechSelect
            value={patchFilter}
            onValueChange={setPatchFilter}
            ariaLabel="Filter by patch"
            options={[
              { value: 'all', label: 'All patches' },
              ...patches.map((p) => ({ value: p, label: `Patch ${p}` })),
            ]}
          />
          <div className="flex gap-1">
            {(['all', 'wins', 'losses'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setWinFilter(value)}
                className={cn(
                  'rounded-sm border px-2.5 py-1.5 text-xs tracking-wide capitalize transition-colors',
                  winFilter === value
                    ? 'border-hx-gold bg-hx-gold/10 text-hx-gold-bright'
                    : 'border-hx-gold-dark/40 text-hx-gold/60 hover:text-hx-gold'
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        {shown === undefined ? (
          timedOut ? (
            <p className="py-10 text-center text-sm text-hx-gold/60">
              The game feed is unavailable right now — please try again later.
            </p>
          ) : (
            <div className="space-y-2" aria-busy>
              {Array.from({ length: 6 }, (_, i) => (
                <PanelSkeleton key={i} className="h-16" />
              ))}
            </div>
          )
        ) : filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-hx-gold/60">
            {shown.length > 0
              ? 'No games match these filters.'
              : 'No games found yet — the ladder sweep may still be warming up.'}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((game) => (
              <GameCard key={game._id} game={game} />
            ))}
          </div>
        )}

        {/* Load more */}
        {games && games.length >= limit && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              className="btn-hextech rounded-sm px-4 py-2 text-xs"
            >
              Load more
            </button>
          </div>
        )}
      </HextechPanel>
    </div>
  );
}
