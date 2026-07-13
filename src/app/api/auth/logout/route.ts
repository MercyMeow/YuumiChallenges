import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('yq_session')?.value;
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (token && convexUrl) {
    try {
      await new ConvexHttpClient(convexUrl).mutation(api.webauth.logout, {
        token,
      });
    } catch {
      // Revocation failed: keep the cookie so the session isn't left
      // valid server-side while the browser believes it is signed out.
      return NextResponse.json(
        { error: 'Sign-out failed — please try again.' },
        { status: 502 }
      );
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('yq_session');
  return res;
}
