import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { RiotAPI } from '@/lib/apis/riot';
import { selectRandomIcon, getSummonerIconUrl } from '@/lib/apis/datadragon';

interface VerifyIconRequest {
  gameName: string;
  tagLine: string;
  region: string;
  expectedIconId?: number; // For verification step
}

// POST - Start icon verification process (get random icon)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameName, tagLine, region }: VerifyIconRequest = await request.json();

    if (!gameName || !tagLine || !region) {
      return NextResponse.json({ 
        error: 'Game name, tag line, and region are required' 
      }, { status: 400 });
    }

    const riotAPI = new RiotAPI(process.env.RIOT_API_KEY!);
    
    try {
      // Get account data by Riot ID
      const accountData = await riotAPI.getAccountByRiotId(gameName, tagLine, region);
      
      // Get summoner data to check current icon
      const summonerData = await riotAPI.getSummonerByPuuid(accountData.puuid, region);
      
      const supabase = createServerSupabaseClient();
      
      // Check if this account is already linked to any user
      const { data: existingSummoner } = await supabase
        .from('summoners')
        .select('user_id')
        .eq('puuid', accountData.puuid)
        .single();

      if (existingSummoner) {
        return NextResponse.json({
          error: 'This account is already linked to a user'
        }, { status: 400 });
      }

      // Check if current user already has a summoner linked
      const { data: userSummoner } = await supabase
        .from('summoners')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (userSummoner) {
        return NextResponse.json({
          error: 'You can only link one League account. Please unlink your current account first.'
        }, { status: 400 });
      }

      // Select random icon (excluding current)
      const currentIconId = summonerData.profileIconId;
      const selectedIconId = selectRandomIcon(currentIconId);
      const iconUrl = await getSummonerIconUrl(selectedIconId);

      return NextResponse.json({
        success: true,
        accountData: {
          puuid: accountData.puuid,
          gameName: accountData.gameName,
          tagLine: accountData.tagLine,
          summonerId: summonerData.id,
          currentIconId,
          level: summonerData.summonerLevel,
        },
        verification: {
          selectedIconId,
          iconUrl,
          instructions: `Please change your summoner icon to the displayed icon in your League of Legends client, then click "Verify Account" to complete the linking process.`
        }
      });

    } catch (riotError) {
      console.error('Riot API error:', riotError);
      return NextResponse.json({
        error: 'Unable to find summoner account. Please check your game name, tag line, and region.'
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error in icon verification start:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Complete icon verification and create summoner record
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameName, tagLine, region, expectedIconId }: VerifyIconRequest = await request.json();

    if (!gameName || !tagLine || !region || !expectedIconId) {
      return NextResponse.json({ 
        error: 'Game name, tag line, region, and expected icon ID are required' 
      }, { status: 400 });
    }

    const riotAPI = new RiotAPI(process.env.RIOT_API_KEY!);
    
    try {
      // Get fresh account data
      const accountData = await riotAPI.getAccountByRiotId(gameName, tagLine, region);
      const summonerData = await riotAPI.refreshSummonerData(accountData.puuid, region);
      
      // Debug logging for Riot API responses
      console.log('Account data:', {
        puuid: accountData.puuid,
        gameName: accountData.gameName,
        tagLine: accountData.tagLine
      });
      console.log('Summoner data:', {
        id: summonerData.id,
        accountId: summonerData.accountId,
        puuid: summonerData.puuid,
        name: summonerData.name,
        profileIconId: summonerData.profileIconId,
        summonerLevel: summonerData.summonerLevel,
        allFields: Object.keys(summonerData)
      });
      
      // Validate required summoner data from modern Riot API
      if (!summonerData.puuid || summonerData.profileIconId === undefined) {
        console.error('Missing required fields in Riot API response:', summonerData);
        return NextResponse.json({
          error: 'Invalid summoner data received from Riot API'
        }, { status: 500 });
      }
      
      // Check if icon was changed to the expected icon
      if (summonerData.profileIconId !== expectedIconId) {
        return NextResponse.json({
          success: false,
          verified: false,
          message: `Icon verification failed. Expected icon ID ${expectedIconId}, but found ${summonerData.profileIconId}. Please ensure you have changed your summoner icon to the displayed icon.`
        }, { status: 400 });
      }

      const supabase = createServerSupabaseClient();

      // Check again for existing summoner (race condition protection)
      const { data: existingSummoner } = await supabase
        .from('summoners')
        .select('user_id')
        .eq('puuid', accountData.puuid)
        .single();

      if (existingSummoner) {
        return NextResponse.json({
          error: 'This account is already linked to a user'
        }, { status: 400 });
      }

      // Check again if current user already has a summoner linked (race condition protection)
      const { data: userSummoner } = await supabase
        .from('summoners')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (userSummoner) {
        return NextResponse.json({
          error: 'You can only link one League account. Please unlink your current account first.'
        }, { status: 400 });
      }

      // Create summoner record (all summoners are verified through icon verification process)
      // Include both game_name and tag_line for complete Riot ID
      const { data: newSummoner, error: createError } = await supabase
        .from('summoners')
        .insert({
          user_id: session.user.id,
          puuid: accountData.puuid,
          game_name: accountData.gameName,
          tag_line: accountData.tagLine,
          region: region,
          level: summonerData.summonerLevel,
          profile_icon_id: summonerData.profileIconId,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating summoner:', {
          error: createError,
          message: createError.message,
          code: createError.code,
          details: createError.details,
          hint: createError.hint,
          insertData: {
            user_id: session.user.id,
            puuid: accountData.puuid,
            game_name: accountData.gameName,
            tag_line: accountData.tagLine,
            region: region,
            level: summonerData.summonerLevel,
            profile_icon_id: summonerData.profileIconId,
          }
        });
        
        // Return more specific error for debugging
        return NextResponse.json({ 
          error: 'Failed to link account',
          debug: process.env.NODE_ENV === 'development' ? {
            supabaseError: createError.message,
            code: createError.code
          } : undefined
        }, { status: 500 });
      }

      // Fetch and store ranked information
      try {
        console.log('Fetching ranked info for summoner:', summonerData.id);
        const rankedData = await riotAPI.getRankedInfo(summonerData.id, region);
        
        if (rankedData && rankedData.length > 0) {
          console.log('Storing ranked data for', rankedData.length, 'queues');
          
          const rankedRecords = rankedData.map((rank: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
            summoner_id: newSummoner.puuid,
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
            season: new Date().getFullYear().toString(), // Current season
          }));
          
          const { error: rankedError } = await supabase
            .from('ranked_info')
            .insert(rankedRecords);
            
          if (rankedError) {
            console.error('Failed to store ranked info:', rankedError);
            // Don't fail the verification if ranked data storage fails
          } else {
            console.log('Successfully stored ranked info for summoner');
          }
        } else {
          console.log('No ranked data available (unranked player)');
        }
      } catch (rankedError) {
        console.error('Failed to fetch ranked info:', rankedError);
        // Don't fail the verification if ranked data fetch fails
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Account successfully linked!',
        summoner: newSummoner
      });

    } catch (riotError) {
      console.error('Riot API error during verification:', riotError);
      return NextResponse.json({
        error: 'Unable to verify account. Please try again later.'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in icon verification completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}