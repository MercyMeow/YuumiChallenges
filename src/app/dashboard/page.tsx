'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { 
  ChallengesCard, 
  LeagueProfileCard, 
  LeaderboardCard, 
  StatsOverviewCard 
} from '@/components/dashboard/dashboard-cards';
import { MatchHistoryCard } from '@/components/match-history';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Sparkles, Zap, Activity, Users, Award, Loader2, RefreshCw } from 'lucide-react';

interface DashboardStats {
  winStreak: number;
  userRank: string;
  winRate: number;
  activeChallenges: number;
  currentRank: number | null;
}

interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  onlineMembers: number;
  activeChallenges: number;
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
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [summonerData, setSummonerData] = useState<SummonerData | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshChecked, setAutoRefreshChecked] = useState(false);
  const [loadingSummoner, setLoadingSummoner] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoadingStats(true);
      
      // Fetch dashboard stats and community stats in parallel
      const [dashboardRes, communityRes] = await Promise.all([
        fetch('/api/user/dashboard-stats'),
        fetch('/api/community/stats')
      ]);

      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json();
        setDashboardStats(dashboardData);
      }

      if (communityRes.ok) {
        const communityData = await communityRes.json();
        setCommunityStats(communityData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchRefreshStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/summoners/refresh');
      if (response.ok) {
        const status = await response.json();
        setRefreshStatus(status);
      }
    } catch (error) {
      console.error('Error fetching refresh status:', error);
    }
  }, []);

  const fetchSummonerData = useCallback(async (retries = 3, delay = 1000) => {
    try {
      setLoadingSummoner(true);
      console.log('🔍 DEBUG - Fetching summoner data, retries left:', retries);
      
      const response = await fetch('/api/summoners');
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 DEBUG - Summoner API response:', data);
        
        if (data.summoner) {
          setSummonerData(data);
          // Also fetch refresh status
          fetchRefreshStatus();
          console.log('✅ DEBUG - Summoner data set successfully');
        } else {
          // No summoner found - retry if we have attempts left
          if (retries > 0) {
            console.log('⏳ DEBUG - No summoner found, retrying in', delay, 'ms');
            setTimeout(() => {
              fetchSummonerData(retries - 1, delay);
            }, delay);
            return; // Don't set loading to false yet
          } else {
            console.log('❌ DEBUG - No summoner found after all retries');
            setSummonerData({ summoner: null, stats: null });
          }
        }
      } else {
        throw new Error(`API response not ok: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching summoner data:', error);
      
      // Retry on error if we have attempts left  
      if (retries > 0) {
        console.log('🔄 DEBUG - Retrying due to error in', delay, 'ms');
        setTimeout(() => {
          fetchSummonerData(retries - 1, delay);  
        }, delay);
        return; // Don't set loading to false yet
      } else {
        // On final error, set to null state
        setSummonerData({ summoner: null, stats: null });
      }
    } finally {
      // Always set loading to false when we're done (success, final retry, or error)
      if (retries === 0) {
        setLoadingSummoner(false);
      }
    }
  }, [fetchRefreshStatus]);

  const checkAutoRefresh = useCallback(async () => {
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
          await fetchSummonerData();
          await fetchDashboardData(); // Refresh dashboard stats too
        }
      }
    } catch (error) {
      console.error('Error during auto-refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshStatus?.can_refresh, fetchSummonerData, fetchDashboardData]);

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
          await Promise.all([
            fetchSummonerData(),
            fetchDashboardData()
          ]);
        }
      }
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
      fetchSummonerData();
    }
  }, [isAuthenticated, user, fetchSummonerData, fetchDashboardData]);

  // Auto-refresh logic - check if we should auto-refresh on mount
  useEffect(() => {
    if (summonerData && !autoRefreshChecked) {
      checkAutoRefresh();
      setAutoRefreshChecked(true);
    }
  }, [summonerData, autoRefreshChecked, checkAutoRefresh]);

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
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1 text-green-300">
                    <Activity className="h-4 w-4" />
                    <span>All systems operational</span>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-300">
                    <Users className="h-4 w-4" />
                    <span>{communityStats?.totalMembers || 0} active members</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
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
              <ChallengesCard />
              <LeagueProfileCard 
                summonerData={summonerData}
                isLoading={loadingSummoner}
                onAccountChange={async () => {
                  // Refresh all dashboard data when account linking succeeds
                  console.log('🔄 DEBUG - Account linking completed, refreshing dashboard');
                  try {
                    await Promise.all([
                      fetchSummonerData(), // Uses retry logic
                      fetchDashboardData()
                    ]);
                    console.log('✅ DEBUG - Dashboard refresh completed successfully');
                  } catch (error) {
                    console.error('❌ ERROR - Dashboard refresh failed:', error);
                  }
                }}
              />
            </div>
            
            {/* Match History Card */}
            <MatchHistoryCard 
              summonerId={summonerData?.summoner?.puuid}
              onRefresh={handleManualRefresh}
              isRefreshing={isRefreshing}
            />
            
            {/* Quick Actions - Moved to left side for better accessibility */}
            <Card className="relative overflow-hidden bg-black/20 backdrop-blur-md border-indigo-500/30 group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
              <CardHeader className="relative pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Settings className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">Quick Actions</CardTitle>
                    <CardDescription className="text-white/70">Common tasks and shortcuts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid gap-3 md:grid-cols-3">
                  <Button 
                    variant="ghost" 
                    className="h-auto p-4 bg-black/20 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 group hover:scale-105 card-hover glow-hover"
                    onClick={handleManualRefresh}
                    disabled={!refreshStatus?.can_manual_refresh || isRefreshing}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all duration-300">
                        <RefreshCw className={`h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform duration-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-white text-sm group-hover:text-blue-200 transition-colors duration-300">
                          {isRefreshing ? 'Refreshing...' : 'Update League Account'}
                        </p>
                        <p className="text-xs text-white/70">
                          {refreshStatus?.can_manual_refresh ? 'Sync your latest matches' : 'Refresh on cooldown'}
                        </p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="h-auto p-4 bg-black/20 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 group hover:scale-105 card-hover glow-hover"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-all duration-300">
                        <Zap className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-white text-sm group-hover:text-purple-200 transition-colors duration-300">Join Weekly Challenge</p>
                        <p className="text-xs text-white/70">Earn points and rewards</p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="h-auto p-4 bg-black/20 hover:bg-green-500/20 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 group hover:scale-105 card-hover glow-hover"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-all duration-300">
                        <Activity className="h-4 w-4 text-green-400 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-white text-sm group-hover:text-green-200 transition-colors duration-300">View Match History</p>
                        <p className="text-xs text-white/70">Analyze your performance</p>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Community & Secondary Info */}
          <div className="space-y-6">
            <LeaderboardCard />
            <StatsOverviewCard />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}