import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';

// Note: This route uses Node.js packages and cannot use edge runtime


export async function DELETE(request: NextRequest) {
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
    
    // Find user to verify they exist
    const user = await db.collection('users').findOne({ _id: userId });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user from database
    const deleteResult = await db.collection('users').deleteOne({ _id: userId });
    
    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete account from database' },
        { status: 500 }
      );
    }

    // Delete user's sessions
    try {
      await db.collection('sessions').deleteMany({ userId: userId.toString() });
      console.log(`Deleted sessions for user: ${userId}`);
    } catch (error) {
      console.warn('Failed to delete user sessions:', error);
      // Don't fail the request if session cleanup fails
    }

    // Log account deletion for audit purposes
    const deletionLog = {
      action: 'ACCOUNT_DELETED',
      userId: userId.toString(),
      username: user.username,
      email: user.email,
      timestamp: new Date().toISOString()
    };
    
    console.log('Account deletion completed:', deletionLog);
    
    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error during account deletion' },
      { status: 500 }
    );
  }
}
