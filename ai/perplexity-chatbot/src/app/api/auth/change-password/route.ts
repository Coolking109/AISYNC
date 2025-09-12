import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';

export const runtime = 'edge';

// Create email transporter
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

    const { currentPassword, newPassword } = await request.json();

    console.log('Password change request:', {
      userId: decoded.userId,
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword,
      newPasswordLength: newPassword?.length
    });

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const userId = new ObjectId(decoded.userId);
    
    // Find user
    const user = await db.collection('users').findOne({ _id: userId });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await AuthUtils.comparePassword(currentPassword, user.passwordHash);
    console.log('Current password verification:', {
      isValid: isCurrentPasswordValid,
      userId: userId.toString()
    });
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await AuthUtils.hashPassword(newPassword);

    // Update user password
    const updateResult = await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          passwordHash: hashedNewPassword,
          updatedAt: new Date()
        }
      }
    );

    console.log('Password update result:', {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      userId: userId.toString()
    });

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to update password' },
        { status: 500 }
      );
    }
    
    console.log('Password changed successfully for user:', userId.toString());

    // Send email notification about password change
    try {
      const transporter = createTransporter();
      
      const passwordChangeMailOptions = {
        from: process.env.SMTP_FROM || 'noreply@aisyncs.org',
        to: user.email,
        subject: '🔐 Password Changed Successfully - AISync Account Security Alert',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🔐 Password Changed</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Password Successfully Updated</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Hello ${user.username || user.email},
              </p>
              
              <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #155724; margin: 0; font-weight: bold;">
                  ✅ Your password has been successfully changed
                </p>
              </div>
              
              <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #666; margin: 0 0 10px 0;"><strong>Account:</strong> ${user.email}</p>
                <p style="color: #666; margin: 0; font-size: 14px;"><strong>Changed on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              </div>
              
              <div style="background: #d1ecf1; border-left: 4px solid #bee5eb; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #0c5460; margin: 0; font-size: 14px;">
                  <strong>🛡️ Security Tips:</strong>
                </p>
                <ul style="color: #0c5460; margin: 10px 0 0 20px; font-size: 14px;">
                  <li>Use a unique password for your AISync account</li>
                  <li>Consider using a password manager</li>
                  <li>Enable two-factor authentication when available</li>
                </ul>
              </div>
              
              <div style="background: #f8d7da; border-left: 4px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #721c24; margin: 0; font-size: 14px;">
                  <strong>⚠️ Didn't change your password?</strong> If you didn't authorize this password change, your account may have been compromised. Please contact our support team immediately and consider changing your password again from a secure device.
                </p>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                This notification helps keep your account secure. If you have any concerns, please don't hesitate to contact our support team.
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

      await transporter.sendMail(passwordChangeMailOptions);
      
      console.log('Password change notification sent to:', {
        email: user.email,
        userId: userId.toString(),
        timestamp: new Date().toISOString()
      });

    } catch (emailError) {
      console.error('Failed to send password change notification:', emailError);
      // Don't fail the entire operation if email notification fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
