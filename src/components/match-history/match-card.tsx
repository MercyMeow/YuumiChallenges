'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { ItemSlots } from './item-slots';
import { SummonerSpells } from './summoner-spells';
import { RuneSlots } from './rune-slots';
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
      ? 'border-l-accessible-green bg-accessible-green/10 border-accessible-green/30' 
      : 'border-l-accessible-red bg-accessible-red/10 border-accessible-red/30';
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
      className={`relative bg-gradient-to-br from-purple-500/5 to-purple-600/5 border border-purple-500/20 backdrop-blur-md transition-all duration-200 hover:bg-white/5 focus-card ${className}`}
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
        className={`absolute top-3 left-28 z-10 ${gameModeColor} border-current`}
      >
        <Gamepad2 className="h-3 w-3 mr-1" />
        {gameMode}
      </Badge>

      <CardContent className="p-6 pt-16">
        <div className="grid grid-cols-12 gap-6 items-center">
          {/* Champion and level - col-span-2 */}
          <div className="col-span-2 flex items-center gap-4">
            <div className="relative">
              <ChampionIcon championId={match.champion} size="xl" />
              {/* Level badge overlay on champion */}
              {match.champion_level && (
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded px-1.5 py-0.5 text-xs font-semibold">
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
          
          {/* Summoner Spells and Runes - col-span-1 */}
          <div className="col-span-1 flex flex-col gap-2">
            {match.summoner_spells && (
              <SummonerSpells 
                spell1Id={match.summoner_spells.spell1Id}
                spell2Id={match.summoner_spells.spell2Id}
                size="lg"
                orientation="vertical"
              />
            )}
            
            {match.runes && (
              <RuneSlots 
                runes={match.runes}
                size="md"
              />
            )}
          </div>

          {/* KDA and Stats - col-span-3 */}
          <div className="col-span-3 flex items-center justify-center gap-6">
            {/* Large KDA */}
            <div className="text-center">
              <div className={`text-2xl font-bold ${getKDAColor(kdaRatio)}`}>
                {match.kills} / {match.deaths} / {match.assists}
              </div>
              <div className="text-sm text-white/60">
                {kda} KDA
              </div>
            </div>

            {/* Horizontal stats */}
            <div className="flex items-center gap-4">
              {match.gold && (
                <div className="text-center">
                  <div className="text-yellow-400 font-semibold">
                    {Math.round(match.gold / 1000)}k
                  </div>
                  <div className="text-xs text-white/60">Gold</div>
                </div>
              )}
              {match.cs && (
                <div className="text-center">
                  <div className="text-purple-400 font-semibold">
                    {match.cs}
                  </div>
                  <div className="text-xs text-white/60">CS</div>
                </div>
              )}
              {match.vision_score && (
                <div className="text-center">
                  <div className="text-pink-400 font-semibold">
                    {match.vision_score}
                  </div>
                  <div className="text-xs text-white/60">Vision</div>
                </div>
              )}
            </div>
          </div>

          {/* Teams - col-span-2 */}
          {match.all_participants && match.all_participants.length > 0 && (
            <div className="col-span-2 grid grid-cols-2 gap-4">
              {/* Blue Team */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-400">Blue</span>
                </div>
                <div className="space-y-1">
                  {match.all_participants
                    .filter((p) => p.teamId === 100)
                    .slice(0, 5)
                    .map((participant, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs">
                        <ChampionIcon championId={participant.championName} size="xs" />
                        <span className="truncate text-white/80 max-w-20">
                          {participant.gameName}#{participant.tagLine}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Red Team */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-medium text-red-400">Red</span>
                </div>
                <div className="space-y-1">
                  {match.all_participants
                    .filter((p) => p.teamId === 200)
                    .slice(0, 5)
                    .map((participant, index) => (
                      <div key={index} className="flex items-center gap-1 text-xs">
                        <ChampionIcon championId={participant.championName} size="xs" />
                        <span className="truncate text-white/80 max-w-20">
                          {participant.gameName}#{participant.tagLine}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Match details button - col-span-1 */}
          <div className="col-span-1 flex justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`/match/${match.match_id}`, '_blank')}
              className="text-white/60 hover:text-white hover:bg-white/10 border-white/20"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Details
            </Button>
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