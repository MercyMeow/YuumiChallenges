import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/db/services/UserService';
import { getServerSession } from 'next-auth/next';
import { ApiError } from '@/types';

/**
 * GET /api/users
 * Get all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Get the session
    const session = await getServerSession();
    
    // Check if user is authenticated and has admin role
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required' 
      }, { status: 401 });
    }
    
    // Get users from database
    const users = await userService.getUserByDiscordId(session.user.id);
    
    // Return users
    return NextResponse.json({ 
      success: true, 
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json({ 
        success: false, 
        message: error.message,
        code: error.code
      }, { status: error.status });
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error.message
    }, { status: 500 });
  }
}
