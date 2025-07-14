import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const challengeId = params.id;
    const supabase = createServerSupabaseClient();

    // Get challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .eq('active', true)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found or inactive' }, { status: 404 });
    }

    // Check if user already participates in this challenge
    const { data: existingParticipation } = await supabase
      .from('user_challenges')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('challenge_id', challengeId)
      .single();

    if (existingParticipation) {
      return NextResponse.json({ error: 'You are already participating in this challenge' }, { status: 400 });
    }

    // Check if user has verified summoners for challenges that require them
    const { data: verifiedSummoners, error: summonersError } = await supabase
      .from('summoners')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('verified', true);

    if (summonersError) {
      console.error('Error checking summoners:', summonersError);
      return NextResponse.json({ error: 'Failed to verify account requirements' }, { status: 500 });
    }

    if (!verifiedSummoners || verifiedSummoners.length === 0) {
      return NextResponse.json({ 
        error: 'You need to link and verify at least one League of Legends account to participate in challenges' 
      }, { status: 400 });
    }

    // Determine initial progress and max progress based on challenge type
    const maxProgress = calculateMaxProgress(challenge);
    
    // Create user challenge participation record
    const { data: userChallenge, error: createError } = await supabase
      .from('user_challenges')
      .insert({
        user_id: session.user.id,
        challenge_id: challengeId,
        progress: 0,
        max_progress: maxProgress,
        completed: false,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating user challenge:', createError);
      return NextResponse.json({ error: 'Failed to join challenge' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userChallenge: {
        id: userChallenge.id,
        challenge_id: challengeId,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        progress: userChallenge.progress,
        max_progress: userChallenge.max_progress,
        reward_points: challenge.reward_points,
        completed: userChallenge.completed,
        started_at: userChallenge.started_at,
        criteria: challenge.criteria,
      },
    });
  } catch (error) {
    console.error('Error in participate API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateMaxProgress(challenge: any): number { // eslint-disable-line @typescript-eslint/no-explicit-any
  // Calculate max progress based on challenge type and criteria
  switch (challenge.type) {
    case 'kda':
      // For KDA challenges, typically need to maintain KDA over X games
      return challenge.criteria?.game_count || 5;
    
    case 'winstreak':
      // For winstreak challenges, progress is the streak length
      return challenge.criteria?.target_value || 5;
    
    case 'champion_mastery':
      // For mastery challenges, progress is mastery points/levels
      return challenge.criteria?.target_value || 21600; // Mastery 7 points requirement
    
    case 'ranked_climb':
      // For ranked challenges, progress is LP or rank progression
      return 100; // Percentage-based progress
    
    case 'games_played':
      // For games played challenges, progress is number of games
      return challenge.criteria?.target_value || 50;
    
    case 'perfect_game':
      // For perfect game challenges, typically just need 1 perfect game
      return 1;
    
    default:
      return 100; // Default percentage-based progress
  }
}