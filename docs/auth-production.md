# Auth Production Configuration

## Supabase Auth Settings

### Production Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| Site URL | `https://yourdomain.com` | Must match production domain |
| Redirect URLs | `https://yourdomain.com/*` | Allow all app routes |
| JWT expiry | 3600 (1 hour) | Balance security vs UX |
| Refresh token rotation | Enabled | Required for security |
| Refresh token reuse interval | 10 seconds | Prevent race conditions |
| Enable email confirmations | true | Required for production |
| Enable phone confirmations | false | Unless using phone auth |
| Minimum password length | 8 | Balance security vs UX |
| Password complexity | Letters + numbers | Reasonable for fitness app |

### Email Configuration

Configure in Supabase Dashboard → Authentication → Email:

- **Sender email**: `noreply@yourdomain.com`
- **Sender name**: `AI Fitness OS`
- **Confirm email**: Enabled
- **Password reset**: Enabled
- **Email change confirmation**: Enabled

### SMTP Provider

Use a transactional email service:
- Resend (recommended)
- SendGrid
- Mailgun
- Amazon SES

### Session Management

| Setting | Value | Notes |
|---------|-------|-------|
| Session timeout | 7 days | Reasonable for mobile app |
| Inactivity timeout | 24 hours | Security vs convenience |
| Maximum sessions per user | 5 | Prevent abuse |

## Security Rules

### Password Policy
- Minimum 8 characters
- At least one letter and one number
- No common passwords (Supabase built-in)
- Password history: 5 (prevent reuse)

### Rate Limiting
- Login attempts: 5 per minute per IP
- Signup: 3 per minute per IP
- Password reset: 3 per hour per email
- OTP: 5 per minute per phone

### Session Security
- JWT signed with strong secret
- Refresh token rotation enabled
- Token reuse detection enabled
- Secure cookie flags (HTTPS only)

## Production Checklist

- [ ] Site URL configured for production domain
- [ ] Redirect URLs include all app routes
- [ ] Email confirmation enabled
- [ SMTP configured with transactional email service
- [ ] Password policy enforced
- [ ] Rate limiting configured
- [ ] JWT expiry set appropriately
- [ ] Refresh token rotation enabled
- [ ] Demo mode disabled in production
- [ ] No test credentials in production

## MFA Roadmap

For future implementation:
- TOTP (Google Authenticator, Authy)
- SMS backup codes
- Recovery codes
- Hardware keys (WebAuthn)

## Monitoring

Monitor auth health:
- Failed login attempts
- Password reset requests
- Session creation/destruction
- Token refresh failures
