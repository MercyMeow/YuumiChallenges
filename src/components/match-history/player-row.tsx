'use client';

import { ChampionIcon } from '@/components/ui/datadragon-image';
import { ItemSlots } from './item-slots';
import { SummonerSpells } from './summoner-spells';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { DetailedMatchParticipant } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface PlayerRowProps {
  participant: DetailedMatchParticipant;
  isCurrentUser?: boolean;
  compact?: boolean;
  className?: string;
}

export function PlayerRow({ 
  participant, 
  isCurrentUser = false, 
  compact = false,
  className = '' 
}: PlayerRowProps) {
  const kda = participant.deaths > 0 
    ? ((participant.kills + participant.assists) / participant.deaths).toFixed(2)
    : 'Perfect';
  
  const kdaRatio = participant.deaths > 0 
    ? (participant.kills + participant.assists) / participant.deaths 
    : 99;

  const getKDAColor = (ratio: number) => {
    if (ratio >= 3) return 'text-green-400';
    if (ratio >= 2) return 'text-yellow-400';
    if (ratio >= 1) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatKDA = (kills: number, deaths: number, assists: number) => {
    return `${kills} / ${deaths} / ${assists}`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 py-1 px-2 rounded ${isCurrentUser ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-black/20'} ${className}`}>
        {/* Champion */}
        <ChampionIcon championId={participant.championName} size="xs" />
        
        {/* Player name */}
        <div className="flex-1 min-w-0">
          <span className={`text-sm truncate ${isCurrentUser ? 'text-purple-300 font-medium' : 'text-white/80'}`}>
            {participant.summonerName}
          </span>
        </div>

        {/* KDA */}
        <div className={`text-xs font-medium ${getKDAColor(kdaRatio)}`}>
          {formatKDA(participant.kills, participant.deaths, participant.assists)}
        </div>

        {/* Items */}
        <ItemSlots items={participant.items} size="sm" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-lg ${isCurrentUser ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-black/20'} ${className}`}>
      {/* Champion */}
      <div className="flex-shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <ChampionIcon championId={participant.championName} size="sm" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{participant.championName}</p>
            <p className="text-xs text-white/60">Level {participant.level}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Summoner Spells */}
      <div className="flex-shrink-0">
        <SummonerSpells 
          spell1Id={participant.summoner1Id}
          spell2Id={participant.summoner2Id}
          size="sm"
          orientation="vertical"
        />
      </div>

      {/* Player Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium truncate ${isCurrentUser ? 'text-purple-300' : 'text-white'}`}>
            {participant.summonerName}
          </span>
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
              You
            </Badge>
          )}
        </div>
        <div className="text-xs text-white/60">
          Level {participant.level}
        </div>
      </div>

      {/* KDA */}
      <div className="flex-shrink-0 text-center">
        <div className={`text-sm font-bold ${getKDAColor(kdaRatio)}`}>
          {formatKDA(participant.kills, participant.deaths, participant.assists)}
        </div>
        <div className="text-xs text-white/60">
          {kda} KDA
        </div>
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 text-center">
        <div className="text-sm font-medium text-white">
          {formatNumber(participant.goldEarned)}g
        </div>
        <div className="text-xs text-white/60">
          {participant.totalMinionsKilled} CS
        </div>
      </div>

      {/* Vision Score */}
      <div className="flex-shrink-0 text-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <div className="text-sm font-medium text-yellow-400">
                {participant.visionScore}
              </div>
              <div className="text-xs text-white/60">
                Vision
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Vision Score: {participant.visionScore}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Items */}
      <div className="flex-shrink-0">
        <ItemSlots 
          items={participant.items} 
          size="md"
          showTrinketSeparately
        />
      </div>
    </div>
  );
}

interface PlayersListProps {
  participants: DetailedMatchParticipant[];
  currentUserPuuid?: string;
  compact?: boolean;
  className?: string;
}

export function PlayersList({ 
  participants, 
  currentUserPuuid,
  compact = false,
  className = ''
}: PlayersListProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      {participants.map((participant) => (
        <PlayerRow
          key={participant.puuid}
          participant={participant}
          isCurrentUser={participant.puuid === currentUserPuuid}
          compact={compact}
        />
      ))}
    </div>
  );
}

/**
 * Helper function to sort participants by role order
 */
export function sortParticipantsByRole(participants: DetailedMatchParticipant[]): DetailedMatchParticipant[] {
  // This is a simplified role detection - in a real app you'd want more sophisticated role detection
  const roleOrder = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
  
  return [...participants].sort((a, b) => {
    // For now, just sort by participant index as roles aren't in the data
    // In the future, you could implement role detection based on champion, summoner spells, etc.
    return 0;
  });
}

/**
 * Helper function to get role icon based on summoner spells and champion
 */
export function getPlayerRole(participant: DetailedMatchParticipant): string {
  // Simplified role detection
  if (participant.summoner1Id === 11 || participant.summoner2Id === 11) {
    return 'JUNGLE'; // Has Smite
  }
  
  // This would need more sophisticated logic in a real implementation
  return 'UNKNOWN';
}

/**
 * Helper function to get role color
 */
export function getRoleColor(role: string): string {
  switch (role) {
    case 'TOP':
      return 'text-blue-400';
    case 'JUNGLE':
      return 'text-green-400';
    case 'MIDDLE':
      return 'text-yellow-400';
    case 'BOTTOM':
      return 'text-red-400';
    case 'UTILITY':
      return 'text-purple-400';
    default:
      return 'text-gray-400';
  }
}