import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions (only admins can toggle challenges)
    const supabase = createServerSupabaseClient();
    const { data: user } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', session.user.id)
      .single();

    if (!user || user.user_role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { active } = await request.json();

    if (typeof active !== 'boolean') {
      return NextResponse.json({ error: 'Invalid active status' }, { status: 400 });
    }

    // Get the challenge
    const { data: challenge } = await supabase
      .from('challenges')
      .select('title')
      .eq('id', id)
      .single();

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    // Toggle challenge active status
    const { error: updateError } = await supabase
      .from('challenges')
      .update({ 
        active: active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error toggling challenge:', updateError);
      return NextResponse.json({ error: 'Failed to toggle challenge' }, { status: 500 });
    }

    // Log the admin action
    await supabase
      .from('admin_actions')
      .insert({
        admin_id: session.user.id,
        action_type: active ? 'challenge_activated' : 'challenge_deactivated',
        target_type: 'challenge',
        target_id: id,
        details: {
          title: challenge.title,
          active: active
        }
      });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in admin toggle challenge API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}