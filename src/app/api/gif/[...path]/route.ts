import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// List of valid rule GIFs
const validGifs = [
  'rule1.gif',
  'rule2.gif',
  'rule3.gif',
  'rule4.gif',
  'rule5.gif',
  'rule6.gif',
  'rule7.gif',
  'rule8.gif',
  'rule9.gif',
  'rule10.gif',
  'rule11.gif',
  'rule12.gif',
  'rule15.gif',
];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const gifName = path.join('/');
  
  // Check if the requested GIF is valid
  if (!validGifs.includes(gifName)) {
    return NextResponse.json({ error: 'GIF not found' }, { status: 404 });
  }
  
  try {
    // Read the GIF file from the public directory
    const gifPath = join(process.cwd(), 'public', gifName);
    const gifBuffer = readFileSync(gifPath);
    
    return new NextResponse(gifBuffer, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': gifBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving GIF file:', error);
    return NextResponse.json({ error: 'Failed to serve GIF' }, { status: 500 });
  }
}