import { NextRequest } from 'next/server';
import {
  AdminApiError,
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
        console.error('[admin] session revocation failed:', error);
        throw new AdminApiError(502, 'Unable to revoke admin session');
      }
    }
    const response = createNoStoreJsonResponse({ ok: true });
    clearAdminSessionCookie(response, request);
    return response;
  } catch (error) {
    return createAdminErrorResponse(error, request);
  }
}
