import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static getTransporter() {
    if (!this.transporter) {
      // Check if email configuration exists
      if (!process.env.EMAIL_USER) {
        console.warn('⚠️ Email service not configured - EMAIL_USER environment variable missing');
        console.warn('📧 To enable emails, set EMAIL_USER and EMAIL_PASSWORD in your .env file');
        return null;
      }

      console.log('📧 Configuring email service with Gmail...');
      
      // Gmail configuration with custom sender name
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        from: process.env.SMTP_FROM || 'AISync <noreply@aisync.dev>', // Use environment variable
      });

      console.log('✅ Email service configured successfully for:', process.env.EMAIL_USER);
    }

    return this.transporter;
  }

  static async sendWelcomeEmail(email: string, username: string) {
    try {
      const transporter = this.getTransporter();
      
      if (!transporter) {
        console.warn('📧 Email service not configured - skipping welcome email');
        return { success: false, error: 'Email service not configured' };
      }
      
      const mailOptions = {
        from: process.env.SMTP_FROM || 'AISync Security <noreply@aisync.dev>',
        replyTo: 'support@aisync.dev',
        to: email,
        subject: 'Welcome to AISync! 🎉',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to AISync</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                line-height: 1.6;
              }
              .email-wrapper {
                max-width: 650px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 25px 50px rgba(0,0,0,0.15);
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.08)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.3;
              }
              .logo {
                font-size: 48px;
                margin-bottom: 10px;
                position: relative;
                z-index: 1;
              }
              .header h1 {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 8px;
                position: relative;
                z-index: 1;
              }
              .header p {
                font-size: 18px;
                opacity: 0.9;
                position: relative;
                z-index: 1;
              }
              .content {
                padding: 40px 30px;
                background: white;
              }
              .greeting {
                font-size: 24px;
                color: #2d3748;
                margin-bottom: 20px;
                font-weight: 600;
              }
              .intro {
                font-size: 16px;
                color: #4a5568;
                margin-bottom: 30px;
                line-height: 1.7;
              }
              .features-title {
                font-size: 20px;
                color: #2d3748;
                margin-bottom: 25px;
                font-weight: 600;
                text-align: center;
              }
              .features-grid {
                display: grid;
                gap: 15px;
                margin-bottom: 30px;
              }
              .feature-card {
                background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                border-radius: 12px;
                padding: 20px;
                border-left: 4px solid #667eea;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
              }
              .feature-card::before {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%);
                border-radius: 0 12px 0 60px;
              }
              .feature-icon {
                font-size: 24px;
                margin-bottom: 8px;
                display: inline-block;
              }
              .feature-title {
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 5px;
              }
              .feature-desc {
                color: #4a5568;
                font-size: 14px;
                line-height: 1.5;
              }
              .cta-section {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                padding: 25px;
                text-align: center;
                margin: 30px 0;
                color: white;
              }
              .cta-button {
                display: inline-block;
                background: rgba(255,255,255,0.2);
                color: white;
                text-decoration: none;
                padding: 12px 30px;
                border-radius: 25px;
                font-weight: 600;
                border: 2px solid rgba(255,255,255,0.3);
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
              }
              .footer {
                background: #f7fafc;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
              }
              .footer-title {
                font-size: 18px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 10px;
              }
              .footer-text {
                color: #718096;
                font-size: 14px;
                margin-bottom: 20px;
              }
              .footer-legal {
                font-size: 12px;
                color: #a0aec0;
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
                margin-top: 20px;
              }
              @media (max-width: 600px) {
                .email-wrapper { margin: 10px; border-radius: 15px; }
                .header { padding: 30px 20px; }
                .content { padding: 30px 20px; }
                .header h1 { font-size: 28px; }
                .greeting { font-size: 22px; }
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="header">
                <div class="logo">🧠</div>
                <h1>Welcome to AISync</h1>
                <p>The Future of AI is Here</p>
              </div>
              
              <div class="content">
                <div class="greeting">Hello ${username}! 👋</div>
                <div class="intro">
                  Welcome to AISync! We're thrilled to have you join our community of AI enthusiasts. Your account is now active and you have access to the most advanced AI models in the world.
                </div>
                
                <div class="features-title">🚀 What Makes AISync Special</div>
                
                <div class="features-grid">
                  <div class="feature-card">
                    <div class="feature-icon">🤖</div>
                    <div class="feature-title">Multi-Model AI Power</div>
                    <div class="feature-desc">Chat with OpenAI GPT-4, Google Gemini, Anthropic Claude, Cohere, Mistral, and our exclusive AISync Nexus all in one place.</div>
                  </div>
                  
                  <div class="feature-card">
                    <div class="feature-icon">🖼️</div>
                    <div class="feature-title">Advanced Vision Analysis</div>
                    <div class="feature-desc">Upload images and get detailed analysis from vision-capable models including our revolutionary AISync Nexus.</div>
                  </div>
                  
                  <div class="feature-card">
                    <div class="feature-icon">💾</div>
                    <div class="feature-title">Smart Session Management</div>
                    <div class="feature-desc">All your conversations are automatically saved, organized, and easily searchable across devices.</div>
                  </div>
                  
                  <div class="feature-card">
                    <div class="feature-icon">🧠</div>
                    <div class="feature-title">AISync Nexus</div>
                    <div class="feature-desc">Our proprietary learning AI that continuously evolves, adapts, and provides increasingly intelligent responses.</div>
                  </div>
                  
                  <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <div class="feature-title">Lightning Fast Responses</div>
                    <div class="feature-desc">Choose to query all models simultaneously or focus on a specific one for optimized performance.</div>
                  </div>
                  
                  <div class="feature-card">
                    <div class="feature-icon">📁</div>
                    <div class="feature-title">Universal File Support</div>
                    <div class="feature-desc">Upload documents, images, and more for comprehensive AI analysis and insights.</div>
                  </div>
                </div>
                
                <div class="cta-section">
                  <h3 style="margin-bottom: 15px;">Ready to Experience the Future?</h3>
                  <p style="margin-bottom: 20px; opacity: 0.9;">Start your first conversation and discover what makes AISync different.</p>
                  <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}" class="cta-button">🚀 Launch AISync</a>
                </div>
              </div>
              
              <div class="footer">
                <div class="footer-title">🎉 Welcome to the AISync Family!</div>
                <div class="footer-text">
                  Thank you for choosing AISync. We're here to help you unlock the full potential of AI technology.
                </div>
                <div class="footer-legal">
                  This email was sent to ${email} because you created an AISync account.<br>
                  If you have any questions, feel free to reply to this email.<br>
                  © 2025 AISync. All rights reserved.
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Welcome to AISync!

Hello ${username}!

Thank you for joining AISync! Your account is now ready to use.

What you can do with AISync:
🤖 Multi-Model AI Chat: Access OpenAI GPT-4, Google Gemini, Anthropic Claude, Cohere, Mistral, and AISync Nexus
🖼️ Image Analysis: Upload images and get detailed analysis from vision-capable models
💾 Smart Sessions: All conversations automatically saved and organized  
⚙️ Flexible Model Selection: Query all models or focus on a specific one
🧠 AISync Nexus: Our revolutionary learning AI that continuously improves
📁 File Support: Upload documents and images for AI analysis

Ready to get started? Visit: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}

Happy chatting!
The AISync Team

---
This email was sent to ${email} because you created an AISync account.
        `.trim()
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully to:', email);
      console.log('📧 Message ID:', result.messageId);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async sendPasswordResetEmail(email: string, resetToken: string, username: string) {
    try {
      const transporter = this.getTransporter();
      
      if (!transporter) {
        console.warn('📧 Email service not configured - skipping password reset email');
        return { success: false, error: 'Email service not configured' };
      }
      
      const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.SMTP_FROM || 'AISync Security <noreply@aisync.dev>',
        replyTo: 'noreply@aisync.dev',
        to: email,
        subject: 'Reset Your AISync Password 🔒',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                background: linear-gradient(135deg, #dc3545 0%, #6f42c1 100%);
                margin: 0;
                padding: 20px;
                line-height: 1.6;
              }
              .email-wrapper {
                max-width: 650px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 25px 50px rgba(0,0,0,0.15);
              }
              .header {
                background: linear-gradient(135deg, #dc3545 0%, #6f42c1 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
              }
              .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.08)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.3;
              }
              .logo {
                font-size: 48px;
                margin-bottom: 10px;
                position: relative;
                z-index: 1;
              }
              .header h1 {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
                position: relative;
                z-index: 1;
              }
              .header p {
                font-size: 16px;
                opacity: 0.9;
                position: relative;
                z-index: 1;
              }
              .content {
                padding: 40px 30px;
                background: white;
              }
              .greeting {
                font-size: 24px;
                color: #2d3748;
                margin-bottom: 20px;
                font-weight: 600;
              }
              .intro {
                font-size: 16px;
                color: #4a5568;
                margin-bottom: 30px;
                line-height: 1.7;
              }
              .cta-section {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
                color: white;
              }
              .reset-button {
                display: inline-block;
                background: rgba(255,255,255,0.2);
                color: white;
                text-decoration: none;
                padding: 15px 40px;
                border-radius: 25px;
                font-weight: 600;
                font-size: 16px;
                border: 2px solid rgba(255,255,255,0.3);
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
                margin: 10px 0;
              }
              .link-section {
                background: #f7fafc;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
              }
              .reset-link {
                word-break: break-all;
                background: #white;
                padding: 15px;
                border-radius: 8px;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
                font-size: 14px;
                color: #2d3748;
                border: 1px solid #e2e8f0;
              }
              .warning-box {
                background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
                border-left: 4px solid #e53e3e;
                border-radius: 12px;
                padding: 20px;
                margin: 25px 0;
                color: #742a2a;
              }
              .warning-title {
                font-weight: 600;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .warning-list {
                margin: 10px 0;
                padding-left: 20px;
              }
              .warning-list li {
                margin-bottom: 5px;
                line-height: 1.5;
              }
              .footer {
                background: #f7fafc;
                padding: 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
              }
              .footer-title {
                font-size: 18px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 10px;
              }
              .footer-text {
                color: #718096;
                font-size: 14px;
                margin-bottom: 20px;
              }
              .footer-legal {
                font-size: 12px;
                color: #a0aec0;
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
                margin-top: 20px;
              }
              @media (max-width: 600px) {
                .email-wrapper { margin: 10px; border-radius: 15px; }
                .header { padding: 30px 20px; }
                .content { padding: 30px 20px; }
                .header h1 { font-size: 24px; }
                .greeting { font-size: 22px; }
              }
            </style>
          </head>
          <body>
            <div class="email-wrapper">
              <div class="header">
                <div class="logo">🔒</div>
                <h1>Password Reset Request</h1>
                <p>AISync Security Center</p>
              </div>
              
              <div class="content">
                <div class="greeting">Hello ${username},</div>
                <div class="intro">
                  We received a request to reset your AISync account password. If you made this request, you can create a new password using the button below.
                </div>
                
                <div class="cta-section">
                  <h3 style="margin-bottom: 15px;">Reset Your Password</h3>
                  <p style="margin-bottom: 20px; opacity: 0.9;">Click the button below to create a new secure password</p>
                  <a href="${resetUrl}" class="reset-button">🔑 Create New Password</a>
                </div>
                
                <div class="link-section">
                  <p style="margin-bottom: 10px; font-weight: 600; color: #2d3748;">Having trouble with the button? Copy this link:</p>
                  <div class="reset-link">${resetUrl}</div>
                </div>
                
                <div class="warning-box">
                  <div class="warning-title">
                    <span>⚠️</span>
                    <span>Important Security Information</span>
                  </div>
                  <ul class="warning-list">
                    <li>This reset link expires in <strong>1 hour</strong> for your security</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your current password remains active until you create a new one</li>
                    <li>This link can only be used once to maintain security</li>
                    <li>Never share this link with anyone</li>
                  </ul>
                </div>
                
                <p style="color: #4a5568; font-size: 14px; text-align: center; margin-top: 20px;">
                  If you continue to have problems, please contact our support team.
                </p>
              </div>
              
              <div class="footer">
                <div class="footer-title">🛡️ AISync Security Team</div>
                <div class="footer-text">
                  This is an automated security email to protect your account.
                </div>
                <div class="footer-legal">
                  This email was sent to ${email} for account security purposes.<br>
                  © 2025 AISync. All rights reserved.
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Password Reset Request - AISync

Hello ${username},

We received a request to reset your AISync account password.

To reset your password, copy and paste this link into your browser:
${resetUrl}

Important Security Information:
- This reset link expires in 1 hour
- If you didn't request this reset, please ignore this email  
- Your current password remains active until you create a new one
- This link can only be used once

AISync Security Team
        `.trim()
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully to:', email);
      return { success: true, messageId: result.messageId };

    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Test email configuration
  static async testConnection() {
    try {
      const transporter = this.getTransporter();
      
      if (!transporter) {
        console.warn('📧 Email service not configured - cannot test connection');
        return false;
      }
      
      console.log('🔍 Testing email service connection...');
      await transporter.verify();
      console.log('✅ Email service is ready and working correctly!');
      return true;
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
      return false;
    }
  }
}
