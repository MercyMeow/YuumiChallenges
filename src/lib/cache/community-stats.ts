import { createServerSupabaseClient } from '@/lib/supabase';

export interface CommunityStats {
  totalMembers: number;
  activeMembers: number;
  onlineMembers: number;
  activeChallenges: number;
  totalGamesTracked: number;
  gamesToday: number;
  challengesCompleted: number;
  mostCommonRank: string;
  rankDistribution: Record<string, number>;
  lastUpdated: string;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
let statsCache: { data: CommunityStats | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};

export async function getCachedCommunityStats(): Promise<CommunityStats> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (statsCache.data && now - statsCache.timestamp < CACHE_DURATION) {
    return statsCache.data;
  }
  
  // Fetch fresh data
  const stats = await fetchCommunityStats();
  
  // Update cache
  statsCache = {
    data: stats,
    timestamp: now,
  };
  
  return stats;
}

async function fetchCommunityStats(): Promise<CommunityStats> {
  const supabase = createServerSupabaseClient();
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Parallel queries for better performance
  const [
    { count: totalMembers },
    { count: activeMembers },
    { count: onlineMembers },
    { count: activeChallenges },
    { count: totalGamesTracked },
    { count: gamesToday },
    { count: challengesCompleted },
    { data: rankData }
  ] = await Promise.all([
    // Total members
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_yuumi_member', true),
    
    // Active members (last 7 days)
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_yuumi_member', true)
      .gte('last_activity', sevenDaysAgo.toISOString()),
    
    // Online members (last hour)
    supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_yuumi_member', true)
      .gte('last_activity', oneHourAgo.toISOString()),
    
    // Active challenges
    supabase
      .from('challenges')
      .select('*', { count: 'exact', head: true })
      .eq('active', true),
    
    // Total games tracked
    supabase
      .from('match_history')
      .select('*', { count: 'exact', head: true }),
    
    // Games today
    supabase
      .from('match_history')
      .select('*', { count: 'exact', head: true })
      .gte('game_creation', todayStart.toISOString()),
    
    // Challenges completed
    supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true),
    
    // Rank distribution - get verified summoners first
    (async () => {
      const { data: verifiedSummoners } = await supabase
        .from('summoners')
        .select('id')
        .eq('verified', true);
      
      const summonerIds = verifiedSummoners?.map(s => s.id) || [];
      
      return supabase
        .from('ranked_info')
        .select('tier')
        .eq('queue_type', 'RANKED_SOLO_5x5')
        .in('summoner_id', summonerIds);
    })(),
  ]);
  
  // Process rank distribution
  const rankDistribution: Record<string, number> = {};
  let mostCommonRank = 'Unranked';
  let maxCount = 0;
  
  if (rankData) {
    rankData.forEach((item) => {
      const tier = item.tier || 'Unranked';
      rankDistribution[tier] = (rankDistribution[tier] || 0) + 1;
      
      if (rankDistribution[tier] > maxCount) {
        maxCount = rankDistribution[tier];
        mostCommonRank = tier;
      }
    });
  }
  
  // Ensure all ranks are represented
  const allRanks = ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER', 'Unranked'];
  allRanks.forEach(rank => {
    if (!rankDistribution[rank]) {
      rankDistribution[rank] = 0;
    }
  });
  
  return {
    totalMembers: totalMembers || 0,
    activeMembers: activeMembers || 0,
    onlineMembers: onlineMembers || 0,
    activeChallenges: activeChallenges || 0,
    totalGamesTracked: totalGamesTracked || 0,
    gamesToday: gamesToday || 0,
    challengesCompleted: challengesCompleted || 0,
    mostCommonRank,
    rankDistribution,
    lastUpdated: new Date().toISOString(),
  };
}

export function invalidateCommunityStatsCache(): void {
  statsCache = {
    data: null,
    timestamp: 0,
  };
}