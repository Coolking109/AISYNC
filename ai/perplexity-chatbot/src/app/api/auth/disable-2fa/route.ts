import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import speakeasy from 'speakeasy';
import nodemailer from 'nodemailer';

// Note: This route uses Node.js packages and cannot use edge runtime


// Create email transporter

// Force dynamic rendering for this API route

// Force dynamic rendering - prevent static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

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

    const { code, password } = await request.json();

    if (!code || !password) {
      return NextResponse.json(
        { success: false, message: 'Both 2FA code and password are required to disable 2FA' },
        { status: 400 }
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

    if (!user.twoFactorEnabled) {
      return NextResponse.json(
        { success: false, message: '2FA is not enabled for this account' },
        { status: 400 }
      );
    }

    // Verify password
    const isPasswordValid = await AuthUtils.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
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

    if (!verified) {
      return NextResponse.json(
        { success: false, message: 'Invalid 2FA code' },
        { status: 400 }
      );
    }

    // Disable 2FA for the user
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $unset: {
          twoFactorSecret: '',
          twoFactorEnabled: '',
          twoFactorEnabledAt: ''
        },
        $set: {
          updatedAt: new Date()
        }
      }
    );

    console.log('2FA disabled for user:', {
      userId: userId.toString(),
      email: user.email,
      timestamp: new Date().toISOString()
    });

    // Send email notification about 2FA deactivation
    try {
      const transporter = createTransporter();
      
      const twoFactorDisabledMailOptions = {
        from: process.env.SMTP_FROM || 'noreply@aisyncs.org',
        to: user.email,
        subject: '⚠️ Two-Factor Authentication Disabled - AISync Security Alert',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">⚠️ 2FA Disabled</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Two-Factor Authentication Disabled</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Hello ${user.username || user.email},
              </p>
              
              <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #721c24; margin: 0; font-weight: bold;">
                  ⚠️ Two-Factor Authentication has been disabled on your account
                </p>
              </div>
              
              <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #666; margin: 0 0 10px 0;"><strong>Account:</strong> ${user.email}</p>
                <p style="color: #666; margin: 0; font-size: 14px;"><strong>Disabled on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              </div>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>🔒 Security Impact:</strong> Your account now only requires a password to sign in. Consider re-enabling 2FA for enhanced security.
                </p>
              </div>
              
              <div style="background: #f8d7da; border-left: 4px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #721c24; margin: 0; font-size: 14px;">
                  <strong>⚠️ Didn't disable 2FA?</strong> If you didn't authorize this change, your account may have been compromised. Please contact our support team immediately and change your password.
                </p>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                You can re-enable two-factor authentication at any time from your account settings.
              </p>
            </div>
            
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                © 2025 AISync. All rights reserved.
              </p>
              <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">
                This is an automated security notification. Please do not reply to this email.
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(twoFactorDisabledMailOptions);
      
      console.log('2FA deactivation notification sent to:', {
        email: user.email,
        userId: userId.toString(),
        timestamp: new Date().toISOString()
      });

    } catch (emailError) {
      console.error('Failed to send 2FA deactivation notification:', emailError);
      // Don't fail the entire operation if email notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been disabled successfully.'
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
