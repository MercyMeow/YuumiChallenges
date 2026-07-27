import { NextRequest } from 'next/server';
import {
  createAdminErrorResponse,
  createNoStoreJsonResponse,
  enforceAdminOrigin,
  loginAdmin,
  readAdminJsonBody,
  requireStringField,
  setAdminSessionCookie,
} from '@/lib/admin/server';

export async function POST(request: NextRequest) {
  try {
    enforceAdminOrigin(request);
    const body = await readAdminJsonBody(request);
    const username = requireStringField(body, 'username', 'Missing username');
    const password = requireStringField(body, 'password', 'Missing password');
    const result = await loginAdmin(request, username, password);
    const response = createNoStoreJsonResponse({
      user: result.user,
    });
    setAdminSessionCookie(response, request, result.token, result.expiresAt);
    return response;
  } catch (error) {
    return createAdminErrorResponse(error, request);
  }
}
