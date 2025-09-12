# Email Configuration Guide

The forgot password feature requires email configuration to send password reset emails to users. Here are the setup instructions for different email providers.

## Gmail Configuration (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Update your `.env.local`**:
   ```bash
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   ```

## Alternative Email Providers

### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
EMAIL_USER=your-verified-sender@domain.com
```

### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-smtp-username
SMTP_PASSWORD=your-mailgun-smtp-password
EMAIL_USER=your-verified-sender@domain.com
```

### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
EMAIL_USER=your-verified-sender@domain.com
```

## Testing Email Configuration

The system includes an email test endpoint. Once configured, you can test your email settings:

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com"}'
```

## Email Templates

The system includes beautiful HTML email templates for:
- **Password Reset**: Professional email with reset link and security information
- **Welcome Email**: Sent automatically when new users register

## Security Notes

- Never commit real email credentials to version control
- Use environment variables for all sensitive information
- App passwords are more secure than regular passwords for Gmail
- Consider using dedicated email services (SendGrid, Mailgun) for production

## Troubleshooting

### Common Issues:
1. **"Invalid login"** with Gmail → Enable 2FA and use App Password
2. **"Authentication failed"** → Check SMTP credentials
3. **"Connection timeout"** → Verify SMTP host and port
4. **Emails not sending** → Check spam folder, verify sender domain

### Development Mode
In development mode, the forgot password endpoint also returns the reset token in the response for testing purposes. This is automatically disabled in production.

## Production Considerations

- Use a dedicated email service (not personal Gmail)
- Implement email rate limiting
- Monitor email delivery rates
- Set up proper SPF/DKIM records for your domain
- Consider using email templates with your branding
