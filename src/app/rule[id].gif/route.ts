import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

// List of valid rule numbers
const validRules = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '15'];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Check if the rule number is valid
  if (!validRules.includes(id)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    // Construct the GIF file path
    const gifPath = path.join(process.cwd(), 'public', `rule${id}.gif`);
    
    // Read the GIF file
    const gifBuffer = await readFile(gifPath);
    
    // Return the GIF with appropriate headers
    return new NextResponse(gifBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'public, max-age=31536000, immutable',
        // Allow Discord to access the image
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error(`Failed to serve GIF for rule ${id}:`, error);
    return new NextResponse('Not Found', { status: 404 });
  }
}