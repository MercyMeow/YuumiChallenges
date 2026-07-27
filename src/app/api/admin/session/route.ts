import { NextRequest } from 'next/server';
import {
  createAdminErrorResponse,
  createNoStoreJsonResponse,
  getAdminSession,
} from '@/lib/admin/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession(request);
    return createNoStoreJsonResponse({
      user: session?.user ?? null,
    });
  } catch (error) {
    return createAdminErrorResponse(error, request);
  }
}
