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
    const userId = session.user.id;

    // Get top 3 users from leaderboard
    const { data: topUsers, error } = await supabase
      .from('user_points')
      .select(`
        user_id,
        total_points,
        rank_position,
        users (
          id,
          name,
          image,
          is_yuumi_member
        )
      `)
      .eq('users.is_yuumi_member', true)
      .order('rank_position', { ascending: true })
      .limit(3);

    if (error) {
      console.error('Error fetching leaderboard preview:', error);
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
    }

    // Get current user's position and points
    const { data: currentUser } = await supabase
      .from('user_points')
      .select(`
        user_id,
        total_points,
        rank_position,
        users (
          id,
          name,
          image,
          is_yuumi_member
        )
      `)
      .eq('user_id', userId)
      .single();

    // Format top users
    const formattedTopUsers = (topUsers || []).map(user => {
      const userData = Array.isArray(user.users) ? user.users[0] : user.users;
      return {
        position: user.rank_position,
        user: {
          id: userData?.id || user.user_id,
          name: userData?.name || 'Unknown',
          image: userData?.image || '',
        },
        points: user.total_points,
      };
    });

    // Format current user data
    let currentUserData = null;
    if (currentUser) {
      const userData = Array.isArray(currentUser.users) ? currentUser.users[0] : currentUser.users;
      currentUserData = {
        position: currentUser.rank_position,
        user: {
          id: userData?.id || currentUser.user_id,
          name: userData?.name || 'Unknown',
          image: userData?.image || '',
        },
        points: currentUser.total_points,
      };
    }

    // Get total number of participants
    const { count: totalParticipants } = await supabase
      .from('user_points')
      .select('*', { count: 'exact', head: true })
      .eq('users.is_yuumi_member', true);

    return NextResponse.json({
      topUsers: formattedTopUsers,
      currentUser: currentUserData,
      totalParticipants: totalParticipants || 0,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in leaderboard preview API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}