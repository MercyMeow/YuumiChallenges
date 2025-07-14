import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { requireAuth, createAuthResponse } from '@/lib/api/middleware/auth';
import { handleApiError, ApiError } from '@/lib/api/utils/error-handler';
import { createSuccessResponse } from '@/lib/api/utils/response-helpers';
import { getPaginationParams, createPaginatedResponse } from '@/lib/api/utils/pagination';
// import { executeQuery, batchQuery } from '@/lib/api/utils/query-helpers';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    const authResponse = createAuthResponse(authResult);
    if (authResponse) return authResponse;
    
    const session = authResult.session!;
    const supabase = createServerSupabaseClient();
    const paginationParams = getPaginationParams(request);

    // Get user points with ranking calculation
    const { data: pointsData, error: pointsError } = await supabase
      .from('user_points')
      .select(`
        user_id,
        total_points,
        rank_position,
        created_at,
        updated_at,
        users (
          id,
          name,
          image,
          user_role,
          is_yuumi_member,
          last_activity
        )
      `)
      .eq('users.is_yuumi_member', true)
      .order('rank_position', { ascending: true })
      .range(paginationParams.offset, paginationParams.offset + paginationParams.limit - 1);

    if (pointsError) {
      throw new ApiError(500, 'Failed to fetch points leaderboard', 'DATABASE_ERROR', pointsError);
    }

    // Get challenge completion counts for each user
    const userIds = pointsData?.map(p => p.user_id) || [];
    let challengeCompletions: Record<string, number> = {};
    
    if (userIds.length > 0) {
      const { data: challengeData } = await supabase
        .from('user_challenges')
        .select('user_id, completed')
        .in('user_id', userIds)
        .eq('completed', true);
      
      // Group challenge completions by user
      challengeCompletions = (challengeData || []).reduce((acc, challenge) => {
        acc[challenge.user_id] = (acc[challenge.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('user_points')
      .select('*', { count: 'exact', head: true })
      .eq('users.is_yuumi_member', true);

    if (countError) {
      console.error('Error counting leaderboard entries:', countError);
    }

    // Find current user's position
    const currentUserPosition = pointsData?.find(p => p.user_id === session.user.id)?.rank_position || null;

    // Format response
    const rankings = (pointsData || []).map(entry => {
      const user = Array.isArray(entry.users) ? entry.users[0] : entry.users;
      return {
        position: entry.rank_position,
        user: {
          id: user?.id || entry.user_id,
          name: user?.name || 'Unknown',
          image: user?.image || '',
          role: user?.user_role || 'member',
        },
        points: entry.total_points,
        completedChallenges: challengeCompletions[entry.user_id] || 0,
        lastActivity: formatLastActivity(user?.last_activity),
        change: 0, // TODO: Calculate position change from previous period
      };
    });

    const response = createPaginatedResponse(
      rankings,
      count || 0,
      paginationParams
    );
    
    return createSuccessResponse({
      ...response,
      userPosition: currentUserPosition,
      totalPlayers: count || 0,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/leaderboard/points');
  }
}

function formatLastActivity(lastActivity: string | null): string {
  if (!lastActivity) return 'Never';
  
  const now = new Date();
  const last = new Date(lastActivity);
  const diffInHours = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} months ago`;
}