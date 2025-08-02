'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AddSummonerDialog } from '@/components/profile/add-summoner-dialog';
import { RefreshStatusIndicator } from '@/components/ui/refresh-status';
import { 
  RefreshStatus,
  ChallengeProgress,
  LeaderboardData,
  LeaderboardUser,
  CommunityStats,
  RankedQueueInfo,
  isRankedQueueInfo,
  isLeaderboardUser,
  isCommunityStats,
  filterValidChallenges,
  safeCalculateWinRate,
  safeArrayAccess
} from '@/lib/types';
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
  Clock,
  RefreshCw
} from 'lucide-react';
import { getProfileIconUrl } from '@/lib/utils/data-dragon';
import { formatRelativeTime } from '@/lib/utils/time';

// ProfileIcon component for robust image loading with fallback
interface ProfileIconProps {
  profileIconId?: number;
}

function ProfileIcon({ profileIconId }: ProfileIconProps) {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch profile icon URL when profileIconId changes
  useEffect(() => {
    const loadImageUrl = async () => {
      if (!profileIconId || profileIconId === 0) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setImageError(false);
        const url = await getProfileIconUrl(profileIconId);
        setImageUrl(url);
      } catch (error) {
        console.error('Error loading profile icon URL:', error);
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadImageUrl();
  }, [profileIconId]);

  const handleImageError = () => {
    setImageError(true);
  };

  // If no profile icon ID, loading, or image failed to load, show fallback
  if (!profileIconId || profileIconId === 0 || isLoading || imageError || !imageUrl) {
    return (
      <div 
        className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl"
        role="img"
        aria-label={isLoading ? "Loading profile icon" : "Default profile icon"}
      >
        {isLoading ? (
          <div 
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
        ) : (
          <span aria-hidden="true">🐱</span>
        )}
      </div>
    );
  }

  // Try to load the profile icon with dynamic Data Dragon version
  return (
    <div 
      className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl overflow-hidden"
      role="img"
      aria-label="League of Legends profile icon"
    >
      <img 
        src={imageUrl}
        alt={`League of Legends profile icon ${profileIconId}`}
        className="w-full h-full object-cover rounded-full"
        onError={handleImageError}
      />
    </div>
  );
}

export function ChallengesCard() {
  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchActiveChallenges();
  }, []);

  const fetchActiveChallenges = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      }
      const response = await fetch('/api/challenges/active');
      if (response.ok) {
        const data = await response.json();
        const challengesData = Array.isArray(data.challenges) ? data.challenges : [];
        const validChallenges = filterValidChallenges(challengesData);
        setChallenges(validChallenges);
      }
    } catch (error) {
      console.error('Error fetching active challenges:', error);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  const handleRefresh = async () => {
    if (!isRefreshing) {
      await fetchActiveChallenges(true);
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'kda':
        return <Zap className="h-4 w-4 text-accessible-yellow" aria-hidden="true" />;
      case 'ranked':
        return <Crown className="h-4 w-4 text-accessible-orange" aria-hidden="true" />;
      case 'mastery':
        return <Star className="h-4 w-4 text-accessible-blue" aria-hidden="true" />;
      default:
        return <Target className="h-4 w-4 text-accessible-purple" aria-hidden="true" />;
    }
  };

  const getChallengeColor = (type: string) => {
    switch (type) {
      case 'kda':
        return 'accessible-yellow';
      case 'ranked':
        return 'accessible-orange';
      case 'mastery':
        return 'accessible-blue';
      default:
        return 'accessible-purple';
    }
  };

  const getChallengeTypeLabel = (type: string) => {
    switch (type) {
      case 'kda':
        return 'KDA Challenge';
      case 'ranked':
        return 'Ranked Challenge';
      case 'mastery':
        return 'Mastery Challenge';
      default:
        return 'Challenge';
    }
  };

  if (loading) {
    return <DashboardCardSkeleton />;
  }

  return (
    <Card 
      className="h-full hover:shadow-lg transition-all duration-300 card-hover bg-black/20 backdrop-blur-md border-purple-500/30 focus-card" 
      role="region"
      aria-labelledby="challenges-card-title"
      tabIndex={0}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-xl" aria-hidden="true">
              <Target className="h-6 w-6 text-accessible-purple" />
            </div>
            <div>
              <CardTitle id="challenges-card-title" className="text-xl font-bold">My Challenges</CardTitle>
              <CardDescription className="text-white/70">Active challenges and progress</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-purple-500/30 text-accessible-purple hover:bg-purple-500/10 p-2 focus-button"
              aria-label={isRefreshing ? "Refreshing challenges" : "Refresh challenges"}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span className="sr-only">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>
            <Badge 
              className="bg-purple-500/20 text-accessible-purple border-purple-500/30 px-3 py-1"
              aria-label={`${challenges.length} active challenges`}
            >
              {challenges.length} Active
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {challenges.length > 0 ? (
          <div className="space-y-4" role="list" aria-label="Active challenges">
            {challenges.slice(0, 3).map((challenge, index) => {
              const color = getChallengeColor(challenge.type);
              const typeLabel = getChallengeTypeLabel(challenge.type);
              return (
                <div 
                  key={challenge.id} 
                  className={`p-4 bg-black/20 backdrop-blur-md rounded-xl border border-${color}/30 focus-card`}
                  role="listitem"
                  tabIndex={0}
                  aria-labelledby={`challenge-title-${index}`}
                  aria-describedby={`challenge-progress-${index} challenge-status-${index}`}
                >
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 bg-${color}/20 rounded-lg`} aria-hidden="true">
                        {getChallengeIcon(challenge.type)}
                      </div>
                      <span 
                        id={`challenge-title-${index}`}
                        className="font-medium text-white"
                        aria-label={`${typeLabel}: ${challenge.title}`}
                      >
                        {challenge.title}
                      </span>
                    </div>
                    <span 
                      className={`text-${color} font-bold`}
                      id={`challenge-progress-${index}`}
                      aria-label={`Progress: ${challenge.progress} out of ${challenge.maxProgress}`}
                    >
                      {challenge.progress}/{challenge.maxProgress}
                    </span>
                  </div>
                  <Progress 
                    value={challenge.progressPercentage} 
                    className="h-3 bg-black/50"
                    aria-label={`${Math.round(challenge.progressPercentage)}% complete`}
                  />
                  <p 
                    className="text-xs text-white/70 mt-2"
                    id={`challenge-status-${index}`}
                    aria-live="polite"
                  >
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

interface SummonerData {
  summoner: {
    id: string;
    puuid: string;
    game_name: string;
    tag_line: string;
    region: string;
    level: number;
    profile_icon_id: number;
    ranked_info?: RankedQueueInfo[];
  } | null;
  stats: {
    totalGames: number;
    overallKDA: number;
    favoriteChampion: string;
    currentRank: string;
  } | null;
}

interface LeagueProfileCardProps {
  summonerData?: SummonerData | null;
  isLoading?: boolean;
  onAccountChange?: () => Promise<void>;
  refreshStatus?: RefreshStatus | null;
  isRefreshing?: boolean;
  onRefresh?: () => Promise<void>;
  onRefreshSpecific?: (operations: string[]) => Promise<void>;
}

export function LeagueProfileCard({ 
  summonerData, 
  isLoading = false, 
  onAccountChange,
  refreshStatus,
  isRefreshing = false,
  onRefresh
}: LeagueProfileCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);


  const handleAccountChange = async () => {
    if (onAccountChange) {
      setIsUpdating(true);
      try {
        await onAccountChange();
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // Adapt the data structure to match what the UI expects
  const summoner = summonerData?.summoner ? {
    ...summonerData.summoner,
    name: summonerData.summoner.game_name,
    tagLine: summonerData.summoner.tag_line,
    soloqRank: summonerData.summoner.ranked_info?.find((r) => 
      isRankedQueueInfo(r) && r.queue_type === 'RANKED_SOLO_5x5'
    ) || null,
    flexRank: summonerData.summoner.ranked_info?.find((r) => 
      isRankedQueueInfo(r) && r.queue_type === 'RANKED_FLEX_SR'
    ) || null,
    recentStats: {
      totalGames: summonerData.stats?.totalGames || 0,
      winRate: (() => {
        const firstRank = safeArrayAccess(summonerData.summoner.ranked_info, 0);
        if (!firstRank || !isRankedQueueInfo(firstRank)) return 0;
        return safeCalculateWinRate(firstRank.wins, firstRank.losses);
      })(),
      kda: summonerData.stats?.overallKDA || 0,
      recentLPGain: Math.floor(Math.random() * 30) - 10 // Mock LP gain for now
    }
  } : null;

  if (isLoading || isUpdating) {
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
              <CardDescription className="text-white/70">Account statistics and performance</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Refresh Status and Controls */}
            {refreshStatus && onRefresh && (
              <RefreshStatusIndicator 
                refreshStatus={refreshStatus}
                isRefreshing={isRefreshing}
                onRefresh={onRefresh}
                showLastRefresh={true}
                showManualRefresh={true}
                className=""
              />
            )}
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-3 py-1">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Verified
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-black/20 backdrop-blur-md rounded-xl border border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <ProfileIcon profileIconId={summoner.profile_icon_id} />
              <div>
                <p className="font-bold text-white text-lg">
                  {summoner.name}#{summoner.tagLine}
                </p>
                <p className="text-blue-400 font-medium">
                  {summoner.region.toUpperCase()}
                </p>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="text-xs">
                    <span className="text-white/60">Solo/Duo:</span>
                    <span className="ml-1 font-medium text-accessible-blue">
                      {summoner.soloqRank ? `${summoner.soloqRank.tier} ${summoner.soloqRank.rank_level}` : 'Unranked'}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-white/60">Flex:</span>
                    <span className="ml-1 font-medium text-accessible-green">
                      {summoner.flexRank ? `${summoner.flexRank.tier} ${summoner.flexRank.rank_level}` : 'Unranked'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              {summoner.soloqRank && (
                <>
                  <p className="text-lg font-bold text-yellow-400">{summoner.soloqRank.league_points} LP</p>
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
                      <p>Recent LP change (Solo/Duo)</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4" role="group" aria-label="Player statistics">
            <div 
              className="text-center p-3 bg-black/40 backdrop-blur-md rounded-lg border border-accessible-blue/30 focus-card"
              tabIndex={0}
              role="img"
              aria-label={`${summoner.recentStats.totalGames} total games played`}
            >
              <p className="text-2xl font-bold text-accessible-blue">{summoner.recentStats.totalGames}</p>
              <p className="text-xs text-white/70">Games</p>
            </div>
            <div 
              className="text-center p-3 bg-black/40 backdrop-blur-md rounded-lg border border-accessible-green/30 focus-card"
              tabIndex={0}
              role="img"
              aria-label={`${summoner.recentStats.winRate}% win rate`}
            >
              <p className="text-2xl font-bold text-accessible-green">{summoner.recentStats.winRate}%</p>
              <p className="text-xs text-white/70">Win Rate</p>
            </div>
            <div 
              className="text-center p-3 bg-black/40 backdrop-blur-md rounded-lg border border-accessible-purple/30 focus-card"
              tabIndex={0}
              role="img"
              aria-label={`${summoner.recentStats.kda} average KDA ratio`}
            >
              <p className="text-lg font-bold text-accessible-purple">{summoner.recentStats.kda} KDA</p>
              <p className="text-xs text-white/70">Average</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-blue-500/30">
          <div className="flex items-center justify-between">
            {/* Last Manual Refresh - Bottom Left */}
            <div className="text-xs text-white/50">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Manual: {refreshStatus?.last_manual_refresh_at ? formatRelativeTime(refreshStatus.last_manual_refresh_at) : 'Never'}</span>
              </div>
            </div>
            
            {/* Last Auto Refresh - Bottom Right */}
            <div className="text-xs text-white/50">
              <div className="flex items-center space-x-1">
                <RefreshCw className="h-3 w-3" />
                <span>Auto: {refreshStatus?.last_refreshed_at ? formatRelativeTime(refreshStatus.last_refreshed_at) : 'Never'}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeaderboardCard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchLeaderboardPreview();
  }, []);

  const fetchLeaderboardPreview = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      }
      const response = await fetch('/api/leaderboard/preview');
      if (response.ok) {
        const data = await response.json();
        // Type guard for leaderboard data structure
        if (data && 
            Array.isArray(data.topUsers) && 
            data.topUsers.every(isLeaderboardUser)) {
          setLeaderboard(data as LeaderboardData);
        } else {
          console.warn('Invalid leaderboard data structure:', data);
          setLeaderboard(null);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard preview:', error);
    } finally {
      setLoading(false);
      if (isRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  const handleRefresh = async () => {
    if (!isRefreshing) {
      await fetchLeaderboardPreview(true);
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
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 p-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-3 py-1 text-lg font-bold">
              #{leaderboard?.currentUser?.position || 'N/A'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {leaderboard?.topUsers && leaderboard.topUsers.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.topUsers.map((user: LeaderboardUser) => (
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
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityStats();
  }, []);

  const fetchCommunityStats = async () => {
    try {
      const response = await fetch('/api/community/stats');
      if (response.ok) {
        const data = await response.json();
        // Type guard for community stats structure
        if (isCommunityStats(data)) {
          setStats(data);
        } else {
          console.warn('Invalid community stats data structure:', data);
          setStats(null);
        }
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
              {(stats?.activeMembers ?? 0) > 100 ? 'High' : (stats?.activeMembers ?? 0) > 50 ? 'Medium' : 'Low'}
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