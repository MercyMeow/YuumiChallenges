import { createServerSupabaseClient } from '@/lib/supabase';
import { requireAuth, createAuthResponse } from '@/lib/api/middleware/auth';
import { handleApiError, ApiError } from '@/lib/api/utils/error-handler';
import { createSuccessResponse } from '@/lib/api/utils/response-helpers';
import { RiotAPI } from '@/lib/apis/riot';
import { RefreshResponse, MatchData } from '@/lib/types';

interface RiotRankedData {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak?: boolean;
  veteran?: boolean;
  freshBlood?: boolean;
  inactive?: boolean;
}

interface RiotParticipant {
  puuid: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth();
    const authResponse = createAuthResponse(authResult);
    if (authResponse) return authResponse;
    
    const session = authResult.session!;
    const { manual = false } = await request.json();

    const supabase = createServerSupabaseClient();
    
    // Get user's summoner
    const { data: summoner, error: summonerError } = await supabase
      .from('summoners')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (summonerError || !summoner) {
      throw new ApiError(404, 'No summoner account found', 'SUMMONER_NOT_FOUND');
    }

    // Check if refresh is allowed based on cooldown
    const { data: canRefreshData, error: canRefreshError } = await supabase
      .rpc('can_refresh_summoner', {
        summoner_puuid: summoner.puuid,
        manual_refresh: manual,
        auto_refresh_minutes: 15,
        manual_refresh_minutes: 1
      });

    if (canRefreshError) {
      throw new ApiError(500, 'Failed to check refresh cooldown', 'DATABASE_ERROR', canRefreshError);
    }

    if (!canRefreshData) {
      const lastRefresh = manual ? summoner.last_manual_refresh_at : summoner.last_refreshed_at;
      const cooldownMinutes = manual ? 1 : 15;
      const nextRefresh = lastRefresh ? 
        new Date(new Date(lastRefresh).getTime() + (cooldownMinutes * 60 * 1000)) : 
        new Date();

      return createSuccessResponse<RefreshResponse>({
        success: false,
        message: `Refresh on cooldown. Try again in ${Math.ceil((nextRefresh.getTime() - Date.now()) / 1000 / 60)} minutes.`,
        next_refresh_available: nextRefresh
      });
    }

    // Initialize Riot API
    const riotAPI = new RiotAPI(process.env.RIOT_API_KEY!);
    let summonerUpdated = false;
    let rankedUpdated = false;
    let matchesAdded = 0;
    let matchesRemoved = 0;

    try {
      // Refresh summoner data (level, profile icon, etc.)
      let riotSummoner = null;
      try {
        riotSummoner = await riotAPI.getSummonerByPuuid(summoner.puuid, summoner.region);
      } catch (summonerError) {
        console.error('Failed to fetch summoner data from Riot API:', summonerError);
        // If we can't get basic summoner data, the rest will likely fail too
        // but we'll still update the timestamp to prevent constant retries
      }
      
      if (riotSummoner) {
        const { error: updateError } = await supabase
          .from('summoners')
          .update({
            level: riotSummoner.summonerLevel,
            profile_icon_id: riotSummoner.profileIconId,
            last_refreshed_at: new Date().toISOString(),
            ...(manual && { last_manual_refresh_at: new Date().toISOString() })
          })
          .eq('puuid', summoner.puuid);

        if (updateError) {
          console.error('Failed to update summoner data:', updateError);
        } else {
          summonerUpdated = true;
        }
      }

      // Refresh ranked information
      let rankedData = null;
      try {
        rankedData = await riotAPI.getRankedInfo(riotSummoner?.id || '', summoner.region);
      } catch (rankedError) {
        console.error('Failed to fetch ranked info:', rankedError);
        // Continue without updating ranked info - don't fail the entire refresh
      }
      
      if (rankedData && rankedData.length > 0) {
        // Clear existing ranked info for this summoner
        await supabase
          .from('ranked_info')
          .delete()
          .eq('summoner_id', summoner.puuid);

        // Insert updated ranked info
        const rankedRecords = rankedData.map((rank: RiotRankedData) => ({
          summoner_id: summoner.puuid,
          queue_type: rank.queueType,
          tier: rank.tier,
          rank_level: rank.rank,
          league_points: rank.leaguePoints,
          wins: rank.wins,
          losses: rank.losses,
          hot_streak: rank.hotStreak || false,
          veteran: rank.veteran || false,
          fresh_blood: rank.freshBlood || false,
          inactive: rank.inactive || false,
          season: new Date().getFullYear().toString()
        }));

        const { error: rankedError } = await supabase
          .from('ranked_info')
          .insert(rankedRecords);

        if (rankedError) {
          console.error('Failed to update ranked info:', rankedError);
        } else {
          rankedUpdated = true;
        }
      }

      // Refresh match history
      let matchIds = null;
      try {
        matchIds = await riotAPI.getMatchHistory(summoner.puuid, summoner.region, 20);
      } catch (matchError) {
        console.error('Failed to fetch match history:', matchError);
        // Continue without updating match history
      }
      
      if (matchIds && matchIds.length > 0) {
        // Get existing match IDs to avoid duplicates
        const { data: existingMatches } = await supabase
          .from('match_history')
          .select('match_id')
          .eq('summoner_id', summoner.id);

        const existingMatchIds = new Set(existingMatches?.map(m => m.match_id) || []);
        const newMatchIds = matchIds.filter((id: string) => !existingMatchIds.has(id));

        // Fetch details for new matches
        for (const matchId of newMatchIds.slice(0, 10)) { // Process up to 10 new matches to avoid rate limits
          try {
            const matchDetails = await riotAPI.getMatchDetails(matchId, summoner.region);
            
            if (matchDetails && matchDetails.info) {
              const participant = matchDetails.info.participants.find(
                (p: RiotParticipant) => p.puuid === summoner.puuid
              );

              if (participant) {
                const matchData: Omit<MatchData, 'id' | 'created_at'> = {
                  match_id: matchId,
                  summoner_id: summoner.id,
                  champion: participant.championName,
                  kills: participant.kills,
                  deaths: participant.deaths,
                  assists: participant.assists,
                  win: participant.win,
                  duration: matchDetails.info.gameDuration,
                  game_mode: matchDetails.info.gameMode,
                  queue_id: matchDetails.info.queueId,
                  game_creation: new Date(matchDetails.info.gameCreation),
                  analyzed_for_challenges: false
                };

                const { error: matchError } = await supabase
                  .from('match_history')
                  .insert([matchData]);

                if (!matchError) {
                  matchesAdded++;
                }
              }
            }
          } catch (matchError) {
            console.error(`Failed to fetch details for match ${matchId}:`, matchError);
            // Continue with other matches
          }
        }

        // Clean up old matches (keep latest 20, remove matches older than 30 days)
        const { data: cleanupResult } = await supabase
          .rpc('cleanup_old_match_data');

        if (cleanupResult) {
          matchesRemoved = cleanupResult;
        }
      }

    } catch (riotError) {
      console.error('Riot API error during refresh:', riotError);
      
      // Only update timestamp if at least some operations succeeded
      const anySuccess = summonerUpdated || rankedUpdated || matchesAdded > 0;
      
      if (anySuccess) {
        // Update refresh timestamp only on partial success
        await supabase
          .from('summoners')
          .update({
            last_refreshed_at: new Date().toISOString(),
            ...(manual && { last_manual_refresh_at: new Date().toISOString() })
          })
          .eq('puuid', summoner.puuid);
          
        return createSuccessResponse<RefreshResponse>({
          success: true,
          message: 'Account partially refreshed (some operations failed)',
          data: {
            summoner_updated: summonerUpdated,
            ranked_updated: rankedUpdated,
            matches_added: matchesAdded,
            matches_removed: matchesRemoved
          }
        });
      } else {
        // Complete failure - don't update timestamps, return error
        throw new ApiError(503, 'Refresh failed - Riot API unavailable. Please try again later.', 'REFRESH_FAILED', {
          error: riotError instanceof Error ? riotError.message : String(riotError)
        });
      }
    }

    // Success path - update timestamps
    await supabase
      .from('summoners')
      .update({
        last_refreshed_at: new Date().toISOString(),
        ...(manual && { last_manual_refresh_at: new Date().toISOString() })
      })
      .eq('puuid', summoner.puuid);

    return createSuccessResponse<RefreshResponse>({
      success: true,
      message: 'Account refreshed successfully',
      data: {
        summoner_updated: summonerUpdated,
        ranked_updated: rankedUpdated,
        matches_added: matchesAdded,
        matches_removed: matchesRemoved
      }
    });

  } catch (error) {
    return handleApiError(error, 'POST /api/summoners/refresh');
  }
}

export async function GET() {
  try {
    const authResult = await requireAuth();
    const authResponse = createAuthResponse(authResult);
    if (authResponse) return authResponse;
    
    const session = authResult.session!;
    const supabase = createServerSupabaseClient();
    
    // Get user's summoner with refresh status
    const { data: summoner, error: summonerError } = await supabase
      .from('summoners')
      .select('puuid, last_refreshed_at, last_manual_refresh_at')
      .eq('user_id', session.user.id)
      .single();

    if (summonerError || !summoner) {
      throw new ApiError(404, 'No summoner account found', 'SUMMONER_NOT_FOUND');
    }

    const now = new Date();
    const lastRefresh = summoner.last_refreshed_at ? new Date(summoner.last_refreshed_at) : null;
    const lastManualRefresh = summoner.last_manual_refresh_at ? new Date(summoner.last_manual_refresh_at) : null;

    const canAutoRefresh = !lastRefresh || (now.getTime() - lastRefresh.getTime()) >= (15 * 60 * 1000);
    const canManualRefresh = !lastManualRefresh || (now.getTime() - lastManualRefresh.getTime()) >= (1 * 60 * 1000);

    const nextAutoRefresh = lastRefresh ? new Date(lastRefresh.getTime() + (15 * 60 * 1000)) : now;
    const nextManualRefresh = lastManualRefresh ? new Date(lastManualRefresh.getTime() + (1 * 60 * 1000)) : now;

    return createSuccessResponse({
      can_refresh: canAutoRefresh,
      can_manual_refresh: canManualRefresh,
      last_refreshed_at: lastRefresh,
      last_manual_refresh_at: lastManualRefresh,
      next_auto_refresh: canAutoRefresh ? null : nextAutoRefresh,
      next_manual_refresh: canManualRefresh ? null : nextManualRefresh
    });

  } catch (error) {
    return handleApiError(error, 'GET /api/summoners/refresh');
  }
}