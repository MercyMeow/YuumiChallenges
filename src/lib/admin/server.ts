import 'server-only';

import { ConvexHttpClient } from 'convex/browser';
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import {
  adminBuildPayloadSchema,
  adminDocumentIdSchema,
  adminItemPayloadSchema,
} from './types';
import type {
  AdminBuild,
  AdminBuildPayload,
  AdminItem,
  AdminItemPayload,
  AdminUser,
} from './types';
import {
  isAllowedAdminOrigin,
  isJsonRecord,
  shouldUseSecureAdminCookie,
} from './utils';

export const ADMIN_SESSION_COOKIE = 'yq_admin_session';
const ADMIN_SESSION_COOKIE_PATH = '/api/admin';

type AdminSessionRecord = {
  token: string;
  user: AdminUser;
};

export class AdminApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

function getConvexClient(): ConvexHttpClient {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    throw new AdminApiError(503, 'Admin API unavailable');
  }
  return new ConvexHttpClient(convexUrl);
}

export function createNoStoreJsonResponse(
  body: unknown,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export function clearAdminSessionCookie(
  response: NextResponse,
  request: NextRequest
): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: shouldUseSecureAdminCookie(
      request.nextUrl.protocol,
      request.nextUrl.hostname
    ),
    path: ADMIN_SESSION_COOKIE_PATH,
    expires: new Date(0),
  });
}

export function setAdminSessionCookie(
  response: NextResponse,
  request: NextRequest,
  token: string,
  expiresAt: number
): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: shouldUseSecureAdminCookie(
      request.nextUrl.protocol,
      request.nextUrl.hostname
    ),
    path: ADMIN_SESSION_COOKIE_PATH,
    expires: new Date(expiresAt),
  });
}

export function enforceAdminOrigin(request: NextRequest): void {
  if (
    !isAllowedAdminOrigin(request.headers.get('origin'), request.nextUrl.origin)
  ) {
    throw new AdminApiError(403, 'Invalid origin');
  }
}

export async function readAdminJsonBody(
  request: NextRequest
): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    throw new AdminApiError(400, 'Invalid JSON body');
  }

  if (!isJsonRecord(parsed)) {
    throw new AdminApiError(400, 'Invalid JSON body');
  }

  return parsed;
}

function describeValidationIssue(issue: {
  path: PropertyKey[];
  message: string;
}): string {
  const field = issue.path.map(String).join('.');
  return field ? `${field}: ${issue.message}` : issue.message;
}

export function parseAdminItemPayload(
  body: Record<string, unknown>
): AdminItemPayload {
  const result = adminItemPayloadSchema.safeParse(body);
  if (!result.success) {
    throw new AdminApiError(
      422,
      `Invalid item payload: ${describeValidationIssue(result.error.issues[0]!)}`
    );
  }
  const { id, ...payload } = result.data;
  return id ? { ...payload, id } : payload;
}

export function parseAdminBuildPayload(
  body: Record<string, unknown>
): AdminBuildPayload {
  const result = adminBuildPayloadSchema.safeParse(body);
  if (!result.success) {
    throw new AdminApiError(
      422,
      `Invalid build payload: ${describeValidationIssue(result.error.issues[0]!)}`
    );
  }
  const { id, ...payload } = result.data;
  return id ? { ...payload, id } : payload;
}

export function parseAdminDocumentId(
  value: string | null,
  subject: 'build' | 'item'
): string {
  const result = adminDocumentIdSchema.safeParse(value);
  if (!result.success) {
    throw new AdminApiError(400, `Invalid ${subject} id`);
  }
  return result.data;
}

export function requireStringField(
  body: Record<string, unknown>,
  key: string,
  errorMessage = `Missing ${key}`
): string {
  const value = body[key];
  if (typeof value !== 'string') {
    throw new AdminApiError(400, errorMessage);
  }
  return value;
}

function readAdminSessionToken(request: NextRequest): string | null {
  return request.cookies.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export async function getAdminSession(
  request: NextRequest
): Promise<AdminSessionRecord | null> {
  const token = readAdminSessionToken(request);
  if (!token) {
    return null;
  }

  const session = await getConvexClient().query(api.auth.verifySession, {
    sessionToken: token,
  });
  if (!session) {
    return null;
  }

  return {
    token,
    user: session.user,
  };
}

export async function requireGuideEditorSession(
  request: NextRequest
): Promise<AdminSessionRecord> {
  const session = await getAdminSession(request);
  if (!session) {
    throw new AdminApiError(401, 'Unauthorized');
  }
  if (session.user.role !== 'admin' && session.user.role !== 'editor') {
    throw new AdminApiError(403, 'Forbidden');
  }
  return session;
}

export async function loginAdmin(username: string, password: string) {
  const result = await getConvexClient().mutation(api.auth.login, {
    username,
    password,
  });
  if (!result.ok) {
    throw new AdminApiError(401, 'Invalid credentials');
  }
  return result;
}

export async function logoutAdmin(token: string) {
  return await getConvexClient().mutation(api.auth.logout, {
    sessionToken: token,
  });
}

export async function fetchAdminBuilds(sessionToken: string) {
  const builds = await getConvexClient().query(api.guide.getAllBuilds, {
    sessionToken,
  });
  return builds.map(({ _id, _creationTime: _ignored, ...build }) => {
    void _ignored;
    return { id: _id, ...build };
  });
}

export async function saveAdminBuild(
  sessionToken: string,
  payload: AdminBuildPayload
): Promise<AdminBuild> {
  const { id, ...rest } = payload;
  const savedId = await getConvexClient().mutation(api.guide.upsertBuild, {
    sessionToken,
    ...rest,
    ...(id ? { id: id as Id<'guideBuilds'> } : {}),
  });
  return {
    ...rest,
    id: savedId,
    updatedAt: Date.now(),
  };
}

export async function deleteAdminBuild(sessionToken: string, id: string) {
  return await getConvexClient().mutation(api.guide.deleteBuild, {
    sessionToken,
    id: id as Id<'guideBuilds'>,
  });
}

export async function fetchAdminItems(sessionToken: string) {
  const items = await getConvexClient().query(api.guide.getAllItems, {
    sessionToken,
  });
  return items.map(({ _id, _creationTime: _ignored, ...item }) => {
    void _ignored;
    return { id: _id, ...item };
  });
}

export async function saveAdminItem(
  sessionToken: string,
  payload: AdminItemPayload
): Promise<AdminItem> {
  const { id, ...rest } = payload;
  const savedId = await getConvexClient().mutation(api.guide.upsertItem, {
    sessionToken,
    ...rest,
    ...(id ? { id: id as Id<'guideItems'> } : {}),
  });
  return {
    ...rest,
    id: savedId,
    updatedAt: Date.now(),
  };
}

export async function deleteAdminItem(sessionToken: string, id: string) {
  return await getConvexClient().mutation(api.guide.deleteItem, {
    sessionToken,
    id: id as Id<'guideItems'>,
  });
}

export function createAdminErrorResponse(
  error: unknown,
  request: NextRequest
): NextResponse {
  const status = error instanceof AdminApiError ? error.status : 500;
  const message =
    error instanceof AdminApiError ? error.message : 'Internal server error';
  if (!(error instanceof AdminApiError)) {
    console.error('[admin] API request failed:', error);
  }
  const response = createNoStoreJsonResponse({ error: message }, { status });
  if (status === 401) {
    clearAdminSessionCookie(response, request);
  }
  return response;
}
