'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { ItemSlots } from './item-slots';
import { SummonerSpells } from './summoner-spells';
import { MatchData } from '@/lib/types';
import { getGameModeDisplayName, getGameModeCategoryColor } from '@/lib/utils/game-modes';
import { formatDistanceToNow } from 'date-fns';
import { 
  Clock, 
  Trophy, 
  Gamepad2,
  ExternalLink
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface MatchCardProps {
  match: MatchData;
  currentUserPuuid?: string;
  className?: string;
  compact?: boolean;
}

export function MatchCard({ 
  match, 
  className = '',
  compact = false
}: MatchCardProps) {
  const kda = match.deaths > 0 
    ? ((match.kills + match.assists) / match.deaths).toFixed(2)
    : 'Perfect';
  
  const kdaRatio = match.deaths > 0 
    ? (match.kills + match.assists) / match.deaths 
    : 99;

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

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const gameMode = getGameModeDisplayName(match.queue_id);
  const gameModeColor = getGameModeCategoryColor(
    match.queue_id === 420 || match.queue_id === 440 ? 'ranked' : 
    match.queue_id === 450 ? 'aram' : 'normal'
  );

  // Compact version for dashboard summary
  if (compact) {
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg border-l-4 ${getWinColor(match.win)} backdrop-blur-md transition-all duration-200 hover:bg-white/5 cursor-pointer ${className}`}>
        <div className="flex items-center space-x-3">
          <ChampionIcon championId={match.champion} size="sm" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{match.champion}</span>
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
            className={`text-xs ${match.win ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
          >
            {match.win ? 'Win' : 'Loss'}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <Card 
      className={`relative bg-gradient-to-br from-purple-500/5 to-purple-600/5 backdrop-blur-md transition-all duration-200 hover:bg-white/5 focus-card ${
        match.win 
          ? 'border-l-4 border-l-accessible-green border-r border-t border-b border-accessible-green/30' 
          : 'border-l-4 border-l-accessible-red border-r border-t border-b border-accessible-red/30'
      } ${className}`}
      role="article"
      aria-labelledby={`match-title-${match.match_id}`}
      tabIndex={0}
    >
      {/* Victory/Defeat badge - absolute positioned top-left */}
      <Badge 
        variant={match.win ? 'default' : 'destructive'} 
        className={`absolute top-3 left-3 z-10 px-3 py-1 ${match.win ? 'bg-accessible-green/20 text-accessible-green border-accessible-green/30' : 'bg-accessible-red/20 text-accessible-red border-accessible-red/30'}`}
      >
        <Trophy className="h-3 w-3 mr-1" />
        {match.win ? 'Victory' : 'Defeat'}
      </Badge>
      
      {/* Game mode badge - positioned right of victory badge */}
      <Badge 
        variant="outline" 
        className={`absolute top-3 left-28 z-10 px-3 py-1 ${gameModeColor} border-current`}
      >
        <Gamepad2 className="h-3 w-3 mr-1" />
        {gameMode}
      </Badge>

      {/* Details button - positioned right of gamemode badge */}
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => window.open(`/match/${match.match_id}`, '_blank')}
        className="absolute top-3 left-52 z-10 px-2 py-0.5 text-xs 
                   text-white/60 hover:text-white hover:bg-white/10 
                   border-white/20 backdrop-blur-sm"
      >
        <ExternalLink className="h-2.5 w-2.5" />
      </Button>

      {/* Teams Section - positioned in header area */}
      {match.all_participants && match.all_participants.length > 0 && (
        <div className="absolute top-3 right-4 z-10 flex gap-3 text-xs">
          {/* Blue Team */}
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
            <span className="text-blue-400 font-medium">Blue</span>
            <div className="flex gap-0.5">
              {match.all_participants
                .filter((p) => p.teamId === 100)
                .slice(0, 5)
                .map((participant, index) => (
                  <ChampionIcon 
                    key={index}
                    championId={participant.championName} 
                    size="xs" 
                    className="border border-blue-500/30 rounded"
                  />
                ))}
            </div>
          </div>

          {/* Red Team */}
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            <span className="text-red-400 font-medium">Red</span>
            <div className="flex gap-0.5">
              {match.all_participants
                .filter((p) => p.teamId === 200)
                .slice(0, 5)
                .map((participant, index) => (
                  <ChampionIcon 
                    key={index}
                    championId={participant.championName} 
                    size="xs" 
                    className="border border-red-500/30 rounded"
                  />
                ))}
            </div>
          </div>
        </div>
      )}


      <CardContent className="p-6 pt-12">
        <div className="grid grid-cols-12 gap-4 items-start">
          {/* Champion and level - col-span-2 */}
          <div className="col-span-2 flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <ChampionIcon championId={match.champion} size="xxl" />
              {/* Level badge overlay on champion */}
              {match.champion_level && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 
                          bg-gradient-to-br from-purple-500 to-pink-500 
                          text-white text-xs font-bold 
                          px-2 py-0.5 rounded-full 
                          border border-purple-400/50
                          shadow-lg shadow-purple-500/25
                          backdrop-blur-sm z-10">
                  {match.champion_level}
                </div>
              )}
            </div>
            
            <div>
              <h3 
                id={`match-title-${match.match_id}`}
                className="text-lg font-bold text-white"
              >
                {match.champion}
              </h3>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(match.duration)}
                </div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-xs text-white/60 mt-1 cursor-help">
                    {formatDistanceToNow(new Date(match.game_creation), { addSuffix: true })}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black/90 backdrop-blur-md border border-purple-500/20">
                  <p className="text-white">
                    {format(new Date(match.game_creation), 'PPpp')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Summoner Spells - col-span-1 */}
          <div className="col-span-1 flex justify-center">
            {match.summoner_spells && (
              <SummonerSpells 
                spell1Id={match.summoner_spells.spell1Id}
                spell2Id={match.summoner_spells.spell2Id}
                size="lg"
                orientation="vertical"
              />
            )}
          </div>

          {/* Items - col-span-3 */}
          <div className="col-span-3">
            {match.items && (
              <ItemSlots 
                items={match.items} 
                size="lg"
                gridLayout
              />
            )}
          </div>

          {/* KDA and Stats - col-span-4 (expanded for vertical layout) */}
          <div className="col-span-4 flex flex-col items-center gap-4">
            {/* KDA on top */}
            <div className="text-center">
              <div className={`text-2xl font-bold ${getKDAColor(kdaRatio)}`}>
                {match.kills} / {match.deaths} / {match.assists}
              </div>
              <div className="text-sm text-white/60">
                {kda} KDA
              </div>
            </div>

            {/* Secondary stats below */}
            <div className="flex items-center gap-6">
              {match.gold && (
                <div className="text-center">
                  <div className="text-base text-yellow-400 font-semibold">
                    {Math.round(match.gold / 1000)}k
                  </div>
                  <div className="text-xs text-white/60">Gold</div>
                </div>
              )}
              {match.cs && (
                <div className="text-center">
                  <div className="text-base text-purple-400 font-semibold">
                    {match.cs}
                  </div>
                  <div className="text-xs text-white/60">CS</div>
                </div>
              )}
              {match.vision_score && (
                <div className="text-center">
                  <div className="text-base text-pink-400 font-semibold">
                    {match.vision_score}
                  </div>
                  <div className="text-xs text-white/60">Vision</div>
                </div>
              )}
            </div>
          </div>

          {/* Free space - col-span-2 (reserved for future use) */}
          <div className="col-span-2">
            {/* Reserved space for future enhancements */}
          </div>

        </div>

      </CardContent>
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
  compact = false
}: MatchCardListProps) {
  if (loading) {
    return (
      <div className={`${compact ? 'space-y-4' : 'grid grid-cols-1 xl:grid-cols-2 gap-4'} ${className}`}>
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="h-32 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Ensure matches is an array before checking length
  const safeMatches = Array.isArray(matches) ? matches : [];
  
  if (safeMatches.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-white/30" />
        <h3 className="text-xl font-semibold text-white mb-2">No Matches Found</h3>
        <p className="text-white/60">Play some games to see your detailed match history</p>
      </div>
    );
  }

  return (
    <div className={`${compact ? 'space-y-4' : 'grid grid-cols-1 xl:grid-cols-2 gap-4'} ${className}`}>
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