import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: challengeId } = await params;
    const supabase = createServerSupabaseClient();

    // Find the user's participation in this challenge
    const { data: userChallenge, error: findError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('challenge_id', challengeId)
      .single();

    if (findError || !userChallenge) {
      return NextResponse.json({ error: 'Challenge participation not found' }, { status: 404 });
    }

    // Check if the challenge is already completed
    if (userChallenge.completed) {
      return NextResponse.json({ 
        error: 'Cannot leave a completed challenge' 
      }, { status: 400 });
    }

    // Delete the user challenge participation
    const { error: deleteError } = await supabase
      .from('user_challenges')
      .delete()
      .eq('id', userChallenge.id);

    if (deleteError) {
      console.error('Error leaving challenge:', deleteError);
      return NextResponse.json({ error: 'Failed to leave challenge' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully left the challenge',
    });
  } catch (error) {
    console.error('Error in leave challenge API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}