'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { 
  ChallengesCard, 
  LeagueProfileCard, 
  LeaderboardCard, 
  StatsOverviewCard 
} from '@/components/dashboard/dashboard-cards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Sparkles, TrendingUp, Zap, Activity, Users, Award, Loader2 } from 'lucide-react';

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

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
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
  };

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

  if (!isAuthenticated || !user) {
    return null;
  }
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Welcome Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 rounded-2xl"></div>
          <div className="relative p-4 rounded-2xl border border-purple-500/20 bg-black/30 backdrop-blur-md">
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
          <Card className="p-4 bg-black/30 backdrop-blur-md border-purple-500/20 hover:border-purple-400/30 hover:bg-purple-500/5 transition-all duration-300 cursor-pointer group">
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
          <Card className="p-4 bg-black/30 backdrop-blur-md border-blue-500/20 hover:border-blue-400/30 hover:bg-blue-500/5 transition-all duration-300 cursor-pointer group">
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
          <Card className="p-4 bg-black/30 backdrop-blur-md border-green-500/20 hover:border-green-400/30 hover:bg-green-500/5 transition-all duration-300 cursor-pointer group">
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
          <Card className="p-4 bg-black/30 backdrop-blur-md border-yellow-500/20 hover:border-yellow-400/30 hover:bg-yellow-500/5 transition-all duration-300 cursor-pointer group">
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
              <LeagueProfileCard />
            </div>
            
            {/* Quick Actions - Moved to left side for better accessibility */}
            <Card className="relative overflow-hidden bg-black/30 backdrop-blur-md border-indigo-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
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
                    className="h-auto p-4 bg-black/30 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-400/30 transition-all duration-300 group hover:scale-105 hover:shadow-lg"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all duration-300">
                        <TrendingUp className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-white text-sm group-hover:text-blue-200 transition-colors duration-300">Update League Account</p>
                        <p className="text-xs text-white/70">Sync your latest matches</p>
                      </div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="h-auto p-4 bg-black/30 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-400/30 transition-all duration-300 group hover:scale-105 hover:shadow-lg"
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
                    className="h-auto p-4 bg-black/30 hover:bg-purple-500/20 border border-purple-500/20 hover:border-purple-400/30 transition-all duration-300 group hover:scale-105 hover:shadow-lg"
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