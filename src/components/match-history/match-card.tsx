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
  Target, 
  Gamepad2,
  ExternalLink
} from 'lucide-react';

interface MatchCardProps {
  match: MatchData;
  currentUserPuuid?: string;
  className?: string;
  compact?: boolean;
}

export function MatchCard({ 
  match, 
  currentUserPuuid: _currentUserPuuid,
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
      className={`border-l-4 ${getWinColor(match.win)} bg-black/20 backdrop-blur-md border border-white/10 transition-all duration-200 hover:bg-white/5 focus-card ${className}`}
      role="article"
      aria-labelledby={`match-title-${match.match_id}`}
      tabIndex={0}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left side - Champion, items, spells, runes, and stats */}
          <div className="flex items-center gap-6">
            {/* Champion and basic info */}
            <div className="flex items-center gap-4">
              <ChampionIcon championId={match.champion} size="lg" />
              
              <div>
                <h3 
                  id={`match-title-${match.match_id}`}
                  className="text-lg font-bold text-white"
                >
                  {match.champion}
                </h3>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Badge 
                    variant="outline" 
                    className={`${gameModeColor} border-current`}
                  >
                    <Gamepad2 className="h-3 w-3 mr-1" />
                    {gameMode}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(match.duration)}
                  </div>
                </div>
                <div className="text-xs text-white/60 mt-1">
                  {formatDistanceToNow(new Date(match.game_creation), { addSuffix: true })}
                </div>
              </div>
            </div>

            {/* Items, Spells, and Runes */}
            <div className="flex flex-col gap-3">
              {/* Items */}
              {match.items && (
                <ItemSlots 
                  items={match.items} 
                  size="md"
                  showTrinketSeparately
                />
              )}
              
              {/* Summoner Spells and Runes in a row */}
              <div className="flex gap-3">
                {match.summoner_spells && (
                  <SummonerSpells 
                    spell1Id={match.summoner_spells.spell1Id}
                    spell2Id={match.summoner_spells.spell2Id}
                    size="sm"
                  />
                )}
                
                {match.runes && (
                  <RuneSlots 
                    runes={match.runes}
                    size="sm"
                  />
                )}
              </div>
            </div>

            {/* KDA and Stats */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <div className={`text-xl font-bold ${getKDAColor(kdaRatio)}`}>
                  {match.kills} / {match.deaths} / {match.assists}
                </div>
                <div className="text-sm text-white/60">
                  {kda} KDA
                </div>
              </div>

              {/* Additional stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                {match.gold && (
                  <div>
                    <div className="text-yellow-400 font-semibold">
                      {Math.round(match.gold / 1000)}k
                    </div>
                    <div className="text-xs text-white/60">Gold</div>
                  </div>
                )}
                {match.cs && (
                  <div>
                    <div className="text-purple-400 font-semibold">
                      {match.cs}
                    </div>
                    <div className="text-xs text-white/60">CS</div>
                  </div>
                )}
                {match.vision_score && (
                  <div>
                    <div className="text-pink-400 font-semibold">
                      {match.vision_score}
                    </div>
                    <div className="text-xs text-white/60">Vision</div>
                  </div>
                )}
                {match.champion_level && (
                  <div>
                    <div className="text-blue-400 font-semibold">
                      {match.champion_level}
                    </div>
                    <div className="text-xs text-white/60">Level</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side - Teams and match details button */}
          <div className="flex items-center gap-6">
            {/* Teams */}
            {match.all_participants && match.all_participants.length > 0 && (
              <div className="grid grid-cols-2 gap-6">
                {/* Blue Team */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-blue-400">Blue Team</span>
                  </div>
                  <div className="space-y-1">
                    {match.all_participants
                      .filter((p) => p.teamId === 100)
                      .slice(0, 5)
                      .map((participant, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <ChampionIcon championId={participant.championName} size="xs" />
                          <span className="truncate text-white/80 max-w-24">
                            {participant.gameName}#{participant.tagLine}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Red Team */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-medium text-red-400">Red Team</span>
                  </div>
                  <div className="space-y-1">
                    {match.all_participants
                      .filter((p) => p.teamId === 200)
                      .slice(0, 5)
                      .map((participant, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <ChampionIcon championId={participant.championName} size="xs" />
                          <span className="truncate text-white/80 max-w-24">
                            {participant.gameName}#{participant.tagLine}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Result and match details button */}
            <div className="flex flex-col items-center gap-3">
              <Badge 
                variant={match.win ? 'default' : 'destructive'} 
                className={`px-4 py-2 ${match.win ? 'bg-accessible-green/20 text-accessible-green border-accessible-green/30' : 'bg-accessible-red/20 text-accessible-red border-accessible-red/30'}`}
              >
                <Trophy className="h-4 w-4 mr-2" />
                {match.win ? 'Victory' : 'Defeat'}
              </Badge>

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
        </div>

        {/* Challenge analysis status */}
        {!match.analyzed_for_challenges && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-yellow-400">
              <Target className="h-4 w-4" />
              <span className="text-sm">Pending challenge analysis</span>
            </div>
          </div>
        )}
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
  currentUserPuuid: _currentUserPuuid,
  loading = false,
  className = '',
  compact = false
}: MatchCardListProps) {
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
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
    <div className={`space-y-4 ${className}`}>
      {safeMatches.map((match) => (
        <MatchCard
          key={match.match_id}
          match={match}
          {...(_currentUserPuuid ? { currentUserPuuid: _currentUserPuuid } : {})}
          compact={compact}
        />
      ))}
    </div>
  );
}