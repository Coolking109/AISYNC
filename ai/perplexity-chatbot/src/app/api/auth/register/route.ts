import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { AuthUtils } from '@/lib/auth-utils';
import { EmailService } from '@/lib/email-service';
import { RegisterRequest, AuthResponse, User } from '@/lib/auth-types';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { email, username, password }: RegisterRequest = await request.json();

    // Validate input
    if (!email || !username || !password) {
      return NextResponse.json(
        { success: false, message: 'Email, username, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!AuthUtils.validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate username
    const usernameValidation = AuthUtils.validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { success: false, message: usernameValidation.message },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = AuthUtils.validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return NextResponse.json(
        { success: false, message: `A user with that ${field} already exists` },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await AuthUtils.hashPassword(password);

    // Create user
    const newUser = {
      email,
      username,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        defaultModelSelection: { mode: 'all' as 'all' | 'single' },
        theme: 'dark' as 'dark' | 'light' | 'auto',
        language: 'en' as 'en' | 'es' | 'fr' | 'de'
      }
    };

    const result = await db.collection('users').insertOne(newUser);

    // Generate token
    const userWithoutPassword = {
      _id: result.insertedId.toString(),
      email,
      username,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
      preferences: newUser.preferences
    };

    const token = AuthUtils.generateToken(userWithoutPassword);

    // Send welcome email with better logging
    EmailService.sendWelcomeEmail(email, username).then(result => {
      if (result.success) {
        console.log(`✅ Welcome email sent successfully to ${email}`);
      } else {
        console.error('❌ Failed to send welcome email:', result.error);
      }
    }).catch(error => {
      console.error('❌ Welcome email error:', error);
    });

    const response: AuthResponse = {
      success: true,
      user: userWithoutPassword,
      token,
      message: 'Account created successfully! Please check your email for a welcome message.'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
