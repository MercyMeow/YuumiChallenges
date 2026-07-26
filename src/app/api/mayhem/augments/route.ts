import { NextResponse } from 'next/server';
import { loadMayhemAugments } from '@/lib/mayhem/fetch-catalog';

export const revalidate = 3600;

/** Proxy + enrich ARAM Mayhem augment meta for the /mayhem client. */
export async function GET() {
  try {
    const payload = await loadMayhemAugments();
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('mayhem augments fetch failed', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to load Mayhem data',
      },
      { status: 502 }
    );
  }
}
