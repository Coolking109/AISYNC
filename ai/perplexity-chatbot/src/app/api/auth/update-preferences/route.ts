import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

export const runtime = 'edge';

// Note: This route uses Node.js packages and cannot use edge runtime


export async function PUT(request: NextRequest) {
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

    const preferences = await request.json();

    // Validate preferences structure
    const validatedPreferences = {
      emailNotifications: typeof preferences.emailNotifications === 'boolean' ? preferences.emailNotifications : true,
      pushNotifications: typeof preferences.pushNotifications === 'boolean' ? preferences.pushNotifications : false,
      theme: ['dark', 'light', 'auto'].includes(preferences.theme) ? preferences.theme : 'dark',
      language: ['en', 'es', 'fr', 'de'].includes(preferences.language) ? preferences.language : 'en',
      autoSave: typeof preferences.autoSave === 'boolean' ? preferences.autoSave : true,
      sessionTimeout: ['15', '30', '60', '120', '0'].includes(preferences.sessionTimeout) ? preferences.sessionTimeout : '30',
    };

    const db = await getDatabase();
    const userId = new ObjectId(decoded.userId);

    // Update user preferences
    const updateResult = await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          preferences: validatedPreferences,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: validatedPreferences
    });

  } catch (error) {
    console.error('Preferences update error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
