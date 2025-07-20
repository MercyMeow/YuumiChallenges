'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AddSummonerDialog } from '@/components/profile/add-summoner-dialog';
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
  const [challenges, setChallenges] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveChallenges();
  }, []);

  const fetchActiveChallenges = async () => {
    try {
      const response = await fetch('/api/challenges/active');
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges || []);
      }
    } catch (error) {
      console.error('Error fetching active challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'kda':
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'ranked':
        return <Crown className="h-4 w-4 text-amber-400" />;
      case 'mastery':
        return <Star className="h-4 w-4 text-blue-400" />;
      default:
        return <Target className="h-4 w-4 text-purple-400" />;
    }
  };

  const getChallengeColor = (type: string) => {
    switch (type) {
      case 'kda':
        return 'yellow';
      case 'ranked':
        return 'amber';
      case 'mastery':
        return 'blue';
      default:
        return 'purple';
    }
  };

  if (loading) {
    return <DashboardCardSkeleton />;
  }

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 card-hover bg-black/20 backdrop-blur-md border-purple-500/30 card-hover">
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
            {challenges.length} Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {challenges.length > 0 ? (
          <div className="space-y-4">
            {challenges.slice(0, 3).map((challenge) => {
              const color = getChallengeColor(challenge.type);
              return (
                <div key={challenge.id} className={`p-4 bg-black/20 backdrop-blur-md rounded-xl border border-${color}-500/20`}>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 bg-${color}-500/20 rounded-lg`}>
                        {getChallengeIcon(challenge.type)}
                      </div>
                      <span className="font-medium text-white">{challenge.title}</span>
                    </div>
                    <span className={`text-${color}-400 font-bold`}>
                      {challenge.progress}/{challenge.maxProgress}
                    </span>
                  </div>
                  <Progress value={challenge.progressPercentage} className="h-3 bg-black/50" />
                  <p className="text-xs text-white/70 mt-2">
                    {challenge.progressPercentage >= 100 
                      ? 'Completed! 🎉' 
                      : `${challenge.maxProgress - challenge.progress} more to complete`}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No active challenges yet</p>
            <p className="text-sm text-gray-500">Join a challenge to start earning points!</p>
          </div>
        )}

        <div className="pt-4 border-t border-purple-500/30">
          <Button variant="outline" className="w-full bg-black/20 border-purple-500/30 hover:bg-purple-500/20 text-white hover:text-purple-200 transition-all">
            <Plus className="h-4 w-4 mr-2" />
            Join New Challenge
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeagueProfileCard() {
  const [summoner, setSummoner] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);

  const handleAccountChange = async () => {
    // Refresh summoner data after account is added/changed
    await fetchSummoner();
  };

  useEffect(() => {
    fetchSummoner();
  }, []);

  const fetchSummoner = async () => {
    try {
      const response = await fetch('/api/summoners');
      if (response.ok) {
        const data = await response.json();
        if (data.summoner) {
          // Adapt the data structure to match what the UI expects
          const adaptedSummoner = {
            ...data.summoner,
            name: data.summoner.game_name, // Use game_name as the display name
            tagLine: data.summoner.tag_line,
            rank: data.summoner.ranked_info?.find((r: any) => r.queue_type === 'RANKED_SOLO_5x5') || null, // eslint-disable-line @typescript-eslint/no-explicit-any
            recentStats: {
              totalGames: data.stats?.totalGames || 0,
              winRate: Math.round(((data.summoner.ranked_info?.[0]?.wins || 0) / Math.max((data.summoner.ranked_info?.[0]?.wins || 0) + (data.summoner.ranked_info?.[0]?.losses || 0), 1)) * 100),
              kda: data.stats?.overallKDA || 0,
              recentLPGain: Math.floor(Math.random() * 30) - 10 // Mock LP gain for now
            }
          };
          setSummoner(adaptedSummoner);
        } else {
          setSummoner(null);
        }
      } else {
        setSummoner(null);
      }
    } catch (error) {
      console.error('Error fetching summoner:', error);
      setSummoner(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardCardSkeleton />;
  }

  if (!summoner) {
    return (
      <Card className="h-full hover:shadow-lg transition-all duration-300 card-hover bg-black/20 backdrop-blur-md border-blue-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <BarChart3 className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">League Profile</CardTitle>
                <CardDescription className="text-white/70">Your linked League account</CardDescription>
              </div>
            </div>
            <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 px-3 py-1">
              No Account
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No League account linked</p>
            <p className="text-sm text-gray-500">Connect your League account to track your progress</p>
          </div>
          
          <div className="pt-4 border-t border-blue-500/30">
            <AddSummonerDialog onAdd={handleAccountChange} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 card-hover bg-black/20 backdrop-blur-md border-blue-500/30">
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
        <div className="p-4 bg-black/20 backdrop-blur-md rounded-xl border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl">
                🐱
              </div>
              <div>
                <p className="font-bold text-white text-lg">
                  {summoner.name}#{summoner.tagLine}
                </p>
                <p className="text-blue-400 font-medium">
                  {summoner.region.toUpperCase()} • {summoner.rank ? `${summoner.rank.tier} ${summoner.rank.rank}` : 'Unranked'}
                </p>
              </div>
            </div>
            <div className="text-right">
              {summoner.rank && (
                <>
                  <p className="text-lg font-bold text-yellow-400">{summoner.rank.leaguePoints} LP</p>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center space-x-1 text-green-400">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">
                          {summoner.recentStats.recentLPGain > 0 ? '+' : ''}{summoner.recentStats.recentLPGain} LP
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Recent LP change</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-black/40 backdrop-blur-md rounded-lg border border-blue-500/30">
              <p className="text-2xl font-bold text-blue-400">{summoner.recentStats.totalGames}</p>
              <p className="text-xs text-white/70">Games</p>
            </div>
            <div className="text-center p-3 bg-black/40 backdrop-blur-md rounded-lg border border-green-500/20">
              <p className="text-2xl font-bold text-green-400">{summoner.recentStats.winRate}%</p>
              <p className="text-xs text-white/70">Win Rate</p>
            </div>
            <div className="text-center p-3 bg-black/40 backdrop-blur-md rounded-lg border border-purple-500/30">
              <p className="text-lg font-bold text-purple-400">{summoner.recentStats.kda} KDA</p>
              <p className="text-xs text-white/70">Average</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-blue-500/30">
          <AddSummonerDialog 
            onAdd={handleAccountChange} 
            variant="change"
            buttonText="Change Account"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function LeaderboardCard() {
  const [leaderboard, setLeaderboard] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardPreview();
  }, []);

  const fetchLeaderboardPreview = async () => {
    try {
      const response = await fetch('/api/leaderboard/preview');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard preview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardCardSkeleton />;
  }

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-900" />;
      default:
        return <span className="text-sm font-bold">{position}</span>;
    }
  };

  const getRankStyle = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
      case 2:
        return 'bg-black/20 backdrop-blur-md border-slate-500/20';
      case 3:
        return 'bg-black/20 backdrop-blur-md border-orange-500/20';
      default:
        return 'bg-black/20 backdrop-blur-md border-gray-500/20';
    }
  };

  const getRankCircleStyle = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-500';
      case 2:
        return 'bg-slate-600 text-slate-300';
      case 3:
        return 'bg-orange-500/30 text-orange-400';
      default:
        return 'bg-gray-500/30 text-gray-400';
    }
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 card-hover bg-black/20 backdrop-blur-md border-yellow-500/30">
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
            #{leaderboard?.currentUser?.position || 'N/A'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {leaderboard?.topUsers && leaderboard.topUsers.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.topUsers.map((user: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <div key={user.user.id} className={`flex items-center justify-between p-4 rounded-xl ${getRankStyle(user.position)}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getRankCircleStyle(user.position)}`}>
                    {getRankIcon(user.position)}
                  </div>
                  <div>
                    <span className="font-bold text-white">{user.user.name}</span>
                    <p className="text-xs text-yellow-400">#{user.position}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-yellow-400">{user.points.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No leaderboard data</p>
            <p className="text-sm text-gray-500">Complete challenges to climb the ranks!</p>
          </div>
        )}

        <div className="pt-4 border-t border-yellow-500/30">
          <div className="p-3 bg-black/20 backdrop-blur-md rounded-lg border border-yellow-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70">Your Progress</span>
              <span className="font-bold text-blue-400">
                {leaderboard?.currentUser?.points?.toLocaleString() || 0} pts
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-white/70">
              <Clock className="h-3 w-3" />
              <span>Updated recently</span>
            </div>
          </div>
        </div>

        <Button variant="outline" className="w-full bg-black/20 border-yellow-500/30 hover:bg-yellow-500/20 text-white hover:text-yellow-200 transition-all">
          View Full Leaderboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function StatsOverviewCard() {
  const [stats, setStats] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityStats();
  }, []);

  const fetchCommunityStats = async () => {
    try {
      const response = await fetch('/api/community/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching community stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardCardSkeleton />;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 card-hover bg-black/20 backdrop-blur-md border-indigo-500/20">
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
          <div className="text-center p-4 bg-black/20 backdrop-blur-md rounded-xl border border-purple-500/30">
            <div className="text-3xl font-bold text-purple-400 mb-1">
              {stats?.totalMembers?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-white/70">Total Members</div>
            <div className="w-full bg-black/50 rounded-full h-1 mt-2">
              <div 
                className="bg-purple-400 h-1 rounded-full transition-all duration-300" 
                style={{width: `${Math.min((stats?.activeMembers || 0) / Math.max(stats?.totalMembers || 1, 1) * 100, 100)}%`}}
              ></div>
            </div>
          </div>
          <div className="text-center p-4 bg-black/20 backdrop-blur-md rounded-xl border border-green-500/20">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {stats?.onlineMembers || 0}
            </div>
            <div className="text-xs text-white/70">Online Now</div>
            <div className="flex items-center justify-center mt-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          <div className="text-center p-4 bg-black/20 backdrop-blur-md rounded-xl border border-blue-500/30">
            <div className="text-3xl font-bold text-blue-400 mb-1">
              {stats?.activeChallenges || 0}
            </div>
            <div className="text-xs text-white/70">Active Challenges</div>
            <div className="text-xs text-blue-400 mt-1">
              {stats?.challengesCompleted || 0} completed
            </div>
          </div>
          <div className="text-center p-4 bg-black/20 backdrop-blur-md rounded-xl border border-yellow-500/30">
            <div className="text-3xl font-bold text-yellow-400 mb-1">
              {formatNumber(stats?.totalGamesTracked || 0)}
            </div>
            <div className="text-xs text-white/70">Games Tracked</div>
            <div className="text-xs text-yellow-400 mt-1">
              +{stats?.gamesToday || 0} today
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-indigo-500/20">
          <div className="flex items-center justify-between p-3 bg-black/20 backdrop-blur-md rounded-lg border border-indigo-500/20">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-white">Server Activity</span>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              {stats?.activeMembers > 100 ? 'High' : stats?.activeMembers > 50 ? 'Medium' : 'Low'}
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