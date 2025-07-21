'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProfileHeader } from '@/components/profile/profile-header';
import { SummonersSection } from '@/components/profile/summoners-section';
import { PerformanceOverview } from '@/components/profile/performance-overview';
import { MatchHistoryDisplay } from '@/components/match-history';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface Summoner {
  id: string;
  puuid: string;
  game_name: string;
  tag_line: string;
  region: string;
  level: number;
  profile_icon_id: number;
  ranked_info?: Array<{
    tier: string;
    rank_level: string;
    league_points: number;
    wins: number;
    losses: number;
    queue_type: string;
  }>;
}

interface PerformanceStats {
  totalGames: number;
  overallKDA: number;
  favoriteChampion: string;
  currentRank: string;
  kdaTrends: Array<{
    date: string;
    kda: number;
  }>;
  queueWinRates: Array<{
    queue: string;
    winRate: number;
    games: number;
  }>;
}

interface UserStats {
  totalGames: number;
  overallKDA: number;
  favoriteChampion: string;
  currentRank: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [summoner, setSummoner] = useState<Summoner | null>(null);
  const [, setPerformanceStats] = useState<PerformanceStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalGames: 0,
    overallKDA: 0,
    favoriteChampion: 'N/A',
    currentRank: 'Unranked',
  });
  const [loadingSummoners, setLoadingSummoners] = useState(true);
  const [, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSummoner = async () => {
    try {
      setLoadingSummoners(true);
      setError(null);
      
      const response = await fetch('/api/summoners');
      if (!response.ok) {
        throw new Error('Failed to fetch summoner');
      }
      
      const data = await response.json();
      setSummoner(data.data?.summoner || null);
      
      // Update user stats from summoner response
      if (data.data?.stats) {
        setUserStats({
          totalGames: data.data.stats.totalGames || 0,
          overallKDA: data.data.stats.overallKDA || 0,
          favoriteChampion: data.data.stats.favoriteChampion || 'N/A',
          currentRank: data.data.stats.currentRank || 'Unranked',
        });
      }
    } catch (err) {
      console.error('Error fetching summoner:', err);
      setError('Failed to load summoner account. Please try again.');
    } finally {
      setLoadingSummoners(false);
    }
  };

  const fetchPerformanceStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      
      if (summoner) {
        const response = await fetch(`/api/summoners/${summoner.puuid}/stats`);
        if (response.ok) {
          const data = await response.json();
          setPerformanceStats(data);
        }
      }
    } catch (err) {
      console.error('Error fetching performance stats:', err);
    } finally {
      setLoadingStats(false);
    }
  }, [summoner]);

  // Fetch summoner data
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSummoner();
    }
  }, [isAuthenticated, user]);

  // Fetch performance stats when summoner changes
  useEffect(() => {
    if (summoner) {
      fetchPerformanceStats();
    }
  }, [summoner, fetchPerformanceStats]);

  const handleAddSummoner = async () => {
    // Simple callback to refresh summoner after successful verification
    await fetchSummoner();
  };


  const handleRemoveSummoner = async (id: string) => {
    try {
      const response = await fetch(`/api/summoners/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove summoner');
      }

      // Refresh summoner
      await fetchSummoner();
    } catch (err) {
      console.error('Error removing summoner:', err);
      throw err;
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing || !summoner) return;
    
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/summoners/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh summoner data after successful refresh
          await fetchSummoner();
          await fetchPerformanceStats();
        }
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Error Alert */}
        {error && (
          <Alert className="border-red-500/20 bg-red-500/5 backdrop-blur-md">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200">
              {error}
              <Button 
                variant="link" 
                onClick={() => window.location.reload()}
                className="ml-2 text-red-400 hover:text-red-300"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Page Header */}
        <ProfileHeader user={user} stats={userStats} />

        {/* Summoner Account Section */}
        <SummonersSection
          summoner={summoner}
          onAdd={handleAddSummoner}
          onRemove={handleRemoveSummoner}
        />

        {/* Performance Overview */}
        {summoner && (
          <PerformanceOverview stats={userStats} summoner={summoner} />
        )}

        {/* Match History */}
        {summoner && (
          <MatchHistoryDisplay
            summonerId={summoner.puuid}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        )}

        {/* No Summoner State */}
        {!summoner && !loadingSummoners && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-md border border-blue-500/20 rounded-lg p-8">
              <h3 className="text-xl font-semibold text-white mb-2">
                Welcome to your League Profile!
              </h3>
              <p className="text-gray-400 mb-6">
                Link your League of Legends account to track your performance and participate in challenges.
              </p>
              <Button 
                onClick={() => router.push('/dashboard/challenges')}
                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/30"
              >
                View Available Challenges
              </Button>
            </div>
          </div>
        )}

        {/* Loading States */}
        {loadingSummoners && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Loading summoner account...</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}