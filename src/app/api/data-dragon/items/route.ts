import { NextResponse } from 'next/server';
import { getItemData, ItemData } from '@/lib/apis/datadragon';

// Server-side cache for Data Dragon item data
let cachedItemData: Record<string, ItemData> | null = null;
let itemCacheTime = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes (items change less frequently)

export async function GET() {
  try {
    const now = Date.now();
    
    // Return cached item data if still valid
    if (cachedItemData && (now - itemCacheTime) < CACHE_DURATION) {
      return NextResponse.json({ 
        items: cachedItemData,
        cached: true,
        cacheAge: Math.floor((now - itemCacheTime) / 1000)
      });
    }
    
    // Fetch latest item data from Data Dragon
    console.log('Fetching fresh item data from Data Dragon...');
    const itemData = await getItemData('en_US');
    
    if (!itemData || typeof itemData !== 'object') {
      throw new Error('Invalid response format from Data Dragon item API');
    }
    
    // Update cache
    cachedItemData = itemData;
    itemCacheTime = now;
    
    return NextResponse.json({ 
      items: itemData,
      cached: false,
      timestamp: new Date().toISOString(),
      itemCount: Object.keys(itemData).length
    });
    
  } catch (error) {
    console.error('Error fetching Data Dragon item data:', error);
    
    // Return cached item data if available, even if expired
    if (cachedItemData) {
      return NextResponse.json({ 
        items: cachedItemData,
        cached: true,
        fallback: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // Return empty items object as fallback
    return NextResponse.json({ 
      items: {},
      cached: false,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 }); // Still return 200 since we have a fallback
  }
}

// Optional: Add a specific item endpoint for individual item lookups
export async function POST(request: Request) {
  try {
    const { itemId } = await request.json();
    
    if (!itemId || typeof itemId !== 'string') {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }
    
    // Get all items (will use cache if available)
    const itemsResponse = await GET();
    const itemsData = await itemsResponse.json();
    
    const item = itemsData.items[itemId];
    
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    
    return NextResponse.json({ item });
    
  } catch (error) {
    console.error('Error fetching specific item data:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}