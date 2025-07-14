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
    const userId = session.user.id;

    // Get user's primary summoner
    const { data: primarySummoner } = await supabase
      .from('summoners')
      .select('*')
      .eq('user_id', userId)
      .eq('verified', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let winStreak = 0;
    let userRank = 'Unranked';
    let winRate = 0;

    if (primarySummoner) {
      // Get recent matches to calculate win streak
      const { data: recentMatches } = await supabase
        .from('match_history')
        .select('win')
        .eq('summoner_id', primarySummoner.id)
        .order('game_creation', { ascending: false })
        .limit(20);

      // Calculate current win streak
      if (recentMatches && recentMatches.length > 0) {
        for (const match of recentMatches) {
          if (match.win) {
            winStreak++;
          } else {
            break;
          }
        }

        // Calculate overall win rate
        const totalGames = recentMatches.length;
        const wins = recentMatches.filter(m => m.win).length;
        winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
      }

      // Get current rank
      const { data: rankInfo } = await supabase
        .from('ranked_info')
        .select('tier, rank_level')
        .eq('summoner_id', primarySummoner.id)
        .eq('queue_type', 'RANKED_SOLO_5x5')
        .single();

      if (rankInfo) {
        userRank = `${rankInfo.tier} ${rankInfo.rank_level}`;
      }
    }

    // Get user's active challenges count
    const { count: activeChallenges } = await supabase
      .from('user_challenges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('completed', false);

    // Get user's current leaderboard position
    const { data: userPoints } = await supabase
      .from('user_points')
      .select('rank_position')
      .eq('user_id', userId)
      .single();

    const currentRank = userPoints?.rank_position || null;

    return NextResponse.json({
      winStreak,
      userRank,
      winRate,
      activeChallenges: activeChallenges || 0,
      currentRank,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in user dashboard stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}