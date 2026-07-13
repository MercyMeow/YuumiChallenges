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
    const result = await new ConvexHttpClient(convexUrl).action(
      api.webauth.verifyAccountLink,
      { token }
    );
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Verification failed.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
