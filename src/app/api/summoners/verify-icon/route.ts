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
      
      // Check if this account is already linked to any user
      const supabase = createServerSupabaseClient();
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

      // Create summoner record (all summoners are verified through icon verification process)
      const { data: newSummoner, error: createError } = await supabase
        .from('summoners')
        .insert({
          user_id: session.user.id,
          puuid: accountData.puuid,
          summoner_id: summonerData.id,
          account_id: summonerData.accountId,
          name: accountData.gameName,
          tag_line: accountData.tagLine,
          region: region,
          level: summonerData.summonerLevel,
          profile_icon_id: summonerData.profileIconId,
          verified: true,
          verification_code: null,
          verification_expires_at: null,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating summoner:', createError);
        return NextResponse.json({ 
          error: 'Failed to link account' 
        }, { status: 500 });
      }

      // Update ranked info
      try {
        const rankedData = await riotAPI.getRankedInfo(summonerData.id, region);
        
        for (const queue of rankedData) {
          await supabase
            .from('ranked_info')
            .upsert({
              summoner_id: newSummoner.id,
              queue_type: queue.queueType,
              tier: queue.tier,
              rank_level: queue.rank,
              league_points: queue.leaguePoints,
              wins: queue.wins,
              losses: queue.losses,
              hot_streak: queue.hotStreak,
              veteran: queue.veteran,
              fresh_blood: queue.freshBlood,
              inactive: queue.inactive,
              season: new Date().getFullYear().toString(),
            }, {
              onConflict: 'summoner_id,queue_type,season'
            });
        }
      } catch (rankedError) {
        console.error('Error updating ranked info:', rankedError);
        // Don't fail the verification if ranked update fails
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