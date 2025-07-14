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
    const userId = session.user.id;

    // Get user's primary summoner with ranked info
    const { data: primarySummoner, error } = await supabase
      .from('summoners')
      .select(`
        *,
        ranked_info (
          tier,
          rank_level,
          league_points,
          wins,
          losses,
          queue_type
        )
      `)
      .eq('user_id', userId)
      .eq('verified', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching primary summoner:', error);
      return NextResponse.json({ error: 'Failed to fetch summoner' }, { status: 500 });
    }

    if (!primarySummoner) {
      return NextResponse.json({ 
        summoner: null,
        message: 'No verified summoner found' 
      });
    }

    // Get recent match statistics
    const { data: recentMatches } = await supabase
      .from('match_history')
      .select('kills, deaths, assists, win')
      .eq('summoner_id', primarySummoner.id)
      .order('game_creation', { ascending: false })
      .limit(20);

    // Calculate statistics
    const totalGames = recentMatches?.length || 0;
    const wins = recentMatches?.filter(m => m.win).length || 0;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    // Calculate KDA
    let kda = 0;
    if (recentMatches && recentMatches.length > 0) {
      const totalKills = recentMatches.reduce((sum, match) => sum + match.kills, 0);
      const totalDeaths = recentMatches.reduce((sum, match) => sum + match.deaths, 0);
      const totalAssists = recentMatches.reduce((sum, match) => sum + match.assists, 0);
      
      kda = totalDeaths > 0 ? 
        parseFloat(((totalKills + totalAssists) / totalDeaths).toFixed(2)) : 
        totalKills + totalAssists;
    }

    // Get current rank info
    const rankedInfo = Array.isArray(primarySummoner.ranked_info) 
      ? primarySummoner.ranked_info 
      : primarySummoner.ranked_info ? [primarySummoner.ranked_info] : [];
    
    const soloQueueRank = rankedInfo.find((rank: any) => rank.queue_type === 'RANKED_SOLO_5x5');
    
    // Calculate recent LP gain (mock for now, would need match history with LP changes)
    const recentLPGain = soloQueueRank ? Math.floor(Math.random() * 30) - 10 : 0;

    return NextResponse.json({
      summoner: {
        id: primarySummoner.id,
        name: primarySummoner.name,
        tagLine: primarySummoner.tag_line,
        region: primarySummoner.region,
        level: primarySummoner.level,
        profileIconId: primarySummoner.profile_icon_id,
        verified: primarySummoner.verified,
        rank: soloQueueRank ? {
          tier: soloQueueRank.tier,
          rank: soloQueueRank.rank_level,
          leaguePoints: soloQueueRank.league_points,
          wins: soloQueueRank.wins,
          losses: soloQueueRank.losses,
          winRate: soloQueueRank.wins + soloQueueRank.losses > 0 ? 
            Math.round((soloQueueRank.wins / (soloQueueRank.wins + soloQueueRank.losses)) * 100) : 0
        } : null,
        recentStats: {
          totalGames,
          winRate,
          kda,
          recentLPGain
        }
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in summoner primary API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}