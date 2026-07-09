'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { Crown } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { HextechPanel, OrnateHeading } from '@/components/ui/hextech-panel';
import { HextechSelect } from '@/components/highelo/hextech-select';
import { HighEloTabs } from '@/components/highelo/high-elo-tabs';
import { platformLabel, regionSlug } from '@/lib/highelo/regions';
import { cn } from '@/lib/utils';

const MIN_GAMES_DEFAULT = 10;

export function PlayersClient() {
  const [region, setRegion] = useState('all');
  const [minGamesOnly, setMinGamesOnly] = useState(true);
  const players = useQuery(api.highelo.listPlayers);

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

  const rows = useMemo(
    () =>
      (shown ?? []).filter(
        (p) =>
          (region === 'all' || p.platform === region) &&
          (!minGamesOnly || p.gamesCount >= MIN_GAMES_DEFAULT)
      ),
    [shown, region, minGamesOnly]
  );

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

      <HextechPanel
        title="The Yuumi Ladder"
        icon={<Crown className="h-4 w-4" aria-hidden />}
        className="mt-8"
        action={
          <span className="hex-label">
            {shown ? `${rows.length} players` : '…'}
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
              { value: 'all', label: 'All regions' },
              ...regions.map((r) => ({ value: r, label: platformLabel(r) })),
            ]}
          />
          <button
            type="button"
            aria-pressed={minGamesOnly}
            onClick={() => setMinGamesOnly((v) => !v)}
            className={cn(
              'rounded-sm border px-2.5 py-1.5 text-xs tracking-wide transition-colors',
              minGamesOnly
                ? 'border-hx-gold bg-hx-gold/10 text-hx-gold-bright'
                : 'border-hx-gold-dark/40 text-hx-gold/60 hover:text-hx-gold'
            )}
          >
            {minGamesOnly ? `${MIN_GAMES_DEFAULT}+ games` : 'All players'}
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
                <div
                  key={i}
                  className="hex-card h-10 animate-pulse rounded-sm opacity-50"
                />
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
