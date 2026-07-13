import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';

// Profile refresh proxy: works signed-out too (public cooldown); when the
// session cookie is present it rides along server-side so subscribers get
// their fast lane without the token ever reaching client JavaScript.

export async function POST(request: NextRequest) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
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
  const token = request.cookies.get('yq_session')?.value;
  try {
    const result = await new ConvexHttpClient(convexUrl).action(
      api.highelo.refreshPlayer,
      { puuid, ...(token ? { token } : {}) }
    );
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Refresh failed — try again.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
