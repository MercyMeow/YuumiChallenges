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

    // Get dashboard statistics
    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: activeChallenges },
      { count: completedChallenges },
      { count: pendingReports }
    ] = await Promise.all([
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_yuumi_member', true),
      
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_yuumi_member', true)
        .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .eq('active', true),
      
      supabase
        .from('user_challenges')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true),
      
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
    ]);

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('admin_actions')
      .select(`
        id,
        action_type,
        target_type,
        details,
        created_at,
        users!admin_id (
          name,
          image
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    // Format recent activity
    const formattedActivity = recentActivity?.map(action => ({
      id: action.id,
      type: action.action_type,
      description: getActionDescription(action.action_type, action.target_type, action.details),
      timestamp: action.created_at,
      user: {
        name: (Array.isArray(action.users) ? action.users[0]?.name : (action.users as { name?: string })?.name) || 'System',
        image: (Array.isArray(action.users) ? action.users[0]?.image : (action.users as { image?: string })?.image) || undefined
      }
    })) || [];

    // Calculate growth percentages (mock data for now)
    const stats = {
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      activeChallenges: activeChallenges || 0,
      completedChallenges: completedChallenges || 0,
      pendingReports: pendingReports || 0,
      userGrowth: 12.5, // Mock growth percentage
      challengeGrowth: 8.3,
      completionRate: (activeChallenges || 0) > 0 ? ((completedChallenges || 0) / (activeChallenges || 1) * 100) : 0
    };

    return NextResponse.json({
      stats,
      recentActivity: formattedActivity
    });

  } catch (error) {
    console.error('Error in admin dashboard API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getActionDescription(actionType: string, targetType: string, details: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  switch (actionType) {
    case 'user_role_changed':
      return `Changed user role to ${details.newRole}`;
    case 'challenge_created':
      return `Created new challenge: ${details.title}`;
    case 'challenge_updated':
      return `Updated challenge: ${details.title}`;
    case 'challenge_deleted':
      return `Deleted challenge: ${details.title}`;
    case 'user_banned':
      return `Banned user: ${details.username}`;
    case 'report_resolved':
      return `Resolved report: ${details.reportType}`;
    default:
      return `Performed ${actionType} on ${targetType}`;
  }
}