import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';

// Discord OAuth callback: code -> token -> identity -> Convex web session
// (httpOnly cookie). Every failure lands back on the return page with
// ?login=failed so the UI can toast instead of stranding the visitor.

const SESSION_COOKIE = 'yq_session';

function siteUrl(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    new URL(request.url).origin
  );
}

export async function GET(request: NextRequest) {
  const site = siteUrl(request);
  const returnTo = request.cookies.get('yq_oauth_return')?.value ?? '/';
  const fail = (reason: string) => {
    const res = NextResponse.redirect(
      `${site}${returnTo}${returnTo.includes('?') ? '&' : '?'}login=failed`
    );
    console.error('[discord-auth]', reason);
    res.cookies.delete('yq_oauth_state');
    res.cookies.delete('yq_oauth_return');
    return res;
  };

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const bridgeSecret = process.env.AUTH_BRIDGE_SECRET;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!clientId || !clientSecret || !bridgeSecret || !convexUrl) {
    return fail('missing configuration');
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const expectedState = request.cookies.get('yq_oauth_state')?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return fail('state mismatch');
  }

  try {
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${site}/api/auth/discord/callback`,
      }),
    });
    if (!tokenRes.ok) return fail(`token exchange ${tokenRes.status}`);
    const token = (await tokenRes.json()) as { access_token?: string };
    if (!token.access_token) return fail('no access token');

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    if (!userRes.ok) return fail(`identity fetch ${userRes.status}`);
    const identity = (await userRes.json()) as {
      id?: string;
      username?: string;
      global_name?: string | null;
      avatar?: string | null;
    };
    if (!identity.id || !identity.username) return fail('identity malformed');

    const convex = new ConvexHttpClient(convexUrl);
    const session = await convex.mutation(api.webauth.upsertDiscordUser, {
      secret: bridgeSecret,
      discordId: identity.id,
      username: identity.username,
      ...(identity.global_name ? { globalName: identity.global_name } : {}),
      ...(identity.avatar ? { avatar: identity.avatar } : {}),
    });

    const res = NextResponse.redirect(`${site}${returnTo}`);
    res.cookies.delete('yq_oauth_state');
    res.cookies.delete('yq_oauth_return');
    res.cookies.set(SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: site.startsWith('https'),
      path: '/',
      expires: new Date(session.expiresAt),
    });
    return res;
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'unknown error');
  }
}
