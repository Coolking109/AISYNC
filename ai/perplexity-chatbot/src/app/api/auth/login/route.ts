import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { LoginRequest, AuthResponse } from '@/lib/auth-types';
import { withTimeout } from '@/lib/timeout-utils';
import * as speakeasy from 'speakeasy';

// Note: This route uses Node.js packages (MongoDB, speakeasy) so cannot use edge runtime

// Force dynamic rendering - prevent static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    console.log('Login API: Request received');
    
    // Parse request with timeout
    const requestData = await withTimeout(
      request.json(),
      5000,
      'Request parsing timeout'
    ) as LoginRequest;
    
    const { email, password, twoFactorCode } = requestData;
    console.log('Login API: Parsed request for email:', email);

    // Validate input
    if (!email || !password) {
      console.log('Login API: Missing email or password');
      return NextResponse.json(
        { success: false, message: 'Email/Username and password are required' },
        { status: 400 }
      );
    }

    console.log('Login API: Connecting to database...');
    const db = await withTimeout(
      getDatabase(),
      10000,
      'Database connection timeout'
    );
    console.log('Login API: Database connected');
    
    // Find user by email OR username with timeout
    console.log('Login API: Finding user...');
    const user = await withTimeout(
      db.collection('users').findOne({
        $or: [
          { email: email },
          { username: email } // Using 'email' field for both email and username input
        ]
      }),
      5000,
      'User lookup timeout'
    ) as any;

    if (!user) {
      console.log('Login API: User not found');
      return NextResponse.json(
        { success: false, message: 'Invalid email/username or password' },
        { status: 401 }
      );
    }

    console.log('Login API: User found, verifying password...');
    // Verify password with timeout
    const isValidPassword = await withTimeout(
      AuthUtils.comparePassword(password, user.passwordHash),
      5000,
      'Password verification timeout'
    );

    if (!isValidPassword) {
      console.log('Login API: Invalid password');
      return NextResponse.json(
        { success: false, message: 'Invalid email/username or password' },
        { status: 401 }
      );
    }

    console.log('Login API: Password valid, checking 2FA...');
    // Check if 2FA is enabled for this user
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!twoFactorCode) {
        console.log('Login API: 2FA required but not provided');
        // Return special response indicating 2FA is required
        return NextResponse.json({
          success: false,
          requires2FA: true,
          message: 'Two-factor authentication code required'
        }, { status: 200 });
      }

      console.log('Login API: Verifying 2FA code...');
      // Verify 2FA code
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2 // Allow some time drift
      });

      if (!verified) {
        console.log('Login API: Invalid 2FA code');
        return NextResponse.json(
          { success: false, message: 'Invalid two-factor authentication code' },
          { status: 401 }
        );
      }
    }

    console.log('Login API: Generating token...');
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

    console.log('Login API: Login successful for user:', user.email);
    const response: AuthResponse = {
      success: true,
      user: userWithoutPassword,
      token,
      message: 'Login successful'
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Login API Error:', error);
    console.error('Error stack:', error.stack);
    
    // Handle timeout errors specifically
    if (error.name === 'TimeoutError') {
      return NextResponse.json(
        { success: false, message: 'Login request timed out. Please try again.' },
        { status: 504 }
      );
    }
    
    // Handle MongoDB connection errors
    if (error.message?.includes('MongoServerError') || error.message?.includes('connection')) {
      return NextResponse.json(
        { success: false, message: 'Database connection error. Please try again.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
