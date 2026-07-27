import { NextRequest } from 'next/server';
import {
  clearAdminSessionCookie,
  createAdminErrorResponse,
  createNoStoreJsonResponse,
  getAdminSession,
} from '@/lib/admin/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    const response = createNoStoreJsonResponse({
      user: session?.user ?? null,
    });
    if (!session) {
      clearAdminSessionCookie(response, request);
    }
    return response;
  } catch (error) {
    return createAdminErrorResponse(error, request);
  }
}
