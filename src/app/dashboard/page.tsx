'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { 
  ChallengesCard, 
  LeagueProfileCard, 
  LeaderboardCard
} from '@/components/dashboard/dashboard-cards';
import { MatchHistoryCard } from '@/components/match-history';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Activity, Users, Award, Loader2, RefreshCw, Zap } from 'lucide-react';

interface DashboardStats {
  winStreak: number;
  userRank: string;
  winRate: number;
  activeChallenges: number;
  currentRank: number | null;
}


interface SummonerData {
  summoner: {
    id: string;
    puuid: string;
    game_name: string;
    tag_line: string;
    region: string;
    level: number;
    profile_icon_id: number;
  } | null;
  stats: {
    totalGames: number;
    overallKDA: number;
    favoriteChampion: string;
    currentRank: string;
  } | null;
}

interface RefreshStatus {
  can_refresh: boolean;
  can_manual_refresh: boolean;
  last_refreshed_at?: Date;
  next_auto_refresh?: Date;
}

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [summonerData, setSummonerData] = useState<SummonerData | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingSummoner, setLoadingSummoner] = useState(true);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [matchHistoryRefreshTrigger, setMatchHistoryRefreshTrigger] = useState(0);

  // Remove useCallback to prevent dependency issues - these functions are only called in effects
  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true);
      
      // Fetch dashboard stats
      const dashboardRes = await fetch('/api/user/dashboard-stats');

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        setDashboardStats(dashboardData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRefreshStatus = async () => {
    try {
      const response = await fetch('/api/summoners/refresh');
      if (response.ok) {
        const data = await response.json();
        
        // Convert timestamp strings back to Date objects
        const refreshStatus = {
          ...data,
          last_refreshed_at: data.last_refreshed_at ? new Date(data.last_refreshed_at) : undefined,
          last_manual_refresh_at: data.last_manual_refresh_at ? new Date(data.last_manual_refresh_at) : undefined,
          next_auto_refresh: data.next_auto_refresh ? new Date(data.next_auto_refresh) : undefined,
          next_manual_refresh: data.next_manual_refresh ? new Date(data.next_manual_refresh) : undefined,
          last_match_date: data.last_match_date ? new Date(data.last_match_date) : undefined,
        };
        
        setRefreshStatus(refreshStatus);
      }
    } catch (error) {
      console.error('Error fetching refresh status:', error);
    }
  };

  const fetchSummonerData = async (isInitialLoad = true) => {
    try {
      if (isInitialLoad) {
        setLoadingSummoner(true);
      }
      console.log('🔍 DEBUG - Fetching summoner data');
      
      const response = await fetch('/api/summoners');
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 DEBUG - Summoner API response:', data);
        
        if (data.data?.summoner) {
          setSummonerData(data.data);
          // Also fetch refresh status
          await fetchRefreshStatus();
          console.log('✅ DEBUG - Summoner data set successfully');
        } else {
          console.log('❌ DEBUG - No summoner found');
          setSummonerData({ summoner: null, stats: null });
        }
      } else {
        throw new Error(`API response not ok: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching summoner data:', error);
      // On error, set to null state
      setSummonerData({ summoner: null, stats: null });
    } finally {
      // Always set loading to false when we're done
      if (isInitialLoad) {
        setLoadingSummoner(false);
      }
    }
  };

  const checkAutoRefresh = async () => {
    if (!refreshStatus?.can_refresh) return;
    
    // Perform auto-refresh if allowed
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/summoners/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: false }),
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Refresh summoner data after successful auto-refresh
          await fetchSummonerData(false);
          await fetchDashboardData(); // Refresh dashboard stats too
          // Trigger match history refresh
          setMatchHistoryRefreshTrigger(Date.now());
        }
      }
    } catch (error) {
      console.error('Error during auto-refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!refreshStatus?.can_manual_refresh || isRefreshing) return;
    
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
          // Refresh all data after successful manual refresh
          await fetchSummonerData(false);
          await fetchDashboardData();
          // Trigger match history refresh
          setMatchHistoryRefreshTrigger(Date.now());
        }
      }
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshAll = async () => {
    if (isRefreshingAll) return;
    
    try {
      setIsRefreshingAll(true);
      
      // Refresh all dashboard data in parallel
      const refreshPromises = [
        fetchDashboardData(),
        fetchSummonerData(false)
      ];
      
      // Also trigger summoner refresh if available
      if (refreshStatus?.can_manual_refresh && !isRefreshing) {
        refreshPromises.push(
          fetch('/api/summoners/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ manual: true }),
          }).then(() => {})
        );
      }
      
      await Promise.allSettled(refreshPromises);
      
      // Add small delay for user feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Trigger match history refresh after successful refresh all
      setMatchHistoryRefreshTrigger(Date.now());
      
    } catch (error) {
      console.error('Error during refresh all:', error);
    } finally {
      setIsRefreshingAll(false);
    }
  };

  // Initial data loading - removed function dependencies to prevent infinite loop
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
      fetchSummonerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]); // Only depend on auth state
  
  // Periodic refresh status updates for accurate cooldown display
  useEffect(() => {
    if (!isAuthenticated || !user || !summonerData?.summoner) return;
    
    // Update refresh status every 30 seconds for accurate cooldown display
    const statusInterval = setInterval(async () => {
      if (!isRefreshing && !isRefreshingAll) {
        await fetchRefreshStatus();
      }
    }, 30 * 1000); // Update every 30 seconds
    
    return () => clearInterval(statusInterval);
  }, [isAuthenticated, user, summonerData?.summoner, isRefreshing, isRefreshingAll]);

  // Auto-refresh logic - periodic checking for auto-refresh eligibility
  useEffect(() => {
    if (!isAuthenticated || !user || !summonerData?.summoner) return;
    
    // Initial auto-refresh check on mount
    const initialCheck = async () => {
      await fetchRefreshStatus();
      if (refreshStatus?.can_refresh && !isRefreshing) {
        await checkAutoRefresh();
      }
    };
    
    initialCheck();
    
    // Set up periodic auto-refresh checking every 5 minutes
    const autoRefreshInterval = setInterval(async () => {
      if (!isRefreshing) {
        await fetchRefreshStatus();
        if (refreshStatus?.can_refresh) {
          await checkAutoRefresh();
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(autoRefreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, summonerData?.summoner]); // Simplified dependencies

  // Handle all loading and authentication states properly
  if (isLoading || loadingStats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If not loading but not authenticated, let middleware handle redirect
  if (!isAuthenticated || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-gray-400">Verifying authentication...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Welcome Section */}
        <div className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-indigo-500/20 rounded-2xl animate-pulse-glow"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-yuumi-purple/30 via-yuumi-blue/30 to-yuumi-teal/30 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-500"></div>
          <div className="relative p-6 rounded-2xl border border-purple-500/30 bg-black/20 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Welcome back! 🐱
                  </h1>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                    Online
                  </Badge>
                </div>
                <p className="text-lg text-white/70">
                  Ready to climb the ranks with your enchanter skills?
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1 text-green-300">
                      <Activity className="h-4 w-4" />
                      <span>All systems operational</span>
                    </div>
                    <div className="flex items-center space-x-1 text-blue-300">
                      <Users className="h-4 w-4" />
                      <span>Active Yuumi Mains community</span>
                    </div>
                  </div>
                  {/* Mobile Refresh All Button */}
                  <div className="md:hidden">
                    <Button 
                      onClick={handleRefreshAll}
                      disabled={isRefreshingAll}
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-none"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshingAll ? 'animate-spin' : ''}`} />
                      {isRefreshingAll ? 'Refreshing...' : 'Refresh All'}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <Button 
                  onClick={handleRefreshAll}
                  disabled={isRefreshingAll}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-none px-6 py-2"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingAll ? 'animate-spin' : ''}`} />
                  {isRefreshingAll ? 'Refreshing All...' : 'Refresh All'}
                </Button>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-2xl animate-pulse">
                    🌟
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-yellow-900" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-black/20 backdrop-blur-md border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all duration-300 cursor-pointer group card-hover">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-all duration-300">
                <Zap className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400 group-hover:text-purple-300 transition-colors duration-300">
                  {dashboardStats?.winStreak || 0}
                </p>
                <p className="text-xs text-white/70">Win Streak</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-black/20 backdrop-blur-md border-blue-500/30 hover:border-blue-400/50 hover:bg-blue-500/10 transition-all duration-300 cursor-pointer group card-hover">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all duration-300">
                <Award className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400 group-hover:text-blue-300 transition-colors duration-300">
                  {dashboardStats?.currentRank || 'N/A'}
                </p>
                <p className="text-xs text-white/70">Rank</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-black/20 backdrop-blur-md border-green-500/30 hover:border-green-400/50 hover:bg-green-500/10 transition-all duration-300 cursor-pointer group card-hover">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-all duration-300">
                <Activity className="h-4 w-4 text-green-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400 group-hover:text-green-300 transition-colors duration-300">
                  {dashboardStats?.winRate || 0}%
                </p>
                <p className="text-xs text-white/70">Win Rate</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-black/20 backdrop-blur-md border-yellow-500/30 hover:border-yellow-400/50 hover:bg-yellow-500/10 transition-all duration-300 cursor-pointer group card-hover">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-all duration-300">
                <Users className="h-4 w-4 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400 group-hover:text-yellow-300 transition-colors duration-300">
                  {dashboardStats?.activeChallenges || 0}
                </p>
                <p className="text-xs text-white/70">Active Challenges</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Dashboard Grid - Reordered by Priority */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Primary User Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Row - Most Important Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              <LeagueProfileCard 
                summonerData={summonerData}
                isLoading={loadingSummoner}
                refreshStatus={refreshStatus}
                isRefreshing={isRefreshing}
                onRefresh={handleManualRefresh}
                onAccountChange={async () => {
                  // Refresh all dashboard data when account linking succeeds
                  console.log('🔄 DEBUG - Account linking completed, refreshing dashboard');
                  try {
                    await fetchSummonerData(false); // Don't show loading spinner for refresh
                    await fetchDashboardData();
                    console.log('✅ DEBUG - Dashboard refresh completed successfully');
                  } catch (error) {
                    console.error('❌ ERROR - Dashboard refresh failed:', error);
                  }
                }}
              />
              <ChallengesCard />
            </div>
            
            {/* Match History Card */}
            <MatchHistoryCard 
              summonerId={summonerData?.summoner?.puuid}
              onRefresh={handleManualRefresh}
              isRefreshing={isRefreshing}
              refreshTrigger={matchHistoryRefreshTrigger}
            />
          </div>
          
          {/* Right Column - Secondary Info */}
          <div className="space-y-6">
            <LeaderboardCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}