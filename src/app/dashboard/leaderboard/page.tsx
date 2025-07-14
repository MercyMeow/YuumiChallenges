'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Crown,
  Star,
  Zap,
  Activity,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  Award,
  Shield,
  User,
  ChevronRight
} from 'lucide-react';

// Types for leaderboard data
interface UserRanking {
  position: number;
  user: {
    id: string;
    name: string;
    image: string;
    role: string;
  };
  points: number;
  completedChallenges: number;
  lastActivity: string;
  change: number; // Position change from previous period
}

interface ChallengeRanking {
  position: number;
  user: {
    id: string;
    name: string;
    image: string;
  };
  progress: number;
  maxProgress: number;
  completedAt: string | null;
  progressPercentage: number;
}

interface PerformanceRanking {
  position: number;
  user: {
    id: string;
    name: string;
    image: string;
  };
  summoner: {
    name: string;
    tagLine: string;
  };
  value: number;
  gamesPlayed: number;
  timeframe: string;
}

interface CommunityStats {
  totalMembers: number;
  activeThisWeek: number;
  challengesCompleted: number;
  averageRank: string;
  topContributors: UserRanking[];
}

// Mock data for demonstration
const mockPointsRankings: UserRanking[] = [
  {
    position: 1,
    user: {
      id: "1",
      name: "YuumiMaster",
      image: "/api/placeholder/40/40",
      role: "admin"
    },
    points: 2547,
    completedChallenges: 15,
    lastActivity: "2 hours ago",
    change: 0
  },
  {
    position: 2,
    user: {
      id: "2",
      name: "CatSupport",
      image: "/api/placeholder/40/40",
      role: "moderator"
    },
    points: 2341,
    completedChallenges: 12,
    lastActivity: "1 hour ago",
    change: 1
  },
  {
    position: 3,
    user: {
      id: "3",
      name: "BookLover",
      image: "/api/placeholder/40/40",
      role: "member"
    },
    points: 2198,
    completedChallenges: 11,
    lastActivity: "3 hours ago",
    change: -1
  },
  {
    position: 4,
    user: {
      id: "4",
      name: "EnchantedPlayer",
      image: "/api/placeholder/40/40",
      role: "member"
    },
    points: 2087,
    completedChallenges: 10,
    lastActivity: "5 hours ago",
    change: 2
  },
  {
    position: 5,
    user: {
      id: "5",
      name: "SupportGoddess",
      image: "/api/placeholder/40/40",
      role: "member"
    },
    points: 1943,
    completedChallenges: 9,
    lastActivity: "1 day ago",
    change: -1
  },
  {
    position: 6,
    user: {
      id: "6",
      name: "HealingHands",
      image: "/api/placeholder/40/40",
      role: "member"
    },
    points: 1876,
    completedChallenges: 8,
    lastActivity: "2 days ago",
    change: 0
  },
  {
    position: 7,
    user: {
      id: "7",
      name: "AzuriteKat",
      image: "/api/placeholder/40/40",
      role: "member"
    },
    points: 1754,
    completedChallenges: 7,
    lastActivity: "3 days ago",
    change: 1
  },
  {
    position: 8,
    user: {
      id: "8",
      name: "MagicalMeow",
      image: "/api/placeholder/40/40",
      role: "member"
    },
    points: 1632,
    completedChallenges: 6,
    lastActivity: "4 days ago",
    change: -2
  }
];

const mockChallengeRankings: ChallengeRanking[] = [
  {
    position: 1,
    user: {
      id: "1",
      name: "YuumiMaster",
      image: "/api/placeholder/40/40"
    },
    progress: 10,
    maxProgress: 10,
    completedAt: "2024-01-15T10:30:00Z",
    progressPercentage: 100
  },
  {
    position: 2,
    user: {
      id: "2",
      name: "CatSupport",
      image: "/api/placeholder/40/40"
    },
    progress: 8,
    maxProgress: 10,
    completedAt: null,
    progressPercentage: 80
  },
  {
    position: 3,
    user: {
      id: "3",
      name: "BookLover",
      image: "/api/placeholder/40/40"
    },
    progress: 7,
    maxProgress: 10,
    completedAt: null,
    progressPercentage: 70
  }
];

const mockPerformanceRankings: PerformanceRanking[] = [
  {
    position: 1,
    user: {
      id: "1",
      name: "YuumiMaster",
      image: "/api/placeholder/40/40"
    },
    summoner: {
      name: "YuumiCarry",
      tagLine: "NA1"
    },
    value: 3.2,
    gamesPlayed: 45,
    timeframe: "This month"
  },
  {
    position: 2,
    user: {
      id: "2",
      name: "CatSupport",
      image: "/api/placeholder/40/40"
    },
    summoner: {
      name: "CatSupport",
      tagLine: "NA1"
    },
    value: 2.8,
    gamesPlayed: 38,
    timeframe: "This month"
  },
  {
    position: 3,
    user: {
      id: "3",
      name: "BookLover",
      image: "/api/placeholder/40/40"
    },
    summoner: {
      name: "BookLover",
      tagLine: "NA1"
    },
    value: 2.6,
    gamesPlayed: 42,
    timeframe: "This month"
  }
];

const mockCommunityStats: CommunityStats = {
  totalMembers: 1247,
  activeThisWeek: 89,
  challengesCompleted: 342,
  averageRank: "Silver II",
  topContributors: mockPointsRankings.slice(0, 3)
};

// Current user position for highlighting
const currentUserId = "6";
const currentUserPosition = mockPointsRankings.find(r => r.user.id === currentUserId)?.position || null;

const LeaderboardHeader = ({ stats, userPosition }: { stats: CommunityStats; userPosition: number | null }) => (
  <Card className="bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-indigo-500/5 border-purple-500/20 backdrop-blur-md">
    <CardContent className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-3">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Leaderboards</h1>
            <p className="text-purple-300">Yuumi Mains Community</p>
          </div>
        </div>
        
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-black/30 backdrop-blur-md rounded-xl border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-400 mb-1">{stats.totalMembers}</div>
            <div className="text-sm text-white/70">Total Members</div>
            <div className="flex items-center justify-center mt-2">
              <Users className="h-4 w-4 text-purple-400 mr-1" />
              <span className="text-xs text-purple-300">Community</span>
            </div>
          </div>
          
          <div className="text-center p-4 bg-black/30 backdrop-blur-md rounded-xl border border-blue-500/20">
            <div className="text-3xl font-bold text-blue-400 mb-1">{stats.activeThisWeek}</div>
            <div className="text-sm text-white/70">Active This Week</div>
            <div className="flex items-center justify-center mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
              <span className="text-xs text-green-400">Online</span>
            </div>
          </div>
          
          <div className="text-center p-4 bg-black/30 backdrop-blur-md rounded-xl border border-green-500/20">
            <div className="text-3xl font-bold text-green-400 mb-1">{stats.challengesCompleted}</div>
            <div className="text-sm text-white/70">Challenges Completed</div>
            <div className="flex items-center justify-center mt-2">
              <Target className="h-4 w-4 text-green-400 mr-1" />
              <span className="text-xs text-green-300">Total</span>
            </div>
          </div>
        </div>
      </div>
      
      {userPosition && (
        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <span className="text-yellow-400 font-bold">#{userPosition}</span>
              </div>
              <div>
                <p className="font-semibold text-white">Your Current Rank</p>
                <p className="text-sm text-white/70">{mockPointsRankings.find(r => r.user.id === currentUserId)?.points} points</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-yellow-400">
                <Clock className="h-4 w-4 inline mr-1" />
                Updated 5 min ago
              </div>
            </div>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

const PointsLeaderboard = ({ rankings, userPosition }: { rankings: UserRanking[]; userPosition: number | null }) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />;
      case 'moderator':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'moderator':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-3 w-3 text-green-400" />;
    if (change < 0) return <ArrowDown className="h-3 w-3 text-red-400" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-8">
      {/* Top 3 Podium */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-6 text-center">Top Performers</h2>
        <div className="flex items-end justify-center space-x-4 mb-6">
          {/* Second Place */}
          {rankings[1] && (
            <div className="text-center">
              <div className="w-20 h-24 bg-gradient-to-b from-slate-300 to-slate-500 rounded-lg flex items-center justify-center mb-2 shadow-lg">
                <span className="text-2xl font-bold text-slate-900">2</span>
              </div>
              <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-slate-400 shadow-lg">
                <AvatarImage src={rankings[1].user.image} />
                <AvatarFallback className="bg-slate-500 text-white">{rankings[1].user.name[0]}</AvatarFallback>
              </Avatar>
              <p className="font-semibold text-white text-sm">{rankings[1].user.name}</p>
              <p className="text-slate-300 text-xs">{rankings[1].points} pts</p>
            </div>
          )}
          
          {/* First Place */}
          {rankings[0] && (
            <div className="text-center">
              <div className="w-24 h-32 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-lg flex items-center justify-center mb-2 relative shadow-lg">
                <Crown className="absolute -top-3 h-6 w-6 text-yellow-200" />
                <span className="text-3xl font-bold text-yellow-900">1</span>
              </div>
              <Avatar className="w-20 h-20 mx-auto mb-2 border-4 border-yellow-400 shadow-lg">
                <AvatarImage src={rankings[0].user.image} />
                <AvatarFallback className="bg-yellow-500 text-yellow-900">{rankings[0].user.name[0]}</AvatarFallback>
              </Avatar>
              <p className="font-bold text-white">{rankings[0].user.name}</p>
              <p className="text-yellow-400 text-sm">{rankings[0].points} pts</p>
            </div>
          )}
          
          {/* Third Place */}
          {rankings[2] && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-b from-orange-300 to-orange-500 rounded-lg flex items-center justify-center mb-2 shadow-lg">
                <span className="text-2xl font-bold text-orange-900">3</span>
              </div>
              <Avatar className="w-16 h-16 mx-auto mb-2 border-2 border-orange-400 shadow-lg">
                <AvatarImage src={rankings[2].user.image} />
                <AvatarFallback className="bg-orange-500 text-orange-900">{rankings[2].user.name[0]}</AvatarFallback>
              </Avatar>
              <p className="font-semibold text-white text-sm">{rankings[2].user.name}</p>
              <p className="text-orange-400 text-xs">{rankings[2].points} pts</p>
            </div>
          )}
        </div>
      </div>

      {/* Full Rankings List */}
      <Card className="bg-black/30 backdrop-blur-md border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Full Rankings</CardTitle>
          <CardDescription className="text-white/70">Complete leaderboard standings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {rankings.map((ranking) => (
            <div
              key={ranking.user.id}
              className={`flex items-center justify-between p-4 rounded-lg transition-all hover:bg-slate-700/30 ${
                ranking.user.id === currentUserId ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-slate-800/30'
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Position */}
                <div className="w-12 text-center">
                  <span className={`text-lg font-bold ${
                    ranking.position <= 3 ? 'text-yellow-400' :
                    ranking.position <= 10 ? 'text-purple-400' :
                    'text-gray-400'
                  }`}>
                    #{ranking.position}
                  </span>
                  {ranking.change !== 0 && (
                    <div className={`text-xs flex items-center justify-center ${getChangeColor(ranking.change)}`}>
                      {getChangeIcon(ranking.change)}
                      <span className="ml-1">{Math.abs(ranking.change)}</span>
                    </div>
                  )}
                </div>
                
                {/* User Info */}
                <Avatar className="w-12 h-12 border-2 border-purple-500/30">
                  <AvatarImage src={ranking.user.image} />
                  <AvatarFallback className="bg-purple-500 text-white">{ranking.user.name[0]}</AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{ranking.user.name}</span>
                    <Badge className={`text-xs ${getRoleColor(ranking.user.role)}`}>
                      {getRoleIcon(ranking.user.role)}
                      <span className="ml-1">{ranking.user.role}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span>{ranking.completedChallenges} challenges</span>
                    <span>•</span>
                    <span>Active {ranking.lastActivity}</span>
                  </div>
                </div>
              </div>
              
              {/* Points */}
              <div className="text-right">
                <div className="text-xl font-bold text-white">{ranking.points}</div>
                <div className="text-sm text-gray-400">points</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const ChallengesLeaderboard = () => (
  <Card className="bg-black/30 backdrop-blur-md border-purple-500/20">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-white">
        <Target className="h-5 w-5 text-purple-400" />
        Challenge Leaderboards
      </CardTitle>
      <CardDescription className="text-white/70">Top performers in active challenges</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid gap-4">
        {mockChallengeRankings.map((ranking) => (
          <div
            key={ranking.user.id}
            className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg hover:bg-slate-700/30 transition-all"
          >
            <div className="flex items-center space-x-4">
              <span className="text-lg font-bold text-purple-400">#{ranking.position}</span>
              <Avatar className="w-10 h-10 border-2 border-purple-500/30">
                <AvatarImage src={ranking.user.image} />
                <AvatarFallback className="bg-purple-500 text-white">{ranking.user.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-white">{ranking.user.name}</p>
                <div className="flex items-center space-x-2 text-sm">
                  <Progress value={ranking.progressPercentage} className="w-20 h-2" />
                  <span className="text-gray-400">{ranking.progress}/{ranking.maxProgress}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {ranking.completedAt ? (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <Star className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  In Progress
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const PerformanceLeaderboard = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Zap className="h-5 w-5 text-green-400" />
          Highest KDA
        </CardTitle>
        <CardDescription className="text-white/70">Best kill/death/assist ratios (min 10 games)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockPerformanceRankings.map((ranking) => (
            <div
              key={ranking.user.id}
              className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-slate-700/30 transition-all"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-green-400">#{ranking.position}</span>
                <Avatar className="w-10 h-10 border-2 border-green-500/30">
                  <AvatarImage src={ranking.user.image} />
                  <AvatarFallback className="bg-green-500 text-white">{ranking.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white">{ranking.user.name}</p>
                  <p className="text-sm text-gray-400">{ranking.summoner.name}#{ranking.summoner.tagLine}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-green-400">{ranking.value}</div>
                <div className="text-xs text-gray-400">{ranking.gamesPlayed} games</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    
    <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5 text-blue-400" />
          Win Rate Leaders
        </CardTitle>
        <CardDescription className="text-white/70">Highest win rates (min 20 games)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockPerformanceRankings.map((ranking) => (
            <div
              key={ranking.user.id}
              className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-slate-700/30 transition-all"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-blue-400">#{ranking.position}</span>
                <Avatar className="w-10 h-10 border-2 border-blue-500/30">
                  <AvatarImage src={ranking.user.image} />
                  <AvatarFallback className="bg-blue-500 text-white">{ranking.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white">{ranking.user.name}</p>
                  <p className="text-sm text-gray-400">{ranking.summoner.name}#{ranking.summoner.tagLine}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-blue-400">{Math.round(ranking.value * 25)}%</div>
                <div className="text-xs text-gray-400">{ranking.gamesPlayed} games</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const CommunityStats = ({ stats }: { stats: CommunityStats }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          Community Overview
        </CardTitle>
        <CardDescription className="text-white/70">Server statistics and insights</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-black/30 rounded-lg border border-purple-500/20">
            <div className="text-2xl font-bold text-purple-400">{stats.totalMembers}</div>
            <div className="text-sm text-white/70">Total Members</div>
          </div>
          <div className="text-center p-4 bg-black/30 rounded-lg border border-blue-500/20">
            <div className="text-2xl font-bold text-blue-400">{stats.activeThisWeek}</div>
            <div className="text-sm text-white/70">Active This Week</div>
          </div>
          <div className="text-center p-4 bg-black/30 rounded-lg border border-green-500/20">
            <div className="text-2xl font-bold text-green-400">{stats.challengesCompleted}</div>
            <div className="text-sm text-white/70">Challenges Done</div>
          </div>
          <div className="text-center p-4 bg-black/30 rounded-lg border border-yellow-500/20">
            <div className="text-2xl font-bold text-yellow-400">{stats.averageRank}</div>
            <div className="text-sm text-white/70">Average Rank</div>
          </div>
        </div>
      </CardContent>
    </Card>
    
    <Card className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border-yellow-500/20 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Award className="h-5 w-5 text-yellow-400" />
          Top Contributors
        </CardTitle>
        <CardDescription className="text-white/70">Most active community members</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats.topContributors.map((contributor) => (
            <div
              key={contributor.user.id}
              className="flex items-center justify-between p-3 bg-black/30 rounded-lg hover:bg-slate-700/30 transition-all"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg font-bold text-yellow-400">#{contributor.position}</span>
                <Avatar className="w-8 h-8 border-2 border-yellow-500/30">
                  <AvatarImage src={contributor.user.image} />
                  <AvatarFallback className="bg-yellow-500 text-white">{contributor.user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white text-sm">{contributor.user.name}</p>
                  <p className="text-xs text-gray-400">{contributor.completedChallenges} challenges</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-bold text-yellow-400">{contributor.points}</div>
                <div className="text-xs text-gray-400">points</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('points');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <LeaderboardHeader 
          stats={mockCommunityStats} 
          userPosition={currentUserPosition}
        />

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-black/30 backdrop-blur-md border-purple-500/20">
            <TabsTrigger 
              value="points" 
              className="data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-200"
            >
              <Trophy className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Overall Points</span>
              <span className="sm:hidden">Points</span>
            </TabsTrigger>
            <TabsTrigger 
              value="challenges" 
              className="data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-200"
            >
              <Target className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Challenges</span>
              <span className="sm:hidden">Challenges</span>
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-200"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Performance</span>
              <span className="sm:hidden">Perf</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="data-[state=active]:bg-purple-500/30 data-[state=active]:text-purple-200"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Community</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <div className="min-h-[600px]">
            <TabsContent value="points">
              <PointsLeaderboard 
                rankings={mockPointsRankings} 
                userPosition={currentUserPosition}
              />
            </TabsContent>
            
            <TabsContent value="challenges">
              <ChallengesLeaderboard />
            </TabsContent>
            
            <TabsContent value="performance">
              <PerformanceLeaderboard />
            </TabsContent>
            
            <TabsContent value="stats">
              <CommunityStats stats={mockCommunityStats} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer with Activity Update */}
        <Card className="bg-black/30 backdrop-blur-md border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-white">Live rankings updated every 5 minutes</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-purple-300">
                <Activity className="h-4 w-4" />
                <span>Last update: just now</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}