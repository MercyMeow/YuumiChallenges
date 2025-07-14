import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    
    // Get user's active challenges
    const { data: activeChallenges, error: activeError } = await supabase
      .from('user_challenges')
      .select(`
        *,
        challenges (
          id,
          title,
          description,
          type,
          criteria,
          reward_points,
          active,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', session.user.id)
      .eq('completed', false)
      .order('created_at', { ascending: false });

    if (activeError) {
      console.error('Error fetching active challenges:', activeError);
      return NextResponse.json({ error: 'Failed to fetch active challenges' }, { status: 500 });
    }

    // Get available challenges that user hasn't joined
    const userChallengeIds = activeChallenges?.map(uc => uc.challenge_id) || [];
    
    let availableQuery = supabase
      .from('challenges')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (userChallengeIds.length > 0) {
      availableQuery = availableQuery.not('id', 'in', `(${userChallengeIds.join(',')})`);
    }

    const { data: availableChallenges, error: availableError } = await availableQuery;

    if (availableError) {
      console.error('Error fetching available challenges:', availableError);
      return NextResponse.json({ error: 'Failed to fetch available challenges' }, { status: 500 });
    }

    // Get completed challenges
    const { data: completedChallenges, error: completedError } = await supabase
      .from('user_challenges')
      .select(`
        *,
        challenges (
          id,
          title,
          description,
          type,
          criteria,
          reward_points,
          active,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', session.user.id)
      .eq('completed', true)
      .order('completed_at', { ascending: false });

    if (completedError) {
      console.error('Error fetching completed challenges:', completedError);
      return NextResponse.json({ error: 'Failed to fetch completed challenges' }, { status: 500 });
    }

    // Get participant counts for available challenges
    const challengeParticipants = await Promise.all(
      (availableChallenges || []).map(async (challenge) => {
        const { count } = await supabase
          .from('user_challenges')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id);
        
        return {
          ...challenge,
          participants: count || 0
        };
      })
    );

    // Calculate stats
    const stats = {
      totalCompleted: completedChallenges?.length || 0,
      totalPoints: completedChallenges?.reduce((sum, uc) => sum + (uc.challenges?.reward_points || 0), 0) || 0,
      activeCount: activeChallenges?.length || 0,
    };

    return NextResponse.json({
      active: activeChallenges?.map(uc => ({
        id: uc.id,
        challenge_id: uc.challenge_id,
        title: uc.challenges?.title,
        description: uc.challenges?.description,
        type: uc.challenges?.type,
        progress: uc.progress,
        max_progress: uc.max_progress,
        reward_points: uc.challenges?.reward_points,
        completed: uc.completed,
        completed_at: uc.completed_at,
        started_at: uc.created_at,
        criteria: uc.challenges?.criteria,
      })) || [],
      available: challengeParticipants.map(challenge => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        criteria: challenge.criteria,
        reward_points: challenge.reward_points,
        participants: challenge.participants,
        difficulty: calculateDifficulty(challenge),
        featured: challenge.featured || false,
      })),
      completed: completedChallenges?.map(uc => ({
        id: uc.id,
        challenge_id: uc.challenge_id,
        title: uc.challenges?.title,
        description: uc.challenges?.description,
        type: uc.challenges?.type,
        progress: uc.progress,
        max_progress: uc.max_progress,
        reward_points: uc.challenges?.reward_points,
        completed: uc.completed,
        completed_at: uc.completed_at,
        started_at: uc.created_at,
      })) || [],
      stats,
    });
  } catch (error) {
    console.error('Error in challenges API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateDifficulty(challenge: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  // Simple difficulty calculation based on challenge type and criteria
  switch (challenge.type) {
    case 'kda':
      const kdaTarget = challenge.criteria?.target_value || 2.0;
      if (kdaTarget >= 3.0) return 'Hard';
      if (kdaTarget >= 2.5) return 'Medium';
      return 'Easy';
    
    case 'winstreak':
      const winstreakTarget = challenge.criteria?.target_value || 5;
      if (winstreakTarget >= 10) return 'Extreme';
      if (winstreakTarget >= 7) return 'Hard';
      if (winstreakTarget >= 5) return 'Medium';
      return 'Easy';
    
    case 'champion_mastery':
      const masteryTarget = challenge.criteria?.target_value || 5;
      if (masteryTarget >= 7) return 'Hard';
      if (masteryTarget >= 6) return 'Medium';
      return 'Easy';
    
    case 'ranked_climb':
      const rankTarget = challenge.criteria?.target_rank || 'SILVER';
      if (['DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rankTarget)) return 'Extreme';
      if (['PLATINUM'].includes(rankTarget)) return 'Hard';
      if (['GOLD'].includes(rankTarget)) return 'Medium';
      return 'Easy';
    
    case 'games_played':
      const gamesTarget = challenge.criteria?.target_value || 50;
      if (gamesTarget >= 200) return 'Hard';
      if (gamesTarget >= 100) return 'Medium';
      return 'Easy';
    
    case 'perfect_game':
      return 'Extreme';
    
    default:
      return 'Medium';
  }
}