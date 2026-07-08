'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { ItemSlots } from './item-slots';
import { SummonerSpells } from './summoner-spells';
import { MatchData, MatchParticipant } from '@/lib/types';
import {
  getGameModeDisplayName,
  getGameModeCategoryColor,
} from '@/lib/utils/game-modes';
import { formatDistanceToNow } from 'date-fns';
import { formatSecondsToTime } from '@/lib/utils/match-timeline-utils';
import { Clock, Trophy, Gamepad2, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface MatchCardProps {
  match: MatchData;
  currentUserPuuid?: string;
  className?: string;
  compact?: boolean;
}

export function MatchCard({
  match,
  currentUserPuuid,
  className = '',
  compact = false,
}: MatchCardProps) {
  const kda =
    match.deaths > 0
      ? ((match.kills + match.assists) / match.deaths).toFixed(2)
      : 'Perfect';

  const kdaRatio =
    match.deaths > 0 ? (match.kills + match.assists) / match.deaths : 99;

  const getKDAColor = (ratio: number) => {
    if (ratio >= 3) return 'text-accessible-green';
    if (ratio >= 2) return 'text-accessible-yellow';
    if (ratio >= 1) return 'text-accessible-orange';
    return 'text-accessible-red';
  };

  const getWinColor = (win: boolean) => {
    return win
      ? 'border-l-4 border-l-accessible-green bg-accessible-green/10 border-r border-t border-b border-accessible-green/30'
      : 'border-l-4 border-l-accessible-red bg-accessible-red/10 border-r border-t border-b border-accessible-red/30';
  };

  // Helper function to identify if a participant is the current user
  const isCurrentUser = (participant: MatchParticipant) => {
    if (!currentUserPuuid || !match.summoner_id) return false;

    // Check if the current user is the owner of this match record
    const isMatchOwner = currentUserPuuid === match.summoner_id;
    if (!isMatchOwner) return false;

    // If the user owns this match, they should be the participant with the same champion
    return participant.championName === match.champion;
  };

  // Enhanced styling for current user highlighting
  const getUserHighlightStyles = (
    participant: MatchParticipant,
    isBlueTeam: boolean
  ) => {
    if (!isCurrentUser(participant)) {
      return {
        containerClass: '',
        iconClass: isBlueTeam
          ? 'border border-blue-500/30 rounded'
          : 'border border-red-500/30 rounded',
        textClass: isBlueTeam ? 'text-blue-300' : 'text-red-300',
      };
    }

    // Enhanced highlighting for current user
    return {
      containerClass: isBlueTeam
        ? 'bg-linear-to-r from-blue-500/20 to-blue-400/10 rounded-md px-1 py-0.5 border border-blue-400/40'
        : 'bg-linear-to-r from-red-500/20 to-red-400/10 rounded-md px-1 py-0.5 border border-red-400/40',
      iconClass: isBlueTeam
        ? 'border-2 border-blue-400 rounded shadow-lg shadow-blue-500/30'
        : 'border-2 border-red-400 rounded shadow-lg shadow-red-500/30',
      textClass: isBlueTeam
        ? 'text-blue-100 font-semibold'
        : 'text-red-100 font-semibold',
    };
  };

  const gameMode = getGameModeDisplayName(match.queue_id);
  const gameModeColor = getGameModeCategoryColor(
    match.queue_id === 420 || match.queue_id === 440
      ? 'ranked'
      : match.queue_id === 450
        ? 'aram'
        : 'normal'
  );

  // Compact version for dashboard summary
  if (compact) {
    return (
      <div
        className={`flex items-center justify-between rounded-lg border-l-4 p-3 ${getWinColor(match.win)} cursor-pointer backdrop-blur-md transition-all duration-200 hover:bg-white/5 ${className}`}
      >
        <div className="flex items-center space-x-3">
          <ChampionIcon championId={match.champion} size="sm" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">
              {match.champion}
            </span>
            <span className="text-xs text-white/60">{gameMode}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className={`text-sm font-bold ${getKDAColor(kdaRatio)}`}>
              {match.kills}/{match.deaths}/{match.assists}
            </div>
            <div className="text-xs text-white/60">KDA: {kda}</div>
          </div>

          <Badge
            variant={match.win ? 'default' : 'destructive'}
            className={`text-xs ${match.win ? 'border-green-500/30 bg-green-500/20 text-green-400' : 'border-red-500/30 bg-red-500/20 text-red-400'}`}
          >
            {match.win ? 'Win' : 'Loss'}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <Card
      className={`relative bg-linear-to-br from-purple-500/5 to-purple-600/5 focus-card backdrop-blur-md transition-all duration-200 hover:bg-white/5 ${
        match.win
          ? 'border-l-accessible-green border-t border-r border-b border-l-4 border-accessible-green/30'
          : 'border-l-accessible-red border-t border-r border-b border-l-4 border-accessible-red/30'
      } ${className}`}
      role="article"
      aria-labelledby={`match-title-${match.match_id}`}
      tabIndex={0}
    >
      {/* Victory/Defeat badge - absolute positioned top-left */}
      <Badge
        variant={match.win ? 'default' : 'destructive'}
        className={`absolute top-3 left-3 z-10 px-3 py-1 ${match.win ? 'border-accessible-green/30 bg-accessible-green/20 text-accessible-green' : 'border-accessible-red/30 bg-accessible-red/20 text-accessible-red'}`}
      >
        <Trophy className="mr-1 h-3 w-3" />
        {match.win ? 'Victory' : 'Defeat'}
      </Badge>

      {/* Game mode badge - positioned right of victory badge */}
      <Badge
        variant="outline"
        className={`absolute top-3 left-28 z-10 px-3 py-1 ${gameModeColor} border-current`}
      >
        <Gamepad2 className="mr-1 h-3 w-3" />
        {gameMode}
      </Badge>

      {/* Game duration badge - positioned right of game mode badge */}
      <Badge
        variant="outline"
        className="absolute top-3 left-48 z-10 border-gray-500/30 bg-gray-500/20 px-3 py-1 text-gray-300"
      >
        <Clock className="mr-1 h-3 w-3" />
        {formatSecondsToTime(match.duration)}
      </Badge>

      {/* Details button - positioned right of duration badge */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(`/match/${match.match_id}`, '_blank')}
        className="absolute top-3 left-72 z-10 border-white/20 px-2 py-0.5 text-xs text-white/60 backdrop-blur-xs hover:bg-white/10 hover:text-white"
      >
        <ExternalLink className="h-2.5 w-2.5" />
      </Button>

      <CardContent className="p-6 pt-20">
        <div className="grid grid-cols-12 items-start gap-4">
          {/* Champion and level - col-span-2 */}
          <div className="col-span-2 -mt-2 flex items-start gap-4">
            <div className="relative shrink-0">
              <ChampionIcon championId={match.champion} size="xl" />

              {/* Champion name badge overlay on top of champion */}
              <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 transform rounded-full border border-blue-400/50 bg-linear-to-br from-blue-500 to-indigo-600 px-2 py-0.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 backdrop-blur-xs">
                {match.champion}
              </div>

              {/* Level badge overlay on champion */}
              {match.champion_level && (
                <div className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 transform rounded-full border border-purple-400/50 bg-linear-to-br from-purple-500 to-pink-500 px-2 py-0.5 text-xs font-bold text-white shadow-lg shadow-purple-500/25 backdrop-blur-xs">
                  {match.champion_level}
                </div>
              )}

              {/* Date played below champion level badge */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 transform cursor-help text-xs font-medium whitespace-nowrap text-white/70">
                    {formatDistanceToNow(new Date(match.game_creation), {
                      addSuffix: true,
                    })}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="border border-purple-500/20 bg-black/90 backdrop-blur-md">
                  <p className="text-white">
                    {format(new Date(match.game_creation), 'PPpp')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex flex-col justify-center">
              {/* Space for additional champion info if needed */}
            </div>
          </div>

          {/* Summoner Spells - col-span-1 - lowered positioning */}
          <div className="col-span-1 flex items-end justify-center pb-2">
            {match.summoner_spells && (
              <SummonerSpells
                spell1Id={match.summoner_spells.spell1Id}
                spell2Id={match.summoner_spells.spell2Id}
                size="lg"
                orientation="vertical"
              />
            )}
          </div>

          {/* Items - col-span-3 - lowered positioning */}
          <div className="col-span-3 flex items-end pb-2">
            {match.items && (
              <ItemSlots items={match.items} size="lg" gridLayout />
            )}
          </div>

          {/* KDA and Stats - col-span-3 (reduced to make room) */}
          <div className="col-span-3 flex flex-col items-center gap-3">
            {/* KDA on top - resized to match champion name font */}
            <div className="text-center">
              <div className={`text-lg font-bold ${getKDAColor(kdaRatio)}`}>
                {match.kills} / {match.deaths} / {match.assists}
              </div>
              <div className="text-xs text-white/60">{kda} KDA</div>
            </div>

            {/* Secondary stats below */}
            <div className="flex items-center gap-4">
              {match.gold && (
                <div className="text-center">
                  <div className="text-sm font-semibold text-yellow-400">
                    {Math.round(match.gold / 1000)}k
                  </div>
                  <div className="text-xs text-white/60">Gold</div>
                </div>
              )}
              {match.cs && (
                <div className="text-center">
                  <div className="text-sm font-semibold text-purple-400">
                    {match.cs}
                  </div>
                  <div className="text-xs text-white/60">CS</div>
                </div>
              )}
              {match.vision_score && (
                <div className="text-center">
                  <div className="text-sm font-semibold text-pink-400">
                    {match.vision_score}
                  </div>
                  <div className="text-xs text-white/60">Vision</div>
                </div>
              )}
            </div>
          </div>

          {/* Free space - col-span-3 (reserved for future use) */}
          <div className="col-span-3">
            {/* Reserved space for future enhancements */}
          </div>
        </div>
      </CardContent>

      {/* Teams Section - positioned at very top of card */}
      {match.all_participants && match.all_participants.length > 0 && (
        <div className="absolute top-0 right-4 z-10 max-w-[calc(100%-16rem)] p-3 text-xs">
          {/* Team Headers */}
          <div className="mb-2 grid grid-cols-2 gap-3">
            <div className="flex items-center justify-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
              <span className="font-medium text-blue-400">Blue</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-red-500"></div>
              <span className="font-medium text-red-400">Red</span>
            </div>
          </div>

          {/* Team Players Side by Side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Blue Team Players */}
            <div className="space-y-1">
              {match.all_participants
                .filter((p) => p.teamId === 100)
                .slice(0, 5)
                .map((participant, index) => {
                  const highlightStyles = getUserHighlightStyles(
                    participant,
                    true
                  );
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-1 ${highlightStyles.containerClass}`}
                    >
                      <ChampionIcon
                        championId={participant.championName}
                        size="xs"
                        className={`${highlightStyles.iconClass} shrink-0`}
                      />
                      <span
                        className={`max-w-16 truncate text-[10px] ${highlightStyles.textClass}`}
                      >
                        {participant.gameName || 'Unknown'}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Red Team Players */}
            <div className="space-y-1">
              {match.all_participants
                .filter((p) => p.teamId === 200)
                .slice(0, 5)
                .map((participant, index) => {
                  const highlightStyles = getUserHighlightStyles(
                    participant,
                    false
                  );
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-1 ${highlightStyles.containerClass}`}
                    >
                      <ChampionIcon
                        championId={participant.championName}
                        size="xs"
                        className={`${highlightStyles.iconClass} shrink-0`}
                      />
                      <span
                        className={`max-w-16 truncate text-[10px] ${highlightStyles.textClass}`}
                      >
                        {participant.gameName || 'Unknown'}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

interface MatchCardListProps {
  matches: MatchData[];
  currentUserPuuid?: string;
  loading?: boolean;
  className?: string;
  compact?: boolean;
}

export function MatchCardList({
  matches,
  currentUserPuuid,
  loading = false,
  className = '',
  compact = false,
}: MatchCardListProps) {
  if (loading) {
    return (
      <div
        className={`${compact ? 'space-y-4' : 'grid grid-cols-1 gap-4 xl:grid-cols-2'} ${className}`}
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border border-white/10 bg-black/20 backdrop-blur-md"
          />
        ))}
      </div>
    );
  }

  // Ensure matches is an array before checking length
  const safeMatches = Array.isArray(matches) ? matches : [];

  if (safeMatches.length === 0) {
    return (
      <div className={`py-12 text-center ${className}`}>
        <Gamepad2 className="mx-auto mb-4 h-16 w-16 text-white/30" />
        <h3 className="mb-2 text-xl font-semibold text-white">
          No Matches Found
        </h3>
        <p className="text-white/60">
          Play some games to see your detailed match history
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${compact ? 'space-y-4' : 'grid grid-cols-1 gap-4 xl:grid-cols-2'} ${className}`}
    >
      {safeMatches.map((match) => (
        <MatchCard
          key={match.match_id}
          match={match}
          {...(currentUserPuuid ? { currentUserPuuid } : {})}
          compact={compact}
        />
      ))}
    </div>
  );
}
