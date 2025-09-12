import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { ResetPasswordRequest } from '@/lib/auth-types';

// Note: This route uses Node.js packages and cannot use edge runtime


const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://coresystembots_db_user:eXBLikJoEBqJUgcA@cluster0.diplw6a.mongodb.net/perplexity-chatbot';

export async function POST(request: NextRequest) {
  try {
    const body: ResetPasswordRequest = await request.json();
    const { token, newPassword } = body;

    // Validate input
    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = AuthUtils.validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
        { status: 400 }
      );
    }

    const client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db('perplexity-chatbot');
    const users = db.collection('users');

    // Find user with valid reset token
    const user = await users.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      await client.close();
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await AuthUtils.hashPassword(newPassword);

    // Update user password and clear reset token
    await users.updateOne(
      { _id: user._id },
      { 
        $set: { 
          passwordHash: hashedPassword,
          updatedAt: new Date()
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordExpires: ""
        }
      }
    );

    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Password has been successfully reset. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while resetting your password' },
      { status: 500 }
    );
  }
}
