import type {
  AdminBuild,
  AdminBuildPayload,
  AdminItem,
  AdminItemPayload,
  AdminUser,
} from './types';
import { getAdminErrorMessage } from './utils';

type AdminSessionResponse = {
  user: AdminUser | null;
};

type AdminBuildsResponse = {
  builds: AdminBuild[];
};

type AdminItemsResponse = {
  items: AdminItem[];
};

type AdminAuthorizationFailureStatus = 401 | 403;
type AdminAuthorizationFailureListener = (
  status: AdminAuthorizationFailureStatus
) => void;

const authorizationFailureListeners =
  new Set<AdminAuthorizationFailureListener>();
let adminSessionEpoch = 0;

export class AdminClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AdminClientError';
    this.status = status;
  }
}

export function subscribeToAdminAuthorizationFailures(
  listener: AdminAuthorizationFailureListener
): () => void {
  authorizationFailureListeners.add(listener);
  return () => {
    authorizationFailureListeners.delete(listener);
  };
}

export function getAdminSessionEpoch(): number {
  return adminSessionEpoch;
}

/**
 * Establishes a new authoritative browser-session epoch and fences every
 * request started under the preceding cookie state.
 */
export function advanceAdminSessionEpoch(): number {
  adminSessionEpoch += 1;
  return adminSessionEpoch;
}

function reportAdminAuthorizationFailure(
  status: number,
  requestGeneration: number
): void {
  if (status !== 401 && status !== 403) {
    return;
  }
  if (requestGeneration !== adminSessionEpoch) {
    return;
  }

  for (const listener of authorizationFailureListeners) {
    listener(status);
  }
}

async function readJsonPayload(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function adminRequest<T>(
  input: RequestInfo,
  init: RequestInit,
  fallbackMessage: string,
  reportAuthorizationFailure = true
): Promise<T> {
  const requestGeneration = adminSessionEpoch;
  const response = await fetch(input, {
    cache: 'no-store',
    credentials: 'same-origin',
    ...init,
  });
  const payload = await readJsonPayload(response);
  if (!response.ok) {
    if (reportAuthorizationFailure) {
      reportAdminAuthorizationFailure(response.status, requestGeneration);
    }
    throw new AdminClientError(
      getAdminErrorMessage(payload, fallbackMessage),
      response.status
    );
  }
  return payload as T;
}

export async function fetchAdminSession(): Promise<AdminUser | null> {
  const payload = await adminRequest<AdminSessionResponse>(
    '/api/admin/session',
    { method: 'GET' },
    'Unable to verify your admin session.'
  );
  return payload.user;
}

export async function loginAdminRequest(
  username: string,
  password: string
): Promise<AdminUser> {
  const payload = await adminRequest<{ user: AdminUser }>(
    '/api/admin/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    },
    'Invalid credentials',
    false
  );
  return payload.user;
}

export async function logoutAdminRequest(): Promise<void> {
  await adminRequest<{ ok: boolean }>(
    '/api/admin/logout',
    { method: 'POST' },
    'Unable to log out right now.'
  );
}

export async function fetchAdminBuildsRequest(): Promise<AdminBuild[]> {
  const payload = await adminRequest<AdminBuildsResponse>(
    '/api/admin/builds',
    { method: 'GET' },
    'Unable to load guide builds right now.'
  );
  return payload.builds;
}

export async function saveAdminBuildRequest(
  payload: AdminBuildPayload
): Promise<AdminBuild> {
  const response = await adminRequest<{ build: AdminBuild }>(
    '/api/admin/builds',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    'Unable to save the build right now.'
  );
  return response.build;
}

export async function deleteAdminBuildRequest(id: string): Promise<string> {
  const response = await adminRequest<{ deletedId: string }>(
    `/api/admin/builds?id=${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    'Unable to delete the build right now.'
  );
  return response.deletedId;
}

export async function fetchAdminItemsRequest(): Promise<AdminItem[]> {
  const payload = await adminRequest<AdminItemsResponse>(
    '/api/admin/items',
    { method: 'GET' },
    'Unable to load guide items right now.'
  );
  return payload.items;
}

export async function saveAdminItemRequest(
  payload: AdminItemPayload
): Promise<AdminItem> {
  const response = await adminRequest<{ item: AdminItem }>(
    '/api/admin/items',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    'Unable to save the item right now.'
  );
  return response.item;
}

export async function deleteAdminItemRequest(id: string): Promise<string> {
  const response = await adminRequest<{ deletedId: string }>(
    `/api/admin/items?id=${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    'Unable to delete the item right now.'
  );
  return response.deletedId;
}
