'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { 
  ChallengesCard, 
  LeagueProfileCard
} from '@/components/dashboard/dashboard-cards';
import { EnhancedMatchHistoryDisplay } from '@/components/match-history';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshStatus } from '@/lib/types';
import { Sparkles, Activity, Users, Award, Loader2, Zap } from 'lucide-react';

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

// Remove local RefreshStatus interface - use the one from @/lib/types

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [summonerData, setSummonerData] = useState<SummonerData | null>(null);
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingSummoner, setLoadingSummoner] = useState(true);

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
        const apiResponse = await response.json();
        // Extract the actual refresh status data from the API response wrapper
        const refreshStatusData = apiResponse.data || apiResponse;
        setRefreshStatus(refreshStatusData as RefreshStatus);
      } else {
        console.error('Refresh status API error:', response.status);
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
      
      const response = await fetch('/api/summoners');
      if (response.ok) {
        const data = await response.json();
        
        if (data.data?.summoner) {
          setSummonerData(data.data);
          // Also fetch refresh status
          await fetchRefreshStatus();
        } else {
          setSummonerData({ summoner: null, stats: null });
        }
      } else {
        throw new Error(`API response not ok: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching summoner data:', error);
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
        }
      }
    } catch (error) {
      console.error('Error during auto-refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    if (!refreshStatus?.can_manual_refresh || isRefreshing) {
      return;
    }
    
    try {
      setIsRefreshing(true);
      
      const response = await fetch('/api/summoners/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        if (result.success || result.data?.partial_success) {
          // Refresh all data after successful manual refresh
          await fetchSummonerData(false);
          await fetchDashboardData();
          await fetchRefreshStatus(); // Update refresh status
        } else {
          console.error('Refresh failed:', result.message);
        }
      } else {
        console.error('Refresh API error:', response.status, result);
      }
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      setIsRefreshing(false);
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
      if (!isRefreshing) {
        await fetchRefreshStatus();
      }
    }, 30 * 1000); // Update every 30 seconds
    
    return () => clearInterval(statusInterval);
  }, [isAuthenticated, user, summonerData?.summoner, isRefreshing]);

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
      {/* Skip Navigation */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>
      
      <main id="main-content" className="space-y-8">
        {/* Hero Welcome Section */}
        <section className="relative overflow-hidden group" aria-labelledby="welcome-heading">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-indigo-500/20 rounded-2xl animate-pulse-glow"></div>
          <div className="absolute -inset-1 bg-gradient-to-r from-yuumi-purple/30 via-yuumi-blue/30 to-yuumi-teal/30 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-500"></div>
          <div className="relative p-6 rounded-2xl border border-purple-500/30 bg-black/20 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <h1 
                    id="welcome-heading"
                    className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent"
                  >
                    Welcome back! <span aria-hidden="true">🐱</span>
                  </h1>
                  <Badge 
                    variant="secondary" 
                    className="bg-accessible-green/20 text-accessible-green border-accessible-green/30"
                    aria-label="Currently online"
                  >
                    <div className="w-2 h-2 bg-accessible-green rounded-full mr-1 animate-pulse" aria-hidden="true"></div>
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
                  {/* Mobile status indicator */}
                  <div className="md:hidden">
                    <div className="flex items-center space-x-1 text-blue-300">
                      <Activity className="h-4 w-4" />
                      <span>Ready</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
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
        </section>

        {/* Quick Stats Bar */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-labelledby="quick-stats-heading">
          <h2 id="quick-stats-heading" className="sr-only">Quick Statistics Overview</h2>
          <Card 
            className="p-4 bg-black/20 backdrop-blur-md border-purple-500/30 hover:border-purple-400/50 hover:bg-purple-500/10 transition-all duration-300 cursor-pointer group card-hover focus-card"
            role="img"
            aria-label={`Current win streak: ${dashboardStats?.winStreak || 0} games`}
            tabIndex={0}
          >
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-all duration-300" aria-hidden="true">
                <Zap className="h-4 w-4 text-accessible-purple group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accessible-purple group-hover:text-purple-300 transition-colors duration-300">
                  {dashboardStats?.winStreak || 0}
                </p>
                <p className="text-xs text-white/70">Win Streak</p>
              </div>
            </div>
          </Card>
          <Card 
            className="p-4 bg-black/20 backdrop-blur-md border-blue-500/30 hover:border-blue-400/50 hover:bg-blue-500/10 transition-all duration-300 cursor-pointer group card-hover focus-card"
            role="img"
            aria-label={`Current rank: ${dashboardStats?.currentRank || 'Not available'}`}
            tabIndex={0}
          >
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all duration-300" aria-hidden="true">
                <Award className="h-4 w-4 text-accessible-blue group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accessible-blue group-hover:text-blue-300 transition-colors duration-300">
                  {dashboardStats?.currentRank || 'N/A'}
                </p>
                <p className="text-xs text-white/70">Rank</p>
              </div>
            </div>
          </Card>
          <Card 
            className="p-4 bg-black/20 backdrop-blur-md border-green-500/30 hover:border-green-400/50 hover:bg-green-500/10 transition-all duration-300 cursor-pointer group card-hover focus-card"
            role="img"
            aria-label={`Win rate: ${dashboardStats?.winRate || 0} percent`}
            tabIndex={0}
          >
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-all duration-300" aria-hidden="true">
                <Activity className="h-4 w-4 text-accessible-green group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accessible-green group-hover:text-green-300 transition-colors duration-300">
                  {dashboardStats?.winRate || 0}%
                </p>
                <p className="text-xs text-white/70">Win Rate</p>
              </div>
            </div>
          </Card>
          <Card 
            className="p-4 bg-black/20 backdrop-blur-md border-yellow-500/30 hover:border-yellow-400/50 hover:bg-yellow-500/10 transition-all duration-300 cursor-pointer group card-hover focus-card"
            role="img"
            aria-label={`Active challenges: ${dashboardStats?.activeChallenges || 0}`}
            tabIndex={0}
          >
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-all duration-300" aria-hidden="true">
                <Users className="h-4 w-4 text-accessible-yellow group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accessible-yellow group-hover:text-yellow-300 transition-colors duration-300">
                  {dashboardStats?.activeChallenges || 0}
                </p>
                <p className="text-xs text-white/70">Active Challenges</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Main Dashboard Grid - Simplified Layout */}
        <section className="space-y-6" aria-labelledby="dashboard-content-heading">
          <h2 id="dashboard-content-heading" className="sr-only">Dashboard Content</h2>
          
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
          
          {/* Enhanced Match History Display */}
          {summonerData?.summoner && (
            <EnhancedMatchHistoryDisplay
              summonerId={summonerData.summoner.puuid}
              currentUserPuuid={summonerData.summoner.puuid}
              onRefresh={handleManualRefresh}
              isRefreshing={isRefreshing}
            />
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}