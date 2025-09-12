import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/lib/email-service';

// Note: This route uses Node.js packages and cannot use edge runtime


export async function POST(request: NextRequest) {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { success: false, message: 'Test endpoint only available in development' },
        { status: 403 }
      );
    }

    const { to, type = 'reset' } = await request.json();

    if (!to) {
      return NextResponse.json(
        { success: false, message: 'Email address is required' },
        { status: 400 }
      );
    }

    // Test email connection first
    const connectionTest = await EmailService.testConnection();
    if (!connectionTest) {
      return NextResponse.json(
        { success: false, message: 'Email service configuration error. Check your environment variables.' },
        { status: 500 }
      );
    }

    let result;
    if (type === 'welcome') {
      result = await EmailService.sendWelcomeEmail(to, 'Test User');
    } else {
      result = await EmailService.sendPasswordResetEmail(to, 'test-token-123', 'Test User');
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test ${type} email sent successfully`,
        messageId: result.messageId
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send email',
        error: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send test email', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { message: 'Test endpoint only available in development' },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: 'Email Test Endpoint',
    usage: {
      method: 'POST',
      body: {
        to: 'test@example.com',
        type: 'reset | welcome (optional, defaults to reset)'
      }
    },
    examples: [
      {
        description: 'Test password reset email',
        curl: 'curl -X POST http://localhost:3000/api/test-email -H "Content-Type: application/json" -d \'{"to": "test@example.com", "type": "reset"}\''
      },
      {
        description: 'Test welcome email',
        curl: 'curl -X POST http://localhost:3000/api/test-email -H "Content-Type: application/json" -d \'{"to": "test@example.com", "type": "welcome"}\''
      }
    ]
  });
}
