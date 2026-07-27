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

import { POST as login } from './login/route';
import { POST as logout } from './logout/route';
import { GET as readSession } from './session/route';
import { GET as readItems } from './items/route';

describe('admin API route contracts', () => {
  beforeEach(() => {
    convexMocks.mutation.mockReset();
    convexMocks.query.mockReset();
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', 'https://convex.example');
    vi.stubEnv('ADMIN_LOGIN_BRIDGE_SECRET', 'test-admin-login-bridge-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('rejects a cross-origin login before contacting Convex', async () => {
    const response = await login(
      new NextRequest('https://yuumi.quest/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://attacker.example',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'correct-horse',
        }),
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid origin',
    });
    expect(convexMocks.mutation).not.toHaveBeenCalled();
  });

  it('clears an invalid session cookie over local HTTP', async () => {
    convexMocks.query.mockResolvedValue(null);
    const response = await readSession(
      new NextRequest('http://localhost/api/admin/session', {
        headers: { Cookie: 'yq_admin_session=expired-token' },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: null });
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('yq_admin_session=');
    expect(setCookie).toContain('Path=/api/admin');
    expect(setCookie).toContain('Expires=Thu, 01 Jan 1970');
    expect(setCookie).not.toContain('Secure');
  });

  it('does not mutate cookies when a cross-site session GET has no cookie', async () => {
    const response = await readSession(
      new NextRequest('https://yuumi.quest/api/admin/session', {
        headers: { Origin: 'https://attacker.example' },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: null });
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(convexMocks.query).not.toHaveBeenCalled();
  });

  it('fails closed when the admin-login bridge secret is missing', async () => {
    vi.stubEnv('ADMIN_LOGIN_BRIDGE_SECRET', '');
    const response = await login(
      new NextRequest('https://yuumi.quest/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://yuumi.quest',
          'cf-connecting-ip': '203.0.113.42',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'correct-horse',
        }),
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: 'Admin login unavailable',
    });
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(convexMocks.mutation).not.toHaveBeenCalled();
  });

  it('keeps the admin cookie when server-side logout revocation fails', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    convexMocks.mutation.mockRejectedValue(
      new Error('Uncaught Error: Unauthorized')
    );

    const response = await logout(
      new NextRequest('https://yuumi.quest/api/admin/logout', {
        method: 'POST',
        headers: {
          Origin: 'https://yuumi.quest',
          Cookie: 'yq_admin_session=session-token',
        },
      })
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to revoke admin session',
    });
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(convexMocks.mutation).toHaveBeenCalledWith(expect.anything(), {
      sessionToken: 'session-token',
    });
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it('translates a late Convex authorization failure to 401', async () => {
    convexMocks.query
      .mockResolvedValueOnce({
        user: { id: 'admin-id', username: 'admin', role: 'admin' },
      })
      .mockRejectedValueOnce(
        new Error(
          '[CONVEX Q(guide:getAllItems)] Server Error\n' +
            'Uncaught Error: Unauthorized\n' +
            '    at handler'
        )
      );

    const response = await readItems(
      new NextRequest('https://yuumi.quest/api/admin/items', {
        headers: { Cookie: 'yq_admin_session=session-token' },
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: 'Unauthorized',
    });
    expect(response.headers.get('set-cookie')).toContain('yq_admin_session=');
  });

  it.each([
    ['http://localhost', false],
    ['https://yuumi.quest', true],
  ])(
    'sets protocol-appropriate login cookies for %s',
    async (origin, secure) => {
      convexMocks.mutation.mockResolvedValue({
        ok: true,
        token: 'session-token',
        expiresAt: Date.now() + 60_000,
        user: { id: 'admin-id', username: 'admin', role: 'admin' },
      });
      const response = await login(
        new NextRequest(`${origin}/api/admin/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: origin,
            'cf-connecting-ip': '203.0.113.42',
          },
          body: JSON.stringify({
            username: 'admin',
            password: 'correct-horse',
          }),
        })
      );

      expect(response.status).toBe(200);
      const setCookie = response.headers.get('set-cookie') ?? '';
      expect(setCookie).toContain('yq_admin_session=session-token');
      expect(setCookie).toContain('HttpOnly');
      expect(setCookie).toContain('SameSite=strict');
      expect(setCookie.includes('Secure')).toBe(secure);
      expect(convexMocks.mutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          secret: 'test-admin-login-bridge-secret',
          sourceId: expect.stringMatching(/^[0-9a-f]{64}$/),
          username: 'admin',
          password: 'correct-horse',
        })
      );
    }
  );
});
