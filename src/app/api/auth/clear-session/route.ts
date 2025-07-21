import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Get all cookies
    const allCookies = cookieStore.getAll();
    
    // Find NextAuth cookies
    const authCookies = allCookies.filter(cookie => 
      cookie.name.includes('next-auth') || 
      cookie.name.includes('__Secure-next-auth') ||
      cookie.name.includes('authjs')
    );

    console.log('Found auth cookies to clear:', authCookies.map(c => c.name));

    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'Session cleared successfully',
      clearedCookies: authCookies.map(c => c.name)
    });

    // Clear each auth cookie
    authCookies.forEach(cookie => {
      response.cookies.delete({
        name: cookie.name,
        path: '/',
      });
      
      // Also try to clear with domain
      response.cookies.set({
        name: cookie.name,
        value: '',
        expires: new Date(0),
        path: '/',
      });
    });

    // Clear common NextAuth cookie names explicitly
    const commonAuthCookies = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url'
    ];

    commonAuthCookies.forEach(cookieName => {
      response.cookies.delete({
        name: cookieName,
        path: '/',
      });
      
      response.cookies.set({
        name: cookieName,
        value: '',
        expires: new Date(0),
        path: '/',
      });
    });

    return response;
    
  } catch (error) {
    console.error('Error clearing session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear session' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to clear session',
    endpoints: {
      clearSession: 'POST /api/auth/clear-session'
    }
  });
}