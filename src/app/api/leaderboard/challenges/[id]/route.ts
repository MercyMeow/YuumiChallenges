import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(
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
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Get challenge leaderboard
    const { data: challengeRankings, error: rankingsError } = await supabase
      .from('user_challenges')
      .select(`
        user_id,
        progress,
        max_progress,
        completed,
        completed_at,
        created_at,
        users (
          id,
          name,
          image,
          is_yuumi_member
        )
      `)
      .eq('challenge_id', challengeId)
      .eq('users.is_yuumi_member', true)
      .order('progress', { ascending: false })
      .order('completed_at', { ascending: true })
      .order('created_at', { ascending: true });

    if (rankingsError) {
      console.error('Error fetching challenge rankings:', rankingsError);
      return NextResponse.json({ error: 'Failed to fetch challenge rankings' }, { status: 500 });
    }

    // Calculate positions and format response
    const rankings = (challengeRankings || []).map((entry, index) => {
      const user = Array.isArray(entry.users) ? entry.users[0] : entry.users;
      return {
        position: index + 1,
        user: {
          id: user?.id || entry.user_id,
          name: user?.name || 'Unknown',
          image: user?.image || '',
        },
        progress: entry.progress,
        maxProgress: entry.max_progress,
        completedAt: entry.completed_at,
        progressPercentage: (entry.progress / entry.max_progress) * 100,
        isCompleted: entry.completed,
      };
    });

    // Find current user's position
    const userPosition = rankings.findIndex(r => r.user.id === session.user.id) + 1 || null;

    return NextResponse.json({
      challenge: {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        reward_points: challenge.reward_points,
        active: challenge.active,
      },
      rankings,
      userPosition,
      totalParticipants: rankings.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in challenge leaderboard API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}