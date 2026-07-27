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
    let revoked = true;
    if (token) {
      try {
        await logoutAdmin(token);
      } catch (error) {
        console.error('[admin] session revocation failed:', error);
        revoked = false;
      }
    }
    // Explicit logout always removes the browser credential. Backend
    // revocation is best-effort so an outage cannot trap a seven-day cookie
    // in the browser.
    const response = createNoStoreJsonResponse({ ok: true, revoked });
    clearAdminSessionCookie(response, request);
    return response;
  } catch (error) {
    return createAdminErrorResponse(error, request);
  }
}
