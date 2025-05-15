# Password Reset System Design

This document outlines the design for the password reset system, including the database schema, API endpoints, and user flows.

## Overview

The password reset system allows users to securely reset their passwords when they have forgotten them. The system will:

1. Allow users to request a password reset by providing their email
2. Generate and send a secure, time-limited reset token
3. Provide a secure page for users to set a new password using the token
4. Enforce password complexity requirements
5. Notify users of successful password resets

## Database Schema

### Password Reset Tokens Table

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  used_at TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN DEFAULT FALSE,
  
  -- Each user can only have a limited number of active tokens
  CONSTRAINT user_email_reset_key UNIQUE (user_id, email)
);

-- Index for token lookups
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
-- Index for user lookups
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
```

## API Endpoints

### Request Password Reset

```
POST /api/auth/password/reset/request
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
  "message": "If your email exists in our system, you will receive password reset instructions"
}
```

### Verify Reset Token

```
GET /api/auth/password/reset/verify?token=<reset_token>
```

**Response (Success):**
```json
{
  "status": "success",
  "valid": true,
  "email": "user@example.com"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "valid": false,
  "message": "Invalid or expired token"
}
```

### Reset Password

```
POST /api/auth/password/reset
```

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "new-password",
  "password_confirmation": "new-password"
}
```

**Response (Success):**
```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

**Response (Error):**
```json
{
  "status": "error",
  "message": "Invalid token or password does not meet requirements"
}
```

## Email Templates

### Password Reset Email

**Subject:** Reset Your Password

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
      <h1>Reset Your Password</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>We received a request to reset your password. To reset your password, click the button below:</p>
      <p style="text-align: center;">
        <a class="button" href="{{reset_link}}">Reset Password</a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p>{{reset_link}}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p>Best regards,<br>The Team</p>
    </div>
  </div>
</body>
</html>
```

## User Flow

1. **Request Password Reset**
   - User navigates to login page
   - User clicks "Forgot password?" link
   - User enters email address
   - System checks if email exists
     - If email exists, system generates reset token and sends email
     - If email doesn't exist, system still shows success message for security
   - User receives confirmation message

2. **Reset Password**
   - User receives email with reset link
   - User clicks link to open reset page
   - System validates token
     - If token is valid, shows password reset form
     - If token is invalid or expired, shows error message
   - User enters new password and confirmation
   - System validates password strength
   - System updates password in database
   - User is redirected to login page with success message

## Implementation Details

### Token Generation

The reset token should be a secure random string:

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

Tokens should expire after 1 hour:

```sql
-- SQL query to check if token is valid
SELECT * FROM password_reset_tokens
WHERE token = $1 AND expires_at > NOW() AND is_used = FALSE;
```

### Password Validation

Passwords should meet these requirements:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

```javascript
// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const isValidPassword = (password) => passwordRegex.test(password);
```

```python
# Password validation in Python
import re
def is_valid_password(password):
    pattern = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
    return bool(re.match(pattern, password))
```

### Password Hashing

Passwords should be securely hashed before storage:

```javascript
// Using bcrypt for Node.js
const bcrypt = require('bcrypt');
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};
```

```python
# Using passlib for Python
from passlib.hash import bcrypt
def hash_password(password):
    return bcrypt.hash(password)
```

### Security Considerations

1. **Rate Limiting**
   - Limit the number of password reset requests from the same IP
   - Implement exponential backoff for repeated requests

2. **Token Security**
   - Use cryptographically secure random tokens
   - Store tokens securely
   - Set appropriate token expiration
   - Invalidate tokens after use

3. **Email Safety**
   - Do not include the original password in emails
   - Use TLS for email transmission
   - Validate email addresses

4. **Preventing Enumeration**
   - Use consistent response times regardless of whether email exists
   - Always return success message even if email doesn't exist

## Frontend Components

1. **Password Reset Request Page**
   - Form for entering email address
   - Validation for email format
   - Success and error messages

2. **Password Reset Page**
   - Form for entering new password and confirmation
   - Password strength meter
   - Validation for password requirements
   - Success and error messages

3. **Login Page Integration**
   - "Forgot password?" link on login page
   - Success message after password reset

## Integration with Existing System

The password reset system will integrate with:

1. **Authentication System**
   - Use existing user database
   - Update user passwords securely

2. **Email Service**
   - Use existing email service for sending reset emails

3. **Security Audit**
   - Log password reset attempts for security monitoring