import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin or owner permissions
    const supabase = createServerSupabaseClient();
    const { data: user } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', session.user.id)
      .single();

    if (!user || (user.user_role !== 'admin' && user.user_role !== 'owner')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all users with their challenge statistics
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        avatar,
        discord_id,
        user_role,
        is_yuumi_member,
        updated_at,
        created_at,
        user_points (
          total_points,
          challenges_completed
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Format user data for admin view
    const formattedUsers = users?.map(user => ({
      id: user.id,
      name: user.username,
      image: user.avatar,
      discord_id: user.discord_id,
      user_role: user.user_role,
      is_yuumi_member: user.is_yuumi_member,
      last_activity: user.updated_at,
      total_challenges: 0, // Could be calculated from user_challenges
      completed_challenges: user.user_points?.[0]?.challenges_completed || 0,
      total_points: user.user_points?.[0]?.total_points || 0,
      created_at: user.created_at
    })) || [];

    return NextResponse.json({
      users: formattedUsers
    });

  } catch (error) {
    console.error('Error in admin users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}