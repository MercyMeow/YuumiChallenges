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

    const summonerId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createServerSupabaseClient();

    // Verify the summoner belongs to the user
    const { data: summoner, error: summonerError } = await supabase
      .from('summoners')
      .select('id, user_id')
      .eq('id', summonerId)
      .eq('user_id', session.user.id)
      .single();

    if (summonerError || !summoner) {
      return NextResponse.json({ error: 'Summoner not found' }, { status: 404 });
    }

    // Get match history with pagination
    const { data: matches, error: matchesError } = await supabase
      .from('match_history')
      .select('*')
      .eq('summoner_id', summonerId)
      .order('game_creation', { ascending: false })
      .range(offset, offset + limit - 1);

    if (matchesError) {
      console.error('Error fetching match history:', matchesError);
      return NextResponse.json({ error: 'Failed to fetch match history' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('match_history')
      .select('*', { count: 'exact', head: true })
      .eq('summoner_id', summonerId);

    if (countError) {
      console.error('Error counting matches:', countError);
    }

    const hasMore = (offset + limit) < (count || 0);
    const nextCursor = hasMore ? (offset + limit).toString() : null;

    return NextResponse.json({
      matches: matches || [],
      pagination: {
        hasMore,
        nextCursor,
        total: count || 0,
      },
    });
  } catch (error) {
    console.error('Error in match history API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}