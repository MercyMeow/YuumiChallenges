'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// Using simple state-based collapsible instead of separate component
import { TeamsComparison } from './team-section';
import { ChampionIcon } from '@/components/ui/datadragon-image';
import { ItemSlots } from './item-slots';
import { SummonerSpells } from './summoner-spells';
import { ProcessedMatchData, SafeDetailedMatchTeam, EnhancedMatchDetailsResponse, MatchDetailsApiResponse, EnhancedMatchParticipant } from '@/lib/types';
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
  Loader2,
  AlertCircle
} from 'lucide-react';

interface MatchCardProps {
  match: ProcessedMatchData;
  currentUserPuuid?: string;
  defaultExpanded?: boolean;
  className?: string;
  compact?: boolean;
}

export function MatchCard({ 
  match, 
  currentUserPuuid,
  defaultExpanded = false,
  className = '',
  compact = false
}: MatchCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [detailedData, setDetailedData] = useState<EnhancedMatchDetailsResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  
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

  // Get user participant data if detailed data is available
  const userParticipant = match.userParticipant;
  const originalDetailedData = match.detailedData;

  // Function to fetch detailed match data
  const fetchDetailedData = useCallback(async (matchId: string) => {
    if (detailedData || isLoadingDetails) return; // Already loaded or loading
    
    setIsLoadingDetails(true);
    setDetailsError(null);
    
    try {
      const response = await fetch(`/api/match/${matchId}/details`);
      const result: MatchDetailsApiResponse = await response.json();
      
      if (result.success && result.data) {
        setDetailedData(result.data);
      } else {
        setDetailsError(result.error || 'Failed to load match details');
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
      setDetailsError('Network error loading match details');
    } finally {
      setIsLoadingDetails(false);
    }
  }, [detailedData, isLoadingDetails]);

  // Handle expand/collapse
  const handleToggleExpand = useCallback(async () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    // Fetch detailed data when expanding if we don't have it
    if (newExpanded && !detailedData && !originalDetailedData) {
      await fetchDetailedData(match.match_id);
    }
  }, [isExpanded, detailedData, originalDetailedData, fetchDetailedData, match.match_id]);

  // Use either the fetched detailed data or the original detailed data
  const activeDetailedData = detailedData || (originalDetailedData ? {
    participants: originalDetailedData.info.participants || [],
    teams: originalDetailedData.info.teams || []
  } : null);

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
      <div>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            {/* Left side - Champion and basic info */}
            <div className="flex items-center gap-4">
              <ChampionIcon championId={match.champion} size="lg" />
              
              <div>
                <h3 
                  id={`match-title-${match.match_id}`}
                  className="text-lg font-bold text-white"
                >
                  {match.champion} - {match.win ? 'Victory' : 'Defeat'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <Badge 
                    variant="outline" 
                    className={`${gameModeColor} border-current`}
                    aria-label={`Game mode: ${gameMode}`}
                  >
                    <Gamepad2 className="h-3 w-3 mr-1" aria-hidden="true" />
                    {gameMode}
                  </Badge>
                  <div 
                    className="flex items-center gap-1"
                    aria-label={`Match duration: ${formatDuration(match.duration)}`}
                  >
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {formatDuration(match.duration)}
                  </div>
                </div>
              </div>
            </div>

            {/* Center - KDA and basic stats */}
            <div className="flex items-center gap-6">
              <div 
                className="text-center"
                role="group"
                aria-label={`KDA: ${match.kills} kills, ${match.deaths} deaths, ${match.assists} assists. Ratio: ${kda}`}
              >
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
                  className={`px-4 py-2 ${match.win ? 'bg-accessible-green/20 text-accessible-green border-accessible-green/30' : 'bg-accessible-red/20 text-accessible-red border-accessible-red/30'}`}
                  aria-label={`Match result: ${match.win ? 'Victory' : 'Defeat'}`}
                >
                  <Trophy className="h-4 w-4 mr-2" aria-hidden="true" />
                  {match.win ? 'Victory' : 'Defeat'}
                </Badge>
                <div 
                  className="text-xs text-white/60 mt-1"
                  aria-label={`Played ${formatDistanceToNow(new Date(match.game_creation), { addSuffix: true })}`}
                >
                  {formatDistanceToNow(new Date(match.game_creation), { addSuffix: true })}
                </div>
              </div>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleToggleExpand}
                disabled={isLoadingDetails}
                className="text-white/60 hover:text-white hover:bg-white/10 focus-button"
                aria-label={isExpanded ? "Hide match details" : "Show match details"}
                aria-expanded={isExpanded}
                aria-controls={`match-details-${match.match_id}`}
              >
                {isLoadingDetails ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : isExpanded ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="sr-only">
                  {isExpanded ? 'Hide' : 'Show'} detailed match information
                </span>
              </Button>
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

        {/* Team Preview - Always visible */}
        {(activeDetailedData?.participants || originalDetailedData?.info.participants) && (
          <CardContent className="pt-0 pb-2">
            <div className="border-t border-white/10 pt-3">
              <div className="grid grid-cols-2 gap-4">
                {/* Blue Team */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-medium text-blue-400">Blue Team</span>
                  </div>
                  <div className="space-y-1">
                    {(activeDetailedData?.participants || originalDetailedData?.info.participants || [])
                      .filter((p: any) => p.teamId === 100)
                      .slice(0, 5)
                      .map((participant: any, index: number) => {
                        const displayName = (participant as EnhancedMatchParticipant).riotIdName && (participant as EnhancedMatchParticipant).riotIdTagline
                          ? `${(participant as EnhancedMatchParticipant).riotIdName}#${(participant as EnhancedMatchParticipant).riotIdTagline}`
                          : participant.summonerName;
                        
                        return (
                          <div key={participant.puuid || index} className="flex items-center gap-2 text-xs">
                            <ChampionIcon championId={participant.championName} size="xs" />
                            <span className={`truncate ${participant.puuid === currentUserPuuid ? 'text-purple-300 font-medium' : 'text-white/80'}`}>
                              {displayName}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Red Team */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-medium text-red-400">Red Team</span>
                  </div>
                  <div className="space-y-1">
                    {(activeDetailedData?.participants || originalDetailedData?.info.participants || [])
                      .filter((p: any) => p.teamId === 200)
                      .slice(0, 5)
                      .map((participant: any, index: number) => {
                        const displayName = (participant as EnhancedMatchParticipant).riotIdName && (participant as EnhancedMatchParticipant).riotIdTagline
                          ? `${(participant as EnhancedMatchParticipant).riotIdName}#${(participant as EnhancedMatchParticipant).riotIdTagline}`
                          : participant.summonerName;
                        
                        return (
                          <div key={participant.puuid || index} className="flex items-center gap-2 text-xs">
                            <ChampionIcon championId={participant.championName} size="xs" />
                            <span className={`truncate ${participant.puuid === currentUserPuuid ? 'text-purple-300 font-medium' : 'text-white/80'}`}>
                              {displayName}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {/* Expanded content - detailed team view */}
        {isExpanded && (
          <CardContent className="pt-0" id={`match-details-${match.match_id}`}>
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-white/60" aria-hidden="true" />
                <h4 className="text-lg font-semibold text-white">Match Details</h4>
              </div>

              {/* Loading state */}
              {isLoadingDetails && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                  <span className="ml-2 text-white/60">Loading match details...</span>
                </div>
              )}

              {/* Error state */}
              {detailsError && (
                <div className="flex items-center justify-center py-8 text-red-400">
                  <AlertCircle className="h-6 w-6 mr-2" />
                  <span>{detailsError}</span>
                </div>
              )}

              {/* Detailed match data */}
              {activeDetailedData && !isLoadingDetails && !detailsError && (
                <TeamsComparison
                  blueTeam={activeDetailedData.teams?.find(t => t.teamId === 100) || match.userTeam || {
                    teamId: 100,
                    win: false,
                    bans: [],
                    objectives: {
                      baron: { first: false, kills: 0 },
                      champion: { first: false, kills: 0 },
                      dragon: { first: false, kills: 0 },
                      inhibitor: { first: false, kills: 0 },
                      riftHerald: { first: false, kills: 0 },
                      tower: { first: false, kills: 0 }
                    }
                  } satisfies SafeDetailedMatchTeam}
                  redTeam={activeDetailedData.teams?.find(t => t.teamId === 200) || match.enemyTeam || {
                    teamId: 200,
                    win: false,
                    bans: [],
                    objectives: {
                      baron: { first: false, kills: 0 },
                      champion: { first: false, kills: 0 },
                      dragon: { first: false, kills: 0 },
                      inhibitor: { first: false, kills: 0 },
                      riftHerald: { first: false, kills: 0 },
                      tower: { first: false, kills: 0 }
                    }
                  } satisfies SafeDetailedMatchTeam}
                  participants={activeDetailedData.participants || []}
                  {...(currentUserPuuid ? { currentUserPuuid } : {})}
                  compact={false}
                  layout="side-by-side"
                />
              )}
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
          {...(currentUserPuuid ? { currentUserPuuid } : {})}
          compact={compact}
        />
      ))}
    </div>
  );
}