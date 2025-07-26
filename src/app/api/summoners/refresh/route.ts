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
    const { manual = false, operations = ['summoner', 'ranked', 'matches'] } = await request.json();

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
    
    // Initialize progress tracking
    const refreshResults = {
      summoner_updated: false,
      ranked_updated: false,
      matches_added: 0,
      matches_removed: 0,
      errors: [] as string[],
      warnings: [] as string[]
    };

    // Track operations to perform
    const shouldRefreshSummoner = operations.includes('summoner');
    const shouldRefreshRanked = operations.includes('ranked');
    const shouldRefreshMatches = operations.includes('matches');

    try {
      // Refresh summoner data (level, profile icon, etc.)
      let riotSummoner = null;
      if (shouldRefreshSummoner) {
        try {
          riotSummoner = await riotAPI.getSummonerByPuuid(summoner.puuid, summoner.region);
        } catch (summonerError) {
          console.error('Failed to fetch summoner data from Riot API:', summonerError);
          refreshResults.errors.push('Failed to fetch summoner data from Riot API');
          refreshResults.warnings.push('Summoner data may be outdated');
        }
      }
      
      if (riotSummoner && shouldRefreshSummoner) {
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
          refreshResults.errors.push('Failed to save summoner data to database');
        } else {
          refreshResults.summoner_updated = true;
        }
      }

      // Refresh ranked information
      let rankedData = null;
      if (shouldRefreshRanked && riotSummoner) {
        try {
          rankedData = await riotAPI.getRankedInfo(riotSummoner.id, summoner.region);
        } catch (rankedError) {
          console.error('Failed to fetch ranked info:', rankedError);
          refreshResults.errors.push('Failed to fetch ranked data from Riot API');
          refreshResults.warnings.push('Ranked data may be outdated');
        }
        
        if (rankedData && rankedData.length > 0) {
          try {
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
              refreshResults.errors.push('Failed to save ranked data to database');
            } else {
              refreshResults.ranked_updated = true;
            }
          } catch (error) {
            console.error('Error processing ranked data:', error);
            refreshResults.errors.push('Error processing ranked data');
          }
        } else if (shouldRefreshRanked) {
          refreshResults.warnings.push('No ranked data found for this summoner');
        }
      }

      // Refresh match history
      if (shouldRefreshMatches) {
        let matchIds = null;
        try {
          matchIds = await riotAPI.getMatchHistory(summoner.puuid, summoner.region, 20);
        } catch (matchError) {
          console.error('Failed to fetch match history:', matchError);
          refreshResults.errors.push('Failed to fetch match history from Riot API');
          refreshResults.warnings.push('Match history may be outdated');
        }
        
        if (matchIds && matchIds.length > 0) {
          try {
            // Get existing match IDs to avoid duplicates
            const { data: existingMatches } = await supabase
              .from('match_history')
              .select('match_id')
              .eq('summoner_id', summoner.puuid);

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
                      summoner_id: summoner.puuid,
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
                      refreshResults.matches_added++;
                    } else {
                      console.error(`Failed to save match ${matchId}:`, matchError);
                      refreshResults.warnings.push(`Failed to save match ${matchId}`);
                    }
                  }
                }
              } catch (matchError) {
                console.error(`Failed to fetch details for match ${matchId}:`, matchError);
                refreshResults.warnings.push(`Failed to process match ${matchId}`);
              }
            }

            // Clean up old matches (keep latest 20, remove matches older than 30 days)
            try {
              const { data: cleanupResult } = await supabase
                .rpc('cleanup_old_match_data');

              if (cleanupResult) {
                refreshResults.matches_removed = cleanupResult;
              }
            } catch (cleanupError) {
              console.error('Failed to cleanup old matches:', cleanupError);
              refreshResults.warnings.push('Failed to cleanup old match data');
            }
          } catch (error) {
            console.error('Error processing match history:', error);
            refreshResults.errors.push('Error processing match history data');
          }
        } else if (shouldRefreshMatches) {
          refreshResults.warnings.push('No new matches found');
        }
      }

    } catch (riotError) {
      console.error('Riot API error during refresh:', riotError);
      refreshResults.errors.push('Critical error during refresh operation');
      
      // Only update timestamp if at least some operations succeeded
      const anySuccess = refreshResults.summoner_updated || refreshResults.ranked_updated || refreshResults.matches_added > 0;
      
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
            ...refreshResults,
            partial_success: true
          }
        });
      } else {
        // Complete failure - don't update timestamps, return error
        throw new ApiError(503, 'Refresh failed - All operations failed. Please try again later.', 'REFRESH_FAILED', {
          error: riotError instanceof Error ? riotError.message : String(riotError),
          details: refreshResults
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

    // Determine overall success status
    const hasErrors = refreshResults.errors.length > 0;
    const hasWarnings = refreshResults.warnings.length > 0;
    const anySuccess = refreshResults.summoner_updated || refreshResults.ranked_updated || refreshResults.matches_added > 0;

    let message = 'Account refreshed successfully';
    if (hasErrors && anySuccess) {
      message = 'Account partially refreshed with some errors';
    } else if (hasWarnings && anySuccess) {
      message = 'Account refreshed successfully with some warnings';
    } else if (!anySuccess) {
      message = 'Refresh completed but no new data was found';
    }

    return createSuccessResponse<RefreshResponse>({
      success: !hasErrors,
      message,
      data: refreshResults
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
    
    // Get user's summoner
    const { data: summoner, error: summonerError } = await supabase
      .from('summoners')
      .select('puuid')
      .eq('user_id', session.user.id)
      .single();

    if (summonerError || !summoner) {
      throw new ApiError(404, 'No summoner account found', 'SUMMONER_NOT_FOUND');
    }

    // Get comprehensive refresh status using the new database function
    const { data: refreshStatus, error: statusError } = await supabase
      .rpc('get_summoner_refresh_status', {
        summoner_puuid: summoner.puuid,
        auto_refresh_minutes: 15,
        manual_refresh_minutes: 1
      })
      .single();

    if (statusError) {
      console.error('Error getting refresh status:', statusError);
      throw new ApiError(500, 'Failed to get refresh status', 'DATABASE_ERROR', statusError);
    }

    const status = refreshStatus as {
      can_auto_refresh: boolean;
      can_manual_refresh: boolean;
      last_refreshed_at: string | null;
      last_manual_refresh_at: string | null;
      next_auto_refresh: string | null;
      next_manual_refresh: string | null;
      total_matches: number;
      last_match_date: string | null;
    };

    // Convert timestamp strings to proper Date objects/ISO strings for frontend
    const convertTimestamp = (timestamp: string | null): Date | undefined => {
      return timestamp ? new Date(timestamp) : undefined;
    };

    return createSuccessResponse({
      can_refresh: status.can_auto_refresh,
      can_manual_refresh: status.can_manual_refresh,
      last_refreshed_at: convertTimestamp(status.last_refreshed_at),
      last_manual_refresh_at: convertTimestamp(status.last_manual_refresh_at),
      next_auto_refresh: convertTimestamp(status.next_auto_refresh),
      next_manual_refresh: convertTimestamp(status.next_manual_refresh),
      total_matches: status.total_matches,
      last_match_date: convertTimestamp(status.last_match_date)
    });

  } catch (error) {
    return handleApiError(error, 'GET /api/summoners/refresh');
  }
}