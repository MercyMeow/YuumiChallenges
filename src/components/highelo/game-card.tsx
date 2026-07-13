'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Swords } from 'lucide-react';
import type { Doc } from '@/../convex/_generated/dataModel';
import { DataDragonImage } from '@/components/ui/datadragon-image';
import { ItemSlot } from '@/components/match-history/item-slots';
import { SummonerSpell } from '@/components/match-history/summoner-spells';
import { RuneIcon } from '@/components/ui/rune-display';
import { platformLabel } from '@/lib/highelo/regions';
import { cn } from '@/lib/utils';

type YuumiGame = Doc<'yuumiGames'>;

// Trinkets/wards are dropped from the compact build strip — they aren't
// part of the item build onetricks-style rows care about.
const TRINKET_ITEM_IDS = new Set([3340, 3363, 3364]);

export function timeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function GameCard({
  game,
  showBuild = false,
}: {
  game: YuumiGame;
  /** Render a compact keystone + summoners + items strip below the row.
   *  Off by default so the /games feed keeps its existing appearance. */
  showBuild?: boolean;
}) {
  const kda =
    game.deaths === 0
      ? 'Perfect'
      : ((game.kills + game.assists) / game.deaths).toFixed(1);

  // Per-game build snapshot — every field is optional (pre-enrichment rows
  // lack it), so guard each part and hide the strip when nothing is present.
  const keystoneId = game.primaryRunes?.[0] || game.keystoneId || undefined;
  const spells = game.summonerSpells ?? [];
  const buildItems = (game.items ?? []).filter(
    (id) => id !== 0 && !TRINKET_ITEM_IDS.has(id)
  );
  const hasBuild =
    keystoneId !== undefined || spells.length > 0 || buildItems.length > 0;

  return (
    <Link
      href={`/match/${game.matchId}`}
      className={cn(
        'group hex-card relative block rounded-sm border-l-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-hx-gold focus:outline-hidden focus-visible:ring-2 focus-visible:ring-hx-gold',
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

      {/* Compact build strip — opt-in (profile Recent Games), skipped when
          the row carries no build snapshot. */}
      {showBuild && hasBuild && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-hx-gold-dark/30 px-3 pt-2.5 pb-3 sm:px-4">
          {(keystoneId !== undefined || spells.length > 0) && (
            <div className="flex items-center gap-1">
              {keystoneId !== undefined && (
                <RuneIcon runeId={keystoneId} size="sm" variant="keystone" />
              )}
              {spells.map((spellId, i) => (
                <SummonerSpell
                  key={`spell-${spellId}-${i}`}
                  spellId={spellId}
                  size="sm"
                />
              ))}
            </div>
          )}
          {buildItems.length > 0 && (
            <div className="flex items-center gap-1 border-l border-hx-gold-dark/30 pl-3">
              {buildItems.map((itemId, i) => (
                <ItemSlot
                  key={`item-${itemId}-${i}`}
                  itemId={itemId}
                  size="sm"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Link>
  );
}
