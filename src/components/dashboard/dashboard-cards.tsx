'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Target, 
  BarChart3, 
  Trophy, 
  TrendingUp, 
  Users, 
  Star,
  Plus,
  ArrowRight,
  Zap,
  Crown,
  Clock
} from 'lucide-react';

export function ChallengesCard() {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">My Challenges</CardTitle>
              <CardDescription>Active challenges and progress</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            3 Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sample challenge progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">10-Game Win Streak</span>
            </div>
            <span className="text-muted-foreground">7/10</span>
          </div>
          <Progress value={70} className="h-2" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="font-medium">Reach Gold Rank</span>
            </div>
            <span className="text-muted-foreground">Silver I</span>
          </div>
          <Progress value={85} className="h-2" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Yuumi Mastery 7</span>
            </div>
            <span className="text-muted-foreground">M6</span>
          </div>
          <Progress value={45} className="h-2" />
        </div>

        <div className="pt-2 border-t">
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Join New Challenge
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeagueProfileCard() {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-chart-2/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <CardTitle className="text-lg">League Profile</CardTitle>
              <CardDescription>Your linked League accounts</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2">
            <div className="w-2 h-2 bg-chart-2 rounded-full mr-1"></div>
            Verified
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sample account info */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium">YuumiCarry</p>
            <p className="text-sm text-muted-foreground">NA1 • Gold II</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">67 LP</p>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center space-x-1 text-xs text-chart-2">
                  <TrendingUp className="h-3 w-3" />
                  <span>+23 LP</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last game: +23 LP (Victory)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Yuumi Games This Season</span>
            <span className="font-medium">127</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Win Rate</span>
            <span className="font-medium text-chart-2">68%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Average KDA</span>
            <span className="font-medium">2.3 / 1.8 / 14.2</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeaderboardCard() {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-chart-3/10 rounded-lg">
              <Trophy className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <CardTitle className="text-lg">Leaderboard</CardTitle>
              <CardDescription>Your ranking this month</CardDescription>
            </div>
          </div>
          <Badge className="bg-chart-3 text-chart-3-foreground">
            #12
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top 3 players */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 bg-chart-3/10 rounded-lg border border-chart-3/20">
            <div className="flex items-center space-x-2">
              <Crown className="h-4 w-4 text-chart-3" />
              <span className="text-sm font-medium">YuumiMaster</span>
            </div>
            <span className="text-sm font-bold text-chart-3">2,547 pts</span>
          </div>

          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 flex items-center justify-center bg-muted rounded text-xs font-bold text-muted-foreground">2</div>
              <span className="text-sm font-medium">CatSupport</span>
            </div>
            <span className="text-sm font-medium">2,341 pts</span>
          </div>

          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 flex items-center justify-center bg-chart-5/20 rounded text-xs font-bold text-chart-5">3</div>
              <span className="text-sm font-medium">BookLover</span>
            </div>
            <span className="text-sm font-medium">2,198 pts</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Your Progress</span>
            <span className="font-medium">1,876 pts</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Updated 5 minutes ago</span>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full">
          View Full Leaderboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function StatsOverviewCard() {
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-chart-4/10 rounded-lg">
            <Users className="h-5 w-5 text-chart-4" />
          </div>
          <div>
            <CardTitle className="text-lg">Community Stats</CardTitle>
            <CardDescription>Yuumi Mains activity</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">1,247</div>
            <div className="text-xs text-muted-foreground">Active Members</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-chart-1">89</div>
            <div className="text-xs text-muted-foreground">Online Now</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-chart-2">342</div>
            <div className="text-xs text-muted-foreground">Challenges Active</div>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <div className="text-2xl font-bold text-chart-3">15.2k</div>
            <div className="text-xs text-muted-foreground">Games Tracked</div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Server Activity</span>
            <Badge variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2">
              <div className="w-2 h-2 bg-chart-2 rounded-full mr-1"></div>
              High
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
}