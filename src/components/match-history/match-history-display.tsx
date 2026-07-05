'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MatchEntry } from './match-entry';
import { MatchData } from '@/lib/types';
import {
  GamepadIcon,
  TrendingUp,
  Trophy,
  Target,
  BarChart3,
  RefreshCw,
  AlertCircle,
  Filter,
} from 'lucide-react';

interface MatchHistoryDisplayProps {
  summonerId: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type MatchFilter = 'all' | 'wins' | 'losses' | 'ranked' | 'normal';

export function MatchHistoryDisplay({
  summonerId,
  onRefresh,
  isRefreshing = false,
}: MatchHistoryDisplayProps) {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MatchFilter>('all');

  // Reset loading/error during render when the summoner changes (the initial
  // state already covers the first fetch), so the fetch effect below never
  // calls setState synchronously.
  const [prevSummonerId, setPrevSummonerId] = useState(summonerId);
  if (prevSummonerId !== summonerId) {
    setPrevSummonerId(summonerId);
    setLoading(true);
    setError(null);
  }

  // Promise-chain style (rather than async/await) so every setState happens
  // inside an async callback, never synchronously when called from the effect.
  const fetchMatches = useCallback(() => {
    return fetch(`/api/summoners/${summonerId}/matches?limit=20`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }

        const data = await response.json();
        setMatches(data.matches || []);
      })
      .catch((error) => {
        console.error('Error fetching matches:', error);
        setError('Failed to load match history');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [summonerId]);

  useEffect(() => {
    fetchMatches();
  }, [summonerId, fetchMatches]);

  const getFilteredMatches = () => {
    // Ensure matches is an array before filtering
    const safeMatches = Array.isArray(matches) ? matches : [];

    switch (filter) {
      case 'wins':
        return safeMatches.filter((match) => match.win);
      case 'losses':
        return safeMatches.filter((match) => !match.win);
      case 'ranked':
        return safeMatches.filter(
          (match) => match.queue_id === 420 || match.queue_id === 440
        );
      case 'normal':
        return safeMatches.filter(
          (match) => match.queue_id === 400 || match.queue_id === 430
        );
      default:
        return safeMatches;
    }
  };

  const calculateStats = () => {
    // Ensure matches is an array before calculating stats
    const safeMatches = Array.isArray(matches) ? matches : [];

    if (safeMatches.length === 0) {
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
      };
    }

    const wins = safeMatches.filter((match) => match.win).length;
    const losses = safeMatches.length - wins;
    const winRate = Math.round((wins / safeMatches.length) * 100);

    const totalKills = safeMatches.reduce((sum, match) => sum + match.kills, 0);
    const totalDeaths = safeMatches.reduce(
      (sum, match) => sum + match.deaths,
      0
    );
    const totalAssists = safeMatches.reduce(
      (sum, match) => sum + match.assists,
      0
    );

    const avgKills = Math.round((totalKills / safeMatches.length) * 10) / 10;
    const avgDeaths = Math.round((totalDeaths / safeMatches.length) * 10) / 10;
    const avgAssists =
      Math.round((totalAssists / safeMatches.length) * 10) / 10;

    const avgKDA =
      totalDeaths > 0
        ? Math.round(((totalKills + totalAssists) / totalDeaths) * 100) / 100
        : 99;

    // Find most played champion
    const championCounts = safeMatches.reduce(
      (acc, match) => {
        acc[match.champion] = (acc[match.champion] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostPlayedChampion =
      Object.entries(championCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      'None';

    return {
      totalGames: safeMatches.length,
      wins,
      losses,
      winRate,
      avgKDA,
      avgKills,
      avgDeaths,
      avgAssists,
      mostPlayedChampion,
    };
  };

  const getStreakInfo = () => {
    if (!Array.isArray(matches) || matches.length === 0)
      return { type: 'none', count: 0, isActive: false };

    const sortedMatches = [...matches].sort(
      (a, b) =>
        new Date(b.game_creation).getTime() -
        new Date(a.game_creation).getTime()
    );

    let currentStreak = 1;
    const firstMatchResult = sortedMatches[0]?.win;

    for (let i = 1; i < sortedMatches.length; i++) {
      if (sortedMatches[i]?.win === firstMatchResult) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      type: firstMatchResult ? 'win' : 'loss',
      count: currentStreak,
      isActive: true,
    };
  };

  if (loading) {
    return (
      <Card className="border-purple-500/30 bg-black/20 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-purple-500/20 p-3">
              <GamepadIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Match History
              </CardTitle>
              <CardDescription className="text-white/70">
                Detailed game performance and statistics
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 bg-white/10" />
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 bg-white/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/30 bg-black/20 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="mb-4 h-16 w-16 text-red-400" />
          <h3 className="mb-2 text-xl font-semibold text-white">
            Failed to Load Match History
          </h3>
          <p className="mb-4 text-white/60">{error}</p>
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              setError(null);
              fetchMatches();
            }}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
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
    <Card className="border-purple-500/30 bg-black/20 backdrop-blur-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-purple-500/20 p-3">
              <GamepadIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                Match History
              </CardTitle>
              <CardDescription className="text-white/70">
                Detailed game performance and statistics
              </CardDescription>
            </div>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!Array.isArray(matches) || matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GamepadIcon className="mb-4 h-16 w-16 text-white/30" />
            <h3 className="mb-2 text-xl font-semibold text-white">
              No Match History
            </h3>
            <p className="mb-4 text-white/60">
              Play some games to see your detailed match history and statistics
            </p>
            {onRefresh && (
              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                Check for Matches
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Statistics Overview */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                <div className="mb-2 flex items-center justify-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-blue-400" />
                  <span className="text-2xl font-bold text-blue-400">
                    {stats.totalGames}
                  </span>
                </div>
                <p className="text-sm text-white/60">Total Games</p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                <div className="mb-2 flex items-center justify-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-green-400" />
                  <span className="text-2xl font-bold text-green-400">
                    {stats.winRate}%
                  </span>
                </div>
                <p className="text-sm text-white/60">Win Rate</p>
                <p className="text-xs text-white/40">
                  {stats.wins}W / {stats.losses}L
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                <div className="mb-2 flex items-center justify-center">
                  <Target className="mr-2 h-5 w-5 text-yellow-400" />
                  <span className="text-2xl font-bold text-yellow-400">
                    {stats.avgKDA}
                  </span>
                </div>
                <p className="text-sm text-white/60">Avg KDA</p>
                <p className="text-xs text-white/40">
                  {stats.avgKills} / {stats.avgDeaths} / {stats.avgAssists}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                <div className="mb-2 flex items-center justify-center">
                  <Trophy className="mr-2 h-5 w-5 text-purple-400" />
                  <Badge
                    variant={streak.type === 'win' ? 'default' : 'destructive'}
                    className="px-2 py-1 text-sm"
                  >
                    {streak.count} {streak.type === 'win' ? 'W' : 'L'}
                  </Badge>
                </div>
                <p className="text-sm text-white/60">Current Streak</p>
              </div>
            </div>

            {/* Filters and Matches */}
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as MatchFilter)}
            >
              <div className="flex items-center justify-between">
                <TabsList className="border border-white/10 bg-black/20">
                  <TabsTrigger value="all">
                    All ({Array.isArray(matches) ? matches.length : 0})
                  </TabsTrigger>
                  <TabsTrigger value="wins">Wins ({stats.wins})</TabsTrigger>
                  <TabsTrigger value="losses">
                    Losses ({stats.losses})
                  </TabsTrigger>
                  <TabsTrigger value="ranked">Ranked</TabsTrigger>
                  <TabsTrigger value="normal">Normal</TabsTrigger>
                </TabsList>

                <div className="flex items-center text-white/60">
                  <Filter className="mr-2 h-4 w-4" />
                  <span className="text-sm">
                    Showing {filteredMatches.length} matches
                  </span>
                </div>
              </div>

              <TabsContent value={filter} className="mt-6">
                {filteredMatches.length === 0 ? (
                  <div className="py-8 text-center text-white/60">
                    <GamepadIcon className="mx-auto mb-4 h-12 w-12 text-white/30" />
                    <p>No matches found for this filter</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMatches.map((match) => (
                      <MatchEntry key={match.match_id} match={match} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
