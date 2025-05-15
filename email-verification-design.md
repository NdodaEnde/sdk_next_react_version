# Email Verification System Design

This document outlines the design for the email verification system, including the database schema, API endpoints, and user flows.

## Overview

The email verification system allows users to verify their email addresses to enhance security and confirm identity. The system will:

1. Send a verification email to users when they register
2. Allow users to request new verification emails
3. Verify email addresses when users click on the verification link
4. Track the verification status in the user profile
5. Enforce email verification requirements for sensitive operations

## Database Schema

### Email Verification Tokens Table

```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  used_at TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN DEFAULT FALSE,
  
  -- Each user can only have a limited number of active tokens
  CONSTRAINT user_email_key UNIQUE (user_id, email)
);

-- Index for token lookups
CREATE INDEX idx_verification_tokens_token ON email_verification_tokens(token);
-- Index for user lookups
CREATE INDEX idx_verification_tokens_user_id ON email_verification_tokens(user_id);
```

### User Profile Extension

Add an `email_verified` column to the user profiles table:

```sql
ALTER TABLE user_profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN email_verified_at TIMESTAMP WITH TIME ZONE;
```

In the case where we're using Supabase Auth, we'll need to check if the email verification status is already tracked in the auth.users table.

## API Endpoints

### Send Verification Email

```
POST /api/auth/email/verification/send
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Verification email sent"
}
```

### Verify Email

```
GET /api/auth/email/verify?token=<verification_token>
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "Email verified successfully"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Invalid or expired token"
}
```

### Check Verification Status

```
GET /api/auth/email/verification/status
```

**Response:**
```json
{
  "verified": true,
  "email": "user@example.com",
  "verified_at": "2025-05-01T12:34:56Z"
}
```

## Email Templates

### Verification Email

**Subject:** Verify Your Email Address

**Body:**
```html
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 10px 20px; text-align: center; }
    .content { padding: 20px; border: 1px solid #ddd; }
    .button { display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verify Your Email Address</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Thank you for registering. Please click the button below to verify your email address:</p>
      <p style="text-align: center;">
        <a class="button" href="{{verification_link}}">Verify Email Address</a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p>{{verification_link}}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not register for an account, please ignore this email.</p>
      <p>Best regards,<br>The Team</p>
    </div>
  </div>
</body>
</html>
```

## User Flow

1. **Registration Flow**
   - User registers with email and password
   - System creates user account
   - System sends verification email
   - User receives email with verification link
   - User clicks link to verify email
   - System marks email as verified
   - User is redirected to dashboard with success message

2. **Manual Verification Flow**
   - User logs in with unverified email
   - System shows verification banner/alert
   - User requests new verification email
   - System sends new verification email
   - User receives email with verification link
   - User clicks link to verify email
   - System marks email as verified
   - User is redirected to dashboard with success message

## Implementation Details

### Token Generation

The verification token should be a secure random string:

```javascript
// Node.js implementation
const crypto = require('crypto');
const generateToken = () => crypto.randomBytes(32).toString('hex');
```

```python
# Python implementation
import secrets
def generate_token():
    return secrets.token_hex(32)
```

### Token Expiration

Tokens should expire after 24 hours:

```sql
-- SQL query to check if token is valid
SELECT * FROM email_verification_tokens
WHERE token = $1 AND expires_at > NOW() AND is_used = FALSE;
```

### Email Sending

We'll use a transactional email service like SendGrid, Mailgun, or Amazon SES:

```javascript
// Example with SendGrid
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationEmail = async (email, verificationLink) => {
  const msg = {
    to: email,
    from: 'noreply@example.com',
    subject: 'Verify Your Email Address',
    text: `Please verify your email by clicking this link: ${verificationLink}`,
    html: emailTemplate.replace('{{verification_link}}', verificationLink),
  };
  
  return sgMail.send(msg);
};
```

### Security Considerations

1. **Rate Limiting**
   - Limit the number of verification emails sent to the same address
   - Implement exponential backoff for repeated requests

2. **Token Security**
   - Use cryptographically secure random tokens
   - Store tokens securely (hashed if possible)
   - Set appropriate token expiration

3. **Email Safety**
   - Do not include sensitive information in emails
   - Use TLS for email transmission
   - Validate email addresses

## Frontend Components

1. **Email Verification Banner**
   - Shown to users with unverified emails
   - Contains action to resend verification email

2. **Verification Success Page**
   - Shown after successful verification
   - Provides confirmation and next steps

3. **Verification Error Page**
   - Shown when verification fails
   - Provides options to resend or contact support

## Integration with Existing System

The email verification system will integrate with:

1. **Authentication System**
   - Registration process to trigger verification emails
   - Login process to check verification status

2. **User Profile**
   - Display email verification status
   - Allow manual reverification

3. **Permission System**
   - Use verification status for permission checks
   - Restrict certain actions to verified users only