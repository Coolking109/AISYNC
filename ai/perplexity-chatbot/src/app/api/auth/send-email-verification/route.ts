import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { ObjectId } from 'mongodb';
import nodemailer from 'nodemailer';

// Note: This route uses Node.js packages and cannot use edge runtime


// Generate a 6-digit verification code

// Force dynamic rendering for this API route

// Force dynamic rendering - prevent static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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

    const { newEmail } = await request.json();

    if (!newEmail) {
      return NextResponse.json(
        { success: false, message: 'New email is required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const userId = new ObjectId(decoded.userId);

    // Check if the new email is already taken by another user
    const existingUser = await db.collection('users').findOne({
      _id: { $ne: userId },
      email: newEmail
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Email address is already taken' },
        { status: 400 }
      );
    }

    // Get current user
    const user = await db.collection('users').findOne({ _id: userId });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Store verification code in database
    await db.collection('email_verifications').updateOne(
      { userId: userId.toString() },
      {
        $set: {
          userId: userId.toString(),
          newEmail,
          verificationCode,
          expiresAt,
          createdAt: new Date(),
          verified: false
        }
      },
      { upsert: true }
    );

    // Send verification email
    try {
      const transporter = createTransporter();
      
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@aisyncs.org',
        to: newEmail,
        subject: 'Verify Your New Email Address - AISync',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">AISync</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
              <h2 style="color: #333; margin-bottom: 20px;">Verify Your New Email Address</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Hello ${user.username},
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                You've requested to change your email address to <strong>${newEmail}</strong>. 
                To complete this change, please enter the verification code below:
              </p>
              
              <div style="background: white; border: 2px dashed #667eea; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
                <h3 style="color: #667eea; margin: 0; font-size: 32px; letter-spacing: 5px;">
                  ${verificationCode}
                </h3>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                This code will expire in <strong>15 minutes</strong>.
              </p>
              
              <p style="color: #999; font-size: 14px; margin-top: 30px;">
                If you didn't request this email change, please ignore this email or contact support if you're concerned about your account security.
              </p>
            </div>
            
            <div style="background: #333; padding: 20px; text-align: center;">
              <p style="color: #999; margin: 0; font-size: 14px;">
                © 2025 AISync. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      
      console.log('Email verification code sent:', {
        userId: userId.toString(),
        newEmail,
        code: verificationCode,
        expiresAt
      });

    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return NextResponse.json(
        { success: false, message: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your new email address'
    });

  } catch (error) {
    console.error('Send email verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
