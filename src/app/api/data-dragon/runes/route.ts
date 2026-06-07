import { NextResponse } from 'next/server';
import { getRuneData, RuneTree } from '@/lib/apis/datadragon';

// Server-side cache for Data Dragon rune data
let cachedRuneData: RuneTree[] | null = null;
let runeCacheTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (runes change infrequently)

export async function GET() {
  try {
    const now = Date.now();

    // Return cached rune data if still valid
    if (cachedRuneData && now - runeCacheTime < CACHE_DURATION) {
      return NextResponse.json({
        runes: cachedRuneData,
        cached: true,
        cacheAge: Math.floor((now - runeCacheTime) / 1000),
      });
    }

    // Fetch latest rune data from Data Dragon
    console.log('Fetching fresh rune data from Data Dragon...');
    const runeData = await getRuneData('en_US');

    if (!runeData || !Array.isArray(runeData)) {
      throw new Error('Invalid response format from Data Dragon rune API');
    }

    // Update cache
    cachedRuneData = runeData;
    runeCacheTime = now;

    return NextResponse.json({
      runes: runeData,
      cached: false,
      timestamp: new Date().toISOString(),
      treeCount: runeData.length,
      totalRunes: runeData.reduce(
        (total, tree) =>
          total +
          tree.slots.reduce(
            (slotTotal, slot) => slotTotal + slot.runes.length,
            0
          ),
        0
      ),
    });
  } catch (error) {
    console.error('Error fetching Data Dragon rune data:', error);

    // Return cached rune data if available, even if expired
    if (cachedRuneData) {
      return NextResponse.json({
        runes: cachedRuneData,
        cached: true,
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Return empty array as fallback
    return NextResponse.json(
      {
        runes: [],
        cached: false,
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 }
    ); // Still return 200 since we have a fallback
  }
}

// Optional: Add specific rune lookup endpoints
export async function POST(request: Request) {
  try {
    const { runeId, treeId, type } = await request.json();

    // Get all runes (will use cache if available)
    const runesResponse = await GET();
    const runesData = await runesResponse.json();

    if (type === 'rune' && runeId) {
      // Find specific rune by ID
      for (const tree of runesData.runes) {
        for (const slot of tree.slots) {
          for (const rune of slot.runes) {
            if (rune.id === runeId) {
              return NextResponse.json({ rune, tree: tree.name });
            }
          }
        }
      }
      return NextResponse.json({ error: 'Rune not found' }, { status: 404 });
    }

    if (type === 'tree' && treeId) {
      // Find specific rune tree by ID
      const tree = runesData.runes.find((t: RuneTree) => t.id === treeId);
      if (!tree) {
        return NextResponse.json(
          { error: 'Rune tree not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ tree });
    }

    if (type === 'keystones') {
      // Get all keystone runes (first slot of each tree)
      const keystones = runesData.runes.map((tree: RuneTree) => ({
        tree: tree.name,
        treeId: tree.id,
        keystones: tree.slots[0]?.runes || [],
      }));
      return NextResponse.json({ keystones });
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing rune request:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
