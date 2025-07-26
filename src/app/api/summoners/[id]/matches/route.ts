import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { RiotAPI } from '@/lib/apis/riot';
import { DetailedMatchData, ProcessedMatchData } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const summonerId = id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const detailed = searchParams.get('detailed') === 'true';

    const supabase = createServerSupabaseClient();

    // Verify the summoner belongs to the user
    const { data: summoner, error: summonerError } = await supabase
      .from('summoners')
      .select('puuid, user_id, region')
      .eq('puuid', summonerId)
      .eq('user_id', session.user.id)
      .single();

    if (summonerError || !summoner) {
      return NextResponse.json({ error: 'Summoner not found' }, { status: 404 });
    }

    // Get match history with pagination
    const { data: matches, error: matchesError } = await supabase
      .from('match_history')
      .select('*')
      .eq('summoner_id', summonerId)
      .order('game_creation', { ascending: false })
      .range(offset, offset + limit - 1);

    if (matchesError) {
      console.error('Error fetching match history:', matchesError);
      return NextResponse.json({ error: 'Failed to fetch match history' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('match_history')
      .select('*', { count: 'exact', head: true })
      .eq('summoner_id', summonerId);

    if (countError) {
      console.error('Error counting matches:', countError);
    }

    const hasMore = (offset + limit) < (count || 0);
    const nextCursor = hasMore ? (offset + limit).toString() : null;

    let processedMatches: ProcessedMatchData[] = matches || [];

    // If detailed data is requested, fetch from Riot API
    if (detailed && matches && matches.length > 0) {
      const riotApiKey = process.env.RIOT_API_KEY;
      if (!riotApiKey) {
        console.warn('RIOT_API_KEY not found, returning basic match data only');
      } else {
        try {
          const riotAPI = new RiotAPI(riotApiKey);
          
          // Fetch detailed data for each match
          const detailedMatches = await Promise.allSettled(
            matches.map(async (match) => {
              try {
                const detailedData: DetailedMatchData = await riotAPI.getMatchDetails(
                  match.match_id, 
                  summoner.region
                );

                // Find user participant in the detailed data
                const userParticipant = detailedData.info.participants.find(
                  p => p.puuid === summoner.puuid
                );

                // Find user's team and enemy team
                const userTeam = detailedData.info.teams.find(
                  t => t.teamId === userParticipant?.teamId
                );
                const enemyTeam = detailedData.info.teams.find(
                  t => t.teamId !== userParticipant?.teamId
                );

                return {
                  ...match,
                  detailedData,
                  userParticipant,
                  userTeam,
                  enemyTeam,
                } as ProcessedMatchData;
              } catch (error) {
                console.error(`Failed to fetch detailed data for match ${match.match_id}:`, error);
                // Return basic match data if detailed fetch fails
                return match as ProcessedMatchData;
              }
            })
          );

          // Process results, keeping successful ones and basic data for failed ones
          processedMatches = detailedMatches.map((result, index) => {
            if (result.status === 'fulfilled') {
              return result.value;
            } else {
              console.error(`Failed to process match ${matches![index].match_id}:`, result.reason);
              return matches![index] as ProcessedMatchData;
            }
          });
        } catch (error) {
          console.error('Error fetching detailed match data:', error);
          // Fall back to basic match data
        }
      }
    }

    return NextResponse.json({
      matches: processedMatches,
      pagination: {
        hasMore,
        nextCursor,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('Error in match history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}