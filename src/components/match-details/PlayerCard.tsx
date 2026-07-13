/**
 * Player Card Component
 * One scoreboard row inside a team panel: identity, KDA, stat blocks,
 * items and runes. Wraps instead of overflowing on narrow viewports.
 */

import { memo } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { ItemSlots } from '@/components/match-history/item-slots';
import { SummonerSpells } from '@/components/match-history/summoner-spells';
import { RuneIcon, StatShardIcon } from '@/components/ui/rune-display';
import { DetailedMatchParticipant } from '@/lib/types';
import { getRoleBoundSlot } from '@/lib/utils/role-quest';
import { GitCompare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExtendedMatchData, TeamTotals } from './types';

const POSITION_LABELS: Record<string, string> = {
  TOP: 'Top',
  JUNGLE: 'Jungle',
  MIDDLE: 'Mid',
  BOTTOM: 'Bot',
  UTILITY: 'Support',
};

interface PlayerCardProps {
  participant: DetailedMatchParticipant;
  teamColor: 'blue' | 'red';
  teamTotals: TeamTotals;
  matchData: ExtendedMatchData;
  selectedPlayer: number | null;
  comparePlayer: number | null;
  setSelectedPlayer: (index: number | null) => void;
  setComparePlayer: (index: number | null) => void;
  getKDAColor: (kills: number, deaths: number, assists: number) => string;
  formatNumber: (num: number) => string;
}

/** Compact centered stat with an optional share-of-team meter. */
function StatBlock({
  value,
  label,
  valueClassName,
  share,
}: {
  value: string | number;
  label: string;
  valueClassName: string;
  share?: number;
}) {
  return (
    <div className="w-16 shrink-0 text-center">
      <div className={cn('text-sm font-bold', valueClassName)}>{value}</div>
      <div className="text-[10px] tracking-widest text-hx-gold/50 uppercase">
        {label}
      </div>
      {share !== undefined && (
        <div className="mx-auto mt-1 h-0.5 w-12 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn('h-full bg-current', valueClassName)}
            style={{ width: `${Math.min(100, Math.max(0, share))}%` }}
          />
        </div>
      )}
    </div>
  );
}

function StatTooltipRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-hx-parchment/60">{label}</span>
      <span className={cn('font-semibold', valueClassName)}>{value}</span>
    </div>
  );
}

const STAT_TOOLTIP_CLASS =
  'border-hx-gold-dark/60 bg-hx-black/95 text-hx-parchment';

export const PlayerCard = memo(
  ({
    participant,
    teamColor,
    teamTotals,
    matchData,
    selectedPlayer,
    comparePlayer,
    setSelectedPlayer,
    setComparePlayer,
    getKDAColor,
    formatNumber,
  }: PlayerCardProps) => {
    const playerIndex = matchData.info.participants.indexOf(participant);
    const isSelected = selectedPlayer === playerIndex;
    const isComparing = comparePlayer === playerIndex;

    const items = [
      participant.item0,
      participant.item1,
      participant.item2,
      participant.item3,
      participant.item4,
      participant.item5,
      participant.item6,
    ];

    const kda =
      participant.deaths > 0
        ? (
            (participant.kills + participant.assists) /
            participant.deaths
          ).toFixed(2)
        : 'Perfect';

    const killParticipation =
      teamTotals.kills > 0
        ? Math.round(
            ((participant.kills + participant.assists) / teamTotals.kills) * 100
          )
        : 0;

    const minutes = Math.max(1, matchData.info.gameDuration / 60);
    const cs =
      participant.totalMinionsKilled + participant.neutralMinionsKilled;
    const damageShare =
      teamTotals.damage > 0
        ? (participant.totalDamageDealtToChampions / teamTotals.damage) * 100
        : 0;
    const goldShare =
      teamTotals.gold > 0
        ? (participant.goldEarned / teamTotals.gold) * 100
        : 0;

    const displayName =
      participant.riotIdGameName && participant.riotIdTagline
        ? participant.riotIdGameName
        : participant.summonerName;
    const position =
      POSITION_LABELS[participant.individualPosition] ??
      participant.individualPosition;

    const keystone = participant.perks?.styles?.[0]?.selections?.[0];
    const statPerks = participant.perks?.statPerks;

    return (
      <div
        className={cn(
          'relative cursor-pointer rounded-sm border-l-2 p-3 hex-card-inset transition-all duration-200',
          teamColor === 'blue'
            ? 'border-l-sky-400/70 hover:border-l-sky-300'
            : 'border-l-red-400/60 hover:border-l-red-300',
          isSelected && 'ring-2 ring-hx-magic',
          isComparing && 'ring-2 ring-hx-gold'
        )}
        onClick={() => {
          setSelectedPlayer(isSelected ? null : playerIndex);
        }}
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {/* Identity: champion, spells, name */}
          <div className="flex min-w-0 flex-1 basis-52 items-center gap-2.5">
            <div className="relative shrink-0">
              <ChampionIcon
                championId={participant.championName}
                size="md"
                className="rounded-sm border border-hx-gold-dark/50"
              />
              <div className="absolute -right-1.5 -bottom-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-hx-gold-dark/70 bg-hx-black px-1 text-[10px] font-bold text-hx-gold-bright">
                {participant.champLevel}
              </div>
            </div>
            <SummonerSpells
              spell1Id={participant.summoner1Id}
              spell2Id={participant.summoner2Id}
              size="sm"
              orientation="vertical"
              className="shrink-0"
            />
            <div className="min-w-0">
              <div
                className="truncate text-sm font-semibold text-hx-parchment"
                title={
                  participant.riotIdTagline
                    ? `${displayName}#${participant.riotIdTagline}`
                    : displayName
                }
              >
                {displayName}
                {participant.riotIdTagline && (
                  <span className="ml-1 text-xs font-normal text-hx-gold/50">
                    #{participant.riotIdTagline}
                  </span>
                )}
              </div>
              <div className="truncate text-[11px] tracking-wide text-hx-gold/60">
                {participant.championName} · {position}
              </div>
            </div>
          </div>

          {/* KDA */}
          <div className="w-24 shrink-0 text-center">
            <div
              className={cn(
                'text-sm font-bold',
                getKDAColor(
                  participant.kills,
                  participant.deaths,
                  participant.assists
                )
              )}
            >
              {participant.kills}/{participant.deaths}/{participant.assists}
            </div>
            <div className="text-[10px] tracking-widest text-hx-gold/50 uppercase">
              {kda} KDA · {killParticipation}% KP
            </div>
          </div>

          {/* Damage (hover for DPM and % team damage) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help touch-manipulation">
                <StatBlock
                  value={formatNumber(participant.totalDamageDealtToChampions)}
                  label="Damage"
                  valueClassName="text-orange-300"
                  share={damageShare}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className={STAT_TOOLTIP_CLASS}>
              <div className="space-y-1">
                <StatTooltipRow
                  label="DPM"
                  value={Math.round(
                    participant.challenges?.damagePerMinute ??
                      participant.totalDamageDealtToChampions / minutes
                  )}
                  valueClassName="text-orange-300"
                />
                <StatTooltipRow
                  label="% Team Damage"
                  value={`${Math.round(damageShare)}%`}
                  valueClassName="text-orange-300"
                />
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Gold (hover for GPM) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help touch-manipulation">
                <StatBlock
                  value={formatNumber(participant.goldEarned)}
                  label="Gold"
                  valueClassName="text-hx-gold-bright"
                  share={goldShare}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className={STAT_TOOLTIP_CLASS}>
              <StatTooltipRow
                label="GPM"
                value={Math.round(participant.goldEarned / minutes)}
                valueClassName="text-hx-gold-bright"
              />
            </TooltipContent>
          </Tooltip>

          {/* CS */}
          <StatBlock
            value={cs}
            label={`CS ${(cs / minutes).toFixed(1)}/m`}
            valueClassName="text-hx-parchment"
          />

          {/* Vision (hover for VPM and pink wards purchased) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help touch-manipulation">
                <StatBlock
                  value={participant.visionScore}
                  label="Vision"
                  valueClassName="text-hx-magic-bright"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent className={STAT_TOOLTIP_CLASS}>
              <div className="space-y-1">
                <StatTooltipRow
                  label="Vision / min"
                  value={(participant.visionScore / minutes).toFixed(1)}
                  valueClassName="text-hx-magic-bright"
                />
                <StatTooltipRow
                  label="Pink wards (purchased)"
                  value={
                    typeof participant.visionWardsBoughtInGame === 'number'
                      ? participant.visionWardsBoughtInGame
                      : 0
                  }
                  valueClassName="text-hx-magic-bright"
                />
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Items + runes */}
          <div className="flex shrink-0 items-center gap-3">
            <ItemSlots
              items={items}
              size="md"
              gridLayout
              roleBoundSlot={getRoleBoundSlot(participant)}
            />
            {keystone && statPerks && (
              <div className="flex items-center gap-1.5">
                <RuneIcon
                  runeId={keystone.perk}
                  size="minor28"
                  variant="keystone"
                />
                <div className="flex items-center gap-0.5">
                  <StatShardIcon
                    statShardId={statPerks.offense}
                    size="shard24"
                  />
                  <StatShardIcon statShardId={statPerks.flex} size="shard24" />
                  <StatShardIcon
                    statShardId={statPerks.defense}
                    size="shard24"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Compare toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={
                  isComparing
                    ? `Stop comparing ${displayName}`
                    : `Compare ${displayName}`
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setComparePlayer(isComparing ? null : playerIndex);
                }}
                className={cn(
                  'ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border transition-colors',
                  isComparing
                    ? 'border-hx-gold bg-hx-gold/15 text-hx-gold-bright'
                    : 'border-hx-gold-dark/50 text-hx-gold/60 hover:border-hx-gold hover:text-hx-gold-bright'
                )}
              >
                {isComparing ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  <GitCompare className="h-3.5 w-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent className={STAT_TOOLTIP_CLASS}>
              {isComparing ? 'Stop comparing' : 'Compare this player'}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.participant.puuid === nextProps.participant.puuid &&
      prevProps.teamColor === nextProps.teamColor &&
      prevProps.teamTotals.damage === nextProps.teamTotals.damage &&
      prevProps.teamTotals.gold === nextProps.teamTotals.gold &&
      prevProps.teamTotals.kills === nextProps.teamTotals.kills &&
      prevProps.selectedPlayer === nextProps.selectedPlayer &&
      prevProps.comparePlayer === nextProps.comparePlayer
    );
  }
);

PlayerCard.displayName = 'PlayerCard';
