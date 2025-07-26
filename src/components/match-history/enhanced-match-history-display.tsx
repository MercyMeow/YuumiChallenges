'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MatchCardList } from './match-card';
import { ProcessedMatchData } from '@/lib/types';
import { 
  GamepadIcon, 
  TrendingUp,
  Trophy,
  Target,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Filter,
  Users,
  Clock,
  Zap
} from 'lucide-react';

interface EnhancedMatchHistoryDisplayProps {
  summonerId: string;
  currentUserPuuid?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type MatchFilter = 'all' | 'wins' | 'losses' | 'ranked' | 'normal' | 'aram';

export function EnhancedMatchHistoryDisplay({ 
  summonerId, 
  currentUserPuuid,
  onRefresh, 
  isRefreshing = false 
}: EnhancedMatchHistoryDisplayProps) {
  const [matches, setMatches] = useState<ProcessedMatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MatchFilter>('all');
  const [limit, setLimit] = useState(50); // Show more matches by default
  const [hasMore, setHasMore] = useState(false);

  const fetchMatches = useCallback(async (resetMatches = true) => {
    try {
      setLoading(resetMatches);
      setError(null);
      
      const offset = resetMatches ? 0 : matches.length;
      const response = await fetch(`/api/summoners/${summonerId}/matches?limit=${limit}&offset=${offset}&detailed=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }
      
      const data = await response.json();
      const newMatches = data.matches || [];
      
      if (resetMatches) {
        setMatches(newMatches);
      } else {
        setMatches(prev => [...prev, ...newMatches]);
      }
      
      setHasMore(data.pagination?.hasMore || false);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to load match history');
    } finally {
      setLoading(false);
    }
  }, [summonerId, limit, matches.length]);

  useEffect(() => {
    fetchMatches(true);
  }, [summonerId]);

  const getFilteredMatches = () => {
    switch (filter) {
      case 'wins':
        return matches.filter(match => match.win);
      case 'losses':
        return matches.filter(match => !match.win);
      case 'ranked':
        return matches.filter(match => match.queue_id === 420 || match.queue_id === 440);
      case 'normal':
        return matches.filter(match => match.queue_id === 400 || match.queue_id === 430);
      case 'aram':
        return matches.filter(match => match.queue_id === 450);
      default:
        return matches;
    }
  };

  const calculateStats = () => {
    if (matches.length === 0) {
      return {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        avgKDA: 0,
        avgKills: 0,
        avgDeaths: 0,
        avgAssists: 0,
        mostPlayedChampion: 'None',
        totalPlayTime: 0,
        detailedMatches: 0
      };
    }

    const wins = matches.filter(match => match.win).length;
    const losses = matches.length - wins;
    const winRate = Math.round((wins / matches.length) * 100);

    const totalKills = matches.reduce((sum, match) => sum + match.kills, 0);
    const totalDeaths = matches.reduce((sum, match) => sum + match.deaths, 0);
    const totalAssists = matches.reduce((sum, match) => sum + match.assists, 0);
    const totalPlayTime = matches.reduce((sum, match) => sum + match.duration, 0);
    const detailedMatches = matches.filter(match => match.detailedData).length;

    const avgKills = Math.round((totalKills / matches.length) * 10) / 10;
    const avgDeaths = Math.round((totalDeaths / matches.length) * 10) / 10;
    const avgAssists = Math.round((totalAssists / matches.length) * 10) / 10;

    const avgKDA = totalDeaths > 0 ? 
      Math.round(((totalKills + totalAssists) / totalDeaths) * 100) / 100 : 
      99;

    // Find most played champion
    const championCounts = matches.reduce((acc, match) => {
      acc[match.champion] = (acc[match.champion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostPlayedChampion = Object.entries(championCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    return {
      totalGames: matches.length,
      wins,
      losses,
      winRate,
      avgKDA,
      avgKills,
      avgDeaths,
      avgAssists,
      mostPlayedChampion,
      totalPlayTime,
      detailedMatches
    };
  };

  const getStreakInfo = () => {
    if (matches.length === 0) return { type: 'none', count: 0, isActive: false };
    
    const sortedMatches = [...matches].sort((a, b) => 
      new Date(b.game_creation).getTime() - new Date(a.game_creation).getTime()
    );
    
    let currentStreak = 1;
    const firstMatchResult = sortedMatches[0]?.win;
    
    for (let i = 1; i < sortedMatches.length; i++) {
      if (sortedMatches[i].win === firstMatchResult) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    return {
      type: firstMatchResult ? 'win' : 'loss',
      count: currentStreak,
      isActive: true
    };
  };

  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading && matches.length === 0) {
    return (
      <Card className="bg-black/20 backdrop-blur-md border-purple-500/30">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <GamepadIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Enhanced Match History</CardTitle>
              <CardDescription className="text-white/70">Comprehensive game analysis and detailed team information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 bg-white/10" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-white/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-black/20 backdrop-blur-md border-red-500/30">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Failed to Load Match History</h3>
          <p className="text-white/60 mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => fetchMatches(true)}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stats = calculateStats();
  const streak = getStreakInfo();
  const filteredMatches = getFilteredMatches();

  return (
    <Card className="bg-black/20 backdrop-blur-md border-purple-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <GamepadIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Enhanced Match History</CardTitle>
              <CardDescription className="text-white/70">
                Comprehensive game analysis with detailed team compositions
              </CardDescription>
            </div>
          </div>
          {onRefresh && (
            <Button 
              variant="outline" 
              onClick={() => {
                onRefresh();
                fetchMatches(true);
              }}
              disabled={isRefreshing}
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GamepadIcon className="h-16 w-16 text-white/30 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Match History</h3>
            <p className="text-white/60 mb-4">Play some games to see your detailed match analysis</p>
            {onRefresh && (
              <Button 
                variant="outline" 
                onClick={() => {
                  onRefresh();
                  fetchMatches(true);
                }}
                disabled={isRefreshing}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Check for Matches
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Enhanced Statistics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg border border-blue-500/20 text-center">
                <div className="flex items-center justify-center mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-400 mr-2" />
                  <span className="text-2xl font-bold text-blue-400">{stats.totalGames}</span>
                </div>
                <p className="text-sm text-white/60">Total Games</p>
                <p className="text-xs text-blue-400/60">{formatPlayTime(stats.totalPlayTime)}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg border border-green-500/20 text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-green-400 mr-2" />
                  <span className="text-2xl font-bold text-green-400">{stats.winRate}%</span>
                </div>
                <p className="text-sm text-white/60">Win Rate</p>
                <p className="text-xs text-white/40">{stats.wins}W / {stats.losses}L</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-lg border border-yellow-500/20 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="h-5 w-5 text-yellow-400 mr-2" />
                  <span className="text-2xl font-bold text-yellow-400">{stats.avgKDA}</span>
                </div>
                <p className="text-sm text-white/60">Avg KDA</p>
                <p className="text-xs text-white/40">{stats.avgKills} / {stats.avgDeaths} / {stats.avgAssists}</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg border border-purple-500/20 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="h-5 w-5 text-purple-400 mr-2" />
                  <Badge 
                    variant={streak.type === 'win' ? 'default' : 'destructive'} 
                    className="text-sm px-2 py-1"
                  >
                    {streak.count} {streak.type === 'win' ? 'W' : 'L'}
                  </Badge>
                </div>
                <p className="text-sm text-white/60">Current Streak</p>
              </div>

              <div className="p-4 bg-gradient-to-br from-pink-500/10 to-pink-600/5 rounded-lg border border-pink-500/20 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="h-5 w-5 text-pink-400 mr-2" />
                  <span className="text-2xl font-bold text-pink-400">{stats.detailedMatches}</span>
                </div>
                <p className="text-sm text-white/60">Detailed</p>
                <p className="text-xs text-white/40">Full Analysis</p>
              </div>
            </div>

            {/* Enhanced Filters */}
            <Tabs value={filter} onValueChange={(value) => setFilter(value as MatchFilter)}>
              <div className="flex items-center justify-between">
                <TabsList className="bg-black/20 border border-white/10">
                  <TabsTrigger value="all">All ({matches.length})</TabsTrigger>
                  <TabsTrigger value="wins">Wins ({stats.wins})</TabsTrigger>
                  <TabsTrigger value="losses">Losses ({stats.losses})</TabsTrigger>
                  <TabsTrigger value="ranked">Ranked</TabsTrigger>
                  <TabsTrigger value="normal">Normal</TabsTrigger>
                  <TabsTrigger value="aram">ARAM</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-white/60">
                    <Filter className="h-4 w-4 mr-2" />
                    <span className="text-sm">Showing {filteredMatches.length} matches</span>
                  </div>
                  {hasMore && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchMatches(false)}
                      disabled={loading}
                      className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Users className="h-4 w-4 mr-2" />
                      )}
                      Load More
                    </Button>
                  )}
                </div>
              </div>

              <TabsContent value={filter} className="mt-6">
                {filteredMatches.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    <GamepadIcon className="h-12 w-12 mx-auto mb-4 text-white/30" />
                    <p>No matches found for this filter</p>
                  </div>
                ) : (
                  <MatchCardList 
                    matches={filteredMatches} 
                    currentUserPuuid={currentUserPuuid}
                    loading={loading && matches.length === 0}
                  />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}