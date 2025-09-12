import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { LoginRequest, AuthResponse } from '@/lib/auth-types';
import * as speakeasy from 'speakeasy';

// Note: This route uses Node.js packages (MongoDB, speakeasy) so cannot use edge runtime

// Force dynamic rendering - prevent static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    console.log('Login API: Request received');
    
    // Check environment variables first
    if (!process.env.MONGODB_URI) {
      console.error('Login API: MONGODB_URI not found');
      return NextResponse.json(
        { success: false, message: 'Database configuration error' },
        { status: 500 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error('Login API: JWT_SECRET not found');
      return NextResponse.json(
        { success: false, message: 'Authentication configuration error' },
        { status: 500 }
      );
    }
    
    // Parse request with basic error handling
    let requestData;
    try {
      requestData = await request.json() as LoginRequest;
    } catch (parseError) {
      console.error('Login API: Request parsing error:', parseError);
      return NextResponse.json(
        { success: false, message: 'Invalid request format' },
        { status: 400 }
      );
    }
    
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
    let db;
    try {
      db = await getDatabase();
      console.log('Login API: Database connected successfully');
    } catch (dbError) {
      console.error('Login API: Database connection error:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database connection failed' },
        { status: 503 }
      );
    }
    
    // Find user by email OR username
    console.log('Login API: Finding user...');
    let user;
    try {
      user = await db.collection('users').findOne({
        $or: [
          { email: email },
          { username: email }
        ]
      }) as any;
    } catch (userError) {
      console.error('Login API: User lookup error:', userError);
      return NextResponse.json(
        { success: false, message: 'User lookup failed' },
        { status: 500 }
      );
    }

    if (!user) {
      console.log('Login API: User not found');
      return NextResponse.json(
        { success: false, message: 'Invalid email/username or password' },
        { status: 401 }
      );
    }

    console.log('Login API: User found, verifying password...');
    // Verify password
    let isValidPassword;
    try {
      isValidPassword = await AuthUtils.comparePassword(password, user.passwordHash);
    } catch (passwordError) {
      console.error('Login API: Password verification error:', passwordError);
      return NextResponse.json(
        { success: false, message: 'Password verification failed' },
        { status: 500 }
      );
    }

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
        return NextResponse.json({
          success: false,
          requires2FA: true,
          message: 'Two-factor authentication code required'
        }, { status: 200 });
      }

      console.log('Login API: Verifying 2FA code...');
      try {
        const verified = speakeasy.totp.verify({
          secret: user.twoFactorSecret,
          encoding: 'base32',
          token: twoFactorCode,
          window: 2
        });

        if (!verified) {
          console.log('Login API: Invalid 2FA code');
          return NextResponse.json(
            { success: false, message: 'Invalid two-factor authentication code' },
            { status: 401 }
          );
        }
      } catch (twoFAError) {
        console.error('Login API: 2FA verification error:', twoFAError);
        return NextResponse.json(
          { success: false, message: '2FA verification failed' },
          { status: 500 }
        );
      }
    }

    console.log('Login API: Generating token...');
    // Generate token
    let token;
    try {
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

      token = AuthUtils.generateToken(userWithoutPassword);
      console.log('Login API: Token generated successfully');

      const response: AuthResponse = {
        success: true,
        user: userWithoutPassword,
        token,
        message: 'Login successful'
      };

      return NextResponse.json(response);
    } catch (tokenError) {
      console.error('Login API: Token generation error:', tokenError);
      return NextResponse.json(
        { success: false, message: 'Token generation failed' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('Login API: Unexpected error:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error', 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
