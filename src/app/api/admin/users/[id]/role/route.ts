import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions (only admins can change roles)
    const supabase = createServerSupabaseClient();
    const { data: admin } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', session.user.id)
      .single();

    if (!admin || admin.user_role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { newRole, reason } = await request.json();

    if (!newRole || !['member', 'moderator', 'admin'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Get the target user
    const { data: targetUser } = await supabase
      .from('users')
      .select('username, user_role')
      .eq('id', id)
      .single();

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user role
    const { error: updateError } = await supabase
      .from('users')
      .update({ user_role: newRole })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating user role:', updateError);
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    // Log the admin action
    await supabase
      .from('admin_actions')
      .insert({
        admin_id: session.user.id,
        action_type: 'user_role_changed',
        target_type: 'user',
        target_id: id,
        details: {
          username: targetUser.username,
          oldRole: targetUser.user_role,
          newRole: newRole,
          reason: reason || 'No reason provided'
        }
      });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in admin user role update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}