import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import speakeasy from 'speakeasy';

// Note: This route uses Node.js packages and cannot use edge runtime


export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email and 2FA code are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Find user by email
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { success: false, message: '2FA is not enabled for this account' },
        { status: 400 }
      );
    }

    // Verify the TOTP code
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2 // Allow some time drift
    });

    console.log('2FA verification attempt:', {
      email: user.email,
      verified,
      timestamp: new Date().toISOString()
    });

    if (!verified) {
      return NextResponse.json(
        { success: false, message: 'Invalid 2FA code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '2FA verification successful'
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
