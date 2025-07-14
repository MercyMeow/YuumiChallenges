import { requireAuth, createAuthResponse } from '@/lib/api/middleware/auth';
import { handleApiError } from '@/lib/api/utils/error-handler';
import { createSuccessResponse } from '@/lib/api/utils/response-helpers';
import { getCachedCommunityStats } from '@/lib/cache/community-stats';

export async function GET() {
  try {
    const authResult = await requireAuth();
    const authResponse = createAuthResponse(authResult);
    if (authResponse) return authResponse;
    
    // Get cached community stats
    const stats = await getCachedCommunityStats();
    
    return createSuccessResponse(stats);
  } catch (error) {
    return handleApiError(error, 'GET /api/community/stats');
  }
}