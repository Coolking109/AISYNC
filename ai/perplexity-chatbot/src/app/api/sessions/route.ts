import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { AuthUtils } from '@/lib/auth-utils';

// Note: This route uses MongoDB so cannot use edge runtime

// Helper function to verify authentication

// Force dynamic rendering for this API route

// Force dynamic rendering - prevent static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  return AuthUtils.verifyToken(token);
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user._id || user.email;
    
    // Only fetch sessions for the authenticated user
    const sessions = await db.collection('sessions')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const sessionData = await request.json();
    const db = await getDatabase();
    
    // Ensure session is associated with authenticated user
    const session = {
      ...sessionData,
      userId: user._id || user.email,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('sessions').insertOne(session);
    
    return NextResponse.json({
      ...session,
      _id: result.insertedId,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id, ...updateData } = await request.json();
    const db = await getDatabase();
    
    // Only allow updating sessions owned by the authenticated user
    const result = await db.collection('sessions').updateOne(
      { 
        _id: new ObjectId(id),
        userId: user._id || user.email
      },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date(),
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Only allow deleting sessions owned by the authenticated user
    const result = await db.collection('sessions').deleteOne({
      _id: new ObjectId(id),
      userId: user._id || user.email
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
