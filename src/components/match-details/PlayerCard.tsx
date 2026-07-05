/**
 * Player Card Component
 * Displays detailed player statistics in a match
 * Extracted from match details page
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { GitCompare, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExtendedMatchData, TeamTotals } from './types';

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
    const isSelected =
      selectedPlayer === matchData.info.participants.indexOf(participant);
    const isComparing =
      comparePlayer === matchData.info.participants.indexOf(participant);
    const playerIndex = matchData.info.participants.indexOf(participant);

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
        : (participant.kills + participant.assists).toFixed(0);

    const killParticipation =
      teamTotals.kills > 0
        ? Math.round(
            ((participant.kills + participant.assists) / teamTotals.kills) * 100
          )
        : 0;

    return (
      <div
        className={cn(
          'cursor-pointer rounded-lg border p-4 transition-all',
          teamColor === 'blue'
            ? 'border-blue-500/20 bg-blue-500/5'
            : 'border-red-500/20 bg-red-500/5',
          isSelected && 'ring-2 ring-purple-500',
          isComparing && 'ring-2 ring-yellow-500',
          'hover:bg-opacity-40'
        )}
        onClick={() => {
          if (isSelected) {
            setSelectedPlayer(null);
          } else {
            setSelectedPlayer(playerIndex);
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ChampionIcon championId={participant.championName} size="lg" />
              <div className="absolute -bottom-1 -right-1 rounded-full bg-black/80 px-1.5 text-xs font-bold text-white">
                {participant.champLevel}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 font-medium text-white">
                {participant.riotIdGameName && participant.riotIdTagline
                  ? `${participant.riotIdGameName}#${participant.riotIdTagline}`
                  : participant.summonerName}
              </div>
              <div className="text-sm text-white/60">
                {participant.championName} • {participant.individualPosition}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* KDA & Stats */}
            <div className="text-center">
              <div
                className={`text-lg font-bold ${getKDAColor(participant.kills, participant.deaths, participant.assists)}`}
              >
                {participant.kills}/{participant.deaths}/{participant.assists}
              </div>
              <div className="text-xs text-white/60">
                {kda} KDA • {killParticipation}% KP
              </div>
            </div>

            {/* Damage (hover for DPM and % team damage) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help touch-manipulation text-center">
                  <div className="font-semibold text-orange-400">
                    {formatNumber(participant.totalDamageDealtToChampions)}
                  </div>
                  <div className="text-xs text-white/60">Damage</div>
                  <Progress
                    value={
                      teamTotals.damage > 0
                        ? (participant.totalDamageDealtToChampions /
                            teamTotals.damage) *
                          100
                        : 0
                    }
                    className="mt-1 h-1 w-16"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="border-orange-500/30 bg-black/85 text-white">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/70">DPM</span>
                    <span className="font-semibold text-orange-300">
                      {Math.round(
                        participant.challenges?.damagePerMinute ??
                          participant.totalDamageDealtToChampions /
                            Math.max(1, matchData.info.gameDuration / 60)
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/70">% Team Damage</span>
                    <span className="font-semibold text-blue-300">
                      {teamTotals.damage > 0
                        ? Math.round(
                            (participant.totalDamageDealtToChampions /
                              teamTotals.damage) *
                              100
                          )
                        : participant.challenges?.teamDamagePercentage
                          ? Math.round(
                              participant.challenges.teamDamagePercentage * 100
                            )
                          : 0}
                      %
                    </span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Gold (hover for GPM) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help touch-manipulation text-center">
                  <div className="font-semibold text-yellow-400">
                    {formatNumber(participant.goldEarned)}
                  </div>
                  <div className="text-xs text-white/60">Gold</div>
                  <Progress
                    value={
                      teamTotals.gold > 0
                        ? (participant.goldEarned / teamTotals.gold) * 100
                        : 0
                    }
                    className="mt-1 h-1 w-16"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent className="border-yellow-500/30 bg-black/85 text-white">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/70">GPM</span>
                  <span className="font-semibold text-yellow-300">
                    {Math.round(
                      participant.goldEarned /
                        Math.max(1, matchData.info.gameDuration / 60)
                    )}
                  </span>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* CS */}
            <div className="text-center">
              <div className="font-semibold text-purple-400">
                {participant.totalMinionsKilled +
                  participant.neutralMinionsKilled}
              </div>
              <div className="text-xs text-white/60">
                CS (
                {(
                  (participant.totalMinionsKilled +
                    participant.neutralMinionsKilled) /
                  (matchData.info.gameDuration / 60)
                ).toFixed(1)}
                /m)
              </div>
            </div>

            {/* Vision (hover for VPM and Pink wards purchased) */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help touch-manipulation text-center">
                  <div className="font-semibold text-pink-400">
                    {participant.visionScore}
                  </div>
                  <div className="text-xs text-white/60">Vision</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="border-pink-500/30 bg-black/85 text-white">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/70">Vision / min</span>
                    <span className="font-semibold text-pink-300">
                      {(
                        participant.visionScore /
                        Math.max(1, matchData.info.gameDuration / 60)
                      ).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/70">
                      Pink wards (purchased)
                    </span>
                    <span className="font-semibold text-purple-300">
                      {typeof participant.visionWardsBoughtInGame === 'number'
                        ? participant.visionWardsBoughtInGame
                        : 0}
                    </span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Items - 3x2 grid + right-side trinket, larger slots */}
            <ItemSlots items={items} size="lg" gridLayout />

            {/* Summoner Spells - vertical, larger */}
            <SummonerSpells
              spell1Id={participant.summoner1Id}
              spell2Id={participant.summoner2Id}
              size="lg"
              orientation="vertical"
            />

            {/* Runes compact */}
            {participant.perks?.styles?.[0]?.selections?.[0] &&
              participant.perks?.statPerks && (
                <div className="flex items-center gap-2">
                  <RuneIcon
                    runeId={participant.perks.styles[0].selections[0].perk}
                    size="minor28"
                    variant="keystone"
                  />
                  <div className="flex items-center gap-1">
                    <StatShardIcon
                      statShardId={participant.perks.statPerks.offense}
                      size="shard24"
                    />
                    <StatShardIcon
                      statShardId={participant.perks.statPerks.flex}
                      size="shard24"
                    />
                    <StatShardIcon
                      statShardId={participant.perks.statPerks.defense}
                      size="shard24"
                    />
                  </div>
                </div>
              )}

            {/* Actions */}
            <div className="flex gap-2">
              {!isComparing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setComparePlayer(playerIndex);
                  }}
                  className="text-xs"
                >
                  <GitCompare className="h-3 w-3" />
                </Button>
              )}
              {isComparing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setComparePlayer(null);
                  }}
                  className="text-xs"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
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
