'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { Layers, Trophy, Users } from 'lucide-react';
import { api } from '@/../convex/_generated/api';
import { HextechPanel } from '@/components/ui/hextech-panel';
import { DataDragonImage } from '@/components/ui/datadragon-image';
import { RuneIcon } from '@/components/ui/rune-display';
import { ItemSlot } from '@/components/match-history/item-slots';
import { GameCard } from '@/components/highelo/game-card';
import { HighEloTabs } from '@/components/highelo/high-elo-tabs';
import { platformLabel } from '@/lib/highelo/regions';
import type { ProfileParams } from './profile-data';

const STYLE_NAMES: Record<number, string> = {
  8000: 'Precision',
  8100: 'Domination',
  8200: 'Sorcery',
  8300: 'Inspiration',
  8400: 'Resolve',
};

const SPELL_NAMES: Record<number, string> = {
  1: 'Cleanse',
  3: 'Exhaust',
  4: 'Flash',
  6: 'Ghost',
  7: 'Heal',
  11: 'Smite',
  12: 'Teleport',
  13: 'Clarity',
  14: 'Ignite',
  21: 'Barrier',
  32: 'Snowball',
};

function gamesLabel(count: number): string {
  return count === 1 ? '1 game' : `${count} games`;
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-6">
      <HighEloTabs />
      {children}
    </div>
  );
}

function NotFound() {
  return (
    <Shell>
      <HextechPanel title="Player Not Found" className="mt-2">
        <p className="py-6 text-center text-sm text-hx-gold/60">
          This summoner isn&apos;t on the Master+ Yuumi ladder.
        </p>
        <div className="pb-4 text-center">
          <Link
            href="/players"
            className="btn-hextech rounded-sm px-4 py-2 text-xs"
          >
            Back to the ladder
          </Link>
        </div>
      </HextechPanel>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-16 text-center">
      <div className="hex-title text-lg text-hx-gold-bright">{value}</div>
      <div className="mt-0.5 hex-label">{label}</div>
    </div>
  );
}

export function ProfileClient({ params }: { params: ProfileParams | null }) {
  const profile = useQuery(api.highelo.getPlayerProfile, params ?? 'skip');

  // Convex unreachable -> useQuery stays undefined forever; show a notice
  // instead of skeletons after a grace period.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (params === null || profile !== undefined) return;
    const timer = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [params, profile]);
  // Render-time reset keeps the React Compiler happy (same pattern as the
  // games feed).
  if (profile !== undefined && timedOut) setTimedOut(false);

  if (params === null || profile === null) {
    return <NotFound />;
  }

  if (profile === undefined) {
    return (
      <Shell>
        {timedOut ? (
          <p className="py-10 text-center text-sm text-hx-gold/60">
            This profile is unavailable right now — please try again later.
          </p>
        ) : (
          <div className="space-y-4" aria-busy>
            <div className="hex-card h-28 animate-pulse rounded-sm opacity-50" />
            {Array.from({ length: 3 }, (_, i) => (
              <div
                key={i}
                className="hex-card h-40 animate-pulse rounded-sm opacity-50"
              />
            ))}
          </div>
        )}
      </Shell>
    );
  }

  const { player } = profile;
  const winrate =
    player.gamesCount > 0
      ? Math.round((player.wins / player.gamesCount) * 100)
      : 0;
  const kda =
    player.deathsTotal === 0
      ? 'Perfect'
      : (
          (player.killsTotal + player.assistsTotal) /
          player.deathsTotal
        ).toFixed(2);
  const showPosition =
    typeof player.position === 'number' && player.position > 0;

  return (
    <Shell>
      {/* Identity header */}
      <div className="hex-card flex flex-wrap items-center gap-4 rounded-sm p-4 sm:p-5">
        <Image
          src={`/images/ranked/${player.tier.toLowerCase()}.png`}
          alt={player.tier}
          width={72}
          height={72}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h1 className="hex-title text-xl text-hx-gold-bright sm:text-2xl">
            {player.gameName}
            <span className="ml-1.5 text-sm font-normal tracking-normal text-hx-gold/50">
              #{player.tagLine}
            </span>
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs tracking-wide text-hx-gold/60">
            <span className="hex-chip-magic">
              {platformLabel(player.platform)}
            </span>
            <span className="capitalize">{player.tier.toLowerCase()}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Stat label="LP" value={player.lp} />
          {showPosition && (
            <Stat label="Yuumi worldwide" value={`#${player.position}`} />
          )}
          <Stat
            label={`${player.gamesCount} games`}
            value={player.gamesCount < 5 ? 'Early season' : `${winrate}%`}
          />
          <Stat label="Avg KDA" value={kda} />
        </div>
      </div>

      {/* Common builds */}
      <HextechPanel
        title="Common Builds"
        icon={<Layers className="h-4 w-4" aria-hidden />}
        className="mt-6"
      >
        {profile.builds.length === 0 && profile.runePages.length === 0 ? (
          <p className="py-6 text-center text-sm text-hx-gold/60">
            No build data yet — games are still being ingested.
          </p>
        ) : (
          <div className="space-y-4">
            {profile.builds.map((build) => (
              <div
                key={build.items.join(',')}
                className="flex flex-wrap items-center gap-3"
              >
                <div className="flex gap-1">
                  {build.items.map((itemId, i) => (
                    <ItemSlot
                      key={`${itemId}-${i}`}
                      itemId={itemId}
                      size="lg"
                    />
                  ))}
                </div>
                <span className="text-xs tracking-wide text-hx-gold/60">
                  {gamesLabel(build.games)} ·{' '}
                  {Math.round((build.wins / build.games) * 100)}% WR
                </span>
              </div>
            ))}
            {profile.runePages.length > 0 && (
              <div className="space-y-3 border-t border-hx-gold-dark/30 pt-4">
                {profile.runePages.map((page) => (
                  <div
                    key={`${page.keystoneId}-${page.secondaryStyleId}-${page.summonerSpells.join(',')}`}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <RuneIcon
                      runeId={page.keystoneId}
                      size="md"
                      variant="keystone"
                    />
                    <span className="text-sm text-hx-gold">
                      {STYLE_NAMES[page.secondaryStyleId] ?? 'Unknown'}{' '}
                      secondary
                    </span>
                    <span className="text-xs tracking-wide text-hx-gold/60">
                      {page.summonerSpells
                        .map((id) => SPELL_NAMES[id] ?? `Spell ${id}`)
                        .join(' + ')}
                    </span>
                    <span className="text-xs tracking-wide text-hx-gold/60">
                      {gamesLabel(page.games)} ·{' '}
                      {Math.round((page.wins / page.games) * 100)}% WR
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </HextechPanel>

      {/* Duo partners */}
      <HextechPanel
        title="Duo Partners"
        icon={<Users className="h-4 w-4" aria-hidden />}
        className="mt-6"
      >
        {profile.duos.length === 0 ? (
          <p className="py-6 text-center text-sm text-hx-gold/60">
            No duo data yet — games are still being ingested.
          </p>
        ) : (
          <div className="space-y-2">
            {profile.duos.map((duo) => (
              <div key={duo.champion} className="flex items-center gap-3">
                <DataDragonImage
                  championId={duo.champion}
                  type="icon"
                  width={32}
                  height={32}
                  className="rounded-sm"
                />
                <span className="flex-1 text-sm font-semibold text-hx-gold-bright">
                  {duo.champion}
                </span>
                <span className="text-xs tracking-wide text-hx-gold/60">
                  {gamesLabel(duo.games)} ·{' '}
                  {Math.round((duo.wins / duo.games) * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </HextechPanel>

      {/* Recent games */}
      <HextechPanel
        title="Recent Games"
        icon={<Trophy className="h-4 w-4" aria-hidden />}
        className="mt-6"
      >
        {profile.recentGames.length === 0 ? (
          <p className="py-6 text-center text-sm text-hx-gold/60">
            No games recorded yet.
          </p>
        ) : (
          <div className="space-y-2">
            {profile.recentGames.map((game) => (
              <GameCard key={game._id} game={game} />
            ))}
          </div>
        )}
      </HextechPanel>
    </Shell>
  );
}
