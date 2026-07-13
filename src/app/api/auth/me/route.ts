import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';

// The web-user session lives in an httpOnly cookie, so the browser asks
// this route (which can read it) who is signed in. The token itself is
// NEVER returned to client JavaScript — authenticated account actions go
// through the /api/account/* proxy routes, which read the cookie
// server-side.

export async function GET(request: NextRequest) {
  const token = request.cookies.get('yq_session')?.value ?? null;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!token || !convexUrl) {
    return NextResponse.json({ user: null });
  }
  try {
    const convex = new ConvexHttpClient(convexUrl);
    const user = await convex.query(api.webauth.me, { token });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
