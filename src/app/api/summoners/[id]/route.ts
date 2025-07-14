import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summonerId = params.id;
    const supabase = createServerSupabaseClient();

    // Verify the summoner belongs to the user
    const { data: summoner, error: summonerError } = await supabase
      .from('summoners')
      .select('id, user_id, verified')
      .eq('id', summonerId)
      .eq('user_id', session.user.id)
      .single();

    if (summonerError || !summoner) {
      return NextResponse.json({ error: 'Summoner not found' }, { status: 404 });
    }

    // Delete the summoner (cascading will handle related data)
    const { error: deleteError } = await supabase
      .from('summoners')
      .delete()
      .eq('id', summonerId);

    if (deleteError) {
      console.error('Error deleting summoner:', deleteError);
      return NextResponse.json({ error: 'Failed to delete summoner' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Summoner account removed successfully',
    });
  } catch (error) {
    console.error('Error in DELETE summoner API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summonerId = params.id;
    const supabase = createServerSupabaseClient();

    // Get summoner with related data
    const { data: summoner, error: summonerError } = await supabase
      .from('summoners')
      .select(`
        *,
        ranked_info (*),
        match_history (
          *
        )
      `)
      .eq('id', summonerId)
      .eq('user_id', session.user.id)
      .single();

    if (summonerError || !summoner) {
      return NextResponse.json({ error: 'Summoner not found' }, { status: 404 });
    }

    return NextResponse.json({
      summoner,
    });
  } catch (error) {
    console.error('Error in GET summoner API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}