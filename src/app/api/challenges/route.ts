// import { NextResponse } from 'next/server';
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
      throw new ApiError(500, 'Failed to fetch active challenges', 'DATABASE_ERROR', activeError);
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
      throw new ApiError(500, 'Failed to fetch available challenges', 'DATABASE_ERROR', availableError);
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
      throw new ApiError(500, 'Failed to fetch completed challenges', 'DATABASE_ERROR', completedError);
    }

    // Get participant counts for all available challenges in a single query
    const challengeIds = availableChallenges?.map(c => c.id) || [];
    const participantCounts: Record<string, number> = {};
    
    if (challengeIds.length > 0) {
      const { data: participantData, error: participantError } = await supabase
        .from('user_challenges')
        .select('challenge_id')
        .in('challenge_id', challengeIds);
      
      if (participantError) {
        console.error('Error fetching participant counts:', participantError);
      } else if (participantData) {
        // Count participants per challenge
        participantData.forEach(p => {
          participantCounts[p.challenge_id] = (participantCounts[p.challenge_id] || 0) + 1;
        });
      }
    }
    
    // Map participant counts to challenges
    const challengeParticipants = (availableChallenges || []).map(challenge => ({
      ...challenge,
      participants: participantCounts[challenge.id] || 0
    }));

    // Calculate stats
    const stats = {
      totalCompleted: completedChallenges?.length || 0,
      totalPoints: completedChallenges?.reduce((sum, uc) => sum + (uc.challenges?.reward_points || 0), 0) || 0,
      activeCount: activeChallenges?.length || 0,
    };

    return createSuccessResponse({
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
    return handleApiError(error, 'GET /api/challenges');
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