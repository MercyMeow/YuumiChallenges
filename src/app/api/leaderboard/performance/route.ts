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
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const limit = parseInt(searchParams.get('limit') || '10');

    // Calculate date threshold
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - parseInt(timeframe));

    // Get KDA leaderboard
    const { data: kdaData, error: kdaError } = await supabase
      .rpc('get_kda_leaderboard', {
        min_games: 10,
        date_threshold: dateThreshold.toISOString(),
        result_limit: limit
      });

    if (kdaError) {
      console.error('Error fetching KDA leaderboard:', kdaError);
    }

    // Get Win Rate leaderboard
    const { data: winRateData, error: winRateError } = await supabase
      .rpc('get_winrate_leaderboard', {
        min_games: 20,
        date_threshold: dateThreshold.toISOString(),
        result_limit: limit
      });

    if (winRateError) {
      console.error('Error fetching win rate leaderboard:', winRateError);
    }

    // Get Champion Mastery leaderboard
    const { data: masteryData, error: masteryError } = await supabase
      .from('summoners')
      .select(`
        user_id,
        name,
        tag_line,
        champion_mastery_points,
        champion_mastery_level,
        users (
          id,
          name,
          image,
          is_yuumi_member
        )
      `)
      .eq('verified', true)
      .eq('users.is_yuumi_member', true)
      .not('champion_mastery_points', 'is', null)
      .order('champion_mastery_points', { ascending: false })
      .limit(limit);

    if (masteryError) {
      console.error('Error fetching mastery leaderboard:', masteryError);
    }

    // Format KDA rankings
    const kdaRankings = (kdaData || []).map((entry: any, index: number) => ({
      position: index + 1,
      user: {
        id: entry.user_id,
        name: entry.user_name,
        image: entry.user_image || '',
      },
      summoner: {
        name: entry.summoner_name,
        tagLine: entry.tag_line,
      },
      value: parseFloat(entry.avg_kda),
      gamesPlayed: entry.games_played,
      timeframe: `Last ${timeframe} days`,
    }));

    // Format Win Rate rankings
    const winRateRankings = (winRateData || []).map((entry: any, index: number) => ({
      position: index + 1,
      user: {
        id: entry.user_id,
        name: entry.user_name,
        image: entry.user_image || '',
      },
      summoner: {
        name: entry.summoner_name,
        tagLine: entry.tag_line,
      },
      value: parseFloat(entry.win_rate) / 100, // Convert to decimal
      gamesPlayed: entry.games_played,
      timeframe: `Last ${timeframe} days`,
    }));

    // Format Champion Mastery rankings
    const masteryRankings = (masteryData || []).map((entry: any, index: number) => {
      const user = Array.isArray(entry.users) ? entry.users[0] : entry.users;
      return {
        position: index + 1,
        user: {
          id: user?.id || entry.user_id,
          name: user?.name || 'Unknown',
          image: user?.image || '',
        },
        summoner: {
          name: entry.name,
          tagLine: entry.tag_line,
        },
        value: entry.champion_mastery_points,
        level: entry.champion_mastery_level,
        timeframe: 'All time',
      };
    });

    return NextResponse.json({
      kda: kdaRankings,
      winRate: winRateRankings,
      mastery: masteryRankings,
      timeframe: `${timeframe} days`,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in performance leaderboard API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}