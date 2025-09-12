import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
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

    const { verificationCode } = await request.json();

    if (!verificationCode) {
      return NextResponse.json(
        { success: false, message: 'Verification code is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const userId = new ObjectId(decoded.userId);

    // Find verification record
    console.log('Looking for verification with:', {
      userId: userId.toString(),
      verificationCode,
      verified: false
    });
    
    const verification = await db.collection('email_verifications').findOne({
      userId: userId.toString(),
      verificationCode,
      verified: false
    });

    console.log('Verification record found:', verification);

    if (!verification) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Check if code has expired
    if (new Date() > verification.expiresAt) {
      await db.collection('email_verifications').deleteOne({ _id: verification._id });
      return NextResponse.json(
        { success: false, message: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Get current user data
    const user = await db.collection('users').findOne({ _id: userId });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const oldEmail = user.email;
    const newEmail = verification.newEmail;

    console.log('Email change details:', {
      oldEmail,
      newEmail,
      userId: userId.toString()
    });

    // Update user email in database
    const updateResult = await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          email: newEmail,
          updatedAt: new Date()
        }
      }
    );

    console.log('Database update result:', updateResult);

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to update email address' },
        { status: 500 }
      );
    }

    // Mark verification as completed
    await db.collection('email_verifications').updateOne(
      { _id: verification._id },
      { $set: { verified: true, verifiedAt: new Date() } }
    );

    // Send notification to OLD email about the change
    try {
      const transporter = createTransporter();
      
      const notificationMailOptions = {
        from: process.env.SMTP_FROM || 'noreply@aisyncs.org',
        to: oldEmail,
        subject: '🔐 Email Address Changed - AISync Account Security Alert',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🔐 Security Alert</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Email Address Changed</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Hello ${user.username},
              </p>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #856404; margin: 0; font-weight: bold;">
                  ⚠️ Your email address has been successfully changed
                </p>
              </div>
              
              <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #666; margin: 0 0 10px 0;"><strong>Previous email:</strong> ${oldEmail}</p>
                <p style="color: #666; margin: 0;"><strong>New email:</strong> ${newEmail}</p>
                <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;"><strong>Changed on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
              </div>
              
              <div style="background: #d1ecf1; border-left: 4px solid #bee5eb; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #0c5460; margin: 0; font-size: 14px;">
                  <strong>🛡️ Security Note:</strong> All future account-related emails will be sent to your new email address.
                </p>
              </div>
              
              <div style="background: #f8d7da; border-left: 4px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="color: #721c24; margin: 0; font-size: 14px;">
                  <strong>⚠️ Didn't make this change?</strong> If you didn't authorize this email change, your account may have been compromised. Please contact our support team immediately.
                </p>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-top: 30px;">
                For your security, this notification was sent to your previous email address.
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

      await transporter.sendMail(notificationMailOptions);
      
      console.log('Email change notification sent to old email:', {
        userId: userId.toString(),
        oldEmail,
        newEmail,
        timestamp: new Date().toISOString()
      });

    } catch (emailError) {
      console.error('Failed to send notification to old email:', emailError);
      // Don't fail the entire operation if notification fails
    }

    // Get updated user data
    const updatedUser = await db.collection('users').findOne({ _id: userId });
    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve updated user data' },
        { status: 500 }
      );
    }

    console.log('Updated user data:', {
      email: updatedUser.email,
      userId: updatedUser._id.toString()
    });

    // Return updated user data (without password)
    const { passwordHash, ...userWithoutPassword } = updatedUser;

    console.log('Email change completed successfully:', {
      userId: userId.toString(),
      oldEmail,
      newEmail,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Email address updated successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Verify email change error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
