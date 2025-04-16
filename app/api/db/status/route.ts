import { NextResponse } from 'next/server';
import { pingDatabase } from '@/lib/db/mongodb';
import { userRepository, challengeRepository, matchRepository } from '@/lib/db/repositories';

/**
 * API route to check database status
 * Returns information about the database connection and collections
 */
export async function GET() {
  try {
    // Check database connection
    const isConnected = await pingDatabase();
    
    if (!isConnected) {
      return NextResponse.json({ 
        success: false, 
        message: 'Database connection failed',
        status: 'disconnected'
      }, { status: 500 });
    }
    
    // Get collection counts
    const [userCount, challengeCount, matchCount] = await Promise.all([
      userRepository.count(),
      challengeRepository.count(),
      matchRepository.count()
    ]);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      status: 'connected',
      collections: {
        users: userCount,
        challenges: challengeCount,
        matches: matchCount
      }
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error checking database status',
      error: error.message,
      status: 'error'
    }, { status: 500 });
  }
}
