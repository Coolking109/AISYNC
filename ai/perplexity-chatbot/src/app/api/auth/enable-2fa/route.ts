import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import speakeasy from 'speakeasy';
import nodemailer from 'nodemailer';

// Note: This route uses Node.js packages and cannot use edge runtime


// Create email transporter

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

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

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Verification code is required' },
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

    if (!user.twoFactorSecret) {
      return NextResponse.json(
        { success: false, message: '2FA setup not initiated. Please generate a QR code first.' },
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
        { success: false, message: 'Invalid verification code. Please try again.' },
        { status: 400 }
      );
    }

    // Enable 2FA for the user
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          twoFactorEnabled: true,
          twoFactorEnabledAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    console.log('2FA enabled for user:', {
      userId: userId.toString(),
      email: user.email,
      timestamp: new Date().toISOString()
    });

    // Send email notification about 2FA activation
    try {
      const transporter = createTransporter();
      
      const twoFactorMailOptions = {
        from: process.env.SMTP_FROM || 'noreply@aisyncs.org',
        to: user.email,
        subject: '🔐 Two-Factor Authentication Enabled - AISync Security Enhancement',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🔐 2FA Activated</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Two-Factor Authentication Enabled</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Hello ${user.username || user.email},
              </p>
              
              <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #155724; margin: 0; font-weight: bold;">
                  ✅ Two-Factor Authentication has been successfully enabled on your account
                </p>
              </div>
              
              <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #666; margin: 0 0 10px 0;"><strong>Account:</strong> ${user.email}</p>
                <p style="color: #666; margin: 0; font-size: 14px;"><strong>Enabled on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              </div>
              
              <div style="background: #d1ecf1; border-left: 4px solid #bee5eb; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #0c5460; margin: 0; font-size: 14px;">
                  <strong>🛡️ Enhanced Security:</strong> Your account is now protected with two-factor authentication. You'll need both your password and a code from your authenticator app to sign in.
                </p>
              </div>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #856404; margin: 0; font-size: 14px;">
                  <strong>📱 Important:</strong> Make sure to keep your authenticator app safe and consider backing up your recovery codes if provided.
                </p>
              </div>
              
              <div style="background: #f8d7da; border-left: 4px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #721c24; margin: 0; font-size: 14px;">
                  <strong>⚠️ Didn't enable 2FA?</strong> If you didn't authorize this change, your account may have been compromised. Please contact our support team immediately.
                </p>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                Thank you for taking steps to secure your account. Two-factor authentication significantly enhances your account security.
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

      await transporter.sendMail(twoFactorMailOptions);
      
      console.log('2FA activation notification sent to:', {
        email: user.email,
        userId: userId.toString(),
        timestamp: new Date().toISOString()
      });

    } catch (emailError) {
      console.error('Failed to send 2FA activation notification:', emailError);
      // Don't fail the entire operation if email notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication has been enabled successfully!'
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
