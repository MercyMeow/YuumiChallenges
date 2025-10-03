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
import { Skeleton } from '@/components/ui/skeleton';
import { MatchCard } from './match-card';
import { MatchData } from '@/lib/types';
import {
  GamepadIcon,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

interface MatchHistoryCardProps {
  summonerId?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  refreshTrigger?: number; // Add refresh trigger for external refresh coordination
}

export function MatchHistoryCard({
  summonerId,
  onRefresh,
  isRefreshing = false,
  refreshTrigger,
}: MatchHistoryCardProps) {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!summonerId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/summoners/${summonerId}/matches?limit=5`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }

      const data = await response.json();
      setMatches(data.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to load match history');
    } finally {
      setLoading(false);
    }
  }, [summonerId]);

  useEffect(() => {
    if (summonerId) {
      fetchMatches();
    } else {
      setLoading(false);
    }
  }, [summonerId, fetchMatches, refreshTrigger]); // Add refreshTrigger to dependencies

  const calculateWinRate = () => {
    // Ensure matches is an array before calculating stats
    const safeMatches = Array.isArray(matches) ? matches : [];
    if (safeMatches.length === 0) return 0;
    const wins = safeMatches.filter((match) => match.win).length;
    return Math.round((wins / safeMatches.length) * 100);
  };

  const getRecentStreak = () => {
    if (!Array.isArray(matches) || matches.length === 0)
      return { type: 'none', count: 0 };

    const sortedMatches = [...matches].sort(
      (a, b) =>
        new Date(b.game_creation).getTime() -
        new Date(a.game_creation).getTime()
    );

    let streakCount = 1;
    const firstMatchResult = sortedMatches[0]?.win;

    for (let i = 1; i < sortedMatches.length; i++) {
      if (sortedMatches[i]?.win === firstMatchResult) {
        streakCount++;
      } else {
        break;
      }
    }

    return {
      type: firstMatchResult ? 'win' : 'loss',
      count: streakCount,
    };
  };

  if (loading) {
    return (
      <Card className="h-full border-purple-500/30 bg-black/20 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-purple-500/20 p-3">
                <GamepadIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  Match History
                </CardTitle>
                <CardDescription className="text-white/70">
                  Recent game performance
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-white/10" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!summonerId) {
    return (
      <Card className="h-full border-purple-500/30 bg-black/20 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-purple-500/20 p-3">
              <GamepadIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Match History</CardTitle>
              <CardDescription className="text-white/70">
                Recent game performance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <GamepadIcon className="mb-4 h-12 w-12 text-white/30" />
          <p className="mb-2 text-white/60">No League account linked</p>
          <p className="text-sm text-white/40">
            Link your account to see match history
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-red-500/30 bg-black/20 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-red-500/20 p-3">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Match History</CardTitle>
              <CardDescription className="text-white/70">
                Error loading matches
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
          <p className="mb-2 text-white/60">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMatches}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!Array.isArray(matches) || matches.length === 0) {
    return (
      <Card className="h-full border-purple-500/30 bg-black/20 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-purple-500/20 p-3">
                <GamepadIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  Match History
                </CardTitle>
                <CardDescription className="text-white/70">
                  Recent game performance
                </CardDescription>
              </div>
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
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
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <GamepadIcon className="mb-4 h-12 w-12 text-white/30" />
          <p className="mb-2 text-white/60">No recent matches found</p>
          <p className="text-sm text-white/40">
            Play some games to see your match history here
          </p>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="mt-4 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Check for Matches
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const winRate = calculateWinRate();
  const streak = getRecentStreak();

  return (
    <Card className="card-hover h-full border-purple-500/30 bg-black/20 backdrop-blur-md transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-purple-500/20 p-3">
              <GamepadIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Match History</CardTitle>
              <CardDescription className="text-white/70">
                Recent game performance
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
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
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
            <div className="mb-1 flex items-center justify-center">
              <TrendingUp className="mr-1 h-4 w-4 text-green-400" />
              <span className="text-lg font-bold text-green-400">
                {winRate}%
              </span>
            </div>
            <p className="text-xs text-white/60">
              Win Rate ({Array.isArray(matches) ? matches.length : 0} games)
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
            <div className="mb-1 flex items-center justify-center">
              <Badge
                variant={streak.type === 'win' ? 'default' : 'destructive'}
                className="px-2 py-1 text-xs"
              >
                {streak.count} {streak.type === 'win' ? 'W' : 'L'}
              </Badge>
            </div>
            <p className="text-xs text-white/60">Current Streak</p>
          </div>
        </div>

        {/* Recent Matches */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white/80">Recent Games</h4>
          {(Array.isArray(matches) ? matches : []).slice(0, 3).map((match) => (
            <MatchCard key={match.match_id} match={match} compact />
          ))}
        </div>

        {/* View All Button */}
        {Array.isArray(matches) && matches.length > 3 && (
          <div className="pt-2">
            <Button
              variant="outline"
              className="w-full border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
            >
              View All Matches
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
