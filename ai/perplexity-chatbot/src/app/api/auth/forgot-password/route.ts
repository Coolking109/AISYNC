import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { EmailService } from '@/lib/email-service';
import { ForgotPasswordRequest } from '@/lib/auth-types';

// Note: This route uses Node.js packages and cannot use edge runtime


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://coresystembots_db_user:eXBLikJoEBqJUgcA@cluster0.diplw6a.mongodb.net/perplexity-chatbot';

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json();
    const { email } = body;

    // Validate input
    if (!email || !AuthUtils.validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Valid email is required' },
        { status: 400 }
      );
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db('perplexity-chatbot');
    const users = db.collection('users');

    // Check if user exists
    const existingUser = await users.findOne({ email });
    if (!existingUser) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, you will receive password reset instructions.'
      });
    }

    // Generate reset token
    const resetToken = AuthUtils.generateResetToken();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset token
    await users.updateOne(
      { email },
      { 
        $set: { 
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetTokenExpires,
          updatedAt: new Date()
        }
      }
    );

    // Send password reset email
    const emailResult = await EmailService.sendPasswordResetEmail(
      email,
      resetToken,
      existingUser.username
    );

    await client.close();

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      // Don't reveal email sending failure for security
    } else {
      console.log(`Password reset email sent to ${email}`);
    }

    // Always return success message for security (don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, you will receive password reset instructions.',
      // Include reset token in development for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
