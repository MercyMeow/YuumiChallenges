'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  safeArrayAccess,
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
  RefreshCw,
  Clock,
} from 'lucide-react';
import { getProfileIconUrl } from '@/lib/utils/data-dragon';
import { formatRelativeTime } from '@/lib/utils/time';

// Utility function to get rank emblem URLs from Community Dragon CDN
const getRankEmblemUrl = (tier: string, division: string) => {
  const normalizedTier = tier.toUpperCase();
  const baseUrl = 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblems';
  
  // Map tier names to emblem file names
  const tierMap: Record<string, string> = {
    'IRON': 'iron',
    'BRONZE': 'bronze',
    'SILVER': 'silver', 
    'GOLD': 'gold',
    'PLATINUM': 'platinum',
    'EMERALD': 'emerald',
    'DIAMOND': 'diamond',
    'MASTER': 'master',
    'GRANDMASTER': 'grandmaster',
    'CHALLENGER': 'challenger'
  };
  
  const tierName = tierMap[normalizedTier];
  if (!tierName) {
    return null; // Return null for unranked/unknown tiers
  }
  
  // For Master+ tiers, no division is needed
  if (['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(normalizedTier)) {
    return `${baseUrl}/${tierName}.png`;
  }
  
  // For other tiers, include division (I, II, III, IV)
  const divisionMap: Record<string, string> = {
    'I': '1',
    'II': '2', 
    'III': '3',
    'IV': '4'
  };
  
  const divisionNumber = divisionMap[division] || '1';
  return `${baseUrl}/${tierName}_${divisionNumber}.png`;
};

// Tier-specific color schemes for rank badges
const getTierColorScheme = (tier: string) => {
  const normalizedTier = tier.toUpperCase();
  
  switch (normalizedTier) {
    case 'IRON':
      return {
        bg: 'bg-gradient-to-r from-gray-600/20 to-gray-700/20',
        border: 'border-gray-600/40',
        text: 'text-gray-300'
      };
    case 'BRONZE':
      return {
        bg: 'bg-gradient-to-r from-amber-700/20 to-amber-800/20',
        border: 'border-amber-600/40',
        text: 'text-amber-300'
      };
    case 'SILVER':
      return {
        bg: 'bg-gradient-to-r from-slate-400/20 to-slate-500/20',
        border: 'border-slate-400/40',
        text: 'text-slate-200'
      };
    case 'GOLD':
      return {
        bg: 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20',
        border: 'border-yellow-500/40',
        text: 'text-yellow-300'
      };
    case 'PLATINUM':
      return {
        bg: 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/20',
        border: 'border-cyan-500/40',
        text: 'text-cyan-300'
      };
    case 'EMERALD':
      return {
        bg: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/20',
        border: 'border-emerald-500/40',
        text: 'text-emerald-300'
      };
    case 'DIAMOND':
      return {
        bg: 'bg-gradient-to-r from-blue-400/20 to-blue-500/20',
        border: 'border-blue-400/40',
        text: 'text-blue-300'
      };
    case 'MASTER':
      return {
        bg: 'bg-gradient-to-r from-purple-500/20 to-purple-600/20',
        border: 'border-purple-500/40',
        text: 'text-purple-300'
      };
    case 'GRANDMASTER':
      return {
        bg: 'bg-gradient-to-r from-red-500/20 to-red-600/20',
        border: 'border-red-500/40',
        text: 'text-red-300'
      };
    case 'CHALLENGER':
      return {
        bg: 'bg-gradient-to-r from-orange-400/20 to-orange-500/20',
        border: 'border-orange-400/40',
        text: 'text-orange-300'
      };
    default:
      return {
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/30',
        text: 'text-gray-400'
      };
  }
};

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
  if (
    !profileIconId ||
    profileIconId === 0 ||
    isLoading ||
    imageError ||
    !imageUrl
  ) {
    return (
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xl"
        role="img"
        aria-label={isLoading ? 'Loading profile icon' : 'Default profile icon'}
      >
        {isLoading ? (
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
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
      className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xl"
      role="img"
      aria-label="League of Legends profile icon"
    >
      <img
        src={imageUrl}
        alt={`League of Legends profile icon ${profileIconId}`}
        className="h-full w-full rounded-full object-cover"
        onError={handleImageError}
      />
    </div>
  );
}

export function ChallengesCard() {
  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveChallenges();
  }, []);

  const fetchActiveChallenges = async () => {
    try {
      const response = await fetch('/api/challenges/active');
      if (response.ok) {
        const data = await response.json();
        const challengesData = Array.isArray(data.challenges)
          ? data.challenges
          : [];
        const validChallenges = filterValidChallenges(challengesData);
        setChallenges(validChallenges);
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
        return (
          <Zap className="text-accessible-yellow h-4 w-4" aria-hidden="true" />
        );
      case 'ranked':
        return (
          <Crown
            className="text-accessible-orange h-4 w-4"
            aria-hidden="true"
          />
        );
      case 'mastery':
        return (
          <Star className="text-accessible-blue h-4 w-4" aria-hidden="true" />
        );
      default:
        return (
          <Target
            className="text-accessible-purple h-4 w-4"
            aria-hidden="true"
          />
        );
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
      className="card-hover focus-card h-full border-purple-500/30 bg-black/20 backdrop-blur-md transition-all duration-300 hover:shadow-lg"
      role="region"
      aria-labelledby="challenges-card-title"
      tabIndex={0}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-purple-500/20 p-3" aria-hidden="true">
              <Target className="text-accessible-purple h-6 w-6" />
            </div>
            <div>
              <CardTitle
                id="challenges-card-title"
                className="text-xl font-bold"
              >
                My Challenges
              </CardTitle>
              <CardDescription className="text-white/70">
                Active challenges and progress
              </CardDescription>
            </div>
          </div>
          <Badge
            className="text-accessible-purple border-purple-500/30 bg-purple-500/20 px-3 py-1"
            aria-label={`${challenges.length} active challenges`}
          >
            {challenges.length} Active
          </Badge>
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
                  className={`rounded-xl border bg-black/20 p-4 backdrop-blur-md border-${color}/30 focus-card`}
                  role="listitem"
                  tabIndex={0}
                  aria-labelledby={`challenge-title-${index}`}
                  aria-describedby={`challenge-progress-${index} challenge-status-${index}`}
                >
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`p-1.5 bg-${color}/20 rounded-lg`}
                        aria-hidden="true"
                      >
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
                    className="mt-2 text-xs text-white/70"
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
          <div className="py-8 text-center">
            <Target className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-4 text-gray-400">No active challenges yet</p>
            <p className="text-sm text-gray-500">
              Join a challenge to start earning points!
            </p>
          </div>
        )}

        <div className="border-t border-purple-500/30 pt-4">
          <Button
            variant="outline"
            className="w-full border-purple-500/30 bg-black/20 text-white transition-all hover:bg-purple-500/20 hover:text-purple-200"
          >
            <Plus className="mr-2 h-4 w-4" />
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
  onRefresh,
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
  const summoner = summonerData?.summoner
    ? {
        ...summonerData.summoner,
        name: summonerData.summoner.game_name,
        tagLine: summonerData.summoner.tag_line,
        soloqRank:
          summonerData.summoner.ranked_info?.find(
            (r) => isRankedQueueInfo(r) && r.queue_type === 'RANKED_SOLO_5x5'
          ) || null,
        flexRank:
          summonerData.summoner.ranked_info?.find(
            (r) => isRankedQueueInfo(r) && r.queue_type === 'RANKED_FLEX_SR'
          ) || null,
        recentStats: {
          totalGames: summonerData.stats?.totalGames || 0,
          winRate: (() => {
            const firstRank = safeArrayAccess(
              summonerData.summoner.ranked_info,
              0
            );
            if (!firstRank || !isRankedQueueInfo(firstRank)) return 0;
            return safeCalculateWinRate(firstRank.wins, firstRank.losses);
          })(),
          kda: summonerData.stats?.overallKDA || 0,
          recentLPGain: Math.floor(Math.random() * 30) - 10, // Mock LP gain for now
        },
      }
    : null;

  if (isLoading || isUpdating) {
    return <DashboardCardSkeleton />;
  }

  if (!summoner) {
    return (
      <Card className="card-hover h-full border-blue-500/30 bg-black/20 backdrop-blur-md transition-all duration-300 hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-blue-500/20 p-3">
                <BarChart3 className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">
                  League Profile
                </CardTitle>
                <CardDescription className="text-white/70">
                  Your linked League account
                </CardDescription>
              </div>
            </div>
            <Badge className="border-gray-500/30 bg-gray-500/20 px-3 py-1 text-gray-400">
              No Account
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="py-8 text-center">
            <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-4 text-gray-400">No League account linked</p>
            <p className="text-sm text-gray-500">
              Connect your League account to track your progress
            </p>
          </div>

          <div className="border-t border-blue-500/30 pt-4">
            <AddSummonerDialog onAdd={handleAccountChange} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-hover h-full border-blue-500/30 bg-black/20 backdrop-blur-md transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-blue-500/20 p-3">
              <BarChart3 className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                League Profile
              </CardTitle>
              <CardDescription className="text-white/70">
                Account statistics and performance
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Refresh Status and Controls */}
            {refreshStatus && onRefresh && (
              <RefreshStatusIndicator
                refreshStatus={refreshStatus}
                isRefreshing={isRefreshing}
                onRefresh={onRefresh}
                showLastRefresh={false}
                showManualRefresh={true}
                className=""
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-xl border border-blue-500/30 bg-black/20 p-4 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ProfileIcon profileIconId={summoner.profile_icon_id} />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-lg font-bold text-white">
                    {summoner.name}#{summoner.tagLine}
                  </p>
                  <Badge 
                    variant="outline" 
                    className="border-blue-500/30 bg-blue-500/10 text-blue-300 px-2 py-1 text-xs font-medium"
                  >
                    {summoner.region.toUpperCase()}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-col space-y-2">
                  {/* Solo/Duo Rank Badge */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-white/60 min-w-[50px]">Solo/Duo:</span>
                    {summoner.soloqRank ? (
                      <Badge className={`${getTierColorScheme(summoner.soloqRank.tier).bg} ${getTierColorScheme(summoner.soloqRank.tier).border} ${getTierColorScheme(summoner.soloqRank.tier).text} px-3 py-1 font-bold shadow-lg backdrop-blur-sm`}>
                        <Crown className="mr-1 h-3 w-3" />
                        {summoner.soloqRank.tier} {summoner.soloqRank.rank_level}
                      </Badge>
                    ) : (
                      <Badge className="border-gray-500/30 bg-gray-500/10 text-gray-400 px-3 py-1 font-medium">
                        Unranked
                      </Badge>
                    )}
                  </div>
                  {/* Flex Rank Badge */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-white/60 min-w-[50px]">Flex:</span>
                    {summoner.flexRank ? (
                      <Badge className={`${getTierColorScheme(summoner.flexRank.tier).bg} ${getTierColorScheme(summoner.flexRank.tier).border} ${getTierColorScheme(summoner.flexRank.tier).text} px-3 py-1 font-bold shadow-lg backdrop-blur-sm`}>
                        <Crown className="mr-1 h-3 w-3" />
                        {summoner.flexRank.tier} {summoner.flexRank.rank_level}
                      </Badge>
                    ) : (
                      <Badge className="border-gray-500/30 bg-gray-500/10 text-gray-400 px-3 py-1 font-medium">
                        Unranked
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              {summoner.soloqRank && (
                <>
                  <p className="text-lg font-bold text-yellow-400">
                    {summoner.soloqRank.league_points} LP
                  </p>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center space-x-1 text-green-400">
                        <TrendingUp className="h-4 w-4" />
                        <span className="font-medium">
                          {summoner.recentStats.recentLPGain > 0 ? '+' : ''}
                          {summoner.recentStats.recentLPGain} LP
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

          {/* Ranked Stats Display */}
          <div className="grid grid-cols-2 gap-4" role="group" aria-label="Ranked statistics">
            {/* SoloQ Rank */}
            <div className="rounded-lg border border-blue-500/30 bg-black/40 p-4 backdrop-blur-md">
              <div className="mb-2 text-center">
                <h4 className="text-sm font-medium text-white/80 mb-3">Solo/Duo Queue</h4>
                {summoner.soloqRank ? (
                  <>
                    <div className="flex justify-center mb-3">
                      <img
                        src={getRankEmblemUrl(summoner.soloqRank.tier, summoner.soloqRank.rank_level) || ''}
                        alt={`${summoner.soloqRank.tier} ${summoner.soloqRank.rank_level} emblem`}
                        className="h-16 w-16 object-contain"
                        onError={(e) => {
                          // Fallback to a crown icon if emblem fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="flex h-16 w-16 items-center justify-center rounded-full ${getTierColorScheme(summoner.soloqRank?.tier || '').bg} ${getTierColorScheme(summoner.soloqRank?.tier || '').border} border-2"><svg class="h-8 w-8 ${getTierColorScheme(summoner.soloqRank?.tier || '').text}" fill="currentColor" viewBox="0 0 24 24"><path d="M12 6L9 9L12 12L15 9L12 6Z"/><path d="M12 2L8 6H16L12 2Z"/><path d="M8 18L12 22L16 18H8Z"/></svg></div>`;
                          }
                        }}
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <p className={`text-lg font-bold ${getTierColorScheme(summoner.soloqRank.tier).text}`}>
                        {summoner.soloqRank.tier} {summoner.soloqRank.rank_level}
                      </p>
                      <p className="text-xl font-bold text-yellow-400">
                        {summoner.soloqRank.league_points} LP
                      </p>
                      <p className="text-sm text-white/70">
                        {summoner.soloqRank.wins}W / {summoner.soloqRank.losses}L
                      </p>
                      <p className="text-sm font-medium text-green-400">
                        {safeCalculateWinRate(summoner.soloqRank.wins, summoner.soloqRank.losses)}% WR
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-500/20 border-2 border-gray-500/30">
                        <Crown className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-400">Unranked</p>
                      <p className="text-sm text-white/50 mt-2">Play ranked games to get a rank</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Flex Rank */}
            <div className="rounded-lg border border-purple-500/30 bg-black/40 p-4 backdrop-blur-md">
              <div className="mb-2 text-center">
                <h4 className="text-sm font-medium text-white/80 mb-3">Flex Queue</h4>
                {summoner.flexRank ? (
                  <>
                    <div className="flex justify-center mb-3">
                      <img
                        src={getRankEmblemUrl(summoner.flexRank.tier, summoner.flexRank.rank_level) || ''}
                        alt={`${summoner.flexRank.tier} ${summoner.flexRank.rank_level} emblem`}
                        className="h-16 w-16 object-contain"
                        onError={(e) => {
                          // Fallback to a crown icon if emblem fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="flex h-16 w-16 items-center justify-center rounded-full ${getTierColorScheme(summoner.flexRank?.tier || '').bg} ${getTierColorScheme(summoner.flexRank?.tier || '').border} border-2"><svg class="h-8 w-8 ${getTierColorScheme(summoner.flexRank?.tier || '').text}" fill="currentColor" viewBox="0 0 24 24"><path d="M12 6L9 9L12 12L15 9L12 6Z"/><path d="M12 2L8 6H16L12 2Z"/><path d="M8 18L12 22L16 18H8Z"/></svg></div>`;
                          }
                        }}
                      />
                    </div>
                    <div className="text-center space-y-1">
                      <p className={`text-lg font-bold ${getTierColorScheme(summoner.flexRank.tier).text}`}>
                        {summoner.flexRank.tier} {summoner.flexRank.rank_level}
                      </p>
                      <p className="text-xl font-bold text-yellow-400">
                        {summoner.flexRank.league_points} LP
                      </p>
                      <p className="text-sm text-white/70">
                        {summoner.flexRank.wins}W / {summoner.flexRank.losses}L
                      </p>
                      <p className="text-sm font-medium text-green-400">
                        {safeCalculateWinRate(summoner.flexRank.wins, summoner.flexRank.losses)}% WR
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-center mb-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-500/20 border-2 border-gray-500/30">
                        <Crown className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-400">Unranked</p>
                      <p className="text-sm text-white/50 mt-2">Play ranked games to get a rank</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Refresh Timers */}
        {refreshStatus && (
          <div className="border-t border-blue-500/30 pt-4">
            <div className="flex justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <div>
                  <p className="text-xs text-white/60">Manual Refresh</p>
                  <p className="font-medium">
                    {refreshStatus.last_manual_refresh_at
                      ? formatRelativeTime(refreshStatus.last_manual_refresh_at)
                      : 'Never'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <div>
                  <p className="text-xs text-white/60">Auto Refresh</p>
                  <p className="font-medium">
                    {refreshStatus.last_refreshed_at
                      ? formatRelativeTime(refreshStatus.last_refreshed_at)
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
        if (
          data &&
          Array.isArray(data.topUsers) &&
          data.topUsers.every(isLeaderboardUser)
        ) {
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
    <Card className="card-hover h-full border-yellow-500/30 bg-black/20 backdrop-blur-md transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-yellow-500/20 p-3">
              <Trophy className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Leaderboard</CardTitle>
              <CardDescription className="text-white/70">
                Your ranking this month
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-yellow-500/30 p-2 text-yellow-400 hover:bg-yellow-500/10"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </Button>
            <Badge className="border-yellow-500/30 bg-yellow-500/20 px-3 py-1 text-lg font-bold text-yellow-400">
              #{leaderboard?.currentUser?.position || 'N/A'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {leaderboard?.topUsers && leaderboard.topUsers.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.topUsers.map((user: LeaderboardUser) => (
              <div
                key={user.user.id}
                className={`flex items-center justify-between rounded-xl p-4 ${getRankStyle(user.position)}`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${getRankCircleStyle(user.position)}`}
                  >
                    {getRankIcon(user.position)}
                  </div>
                  <div>
                    <span className="font-bold text-white">
                      {user.user.name}
                    </span>
                    <p className="text-xs text-yellow-400">#{user.position}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-yellow-400">
                  {user.points.toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-2 text-gray-400">No leaderboard data</p>
            <p className="text-sm text-gray-500">
              Complete challenges to climb the ranks!
            </p>
          </div>
        )}

        <div className="border-t border-yellow-500/30 pt-4">
          <div className="rounded-lg border border-yellow-500/30 bg-black/20 p-3 backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between">
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

        <Button
          variant="outline"
          className="w-full border-yellow-500/30 bg-black/20 text-white transition-all hover:bg-yellow-500/20 hover:text-yellow-200"
        >
          View Full Leaderboard
          <ArrowRight className="ml-2 h-4 w-4" />
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
    <Card className="card-hover h-full border-indigo-500/20 bg-black/20 backdrop-blur-md transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="rounded-xl bg-indigo-500/20 p-3">
            <Users className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Community Stats</CardTitle>
            <CardDescription className="text-white/70">
              Yuumi Mains activity overview
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-purple-500/30 bg-black/20 p-4 text-center backdrop-blur-md">
            <div className="mb-1 text-3xl font-bold text-purple-400">
              {stats?.totalMembers?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-white/70">Total Members</div>
            <div className="mt-2 h-1 w-full rounded-full bg-black/50">
              <div
                className="h-1 rounded-full bg-purple-400 transition-all duration-300"
                style={{
                  width: `${Math.min(((stats?.activeMembers || 0) / Math.max(stats?.totalMembers || 1, 1)) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-black/20 p-4 text-center backdrop-blur-md">
            <div className="mb-1 text-3xl font-bold text-green-400">
              {stats?.onlineMembers || 0}
            </div>
            <div className="text-xs text-white/70">Online Now</div>
            <div className="mt-2 flex items-center justify-center">
              <div className="mr-1 h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
              <span className="text-xs text-green-400">Live</span>
            </div>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-black/20 p-4 text-center backdrop-blur-md">
            <div className="mb-1 text-3xl font-bold text-blue-400">
              {stats?.activeChallenges || 0}
            </div>
            <div className="text-xs text-white/70">Active Challenges</div>
            <div className="mt-1 text-xs text-blue-400">
              {stats?.challengesCompleted || 0} completed
            </div>
          </div>
          <div className="rounded-xl border border-yellow-500/30 bg-black/20 p-4 text-center backdrop-blur-md">
            <div className="mb-1 text-3xl font-bold text-yellow-400">
              {formatNumber(stats?.totalGamesTracked || 0)}
            </div>
            <div className="text-xs text-white/70">Games Tracked</div>
            <div className="mt-1 text-xs text-yellow-400">
              +{stats?.gamesToday || 0} today
            </div>
          </div>
        </div>

        <div className="border-t border-indigo-500/20 pt-4">
          <div className="flex items-center justify-between rounded-lg border border-indigo-500/20 bg-black/20 p-3 backdrop-blur-md">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 animate-pulse rounded-full bg-green-400"></div>
              <span className="text-sm font-medium text-white">
                Server Activity
              </span>
            </div>
            <Badge className="border-green-500/30 bg-green-500/20 text-green-400">
              {(stats?.activeMembers ?? 0) > 100
                ? 'High'
                : (stats?.activeMembers ?? 0) > 50
                  ? 'Medium'
                  : 'Low'}
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
