import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export const runtime = 'edge';

// Note: This route uses Node.js packages and cannot use edge runtime


export async function POST(request: NextRequest) {
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
    
    // Get user
    const user = await db.collection('users').findOne({ _id: userId });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if 2FA is already enabled
    if (user.twoFactorEnabled) {
      return NextResponse.json(
        { success: false, message: '2FA is already enabled for this account' },
        { status: 400 }
      );
    }

    // Generate secret for 2FA
    const secret = speakeasy.generateSecret({
      name: `AISync (${user.email})`,
      issuer: 'AISync',
      length: 32
    });

    console.log('Generated 2FA secret for user:', {
      userId: userId.toString(),
      email: user.email
    });

    // Store the temporary secret (not yet activated)
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          twoFactorSecret: secret.base32,
          twoFactorEnabled: false,
          updatedAt: new Date()
        }
      }
    );

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
