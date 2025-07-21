import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
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
      .eq('discord_id', session.user.id)
      .single();

    if (!user || (user.user_role !== 'admin' && user.user_role !== 'owner')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const actionType = searchParams.get('action_type');
    const targetType = searchParams.get('target_type');
    const adminId = searchParams.get('admin_id');

    // Build query
    let query = supabase
      .from('admin_actions')
      .select(`
        *,
        admin:users!admin_id (
          username,
          avatar
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (actionType) {
      query = query.eq('action_type', actionType);
    }
    if (targetType) {
      query = query.eq('target_type', targetType);
    }
    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: actions, error } = await query;

    if (error) {
      console.error('Error fetching audit log:', error);
      return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('admin_actions')
      .select('*', { count: 'exact', head: true });

    const pagination = {
      page,
      limit,
      total: totalCount || 0,
      hasMore: (from + limit) < (totalCount || 0)
    };

    return NextResponse.json({
      actions: actions || [],
      pagination
    });

  } catch (error) {
    console.error('Error in admin audit API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}