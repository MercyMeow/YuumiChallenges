import 'server-only';

import { ConvexHttpClient } from 'convex/browser';
import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/../convex/_generated/api';
import type { Id } from '@/../convex/_generated/dataModel';
import {
  adminBuildPayloadSchema,
  adminDocumentIdSchema,
  adminItemPayloadSchema,
  describeAdminValidationIssue,
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
export const ADMIN_LOGIN_BODY_MAX_BYTES = 4 * 1024;
export const ADMIN_ITEM_BODY_MAX_BYTES = 32 * 1024;
export const ADMIN_BUILD_BODY_MAX_BYTES = 960 * 1024;
const ADMIN_SESSION_COOKIE_PATH = '/api/admin';
const ADMIN_LOGIN_SOURCE_HEADER = 'cf-connecting-ip';
const ADMIN_LOGIN_SOURCE_MAX_LENGTH = 128;

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

function requireAdminLoginBridgeSecret(): string {
  const secret = process.env.ADMIN_LOGIN_BRIDGE_SECRET;
  if (!secret) {
    throw new AdminApiError(503, 'Admin login unavailable');
  }
  return secret;
}

function readAdminLoginSource(request: NextRequest): string {
  const cloudflareSource = request.headers
    .get(ADMIN_LOGIN_SOURCE_HEADER)
    ?.trim();
  if (
    cloudflareSource &&
    cloudflareSource.length <= ADMIN_LOGIN_SOURCE_MAX_LENGTH
  ) {
    return cloudflareSource;
  }

  // Cloudflare supplies cf-connecting-ip in production. Local development
  // deliberately uses a single fallback bucket; arbitrary forwarded headers
  // are not trusted as attacker-controlled rate-limit identities.
  const hostname = request.nextUrl.hostname.toLowerCase();
  const isLoopback =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname === '::1';
  if (isLoopback || process.env.NODE_ENV !== 'production') {
    return 'local-development';
  }
  throw new AdminApiError(503, 'Admin login unavailable');
}

async function createAdminLoginSourceId(
  request: NextRequest,
  secret: string
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(readAdminLoginSource(request))
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
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
  request: NextRequest,
  maxBytes: number
): Promise<Record<string, unknown>> {
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    const declaredBytes = Number(contentLength);
    if (
      !Number.isSafeInteger(declaredBytes) ||
      declaredBytes < 0 ||
      declaredBytes > maxBytes
    ) {
      throw new AdminApiError(413, 'Request body too large');
    }
  }

  const reader = request.body?.getReader();
  if (!reader) {
    throw new AdminApiError(400, 'Invalid JSON body');
  }

  const decoder = new TextDecoder('utf-8', { fatal: true });
  let totalBytes = 0;
  let body = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        throw new AdminApiError(413, 'Request body too large');
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } catch (error) {
    if (error instanceof AdminApiError) {
      throw error;
    }
    throw new AdminApiError(400, 'Invalid JSON body');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new AdminApiError(400, 'Invalid JSON body');
  }

  if (!isJsonRecord(parsed)) {
    throw new AdminApiError(400, 'Invalid JSON body');
  }

  return parsed;
}

export function parseAdminItemPayload(
  body: Record<string, unknown>
): AdminItemPayload {
  const result = adminItemPayloadSchema.safeParse(body);
  if (!result.success) {
    throw new AdminApiError(
      422,
      `Invalid item payload: ${describeAdminValidationIssue(result.error.issues[0]!)}`
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
      `Invalid build payload: ${describeAdminValidationIssue(result.error.issues[0]!)}`
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

export function requireAdminSessionToken(request: NextRequest): string {
  const token = readAdminSessionToken(request);
  if (!token) {
    throw new AdminApiError(401, 'Unauthorized');
  }
  return token;
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

export async function loginAdmin(
  request: NextRequest,
  username: string,
  password: string
) {
  const secret = requireAdminLoginBridgeSecret();
  const sourceId = await createAdminLoginSourceId(request, secret);
  const result = await getConvexClient().mutation(api.auth.login, {
    secret,
    sourceId,
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
  const saved = await getConvexClient().mutation(api.guide.upsertBuild, {
    sessionToken,
    ...rest,
    ...(id ? { id: id as Id<'guideBuilds'> } : {}),
  });
  const { _id, _creationTime: _ignored, ...build } = saved;
  void _ignored;
  const { updatedAt, ...persistedPayload } = build;
  return {
    ...adminBuildPayloadSchema.parse({ id: _id, ...persistedPayload }),
    id: _id,
    updatedAt,
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
  const saved = await getConvexClient().mutation(api.guide.upsertItem, {
    sessionToken,
    ...rest,
    ...(id ? { id: id as Id<'guideItems'> } : {}),
  });
  const { _id, _creationTime: _ignored, ...item } = saved;
  void _ignored;
  const { updatedAt, ...persistedPayload } = item;
  return {
    ...adminItemPayloadSchema.parse({ id: _id, ...persistedPayload }),
    id: _id,
    updatedAt,
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
  _request: NextRequest
): NextResponse {
  void _request;
  const isUnauthorizedConvexError =
    error instanceof Error &&
    (error.message.trim() === 'Unauthorized' ||
      /(?:^|\r?\n)Uncaught Error: Unauthorized(?:\r?\n|$)/.test(error.message));
  const status =
    error instanceof AdminApiError
      ? error.status
      : isUnauthorizedConvexError
        ? 401
        : 500;
  const message =
    error instanceof AdminApiError
      ? error.message
      : isUnauthorizedConvexError
        ? 'Unauthorized'
        : 'Internal server error';
  if (!(error instanceof AdminApiError) && !isUnauthorizedConvexError) {
    console.error('[admin] API request failed:', error);
  }
  return createNoStoreJsonResponse({ error: message }, { status });
}
