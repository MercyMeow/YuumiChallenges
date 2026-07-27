import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const convexMocks = vi.hoisted(() => ({
  mutation: vi.fn(),
}));

vi.mock('convex/browser', () => ({
  ConvexHttpClient: class {
    mutation = convexMocks.mutation;
  },
}));

import { GET as beginDiscordLogin } from './login/route';
import { GET as finishDiscordLogin } from './callback/route';
import { POST as logout } from '../logout/route';

function configureDiscordAuth() {
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://yuumi.example');
  vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', 'https://convex.example');
  vi.stubEnv('DISCORD_CLIENT_ID', 'discord-client');
  vi.stubEnv('DISCORD_CLIENT_SECRET', 'discord-secret');
  vi.stubEnv('AUTH_BRIDGE_SECRET', 'bridge-secret');
}

describe('Discord auth route contracts', () => {
  beforeEach(() => {
    convexMocks.mutation.mockReset();
    configureDiscordAuth();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('stores only a sanitized same-origin return path', async () => {
    const unsafeReturn = encodeURIComponent(
      '/..//attacker.example/path?stolen=1'
    );
    const response = await beginDiscordLogin(
      new NextRequest(
        `https://yuumi.example/api/auth/discord/login?return=${unsafeReturn}`
      )
    );

    expect(response.status).toBe(307);
    expect(response.cookies.get('yq_oauth_return')?.value).toBe('/');
    expect(response.cookies.get('yq_oauth_state')?.value).toBeTruthy();
    expect(new URL(response.headers.get('location')!).origin).toBe(
      'https://discord.com'
    );
  });

  it('rejects a state mismatch, redirects locally, and clears OAuth cookies', async () => {
    const response = await finishDiscordLogin(
      new NextRequest(
        'https://yuumi.example/api/auth/discord/callback?code=code&state=wrong',
        {
          headers: {
            Cookie: 'yq_oauth_state=expected; yq_oauth_return=/guide?tab=items',
          },
        }
      )
    );

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location')!);
    expect(location.origin).toBe('https://yuumi.example');
    expect(location.pathname).toBe('/guide');
    expect(location.searchParams.get('tab')).toBe('items');
    expect(location.searchParams.get('login')).toBe('failed');
    expect(response.cookies.get('yq_oauth_state')?.value).toBe('');
    expect(response.cookies.get('yq_oauth_return')?.value).toBe('');
  });

  it('sets the hardened web-session cookie after a valid callback', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: 'discord-token' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 'discord-id',
            username: 'Yuumi',
            global_name: 'The Cat',
            avatar: 'avatar-hash',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );
    vi.stubGlobal('fetch', fetchMock);
    convexMocks.mutation.mockResolvedValue({
      token: 'web-session-token',
      expiresAt: Date.now() + 60_000,
    });

    const response = await finishDiscordLogin(
      new NextRequest(
        'https://yuumi.example/api/auth/discord/callback?code=code&state=expected',
        {
          headers: {
            Cookie: 'yq_oauth_state=expected; yq_oauth_return=/guide',
          },
        }
      )
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://yuumi.example/guide'
    );
    const setCookie = response.headers.get('set-cookie') ?? '';
    expect(setCookie).toContain('yq_session=web-session-token');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
    expect(setCookie).toContain('SameSite=lax');
  });

  it('rejects cross-origin logout without clearing the cookie', async () => {
    const response = await logout(
      new NextRequest('https://yuumi.example/api/auth/logout', {
        method: 'POST',
        headers: {
          Cookie: 'yq_session=web-session-token',
          Origin: 'https://attacker.example',
        },
      })
    );

    expect(response.status).toBe(403);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(convexMocks.mutation).not.toHaveBeenCalled();
  });
});
