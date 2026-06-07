import { NextResponse } from 'next/server';
import {
  fetchWikiRotationWikitext,
  WIKI_SOURCE_NAME,
  WIKI_SOURCE_URL,
} from '@/lib/mythic-shop/fetch-wiki-rotation';
import { parseWikiRotation } from '@/lib/mythic-shop/parse-wiki-rotation';
import type { MythicShopRotation } from '@/lib/mythic-shop/types';

// Server-side cache for the parsed rotation. The wiki updates a few times per
// patch, so a multi-hour TTL keeps us well within Fandom rate limits.
let cachedRotation: MythicShopRotation | null = null;
let rotationCacheTime = 0;
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours

function buildRotation(wikitext: string, now: Date): MythicShopRotation {
  const sections = parseWikiRotation(wikitext, now);
  if (sections.length === 0) {
    throw new Error('No Mythic Shop items parsed from wiki extract');
  }
  return {
    sections,
    fetchedAt: now.toISOString(),
    source: { name: WIKI_SOURCE_NAME, url: WIKI_SOURCE_URL },
    stale: false,
  };
}

export async function GET() {
  const now = Date.now();

  if (cachedRotation && now - rotationCacheTime < CACHE_DURATION) {
    return NextResponse.json({ ...cachedRotation, cached: true });
  }

  try {
    const wikitext = await fetchWikiRotationWikitext();
    const rotation = buildRotation(wikitext, new Date(now));

    cachedRotation = rotation;
    rotationCacheTime = now;

    return NextResponse.json({ ...rotation, cached: false });
  } catch (error) {
    console.error('Error fetching Mythic Shop rotation:', error);

    // Serve stale data if we have any, flagged so the UI can warn the user.
    if (cachedRotation) {
      return NextResponse.json({
        ...cachedRotation,
        stale: true,
        cached: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return NextResponse.json(
      {
        sections: [],
        fetchedAt: new Date(now).toISOString(),
        source: { name: WIKI_SOURCE_NAME, url: WIKI_SOURCE_URL },
        stale: true,
        cached: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    );
  }
}
