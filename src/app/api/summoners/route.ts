import { createServerSupabaseClient } from '@/lib/supabase';
import { requireAuth, createAuthResponse } from '@/lib/api/middleware/auth';
import { handleApiError, ApiError } from '@/lib/api/utils/error-handler';
import { createSuccessResponse } from '@/lib/api/utils/response-helpers';

export async function GET() {
  try {
    const authResult = await requireAuth();
    const authResponse = createAuthResponse(authResult);
    if (authResponse) return authResponse;
    
    const session = authResult.session!;

    const supabase = createServerSupabaseClient();
    
    // Get user's single summoner with ranked info (users can only have one summoner)
    const { data: summoner, error: summonerError } = await supabase
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
      .single();

    if (summonerError && summonerError.code !== 'PGRST116') {
      throw new ApiError(500, 'Failed to fetch summoner', 'DATABASE_ERROR', summonerError);
    }

    // If no summoner found, return null
    if (!summoner) {
      return createSuccessResponse({
        summoner: null,
        stats: null,
      });
    }

    // Get match stats for the single summoner
    const { data: matchStats, error: matchStatsError } = await supabase
      .from('match_history')
      .select(`
        kills,
        deaths,
        assists,
        win,
        champion
      `)
      .eq('summoner_id', summoner.puuid);

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

    const currentRank = summoner.ranked_info?.find((r: any) => r.queue_type === 'RANKED_SOLO_5x5')?.tier || 'Unranked'; // eslint-disable-line @typescript-eslint/no-explicit-any

    return createSuccessResponse({
      summoner,
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

export async function POST() {
  try {
    const authResult = await requireAuth();
    const authResponse = createAuthResponse(authResult);
    if (authResponse) return authResponse;

    // This endpoint is deprecated - redirect users to use icon verification
    throw new ApiError(
      410, 
      'This endpoint has been replaced by the icon verification system. Please use /api/summoners/verify-icon instead.',
      'ENDPOINT_DEPRECATED'
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/summoners');
  }
}