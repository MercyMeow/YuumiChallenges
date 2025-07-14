import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const userId = session.user.id;

    // Get user's active challenges with progress
    const { data: activeChallenges, error } = await supabase
      .from('user_challenges')
      .select(`
        id,
        progress,
        max_progress,
        completed,
        created_at,
        challenges (
          id,
          title,
          description,
          type,
          reward_points,
          criteria
        )
      `)
      .eq('user_id', userId)
      .eq('completed', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active challenges:', error);
      return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
    }

    // Format response
    const formattedChallenges = (activeChallenges || []).map(challenge => {
      const challengeData = Array.isArray(challenge.challenges) 
        ? challenge.challenges[0] 
        : challenge.challenges;
      
      const progressPercentage = challenge.max_progress > 0 
        ? (challenge.progress / challenge.max_progress) * 100 
        : 0;

      return {
        id: challenge.id,
        challengeId: challengeData?.id,
        title: challengeData?.title || 'Unknown Challenge',
        description: challengeData?.description || '',
        type: challengeData?.type || 'other',
        rewardPoints: challengeData?.reward_points || 0,
        progress: challenge.progress,
        maxProgress: challenge.max_progress,
        progressPercentage: Math.round(progressPercentage),
        startedAt: challenge.created_at,
        criteria: challengeData?.criteria || {},
      };
    });

    return NextResponse.json({
      challenges: formattedChallenges,
      totalActive: formattedChallenges.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in challenges active API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}