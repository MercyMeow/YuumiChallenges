import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createServerSupabaseClient } from '@/lib/supabase';
import { RiotAPI } from '@/lib/apis/riot';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { verificationCode } = await request.json();
    const summonerId = params.id;

    if (!verificationCode) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // Get summoner data
    const { data: summoner, error: summonerError } = await supabase
      .from('summoners')
      .select('*')
      .eq('id', summonerId)
      .eq('user_id', session.user.id)
      .single();

    if (summonerError || !summoner) {
      return NextResponse.json({ error: 'Summoner not found' }, { status: 404 });
    }

    if (summoner.verified) {
      return NextResponse.json({ error: 'Summoner already verified' }, { status: 400 });
    }

    // Check if verification code has expired
    if (summoner.verification_expires_at && new Date() > new Date(summoner.verification_expires_at)) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    // Verify the code by checking item sets in League client
    const riotAPI = new RiotAPI(process.env.RIOT_API_KEY!);
    
    try {
      const itemSets = await riotAPI.getItemSets(summoner.summoner_id, summoner.region);
      const hasVerificationSet = itemSets.some((set: any) => set.title === verificationCode);

      if (!hasVerificationSet) {
        return NextResponse.json({ 
          success: false, 
          verified: false, 
          message: 'Verification code not found in item sets. Please ensure you have created an item set with the exact verification code as the title.' 
        }, { status: 400 });
      }

      // Update summoner as verified
      const { error: updateError } = await supabase
        .from('summoners')
        .update({
          verified: true,
          verification_code: null,
          verification_expires_at: null,
        })
        .eq('id', summonerId);

      if (updateError) {
        console.error('Error updating summoner verification:', updateError);
        return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
      }

      // Update ranked info
      try {
        const rankedData = await riotAPI.getRankedInfo(summoner.summoner_id, summoner.region);
        
        for (const queue of rankedData) {
          await supabase
            .from('ranked_info')
            .upsert({
              summoner_id: summonerId,
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
        message: 'Account successfully verified!',
      });
    } catch (riotError) {
      console.error('Riot API error during verification:', riotError);
      return NextResponse.json({ 
        success: false, 
        verified: false, 
        message: 'Unable to verify account. Please try again later.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in verification API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summonerId = params.id;
    const supabase = createServerSupabaseClient();
    
    // Get summoner data
    const { data: summoner, error: summonerError } = await supabase
      .from('summoners')
      .select('*')
      .eq('id', summonerId)
      .eq('user_id', session.user.id)
      .single();

    if (summonerError || !summoner) {
      return NextResponse.json({ error: 'Summoner not found' }, { status: 404 });
    }

    if (summoner.verified) {
      return NextResponse.json({ error: 'Summoner already verified' }, { status: 400 });
    }

    // Generate new verification code
    const verificationCode = Math.random().toString(36).substring(2, 15);
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update summoner with new verification code
    const { error: updateError } = await supabase
      .from('summoners')
      .update({
        verification_code: verificationCode,
        verification_expires_at: verificationExpiresAt.toISOString(),
      })
      .eq('id', summonerId);

    if (updateError) {
      console.error('Error updating verification code:', updateError);
      return NextResponse.json({ error: 'Failed to generate new verification code' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      verificationCode,
      message: 'New verification code generated',
    });
  } catch (error) {
    console.error('Error in verification code generation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}