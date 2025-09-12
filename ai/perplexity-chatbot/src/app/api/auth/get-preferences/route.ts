import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export const runtime = 'edge';

// Note: This route uses Node.js packages and cannot use edge runtime


export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing authentication token' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const decoded = AuthUtils.verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing authentication token' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const userId = new ObjectId(decoded.userId);
    
    const user = await db.collection('users').findOne({ _id: userId });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Return user preferences with defaults
    const defaultPreferences = {
      emailNotifications: true,
      pushNotifications: false,
      theme: 'dark',
      language: 'en',
      autoSave: true,
      sessionTimeout: '30',
    };

    const preferences = { ...defaultPreferences, ...user.preferences };
    
    return NextResponse.json({
      success: true,
      preferences
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
