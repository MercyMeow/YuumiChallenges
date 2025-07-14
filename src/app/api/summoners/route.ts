import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { RiotAPI } from '@/lib/apis/riot';
import { requireAuth, createAuthResponse } from '@/lib/api/middleware/auth';
import { handleApiError, ApiError } from '@/lib/api/utils/error-handler';
import { createSuccessResponse } from '@/lib/api/utils/response-helpers';
import { validateRequestBody } from '@/lib/api/utils/validation';
// import { executeQuery } from '@/lib/api/utils/query-helpers';
import { z } from 'zod';

export async function GET() {
  try {
    const authResult = await requireAuth();
    const authResponse = createAuthResponse(authResult);
    if (authResponse) return authResponse;
    
    const session = authResult.session!;

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
      throw new ApiError(500, 'Failed to fetch summoners', 'DATABASE_ERROR', summonersError);
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

    const currentRank = summoners?.find(s => s.verified)?.ranked_info?.find((r: any) => r.queue_type === 'RANKED_SOLO_5x5')?.tier || 'Unranked'; // eslint-disable-line @typescript-eslint/no-explicit-any

    return createSuccessResponse({
      summoners: summoners || [],
      stats: {
        totalGames,
        overallKDA: Math.round(overallKDA * 100) / 100,
        favoriteChampion,
        currentRank,
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/summoners');
  }
}

const createSummonerSchema = z.object({
  gameName: z.string().min(1).max(50),
  tagLine: z.string().min(1).max(10),
  region: z.string().min(2).max(10),
});

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    const authResponse = createAuthResponse(authResult);
    if (authResponse) return authResponse;
    
    const session = authResult.session!;
    const { gameName, tagLine, region } = await validateRequestBody(request, createSummonerSchema);

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
          throw new ApiError(400, 'You have already linked this account', 'ACCOUNT_ALREADY_LINKED');
        } else {
          throw new ApiError(400, 'This account is already linked to another user', 'ACCOUNT_LINKED_TO_OTHER');
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
        throw new ApiError(500, 'Failed to create summoner record', 'DATABASE_ERROR', summonerError);
      }

      return createSuccessResponse({
        summoner,
        verificationCode,
      }, 'Summoner account linked successfully');
    } catch (riotError) {
      console.error('Riot API error:', riotError);
      throw new ApiError(404, 'Summoner not found or invalid region', 'SUMMONER_NOT_FOUND');
    }
  } catch (error) {
    return handleApiError(error, 'POST /api/summoners');
  }
}