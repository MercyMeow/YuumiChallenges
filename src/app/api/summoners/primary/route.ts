import { NextResponse } from 'next/server';

// This endpoint is deprecated - users now only have one summoner
// Redirect to the main summoners endpoint which returns the single summoner
export async function GET() {
  return NextResponse.json({
    error: 'This endpoint has been deprecated. Use /api/summoners instead.',
    message: 'Users can now only have one linked League account. The main /api/summoners endpoint returns the single summoner.',
    deprecatedSince: '2025-07-20'
  }, { status: 410 });
}