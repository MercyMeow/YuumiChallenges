import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const convexMocks = vi.hoisted(() => ({
  mutation: vi.fn(),
  query: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('convex/browser', () => ({
  ConvexHttpClient: class {
    mutation = convexMocks.mutation;
    query = convexMocks.query;
  },
}));

import { DELETE as deleteBuild, POST as saveBuild } from './builds/route';
import {
  DELETE as deleteItem,
  GET as getItems,
  POST as saveItem,
} from './items/route';

const ITEM_ID = 'a'.repeat(32);
const BUILD_ID = 'b'.repeat(32);
const ADMIN_ORIGIN = 'https://yuumi.quest';
function createRequest(
  path: string,
  init: Omit<RequestInit, 'signal'> = {},
  origin = ADMIN_ORIGIN
) {
  const headers = new Headers(init.headers);
  headers.set('Origin', origin);
  headers.set('Cookie', 'yq_admin_session=session-token');
  return new NextRequest(`${ADMIN_ORIGIN}${path}`, {
    ...init,
    headers,
  });
}

function validItemPayload() {
  return {
    name: 'Moonstone Renewer',
    itemId: 6617,
    category: 'core',
    reason: 'Reliable healing',
    priority: 1,
    isActive: true,
  };
}

function validBuildPayload() {
  return {
    name: 'Aery Support',
    description: 'Standard support build',
    icon: 'star',
    color: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
    isRecommended: true,
    isActive: true,
    priority: 0,
    runes: {
      name: 'Aery',
      primaryTree: 'Sorcery',
      keystone: 'SummonAery',
      primary: ['ManaflowBand', 'Transcendence', 'Scorch'],
      secondaryTree: 'Resolve',
      secondary: ['FontOfLife', 'Revitalize'],
      shards: ['AdaptiveForce', 'AdaptiveForce', 'Health'],
    },
    items: {
      starter: [],
      core: [],
      situational: [],
    },
    skillOrder: {
      priority: 'E > W > Q',
      levels: [
        'E',
        'W',
        'Q',
        'E',
        'E',
        'R',
        'E',
        'W',
        'E',
        'W',
        'R',
        'W',
        'W',
        'Q',
        'Q',
        'R',
        'Q',
        'Q',
      ],
      notes: '',
    },
  };
}

describe('admin guide resource routes', () => {
  beforeEach(() => {
    convexMocks.mutation.mockReset();
    convexMocks.query.mockReset();
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', 'https://convex.example');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    ['POST', saveItem, '/api/admin/items', JSON.stringify(validItemPayload())],
    ['DELETE', deleteItem, `/api/admin/items?id=${ITEM_ID}`, undefined],
  ])(
    'rejects cross-origin item %s before session or persistence work',
    async (method, handler, path, body) => {
      const requestInit: Omit<RequestInit, 'signal'> = {
        method,
        ...(body
          ? {
              headers: { 'Content-Type': 'application/json' },
              body,
            }
          : {}),
      };
      const response = await handler(
        createRequest(path, requestInit, 'https://attacker.example')
      );

      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: 'Invalid origin',
      });
      expect(convexMocks.query).not.toHaveBeenCalled();
      expect(convexMocks.mutation).not.toHaveBeenCalled();
    }
  );

  it('uses the mutation itself as the single authorization boundary', async () => {
    convexMocks.mutation.mockRejectedValue(
      new Error('Uncaught Error: Unauthorized')
    );

    const response = await saveItem(
      createRequest('/api/admin/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validItemPayload()),
      })
    );

    expect(response.status).toBe(401);
    expect(convexMocks.query).not.toHaveBeenCalled();
    expect(convexMocks.mutation).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid JSON and invalid item payloads after authentication', async () => {
    const invalidJsonResponse = await saveItem(
      createRequest('/api/admin/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{not-json',
      })
    );
    expect(invalidJsonResponse.status).toBe(400);
    expect(convexMocks.mutation).not.toHaveBeenCalled();

    const invalidPayloadResponse = await saveItem(
      createRequest('/api/admin/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validItemPayload(),
          itemId: 6617.5,
        }),
      })
    );
    expect(invalidPayloadResponse.status).toBe(422);
    expect(convexMocks.mutation).not.toHaveBeenCalled();
  });

  it('rejects an oversized resource body before JSON parsing', async () => {
    const response = await saveItem(
      createRequest('/api/admin/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validItemPayload(),
          reason: 'x'.repeat(33 * 1024),
        }),
      })
    );

    expect(response.status).toBe(413);
    expect(convexMocks.mutation).not.toHaveBeenCalled();
  });

  it('rejects an invalid item id before deletion', async () => {
    const response = await deleteItem(
      createRequest('/api/admin/items?id=invalid', { method: 'DELETE' })
    );

    expect(response.status).toBe(400);
    expect(convexMocks.mutation).not.toHaveBeenCalled();
  });

  it('returns authenticated item reads through the shared route flow', async () => {
    convexMocks.query.mockResolvedValueOnce([
      {
        _id: ITEM_ID,
        _creationTime: 1,
        ...validItemPayload(),
        updatedAt: 2,
      },
    ]);

    const response = await getItems(
      createRequest('/api/admin/items', { method: 'GET' })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      items: [{ id: ITEM_ID, ...validItemPayload(), updatedAt: 2 }],
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(convexMocks.query).toHaveBeenCalledTimes(1);
  });

  it('saves and deletes an authenticated item', async () => {
    convexMocks.mutation.mockResolvedValueOnce({
      _id: ITEM_ID,
      _creationTime: 1,
      ...validItemPayload(),
      name: 'Persisted item name',
      updatedAt: 123,
    });
    const saveResponse = await saveItem(
      createRequest('/api/admin/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validItemPayload()),
      })
    );

    expect(saveResponse.status).toBe(200);
    await expect(saveResponse.json()).resolves.toMatchObject({
      item: {
        id: ITEM_ID,
        ...validItemPayload(),
        name: 'Persisted item name',
        updatedAt: 123,
      },
    });

    convexMocks.mutation.mockResolvedValueOnce({ success: true });
    const deleteResponse = await deleteItem(
      createRequest(`/api/admin/items?id=${ITEM_ID}`, { method: 'DELETE' })
    );
    expect(deleteResponse.status).toBe(200);
    await expect(deleteResponse.json()).resolves.toEqual({
      deletedId: ITEM_ID,
    });
  });

  it('uses the same validation and persistence flow for builds', async () => {
    const unsupportedIconResponse = await saveBuild(
      createRequest('/api/admin/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validBuildPayload(), icon: 'wand' }),
      })
    );
    expect(unsupportedIconResponse.status).toBe(422);
    expect(convexMocks.mutation).not.toHaveBeenCalled();

    convexMocks.mutation.mockResolvedValueOnce({
      _id: BUILD_ID,
      _creationTime: 1,
      ...validBuildPayload(),
      description: 'Persisted build description',
      updatedAt: 456,
    });
    const saveResponse = await saveBuild(
      createRequest('/api/admin/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validBuildPayload()),
      })
    );
    expect(saveResponse.status).toBe(200);
    await expect(saveResponse.json()).resolves.toMatchObject({
      build: {
        id: BUILD_ID,
        ...validBuildPayload(),
        description: 'Persisted build description',
        updatedAt: 456,
      },
    });

    convexMocks.mutation.mockResolvedValueOnce({ success: true });
    const deleteResponse = await deleteBuild(
      createRequest(`/api/admin/builds?id=${BUILD_ID}`, { method: 'DELETE' })
    );
    expect(deleteResponse.status).toBe(200);
    await expect(deleteResponse.json()).resolves.toEqual({
      deletedId: BUILD_ID,
    });
  });
});
