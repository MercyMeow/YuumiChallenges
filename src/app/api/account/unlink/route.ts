import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';

export async function POST(request: NextRequest) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const token = request.cookies.get('yq_session')?.value;
  if (!convexUrl) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  if (!token) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }
  try {
    await new ConvexHttpClient(convexUrl).mutation(api.webauth.unlinkAccount, {
      token,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unlink failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
