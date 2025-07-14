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
    <Card className="h-full hover:shadow-lg transition-all duration-300 bg-black/30 backdrop-blur-md border-purple-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Target className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">My Challenges</CardTitle>
              <CardDescription className="text-white/70">Active challenges and progress</CardDescription>
            </div>
          </div>
          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-3 py-1">
            3 Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sample challenge progress */}
        <div className="space-y-4">
          <div className="p-4 bg-black/30 backdrop-blur-md rounded-xl border border-yellow-500/20">
            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-yellow-500/20 rounded-lg">
                  <Zap className="h-4 w-4 text-yellow-400" />
                </div>
                <span className="font-medium text-white">10-Game Win Streak</span>
              </div>
              <span className="text-yellow-400 font-bold">7/10</span>
            </div>
            <Progress value={70} className="h-3 bg-black/50" />
            <p className="text-xs text-white/70 mt-2">3 more wins to complete</p>
          </div>

          <div className="p-4 bg-black/30 backdrop-blur-md rounded-xl border border-amber-500/20">
            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-500/20 rounded-lg">
                  <Crown className="h-4 w-4 text-amber-400" />
                </div>
                <span className="font-medium text-white">Reach Gold Rank</span>
              </div>
              <span className="text-amber-400 font-bold">Silver I</span>
            </div>
            <Progress value={85} className="h-3 bg-black/50" />
            <p className="text-xs text-white/70 mt-2">So close! Keep climbing</p>
          </div>

          <div className="p-4 bg-black/30 backdrop-blur-md rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between text-sm mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-500/20 rounded-lg">
                  <Star className="h-4 w-4 text-blue-400" />
                </div>
                <span className="font-medium text-white">Yuumi Mastery 7</span>
              </div>
              <span className="text-blue-400 font-bold">M6</span>
            </div>
            <Progress value={45} className="h-3 bg-black/50" />
            <p className="text-xs text-white/70 mt-2">Keep showing off those skills!</p>
          </div>
        </div>

        <div className="pt-4 border-t border-purple-500/20">
          <Button variant="outline" className="w-full bg-black/30 border-purple-500/20 hover:bg-purple-500/20 text-white hover:text-purple-200 transition-all">
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
    <Card className="h-full hover:shadow-lg transition-all duration-300 bg-black/30 backdrop-blur-md border-blue-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">League Profile</CardTitle>
              <CardDescription className="text-white/70">Your linked League accounts</CardDescription>
            </div>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            Verified
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sample account info */}
        <div className="p-4 bg-black/30 backdrop-blur-md rounded-xl border border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl">
                🐱
              </div>
              <div>
                <p className="font-bold text-white text-lg">YuumiCarry</p>
                <p className="text-blue-400 font-medium">NA1 • Gold II</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-yellow-400">67 LP</p>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center space-x-1 text-green-400">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">+23 LP</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Last game: +23 LP (Victory)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-black/40 backdrop-blur-md rounded-lg border border-blue-500/20">
              <p className="text-2xl font-bold text-blue-400">127</p>
              <p className="text-xs text-white/70">Games</p>
            </div>
            <div className="text-center p-3 bg-black/40 backdrop-blur-md rounded-lg border border-green-500/20">
              <p className="text-2xl font-bold text-green-400">68%</p>
              <p className="text-xs text-white/70">Win Rate</p>
            </div>
            <div className="text-center p-3 bg-black/40 backdrop-blur-md rounded-lg border border-purple-500/20">
              <p className="text-lg font-bold text-purple-400">2.3 KDA</p>
              <p className="text-xs text-white/70">Average</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-blue-500/20">
          <Button variant="outline" className="w-full bg-black/30 border-blue-500/20 hover:bg-blue-500/20 text-white hover:text-blue-200 transition-all">
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
    <Card className="h-full hover:shadow-lg transition-all duration-300 bg-black/30 backdrop-blur-md border-yellow-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-yellow-500/20 rounded-xl">
              <Trophy className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Leaderboard</CardTitle>
              <CardDescription className="text-white/70">Your ranking this month</CardDescription>
            </div>
          </div>
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-3 py-1 text-lg font-bold">
            #12
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top 3 players */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-xl border border-yellow-500/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="h-4 w-4 text-yellow-900" />
              </div>
              <div>
                <span className="font-bold text-white">YuumiMaster</span>
                <p className="text-xs text-yellow-400">Enchanter God</p>
              </div>
            </div>
            <span className="text-lg font-bold text-yellow-400">2,547 pts</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-black/30 backdrop-blur-md rounded-xl border border-slate-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-sm font-bold text-slate-300">2</div>
              <div>
                <span className="font-medium text-white">CatSupport</span>
                <p className="text-xs text-white/70">Support Main</p>
              </div>
            </div>
            <span className="font-bold text-slate-300">2,341 pts</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-black/30 backdrop-blur-md rounded-xl border border-orange-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500/30 rounded-full flex items-center justify-center text-sm font-bold text-orange-400">3</div>
              <div>
                <span className="font-medium text-white">BookLover</span>
                <p className="text-xs text-white/70">Cat Whisperer</p>
              </div>
            </div>
            <span className="font-bold text-orange-400">2,198 pts</span>
          </div>
        </div>

        <div className="pt-4 border-t border-yellow-500/20">
          <div className="p-3 bg-black/30 backdrop-blur-md rounded-lg border border-yellow-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70">Your Progress</span>
              <span className="font-bold text-blue-400">1,876 pts</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-white/70">
              <Clock className="h-3 w-3" />
              <span>Updated 5 minutes ago</span>
            </div>
          </div>
        </div>

        <Button variant="outline" className="w-full bg-black/30 border-yellow-500/20 hover:bg-yellow-500/20 text-white hover:text-yellow-200 transition-all">
          View Full Leaderboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function StatsOverviewCard() {
  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 bg-black/30 backdrop-blur-md border-indigo-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <Users className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Community Stats</CardTitle>
            <CardDescription className="text-white/70">Yuumi Mains activity overview</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-400 mb-1">1,247</div>
            <div className="text-xs text-white/70">Active Members</div>
            <div className="w-full bg-black/50 rounded-full h-1 mt-2">
              <div className="bg-purple-400 h-1 rounded-full" style={{width: '87%'}}></div>
            </div>
          </div>
          <div className="text-center p-4 bg-black/30 backdrop-blur-md rounded-xl border border-green-500/20">
            <div className="text-3xl font-bold text-green-400 mb-1">89</div>
            <div className="text-xs text-white/70">Online Now</div>
            <div className="flex items-center justify-center mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          <div className="text-center p-4 bg-black/30 backdrop-blur-md rounded-xl border border-blue-500/20">
            <div className="text-3xl font-bold text-blue-400 mb-1">342</div>
            <div className="text-xs text-white/70">Challenges Active</div>
            <div className="text-xs text-blue-400 mt-1">+12 this week</div>
          </div>
          <div className="text-center p-4 bg-black/30 backdrop-blur-md rounded-xl border border-yellow-500/20">
            <div className="text-3xl font-bold text-yellow-400 mb-1">15.2k</div>
            <div className="text-xs text-white/70">Games Tracked</div>
            <div className="text-xs text-yellow-400 mt-1">+156 today</div>
          </div>
        </div>

        <div className="pt-4 border-t border-indigo-500/20">
          <div className="flex items-center justify-between p-3 bg-black/30 backdrop-blur-md rounded-lg border border-indigo-500/20">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-white">Server Activity</span>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
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