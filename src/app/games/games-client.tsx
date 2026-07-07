'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { Swords, Trophy } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import type { Doc } from '@/../convex/_generated/dataModel';
import { HextechPanel, OrnateHeading } from '@/components/ui/hextech-panel';
import { DataDragonImage } from '@/components/ui/datadragon-image';
import { useLivePatch } from '@/lib/hooks/use-live-patch';
import { cn } from '@/lib/utils';

type YuumiGame = Doc<'yuumiGames'>;

const PAGE_SIZE = 50;

const PLATFORM_LABELS: Record<string, string> = {
  br1: 'BR',
  eun1: 'EUNE',
  euw1: 'EUW',
  jp1: 'JP',
  kr: 'KR',
  la1: 'LAN',
  la2: 'LAS',
  me1: 'ME',
  na1: 'NA',
  oc1: 'OCE',
  ru: 'RU',
  sg2: 'SEA',
  tr1: 'TR',
  tw2: 'TW',
  vn2: 'VN',
};

function platformLabel(platform: string): string {
  return PLATFORM_LABELS[platform] ?? platform.toUpperCase();
}

function timeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function GameCard({ game }: { game: YuumiGame }) {
  const kda =
    game.deaths === 0
      ? 'Perfect'
      : ((game.kills + game.assists) / game.deaths).toFixed(1);

  return (
    <Link
      href={`/match/${game.matchId}`}
      className={cn(
        'group hex-card relative block rounded-sm border-l-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-hx-gold',
        game.win ? 'border-l-emerald-400/70' : 'border-l-red-400/60'
      )}
    >
      <div className="flex flex-col gap-3 p-3 sm:p-4 lg:flex-row lg:items-center lg:gap-4">
        {/* Yuumi player */}
        <div className="flex min-w-0 items-center gap-3 lg:w-72 lg:shrink-0">
          <Image
            src={`/images/ranked/${game.tier.toLowerCase()}.png`}
            alt={game.tier}
            width={40}
            height={40}
            className="shrink-0"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-hx-gold-bright">
              {game.playerName}
              {game.playerTag && (
                <span className="ml-1 text-xs font-normal text-hx-gold/50">
                  #{game.playerTag}
                </span>
              )}
            </div>
            <div className="text-[11px] tracking-wide text-hx-gold/60">
              {game.lp} LP · {game.kills}/{game.deaths}/{game.assists} · {kda}{' '}
              KDA
            </div>
          </div>
        </div>

        {/* Team comps */}
        <div className="flex flex-1 items-center justify-center gap-2">
          <div className="flex gap-1">
            {game.allyChampions.map((champion, i) => (
              <DataDragonImage
                key={`ally-${champion}-${i}`}
                championId={champion}
                type="icon"
                width={28}
                height={28}
                className={cn(
                  'rounded-sm',
                  champion === 'Yuumi' && 'ring-2 ring-hx-magic'
                )}
              />
            ))}
          </div>
          <Swords
            className="h-3.5 w-3.5 shrink-0 text-hx-gold/40"
            aria-hidden
          />
          <div className="flex gap-1">
            {game.enemyChampions.map((champion, i) => (
              <DataDragonImage
                key={`enemy-${champion}-${i}`}
                championId={champion}
                type="icon"
                width={28}
                height={28}
                className="rounded-sm opacity-90"
              />
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 text-[11px] tracking-wide text-hx-gold/60 lg:w-64 lg:shrink-0 lg:justify-end">
          <span
            className={cn(
              'hex-title text-xs',
              game.win ? 'text-emerald-300' : 'text-red-300'
            )}
          >
            {game.win ? 'Victory' : 'Defeat'}
          </span>
          <span className="hex-chip-magic">{platformLabel(game.platform)}</span>
          <span>{game.patch}</span>
          <span>{formatDuration(game.gameDuration)}</span>
          <span className="whitespace-nowrap">
            {timeAgo(game.gameCreation)}
          </span>
        </div>
      </div>
    </Link>
  );
}

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

  const regions = useMemo(
    () => [...new Set((games ?? []).map((g) => g.platform))].sort(),
    [games]
  );
  const patches = useMemo(
    () =>
      [...new Set((games ?? []).map((g) => g.patch))].sort((a, b) =>
        b.localeCompare(a, undefined, { numeric: true })
      ),
    [games]
  );

  const filtered = useMemo(
    () =>
      (games ?? []).filter(
        (g) =>
          (region === 'all' || g.platform === region) &&
          (patchFilter === 'all' || g.patch === patchFilter) &&
          (winFilter === 'all' || (winFilter === 'wins') === g.win)
      ),
    [games, region, patchFilter, winFilter]
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

      <HextechPanel
        title="Game Feed"
        icon={<Trophy className="h-4 w-4" aria-hidden />}
        className="mt-8"
        action={
          <span className="hex-label">
            {games ? `${filtered.length} games` : '…'}
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
        {games === undefined ? (
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
            No games found yet — the ladder sweep may still be warming up.
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
