import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// Force dynamic rendering - prevent static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('Test DB API: Checking database connection...');
    
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        success: false,
        message: 'MONGODB_URI not configured'
      }, { status: 500 });
    }

    const db = await getDatabase();
    console.log('Test DB API: Database connected');
    
    // Test database connection by counting users
    const userCount = await db.collection('users').countDocuments();
    console.log('Test DB API: User count:', userCount);
    
    // Get first user (without password) for testing
    const sampleUser = await db.collection('users').findOne(
      {}, 
      { projection: { passwordHash: 0, twoFactorSecret: 0 } }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      userCount,
      sampleUser: sampleUser ? {
        email: sampleUser.email,
        username: sampleUser.username,
        hasPassword: !!sampleUser.passwordHash
      } : null,
      environment: {
        hasMongoUri: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV
      }
    });

  } catch (error: any) {
    console.error('Test DB API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database test failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
