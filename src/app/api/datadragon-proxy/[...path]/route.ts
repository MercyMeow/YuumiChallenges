import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const fullPath = path.join('/');
    
    // Construct DataDragon URL
    const dataDragonUrl = `https://ddragon.leagueoflegends.com/cdn/${fullPath}`;
    
    const response = await fetch(dataDragonUrl, {
      next: { revalidate: 2592000 } // 30 days cache
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch DataDragon asset: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000',
      }
    });
  } catch (error) {
    console.error('DataDragon proxy error:', error);
    
    // Return 404 for missing assets - the ImageResponse will handle fallbacks
    return new Response(null, { 
      status: 404,
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache 404s for 5 minutes
      }
    });
  }
}