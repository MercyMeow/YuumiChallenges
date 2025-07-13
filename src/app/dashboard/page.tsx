'use client';

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
import { Settings, Sparkles, TrendingUp, Zap, Activity, Users, Award } from 'lucide-react';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Hero Welcome Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-indigo-500/10 rounded-2xl"></div>
          <div className="relative p-8 rounded-2xl border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    Welcome back! 🐱
                  </h1>
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                    Online
                  </Badge>
                </div>
                <p className="text-xl text-muted-foreground">
                  Ready to climb the ranks with your enchanter skills?
                </p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1 text-green-400">
                    <Activity className="h-4 w-4" />
                    <span>All systems operational</span>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-400">
                    <Users className="h-4 w-4" />
                    <span>1,247 active members</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-4xl animate-pulse">
                    🌟
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-yellow-900" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Zap className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">7</p>
                <p className="text-xs text-muted-foreground">Win Streak</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Award className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">12</p>
                <p className="text-xs text-muted-foreground">Rank</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Activity className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">68%</p>
                <p className="text-xs text-muted-foreground">Win Rate</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Users className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-400">3</p>
                <p className="text-xs text-muted-foreground">Active Challenges</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ChallengesCard />
              <LeagueProfileCard />
            </div>
            <StatsOverviewCard />
          </div>
          
          <div className="space-y-6">
            <LeaderboardCard />
            
            {/* Enhanced Quick Actions Card */}
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5"></div>
              <CardHeader className="relative pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Settings className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-auto p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Update League Account</p>
                      <p className="text-xs text-muted-foreground">Sync your latest matches</p>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-auto p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Zap className="h-4 w-4 text-purple-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Join Weekly Challenge</p>
                      <p className="text-xs text-muted-foreground">Earn points and rewards</p>
                    </div>
                  </div>
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start h-auto p-4 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Activity className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">View Match History</p>
                      <p className="text-xs text-muted-foreground">Analyze your performance</p>
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}