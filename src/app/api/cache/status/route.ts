import { NextResponse } from 'next/server';
import { getMatchCache } from '@/lib/cache/match-cache';

export async function GET() {
  try {
    const cache = getMatchCache();
    const stats = cache.getStats();

    return NextResponse.json({
      success: true,
      cache: {
        ...stats,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error getting cache status:', error);
    return NextResponse.json(
      { error: 'Failed to get cache status' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cache = getMatchCache();
    cache.clear();

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}