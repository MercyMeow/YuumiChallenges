import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createServerSupabaseClient } from '@/lib/supabase';
import { RiotAPI } from '@/lib/apis/riot';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    
    // Get user's summoners with ranked info
    const { data: summoners, error: summonersError } = await supabase
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
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (summonersError) {
      console.error('Error fetching summoners:', summonersError);
      return NextResponse.json({ error: 'Failed to fetch summoners' }, { status: 500 });
    }

    // Get aggregate stats
    const { data: matchStats, error: matchStatsError } = await supabase
      .from('match_history')
      .select(`
        kills,
        deaths,
        assists,
        win,
        champion
      `)
      .in('summoner_id', summoners?.map(s => s.id) || []);

    if (matchStatsError) {
      console.error('Error fetching match stats:', matchStatsError);
    }

    // Calculate overall stats
    const totalGames = matchStats?.length || 0;
    const overallKDA = totalGames > 0 ? 
      (matchStats?.reduce((sum, match) => sum + match.kills + match.assists, 0) || 0) / 
      Math.max(matchStats?.reduce((sum, match) => sum + match.deaths, 0) || 1, 1) : 0;

    const championCounts = matchStats?.reduce((acc, match) => {
      acc[match.champion] = (acc[match.champion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const favoriteChampion = Object.entries(championCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    const currentRank = summoners?.find(s => s.verified)?.ranked_info?.find((r: any) => r.queue_type === 'RANKED_SOLO_5x5')?.tier || 'Unranked';

    return NextResponse.json({
      summoners: summoners || [],
      stats: {
        totalGames,
        overallKDA: Math.round(overallKDA * 100) / 100,
        favoriteChampion,
        currentRank,
      },
    });
  } catch (error) {
    console.error('Error in summoners API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameName, tagLine, region } = await request.json();

    if (!gameName || !tagLine || !region) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const riotAPI = new RiotAPI(process.env.RIOT_API_KEY!);
    const supabase = createServerSupabaseClient();

    try {
      // Look up summoner in Riot API
      const accountData = await riotAPI.getAccountByRiotId(gameName, tagLine, region);
      const summonerData = await riotAPI.getSummonerByPuuid(accountData.puuid, region);

      // Check if summoner already exists
      const { data: existingSummoner } = await supabase
        .from('summoners')
        .select('id, user_id')
        .eq('puuid', accountData.puuid)
        .single();

      if (existingSummoner) {
        if (existingSummoner.user_id === session.user.id) {
          return NextResponse.json({ error: 'You have already linked this account' }, { status: 400 });
        } else {
          return NextResponse.json({ error: 'This account is already linked to another user' }, { status: 400 });
        }
      }

      // Generate verification code
      const verificationCode = Math.random().toString(36).substring(2, 15);
      const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create summoner record
      const { data: summoner, error: summonerError } = await supabase
        .from('summoners')
        .insert({
          user_id: session.user.id,
          puuid: accountData.puuid,
          summoner_id: summonerData.id,
          account_id: summonerData.accountId,
          name: gameName,
          tag_line: tagLine,
          region: region,
          level: summonerData.summonerLevel,
          profile_icon_id: summonerData.profileIconId,
          verified: false,
          verification_code: verificationCode,
          verification_expires_at: verificationExpiresAt.toISOString(),
        })
        .select()
        .single();

      if (summonerError) {
        console.error('Error creating summoner:', summonerError);
        return NextResponse.json({ error: 'Failed to create summoner record' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        summoner,
        verificationCode,
      });
    } catch (riotError) {
      console.error('Riot API error:', riotError);
      return NextResponse.json({ error: 'Summoner not found or invalid region' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error in POST summoners API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}