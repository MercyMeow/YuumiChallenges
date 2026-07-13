import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';

// Begins the icon-challenge link flow for the signed-in user (cookie is
// read server-side; the session token never reaches client JavaScript).

export async function POST(request: NextRequest) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const token = request.cookies.get('yq_session')?.value;
  if (!convexUrl) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }
  if (!token) {
    return NextResponse.json({ error: 'Sign in first.' }, { status: 401 });
  }
  // catch() covers parse errors; the object-check covers valid-but-wrong
  // JSON like `null` or a bare string.
  const body: unknown = await request.json().catch(() => ({}));
  const puuid =
    typeof body === 'object' && body !== null
      ? (body as { puuid?: unknown }).puuid
      : undefined;
  if (typeof puuid !== 'string' || puuid.length === 0) {
    return NextResponse.json({ error: 'Missing puuid' }, { status: 400 });
  }
  try {
    const result = await new ConvexHttpClient(convexUrl).action(
      api.webauth.startAccountLink,
      { token, puuid }
    );
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not start verification.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
