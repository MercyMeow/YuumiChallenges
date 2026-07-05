import { NextResponse } from 'next/server';

// Server-side cache for Data Dragon version
let cachedVersion: string | null = null;
let versionCacheTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  try {
    const now = Date.now();

    // Return cached version if still valid
    if (cachedVersion && now - versionCacheTime < CACHE_DURATION) {
      return NextResponse.json({
        version: cachedVersion,
        cached: true,
        cacheAge: Math.floor((now - versionCacheTime) / 1000),
      });
    }

    // Fetch latest version from Data Dragon API (server-side, no CORS issues)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    let response: Response;

    try {
      response = await fetch(
        'https://ddragon.leagueoflegends.com/api/versions.json',
        {
          headers: {
            'User-Agent': 'YuumiChallenges/1.0',
          },
          signal: controller.signal,
        }
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Data Dragon version request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(
        `Data Dragon API responded with status: ${response.status}`
      );
    }

    const versions: string[] = await response.json();

    if (!versions || !Array.isArray(versions) || versions.length === 0) {
      throw new Error('Invalid response format from Data Dragon API');
    }

    const latestVersion = versions[0];

    if (!latestVersion) {
      throw new Error('No versions available from Data Dragon API');
    }

    // Update cache
    cachedVersion = latestVersion;
    versionCacheTime = now;

    return NextResponse.json({
      version: latestVersion,
      cached: false,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching Data Dragon version:', error);

    // Return cached version if available, even if expired
    if (cachedVersion) {
      return NextResponse.json({
        version: cachedVersion,
        cached: true,
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Fallback to known working version
    const fallbackVersion = '16.13.1';
    return NextResponse.json(
      {
        version: fallbackVersion,
        cached: false,
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    ); // Still return 200 since we have a fallback
  }
}
