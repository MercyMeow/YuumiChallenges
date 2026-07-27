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
import { GET as readSession } from './session/route';

describe('admin API route contracts', () => {
  beforeEach(() => {
    convexMocks.mutation.mockReset();
    convexMocks.query.mockReset();
    vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', 'https://convex.example');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
    }
  );
});
