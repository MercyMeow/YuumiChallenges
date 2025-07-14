import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Get community statistics
    const [
      { count: totalMembers },
      { count: activeMembers },
      { count: activeChallenges },
      { count: totalGamesTracked }
    ] = await Promise.all([
      // Total Yuumi members
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_yuumi_member', true),
      
      // Active members (users who have logged in within the last 7 days)
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_yuumi_member', true)
        .gte('last_activity', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Active challenges
      supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .eq('active', true),
      
      // Total games tracked
      supabase
        .from('match_history')
        .select('*', { count: 'exact', head: true })
    ]);

    // Get currently online members (simplified - users active in last hour)
    const { count: onlineMembers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_yuumi_member', true)
      .gte('last_activity', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    // Get recent activity summary
    const { data: recentMatches } = await supabase
      .from('match_history')
      .select('game_creation')
      .gte('game_creation', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('game_creation', { ascending: false });

    const gamesToday = recentMatches?.length || 0;

    // Get challenge completion statistics
    const { count: challengesCompleted } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('completed', true);

    // Get rank distribution
    const { data: rankDistribution } = await supabase
      .from('ranked_info')
      .select(`
        tier,
        summoners (
          user_id,
          users (
            is_yuumi_member
          )
        )
      `)
      .eq('queue_type', 'RANKED_SOLO_5x5')
      .eq('summoners.users.is_yuumi_member', true);

    // Calculate rank statistics
    const rankCounts = (rankDistribution || []).reduce((acc, rank) => {
      acc[rank.tier] = (acc[rank.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonRank = Object.entries(rankCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'UNRANKED';

    return NextResponse.json({
      totalMembers: totalMembers || 0,
      activeMembers: activeMembers || 0,
      onlineMembers: onlineMembers || 0,
      activeChallenges: activeChallenges || 0,
      totalGamesTracked: totalGamesTracked || 0,
      gamesToday,
      challengesCompleted: challengesCompleted || 0,
      mostCommonRank,
      rankDistribution: rankCounts,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in community stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}