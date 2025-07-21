import { NextRequest, NextResponse } from 'next/server';
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
      .eq('discord_id', session.user.id)
      .single();

    if (!user || (user.user_role !== 'admin' && user.user_role !== 'owner')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all reports with user information
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:users!reporter_id (
          username,
          avatar
        ),
        reported_user:users!reported_user_id (
          username,
          avatar
        ),
        assigned_admin:users!assigned_to (
          username,
          avatar
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    // Get report statistics
    const { data: pendingReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { data: resolvedReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved');

    const { data: dismissedReports } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'dismissed');

    const stats = {
      pending: pendingReports?.length || 0,
      resolved: resolvedReports?.length || 0,
      dismissed: dismissedReports?.length || 0
    };

    return NextResponse.json({
      reports: reports || [],
      stats
    });

  } catch (error) {
    console.error('Error in admin reports API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const reportData = await request.json();

    // Validate required fields
    if (!reportData.reported_user_id || !reportData.report_type || !reportData.description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create report
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: session.user.id,
        reported_user_id: reportData.reported_user_id,
        report_type: reportData.report_type,
        description: reportData.description,
        evidence_urls: reportData.evidence_urls || [],
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    return NextResponse.json({ success: true, report });

  } catch (error) {
    console.error('Error in admin create report API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}