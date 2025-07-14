import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin or moderator permissions
    const supabase = createServerSupabaseClient();
    const { data: user } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', session.user.id)
      .single();

    if (!user || (user.user_role !== 'admin' && user.user_role !== 'moderator')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all challenges with participation stats
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select(`
        *,
        users!created_by (
          username
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching challenges:', error);
      return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 });
    }

    // Get participation stats for each challenge
    const challengeStats = await Promise.all(
      challenges?.map(async (challenge) => {
        const { count: participants } = await supabase
          .from('user_challenges')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id);

        const { count: completions } = await supabase
          .from('user_challenges')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id)
          .eq('completed', true);

        const completion_rate = (participants || 0) > 0 ? ((completions || 0) / (participants || 1)) * 100 : 0;

        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          type: challenge.type,
          criteria: challenge.criteria,
          reward_points: challenge.reward_points,
          active: challenge.active,
          featured: challenge.featured,
          created_at: challenge.created_at,
          updated_at: challenge.updated_at,
          participants: participants || 0,
          completions: completions || 0,
          completion_rate: completion_rate
        };
      }) || []
    );

    return NextResponse.json({
      challenges: challengeStats
    });

  } catch (error) {
    console.error('Error in admin challenges API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions (only admins can create challenges)
    const supabase = createServerSupabaseClient();
    const { data: user } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', session.user.id)
      .single();

    if (!user || user.user_role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const challengeData = await request.json();

    // Validate required fields
    if (!challengeData.title || !challengeData.description || !challengeData.type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create challenge
    const { data: challenge, error } = await supabase
      .from('challenges')
      .insert({
        title: challengeData.title,
        description: challengeData.description,
        type: challengeData.type,
        criteria: challengeData.criteria || {},
        reward_points: challengeData.reward_points || 100,
        active: challengeData.active !== false,
        featured: challengeData.featured || false,
        created_by: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating challenge:', error);
      return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 });
    }

    // Log the admin action
    await supabase
      .from('admin_actions')
      .insert({
        admin_id: session.user.id,
        action_type: 'challenge_created',
        target_type: 'challenge',
        target_id: challenge.id,
        details: {
          title: challenge.title,
          type: challenge.type,
          reward_points: challenge.reward_points
        }
      });

    return NextResponse.json({ success: true, challenge });

  } catch (error) {
    console.error('Error in admin create challenge API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}