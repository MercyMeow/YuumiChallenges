'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { Crown, TrendingUp } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { HextechPanel, OrnateHeading } from '@/components/ui/hextech-panel';
import { HextechSelect } from '@/components/highelo/hextech-select';
import { HighEloTabs } from '@/components/highelo/high-elo-tabs';
import { PanelSkeleton } from '@/components/ui/skeleton';
import { platformLabel, regionSlug } from '@/lib/highelo/regions';
import { parseClimbers } from '@/lib/highelo/meta-stats';
import { getLastViewedProfileSnapshot } from '@/lib/highelo/last-profile';
import { cn } from '@/lib/utils';

const MIN_GAMES_DEFAULT = 10;
const CLIMBERS_SHOWN = 6;

/** The three ladders: raw rank, efficiency, and sheer dedication. */
const SORT_MODES = [
  { value: 'rank', label: 'Rank' },
  { value: 'winrate', label: 'Winrate' },
  { value: 'games', label: 'Most games' },
] as const;
type SortMode = (typeof SORT_MODES)[number]['value'];

function profileHref(platform: string, gameName: string, tagLine: string) {
  return `/players/${regionSlug(platform)}/${encodeURIComponent(`${gameName}-${tagLine}`)}`;
}

// The last-viewed pin only needs the value at mount; localStorage has no
// same-tab change events worth subscribing to.
function subscribeNever(): () => void {
  return () => {};
}

export function PlayersClient() {
  const [region, setRegion] = useState('all');
  const [minGamesOnly, setMinGamesOnly] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('rank');
  const players = useQuery(api.highelo.listPlayers);
  const climbersRaw = useQuery(api.meta.getClimbers);

  // Last-viewed profile from localStorage; the server snapshot is null, so
  // the pin appears only after hydration (no mismatch).
  const lastViewed = useSyncExternalStore(
    subscribeNever,
    getLastViewedProfileSnapshot,
    () => null
  );

  // Convex unreachable -> useQuery stays undefined forever; show a notice
  // instead of skeletons after a grace period.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (players !== undefined) return;
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [players]);

  // Hold the last defined result so refetches keep existing rows visible,
  // and reset the timeout notice once data arrives. Render-time adjustment
  // keeps the React Compiler happy (same pattern as the games feed).
  const [prevPlayers, setPrevPlayers] = useState<typeof players>(undefined);
  if (players !== undefined) {
    if (players !== prevPlayers) setPrevPlayers(players);
    if (timedOut) setTimedOut(false);
  }
  const shown = players ?? prevPlayers;

  const regions = useMemo(
    () => [...new Set((shown ?? []).map((p) => p.platform))].sort(),
    [shown]
  );

  const rows = useMemo(() => {
    // Winrate sorting is meaningless below a games floor, so the minimum
    // is enforced there regardless of the toggle.
    const minGames =
      sortMode === 'winrate' || minGamesOnly ? MIN_GAMES_DEFAULT : 0;
    const filtered = (shown ?? []).filter(
      (p) =>
        (region === 'all' || p.platform === region) && p.gamesCount >= minGames
    );
    if (sortMode === 'winrate') {
      return [...filtered].sort(
        (a, b) =>
          b.wins / b.gamesCount - a.wins / a.gamesCount ||
          b.gamesCount - a.gamesCount
      );
    }
    if (sortMode === 'games') {
      return [...filtered].sort((a, b) => b.gamesCount - a.gamesCount);
    }
    return filtered; // 'rank': the query already orders by tier, then LP
  }, [shown, region, minGamesOnly, sortMode]);

  const climbers = useMemo(() => {
    if (climbersRaw === undefined || climbersRaw === null) return null;
    const parsed = parseClimbers(climbersRaw);
    return parsed && parsed.entries.length > 0 ? parsed : null;
  }, [climbersRaw]);

  // "Continue where you left off": global rank in the default ordering.
  const lastViewedRank = useMemo(() => {
    if (!lastViewed || !shown) return null;
    const index = shown.findIndex((p) => p.puuid === lastViewed.puuid);
    return index === -1 ? null : index + 1;
  }, [lastViewed, shown]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <OrnateHeading as="h1" eyebrow="Master+ around the world">
        The Yuumi Ladder
      </OrnateHeading>
      <p className="mt-3 text-center text-xs tracking-wide text-hx-gold/60">
        Every Master+ solo queue Yuumi player across all regions, ranked by tier
        and LP · season stats from the game feed
      </p>

      <HighEloTabs />

      {/* Climbers of the week — appears once snapshot history exists. */}
      {climbers && (
        <HextechPanel
          title="Climbers of the Week"
          icon={<TrendingUp className="h-4 w-4" aria-hidden />}
          accent="magic"
          className="mt-8"
          action={<span className="hex-label">past 7 days</span>}
        >
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {climbers.entries.slice(0, CLIMBERS_SHOWN).map((climber, i) => (
              <Link
                key={climber.puuid}
                href={profileHref(
                  climber.platform,
                  climber.gameName,
                  climber.tagLine
                )}
                className="group flex items-center gap-3 rounded-sm px-3 py-2.5 hex-card-inset transition-colors hover:bg-hx-gold/5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-hx-gold"
              >
                <span className="w-5 shrink-0 hex-title text-sm text-hx-gold/50">
                  {i + 1}
                </span>
                <Image
                  src={`/images/ranked/${climber.tier.toLowerCase()}.png`}
                  alt={climber.tier}
                  width={28}
                  height={28}
                  className="shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-hx-gold-bright group-hover:underline">
                    {climber.gameName}
                    <span className="ml-1 text-xs font-normal text-hx-gold/50">
                      #{climber.tagLine}
                    </span>
                  </span>
                  <span className="block text-[11px] tracking-wide text-hx-gold/50">
                    {platformLabel(climber.platform)} · {climber.lp} LP
                  </span>
                </span>
                <span className="shrink-0 hex-title text-sm text-emerald-300">
                  +{climber.delta} LP
                </span>
              </Link>
            ))}
          </div>
        </HextechPanel>
      )}

      {/* Continue where you left off */}
      {lastViewed && lastViewedRank !== null && (
        <Link
          href={profileHref(
            lastViewed.platform,
            lastViewed.gameName,
            lastViewed.tagLine
          )}
          className="group hex-card mt-4 flex items-center gap-3 rounded-sm px-4 py-2.5 transition-colors hover:bg-hx-gold/5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-hx-gold"
        >
          <span className="shrink-0 hex-label">Continue</span>
          <span className="min-w-0 flex-1 truncate text-sm text-hx-gold-bright group-hover:underline">
            {lastViewed.gameName}
            <span className="ml-1 text-xs text-hx-gold/50">
              #{lastViewed.tagLine}
            </span>
          </span>
          <span className="shrink-0 text-xs tracking-wide text-hx-gold/60">
            #{lastViewedRank} Yuumi worldwide
          </span>
        </Link>
      )}

      <HextechPanel
        title="The Yuumi Ladder"
        icon={<Crown className="h-4 w-4" aria-hidden />}
        className={
          climbers || (lastViewed && lastViewedRank !== null) ? 'mt-6' : 'mt-8'
        }
        action={
          <span className="hex-label">
            {shown ? `${rows.length} players` : '…'}
          </span>
        }
      >
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            {SORT_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setSortMode(mode.value)}
                aria-pressed={sortMode === mode.value}
                className={cn(
                  'rounded-sm border px-2.5 py-1.5 text-xs tracking-wide transition-colors',
                  sortMode === mode.value
                    ? 'border-hx-magic bg-hx-magic/10 text-hx-magic-bright'
                    : 'border-hx-gold-dark/40 text-hx-gold/60 hover:text-hx-gold'
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <HextechSelect
            value={region}
            onValueChange={setRegion}
            ariaLabel="Filter by region"
            options={[
              { value: 'all', label: 'All regions' },
              ...regions.map((r) => ({ value: r, label: platformLabel(r) })),
            ]}
          />
          <button
            type="button"
            aria-pressed={minGamesOnly}
            onClick={() => setMinGamesOnly((v) => !v)}
            disabled={sortMode === 'winrate'}
            className={cn(
              'rounded-sm border px-2.5 py-1.5 text-xs tracking-wide transition-colors',
              minGamesOnly || sortMode === 'winrate'
                ? 'border-hx-gold bg-hx-gold/10 text-hx-gold-bright'
                : 'border-hx-gold-dark/40 text-hx-gold/60 hover:text-hx-gold',
              sortMode === 'winrate' && 'cursor-not-allowed opacity-60'
            )}
          >
            {minGamesOnly || sortMode === 'winrate'
              ? `${MIN_GAMES_DEFAULT}+ games`
              : 'All players'}
          </button>
        </div>

        {/* Ladder */}
        {shown === undefined ? (
          timedOut ? (
            <p className="py-10 text-center text-sm text-hx-gold/60">
              The ladder is unavailable right now — please try again later.
            </p>
          ) : (
            <div className="space-y-2" aria-busy>
              {Array.from({ length: 8 }, (_, i) => (
                <PanelSkeleton key={i} className="h-10" />
              ))}
            </div>
          )
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-hx-gold/60">
            {shown.length > 0
              ? 'No players match these filters.'
              : 'The ladder is still assembling — check back soon.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-hx-gold-dark/30 hex-label text-[10px]">
                  <th scope="col" className="px-2 py-2">
                    #
                  </th>
                  <th scope="col" className="px-2 py-2">
                    Player
                  </th>
                  <th scope="col" className="px-2 py-2">
                    Region
                  </th>
                  <th scope="col" className="px-2 py-2 text-right">
                    LP
                  </th>
                  <th scope="col" className="px-2 py-2 text-right">
                    Games
                  </th>
                  <th scope="col" className="px-2 py-2 text-right">
                    Winrate
                  </th>
                  <th scope="col" className="px-2 py-2 text-right">
                    KDA
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => {
                  const winrate =
                    p.gamesCount > 0
                      ? Math.round((p.wins / p.gamesCount) * 100)
                      : 0;
                  const kda =
                    p.deathsTotal === 0
                      ? 'Perfect'
                      : (
                          (p.killsTotal + p.assistsTotal) /
                          p.deathsTotal
                        ).toFixed(2);
                  return (
                    <tr
                      key={p.puuid}
                      className="group relative border-b border-hx-gold-dark/15 transition-colors hover:bg-hx-gold/5"
                    >
                      <td className="px-2 py-2.5 text-hx-gold/50">{i + 1}</td>
                      <td className="px-2 py-2.5">
                        <Link
                          href={`/players/${regionSlug(p.platform)}/${encodeURIComponent(`${p.gameName}-${p.tagLine}`)}`}
                          className="flex items-center gap-2 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-hx-gold"
                        >
                          <Image
                            src={`/images/ranked/${p.tier.toLowerCase()}.png`}
                            alt={p.tier}
                            width={24}
                            height={24}
                          />
                          <span className="font-semibold text-hx-gold-bright group-hover:underline">
                            {p.gameName}
                            <span className="ml-1 text-xs font-normal text-hx-gold/50">
                              #{p.tagLine}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-2 py-2.5">
                        <span className="hex-chip-magic">
                          {platformLabel(p.platform)}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right text-hx-gold">
                        {p.lp}
                      </td>
                      <td className="px-2 py-2.5 text-right text-hx-gold/70">
                        {p.gamesCount}
                      </td>
                      <td
                        className={cn(
                          'px-2 py-2.5 text-right',
                          winrate >= 55
                            ? 'text-hx-gold-bright'
                            : 'text-hx-gold/70'
                        )}
                      >
                        {winrate}%
                      </td>
                      <td className="px-2 py-2.5 text-right text-hx-gold/70">
                        {kda}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-center text-[11px] tracking-wide text-hx-gold/40">
          Players with fewer than {MIN_GAMES_DEFAULT} season games are hidden by
          default.
        </p>
      </HextechPanel>
    </div>
  );
}
