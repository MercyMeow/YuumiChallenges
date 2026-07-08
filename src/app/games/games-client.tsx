'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { Trophy } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { HextechPanel, OrnateHeading } from '@/components/ui/hextech-panel';
import { GameCard } from '@/components/highelo/game-card';
import { HighEloTabs } from '@/components/highelo/high-elo-tabs';
import { platformLabel } from '@/lib/highelo/regions';
import { useLivePatch } from '@/lib/hooks/use-live-patch';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 50;

type WinFilter = 'all' | 'wins' | 'losses';

export function GamesClient() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [region, setRegion] = useState('all');
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
    () => [...new Set((shown ?? []).map((g) => g.platform))].sort(),
    [shown]
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
          (region === 'all' || g.platform === region) &&
          (patchFilter === 'all' || g.patch === patchFilter) &&
          (winFilter === 'all' || (winFilter === 'wins') === g.win)
      ),
    [shown, region, patchFilter, winFilter]
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <OrnateHeading as="h1" eyebrow="Live from the ladder">
        Master+ Yuumi Games
      </OrnateHeading>
      <p className="mt-3 text-center text-xs tracking-wide text-hx-gold/60">
        Every Master+ solo queue Yuumi game across all regions on patch{' '}
        {livePatch ?? '…'} and the one before · refreshed every 5 minutes
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
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-sm border border-hx-gold-dark/40 bg-transparent px-2 py-1.5 text-xs tracking-wide text-hx-gold hex-card-inset"
            aria-label="Filter by region"
          >
            <option value="all">All regions</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {platformLabel(r)}
              </option>
            ))}
          </select>
          <select
            value={patchFilter}
            onChange={(e) => setPatchFilter(e.target.value)}
            className="rounded-sm border border-hx-gold-dark/40 bg-transparent px-2 py-1.5 text-xs tracking-wide text-hx-gold hex-card-inset"
            aria-label="Filter by patch"
          >
            <option value="all">All patches</option>
            {patches.map((p) => (
              <option key={p} value={p}>
                Patch {p}
              </option>
            ))}
          </select>
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
                <div
                  key={i}
                  className="hex-card h-16 animate-pulse rounded-sm opacity-50"
                />
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
