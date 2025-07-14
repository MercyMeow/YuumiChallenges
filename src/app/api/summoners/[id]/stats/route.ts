import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const summonerId = id;
    const supabase = createServerSupabaseClient();

    // Verify the summoner belongs to the user
    const { data: summoner, error: summonerError } = await supabase
      .from('summoners')
      .select('id, user_id')
      .eq('id', summonerId)
      .eq('user_id', session.user.id)
      .single();

    if (summonerError || !summoner) {
      return NextResponse.json({ error: 'Summoner not found' }, { status: 404 });
    }

    // Get champion statistics
    const { data: matches, error: matchesError } = await supabase
      .from('match_history')
      .select('champion, kills, deaths, assists, win, game_creation')
      .eq('summoner_id', summonerId)
      .order('game_creation', { ascending: false });

    if (matchesError) {
      console.error('Error fetching match data:', matchesError);
      return NextResponse.json({ error: 'Failed to fetch match data' }, { status: 500 });
    }

    // Calculate champion statistics
    const championStats = (matches || []).reduce((acc, match) => {
      const champion = match.champion;
      if (!acc[champion]) {
        acc[champion] = {
          champion_name: champion,
          games_played: 0,
          wins: 0,
          total_kills: 0,
          total_deaths: 0,
          total_assists: 0,
        };
      }

      acc[champion].games_played++;
      if (match.win) acc[champion].wins++;
      acc[champion].total_kills += match.kills;
      acc[champion].total_deaths += match.deaths;
      acc[champion].total_assists += match.assists;

      return acc;
    }, {} as Record<string, any>); // eslint-disable-line @typescript-eslint/no-explicit-any

    // Convert to array and calculate derived stats
    const championStatsArray = Object.values(championStats).map((stats: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      ...stats,
      win_rate: (stats.wins / stats.games_played * 100).toFixed(1),
      avg_kills: (stats.total_kills / stats.games_played).toFixed(1),
      avg_deaths: (stats.total_deaths / stats.games_played).toFixed(1),
      avg_assists: (stats.total_assists / stats.games_played).toFixed(1),
      avg_kda: ((stats.total_kills + stats.total_assists) / Math.max(stats.total_deaths, 1)).toFixed(2),
    })).sort((a, b) => b.games_played - a.games_played);

    // Get ranked history
    const { data: rankedHistory, error: rankedError } = await supabase
      .from('ranked_info')
      .select('*')
      .eq('summoner_id', summonerId)
      .order('created_at', { ascending: false });

    if (rankedError) {
      console.error('Error fetching ranked history:', rankedError);
    }

    // Calculate performance trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMatches = (matches || []).filter(match => 
      new Date(match.game_creation) >= thirtyDaysAgo
    );

    const performanceTrends = recentMatches.map(match => ({
      date: match.game_creation,
      kda: (match.kills + match.assists) / Math.max(match.deaths, 1),
      win: match.win,
      champion: match.champion,
    }));

    return NextResponse.json({
      champion_stats: championStatsArray,
      rank_history: rankedHistory || [],
      performance_trends: performanceTrends,
    });
  } catch (error) {
    console.error('Error in summoner stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}