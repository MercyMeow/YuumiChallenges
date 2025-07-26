'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
// Using simple state-based collapsible instead of separate component
import { TeamsComparison } from './team-section';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { ItemSlots } from './item-slots';
import { SummonerSpells } from './summoner-spells';
import { ProcessedMatchData } from '@/lib/types';
import { getGameModeDisplayName, getGameModeCategoryColor } from '@/lib/utils/game-modes';
import { formatDistanceToNow } from 'date-fns';
import { 
  Clock, 
  Trophy, 
  Target, 
  ChevronDown, 
  ChevronUp,
  Gamepad2,
  Users,
  TrendingUp,
  Eye,
  Crown
} from 'lucide-react';

interface MatchCardProps {
  match: ProcessedMatchData;
  currentUserPuuid?: string;
  defaultExpanded?: boolean;
  className?: string;
}

export function MatchCard({ 
  match, 
  currentUserPuuid,
  defaultExpanded = false,
  className = ''
}: MatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const kda = match.deaths > 0 
    ? ((match.kills + match.assists) / match.deaths).toFixed(2)
    : 'Perfect';
  
  const kdaRatio = match.deaths > 0 
    ? (match.kills + match.assists) / match.deaths 
    : 99;

  const getKDAColor = (ratio: number) => {
    if (ratio >= 3) return 'text-green-400';
    if (ratio >= 2) return 'text-yellow-400';
    if (ratio >= 1) return 'text-orange-400';
    return 'text-red-400';
  };

  const getWinColor = (win: boolean) => {
    return win 
      ? 'border-l-green-500 bg-green-500/5 border-green-500/20' 
      : 'border-l-red-500 bg-red-500/5 border-red-500/20';
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

  // Get user participant data if detailed data is available
  const userParticipant = match.userParticipant;
  const detailedData = match.detailedData;

  return (
    <Card className={`border-l-4 ${getWinColor(match.win)} bg-black/20 backdrop-blur-md border border-white/10 transition-all duration-200 hover:bg-white/5 ${className}`}>
      <div>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            {/* Left side - Champion and basic info */}
            <div className="flex items-center gap-4">
              <ChampionIcon championId={match.champion} size="lg" />
              
              <div>
                <h3 className="text-lg font-bold text-white">{match.champion}</h3>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Badge variant="outline" className={`${gameModeColor} border-current`}>
                    <Gamepad2 className="h-3 w-3 mr-1" />
                    {gameMode}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(match.duration)}
                  </div>
                </div>
              </div>
            </div>

            {/* Center - KDA and basic stats */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-xl font-bold ${getKDAColor(kdaRatio)}`}>
                  {match.kills} / {match.deaths} / {match.assists}
                </div>
                <div className="text-sm text-white/60">
                  {kda} KDA
                </div>
              </div>

              {/* Items if we have user participant data */}
              {userParticipant && (
                <div className="flex flex-col items-center gap-2">
                  <ItemSlots 
                    items={userParticipant.items} 
                    size="md"
                    showTrinketSeparately
                  />
                  <SummonerSpells 
                    spell1Id={userParticipant.summoner1Id}
                    spell2Id={userParticipant.summoner2Id}
                    size="sm"
                  />
                </div>
              )}

              {/* Additional stats if we have detailed data */}
              {userParticipant && (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-yellow-400 font-semibold">
                      {Math.round(userParticipant.goldEarned / 1000)}k
                    </div>
                    <div className="text-xs text-white/60">Gold</div>
                  </div>
                  <div>
                    <div className="text-purple-400 font-semibold">
                      {userParticipant.totalMinionsKilled}
                    </div>
                    <div className="text-xs text-white/60">CS</div>
                  </div>
                  <div>
                    <div className="text-pink-400 font-semibold">
                      {userParticipant.visionScore}
                    </div>
                    <div className="text-xs text-white/60">Vision</div>
                  </div>
                  <div>
                    <div className="text-blue-400 font-semibold">
                      {userParticipant.level}
                    </div>
                    <div className="text-xs text-white/60">Level</div>
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Result and expand button */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <Badge 
                  variant={match.win ? 'default' : 'destructive'} 
                  className={`px-4 py-2 ${match.win ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  {match.win ? 'Victory' : 'Defeat'}
                </Badge>
                <div className="text-xs text-white/60 mt-1">
                  {formatDistanceToNow(new Date(match.game_creation), { addSuffix: true })}
                </div>
              </div>

              {detailedData && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Challenge analysis status */}
          {!match.analyzed_for_challenges && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 text-yellow-400">
                <Target className="h-4 w-4" />
                <span className="text-sm">Pending challenge analysis</span>
              </div>
            </div>
          )}
        </CardHeader>

        {/* Expanded content - detailed team view */}
        {detailedData && isExpanded && (
          <CardContent className="pt-0">
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-white/60" />
                <h4 className="text-lg font-semibold text-white">Match Details</h4>
              </div>

              <TeamsComparison
                blueTeam={match.userTeam || detailedData.info.teams.find(t => t.teamId === 100)!}
                redTeam={match.enemyTeam || detailedData.info.teams.find(t => t.teamId === 200)!}
                participants={detailedData.info.participants}
                currentUserPuuid={currentUserPuuid}
                compact={false}
                layout="stacked"
              />
            </div>
          </CardContent>
        )}
      </div>
    </Card>
  );
}

interface MatchCardListProps {
  matches: ProcessedMatchData[];
  currentUserPuuid?: string;
  loading?: boolean;
  className?: string;
}

export function MatchCardList({ 
  matches, 
  currentUserPuuid,
  loading = false,
  className = ''
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

  if (matches.length === 0) {
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
      {matches.map((match) => (
        <MatchCard
          key={match.match_id}
          match={match}
          currentUserPuuid={currentUserPuuid}
        />
      ))}
    </div>
  );
}