import { NextRequest } from 'next/server';
import {
  createAdminErrorResponse,
  createNoStoreJsonResponse,
  enforceAdminOrigin,
  logoutAdmin,
  ADMIN_SESSION_COOKIE,
  clearAdminSessionCookie,
} from '@/lib/admin/server';

export async function POST(request: NextRequest) {
  try {
    enforceAdminOrigin(request);
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (token) {
      try {
        await logoutAdmin(token);
      } catch (error) {
        // Local logout must still discard the browser credential if Convex is
        // temporarily unavailable. The server-side session will expire on its
        // normal TTL and cannot be read back from the httpOnly cookie.
        console.error('[admin] session revocation failed:', error);
      }
    }
    const response = createNoStoreJsonResponse({ ok: true });
    clearAdminSessionCookie(response, request);
    return response;
  } catch (error) {
    return createAdminErrorResponse(error, request);
  }
}
