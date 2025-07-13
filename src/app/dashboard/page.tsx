'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { 
  ChallengesCard, 
  LeagueProfileCard, 
  LeaderboardCard, 
  StatsOverviewCard 
} from '@/components/dashboard/dashboard-cards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Sparkles, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back! 🐱
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your League of Legends journey with the Yuumi Mains community
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Everything is up to date</span>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ChallengesCard />
          <LeagueProfileCard />
          <LeaderboardCard />
        </div>

        {/* Secondary Content */}
        <div className="grid gap-6 md:grid-cols-2">
          <StatsOverviewCard />
          
          {/* Quick Actions Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <span className="text-sm font-medium">Update League Account</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <span className="text-sm font-medium">Join Weekly Challenge</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <span className="text-sm font-medium">View Match History</span>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}