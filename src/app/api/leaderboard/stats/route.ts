import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Get community stats
    const [
      { count: totalMembers },
      { count: activeThisWeek },
      { count: challengesCompleted },
      { data: topContributors },
      { data: recentAchievements },
      { data: rankDistribution }
    ] = await Promise.all([
      // Total members
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_yuumi_member', true),
      
      // Active this week
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_yuumi_member', true)
        .gte('last_activity', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Completed challenges
      supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true),
      
      // Top contributors
      supabase
        .from('user_points')
        .select(`
          user_id,
          total_points,
          rank_position,
          users (
            id,
            name,
            image,
            user_role,
            is_yuumi_member
          )
        `)
        .eq('users.is_yuumi_member', true)
        .order('total_points', { ascending: false })
        .limit(5),
      
      // Recent achievements
      supabase
        .from('user_challenges')
        .select(`
          id,
          user_id,
          completed_at,
          challenges (
            id,
            title,
            reward_points
          ),
          users (
            id,
            name,
            image
          )
        `)
        .eq('completed', true)
        .eq('users.is_yuumi_member', true)
        .order('completed_at', { ascending: false })
        .limit(10),
      
      // Rank distribution
      supabase
        .from('ranked_info')
        .select(`
          tier,
          rank_level,
          league_points,
          summoners (
            user_id,
            verified,
            users (
              is_yuumi_member
            )
          )
        `)
        .eq('queue_type', 'RANKED_SOLO_5x5')
        .eq('summoners.verified', true)
        .eq('summoners.users.is_yuumi_member', true)
    ]);

    // Calculate average rank
    const averageRank = calculateAverageRank(rankDistribution || []);

    // Get challenge completion counts for top contributors
    const topContributorIds = topContributors?.map(c => c.user_id) || [];
    const { data: challengeCompletions } = await supabase
      .from('user_challenges')
      .select('user_id, completed')
      .in('user_id', topContributorIds)
      .eq('completed', true);

    const completionCounts = (challengeCompletions || []).reduce((acc, completion) => {
      acc[completion.user_id] = (acc[completion.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Format response
    const formattedTopContributors = (topContributors || []).map(contributor => {
      const user = Array.isArray(contributor.users) ? contributor.users[0] : contributor.users;
      return {
        position: contributor.rank_position,
        user: {
          id: user?.id || contributor.user_id,
          name: user?.name || 'Unknown',
          image: user?.image || '',
          role: user?.user_role || 'member',
        },
        points: contributor.total_points,
        completedChallenges: completionCounts[contributor.user_id] || 0,
        lastActivity: 'Recently',
        change: 0,
      };
    });

    const formattedRecentAchievements = (recentAchievements || []).map(achievement => {
      const user = Array.isArray(achievement.users) ? achievement.users[0] : achievement.users;
      const challenge = Array.isArray(achievement.challenges) ? achievement.challenges[0] : achievement.challenges;
      return {
        id: achievement.id,
        user: {
          id: user?.id || achievement.user_id,
          name: user?.name || 'Unknown',
          image: user?.image || '',
        },
        challenge: {
          id: challenge?.id,
          title: challenge?.title,
          points: challenge?.reward_points,
        },
        completedAt: achievement.completed_at,
      };
    });

    return NextResponse.json({
      communityStats: {
        totalMembers: totalMembers || 0,
        activeThisWeek: activeThisWeek || 0,
        challengesCompleted: challengesCompleted || 0,
        averageRank: averageRank || 'Unranked',
      },
      topContributors: formattedTopContributors,
      recentAchievements: formattedRecentAchievements,
      rankDistribution: calculateRankDistribution(rankDistribution || []),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in leaderboard stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateAverageRank(rankData: any[]): string {
  if (!rankData || rankData.length === 0) return 'Unranked';

  const rankValues = {
    'IRON': 0,
    'BRONZE': 1,
    'SILVER': 2,
    'GOLD': 3,
    'PLATINUM': 4,
    'DIAMOND': 5,
    'MASTER': 6,
    'GRANDMASTER': 7,
    'CHALLENGER': 8
  };

  const rankLevels = {
    'IV': 0,
    'III': 1,
    'II': 2,
    'I': 3
  };

  let totalRankValue = 0;
  let count = 0;

  for (const rank of rankData) {
    const tierValue = rankValues[rank.tier as keyof typeof rankValues];
    const levelValue = rankLevels[rank.rank_level as keyof typeof rankLevels];
    
    if (tierValue !== undefined && levelValue !== undefined) {
      totalRankValue += tierValue * 4 + levelValue;
      count++;
    }
  }

  if (count === 0) return 'Unranked';

  const avgRankValue = Math.round(totalRankValue / count);
  const avgTier = Math.floor(avgRankValue / 4);
  const avgLevel = avgRankValue % 4;

  const tierNames = Object.keys(rankValues);
  const levelNames = Object.keys(rankLevels);

  return `${tierNames[avgTier]} ${levelNames[avgLevel]}`;
}

function calculateRankDistribution(rankData: any[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  for (const rank of rankData) {
    const tier = rank.tier;
    distribution[tier] = (distribution[tier] || 0) + 1;
  }
  
  return distribution;
}