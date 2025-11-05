# Security Policy

## Security Improvements Implemented

This document outlines the security improvements made to the ASAD Event-Based Project application.

### 1. Authentication & Authorization

#### JWT Token Security
- **Token Expiration**: Access tokens now expire after 1 hour
- **Secure Token Payload**: Tokens no longer contain sensitive information (passwords, full user objects)
- **Token Verification**: All tokens are properly verified using `jwt.verify()` instead of just decoded
- **Secure Cookies**: Cookies are now set with `httpOnly`, `secure` (in production), and `sameSite: strict` flags

#### Authorization Controls
- **Role-Based Access**: Socket.io connections verify that users can only perform actions appropriate for their role
- **User Type Validation**: Publishers can only connect as publishers, subscribers as subscribers

### 2. Input Validation & Sanitization

#### XSS Prevention
- All user inputs are sanitized using DOMPurify to prevent XSS attacks
- HTML tags and scripts are stripped from user-provided content

#### Input Validation
- **Usernames**: Must be 3-30 characters, alphanumeric with underscores and hyphens only
- **Passwords**: Minimum 8 characters required with at least one uppercase letter, one lowercase letter, one digit, and one special character
- **Topic Names**: Must be 2-50 characters, alphanumeric with spaces, underscores, and hyphens
- **Content**: Limited to 1-1000 characters
- **Ratings**: Validated to be numbers between 0-5

### 3. Security Headers & Middleware

#### Helmet.js
- Content Security Policy (CSP) configured to restrict script and style sources
- Protection against common web vulnerabilities
- **Note**: CSP currently uses `'unsafe-inline'` for scripts and styles due to legacy inline code. For production, consider moving inline scripts to external files or using CSP nonces.

#### Rate Limiting
- Configured to limit requests to 100 per 15-minute window
- Prevents brute force attacks and DoS attempts

#### Request Size Limits
- JSON and URL-encoded body payloads limited to 10KB
- Prevents memory exhaustion attacks

### 4. Information Disclosure Prevention

#### Removed/Modified Endpoints
- **Removed `/users` endpoint**: Previously exposed all user data including hashed passwords
- **Limited `/health` endpoint**: Now only returns basic status, version, and timestamp (removed memory usage, active users, etc.)

#### Logging Improvements
- Sensitive information no longer logged
- Error messages sanitized to prevent information leakage

### 5. WebSocket Security

#### Token Verification
- Socket.io connections now verify JWT tokens instead of just decoding them
- Invalid tokens result in immediate disconnection

#### Event Authorization
- All socket events validate that the user has permission to perform the action
- Input validation on all socket event parameters

### 6. Password Security

#### Bcrypt Configuration
- Password hashing now uses configurable rounds (default: 10)
- Passwords are properly hashed using bcrypt before storage

### 7. CORS Configuration

#### Socket.io CORS
- CORS policy configured for Socket.io
- Can be configured via `CORS_ORIGIN` environment variable
- Default is to not allow cross-origin requests

## Environment Variables

The following environment variables must be set for the application to run:

```bash
ACCESS_TOKEN_SECRET=<64-byte-hex-string>
REFRESH_TOKEN_SECRET=<64-byte-hex-string>
NODE_ENV=development|production
CORS_ORIGIN=<allowed-origin> # Optional
```

Generate secure secrets using:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Security Best Practices

### For Deployment

1. **Always use HTTPS in production** - Set `NODE_ENV=production` to enable secure cookies
2. **Keep secrets secret** - Never commit `.env` files to version control
3. **Use strong secrets** - Generate new random secrets for each environment
4. **Configure CORS** - Set `CORS_ORIGIN` to your frontend domain
5. **Monitor logs** - Review security-related log entries regularly
6. **Keep dependencies updated** - Regularly run `pnpm audit` and update packages

### For Development

1. **Use the `.env.example` file** as a template
2. **Generate unique secrets** for your local environment
3. **Never use production secrets** in development

## Known Limitations

1. **Session Management**: Currently uses stateless JWT tokens without refresh token rotation
2. **Rate Limiting**: Rate limiting is IP-based and may need adjustment for production use behind proxies
3. **User Storage**: User data is stored in memory and will be lost on server restart
4. **Account Security**: No account lockout mechanism after multiple failed login attempts

## Reporting Security Issues

If you discover a security vulnerability, please email the maintainers directly rather than creating a public issue.

## Future Improvements

1. Implement refresh token rotation
2. Add persistent storage for user data
3. Implement account lockout after failed login attempts
4. Add two-factor authentication support
5. Implement session management with Redis
6. Add comprehensive audit logging
7. Implement content moderation for published articles
8. Add file upload security if file uploads are implemented
