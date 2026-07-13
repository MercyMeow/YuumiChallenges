import { NextRequest, NextResponse } from 'next/server';

// Kicks off the Discord OAuth code flow. The state nonce round-trips via
// an httpOnly cookie and is checked in the callback (CSRF guard).

function siteUrl(request: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
    new URL(request.url).origin
  );
}

export async function GET(request: NextRequest) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'Discord login is not configured (DISCORD_CLIENT_ID).' },
      { status: 503 }
    );
  }
  const state = crypto.randomUUID();
  // Return the visitor to the page they clicked from.
  const returnTo = request.nextUrl.searchParams.get('return') ?? '/';
  const authorize = new URL('https://discord.com/oauth2/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('response_type', 'code');
  authorize.searchParams.set(
    'redirect_uri',
    `${siteUrl(request)}/api/auth/discord/callback`
  );
  authorize.searchParams.set('scope', 'identify');
  authorize.searchParams.set('state', state);

  const res = NextResponse.redirect(authorize);
  const cookie = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: siteUrl(request).startsWith('https'),
    path: '/',
    maxAge: 600,
  };
  res.cookies.set('yq_oauth_state', state, cookie);
  // Only same-site relative paths — never an absolute URL (open redirect).
  res.cookies.set(
    'yq_oauth_return',
    returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/',
    cookie
  );
  return res;
}
