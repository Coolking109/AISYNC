import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { LoginRequest, AuthResponse } from '@/lib/auth-types';
import * as speakeasy from 'speakeasy';

export const runtime = 'edge';

// Note: This route uses Node.js packages (MongoDB, speakeasy) so cannot use edge runtime

export async function POST(request: NextRequest) {
  try {
    const { email, password, twoFactorCode }: LoginRequest = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email/Username and password are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Find user by email OR username
    const user = await db.collection('users').findOne({
      $or: [
        { email: email },
        { username: email } // Using 'email' field for both email and username input
      ]
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email/username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await AuthUtils.comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid email/username or password' },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        // Return special response indicating 2FA is required
        return NextResponse.json({
          success: false,
          requires2FA: true,
          message: 'Two-factor authentication code required'
        }, { status: 200 });
      }

      // Verify 2FA code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2 // Allow some time drift
      });

      if (!verified) {
        return NextResponse.json(
          { success: false, message: 'Invalid two-factor authentication code' },
          { status: 401 }
        );
      }
    }

    // Generate token
    const userWithoutPassword = {
      _id: user._id.toString(),
      email: user.email,
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      twoFactorEnabled: user.twoFactorEnabled || false,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      preferences: user.preferences
    };

    const token = AuthUtils.generateToken(userWithoutPassword);

    const response: AuthResponse = {
      success: true,
      user: userWithoutPassword,
      token,
      message: 'Login successful'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
