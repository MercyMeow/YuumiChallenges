import { NextResponse } from 'next/server';
import { ensureDatabaseSetup } from '@/lib/db/init';

/**
 * API route to initialize the database
 * This can be called manually or automatically when the application starts
 */
export async function GET() {
  try {
    const success = await ensureDatabaseSetup();
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Database initialized successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to initialize database' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error initializing database',
      error: error.message
    }, { status: 500 });
  }
}
