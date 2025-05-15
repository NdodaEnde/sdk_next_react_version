# Authentication System Documentation

This document describes the authentication system implemented for the MedicData Analytics application.

## Overview

The authentication system uses Supabase Auth for user management and JWT (JSON Web Tokens) for securing API endpoints. This implementation provides:

- Secure user authentication with JWT tokens
- Backend validation of authentication tokens
- Role-based access control
- Organization-based access control for multi-tenant operation
- Development mode that allows testing without valid tokens

## Architecture

### Auth Package (`/packages/auth`)

A shared package that provides authentication services for both frontend and backend:

- **Supabase Client**: Creates and manages a Supabase client for authentication
- **Auth Service**: Provides methods for authentication operations (sign in, sign up, etc.)
- **Token Management**: Handles token storage and retrieval

### Frontend Integration

- **Auth Context**: React context for managing authentication state
- **Auth Hook**: Custom hook for authentication operations
- **Protected Routes**: HOC for restricting access to authenticated routes

### Backend Integration

- **Auth Middleware**: JWT validation middleware for protecting API endpoints
- **Role-based Access Control**: Decorator for restricting access based on user roles
- **Organization Context**: Decorator for multi-tenant access control

## Authentication Flow

1. **User Authentication**:
   - User signs in through the Supabase Auth UI or API
   - Supabase returns JWT tokens upon successful authentication
   - Tokens are stored in browser localStorage or cookies

2. **API Requests**:
   - Frontend includes JWT token in the Authorization header
   - Backend validates the token for each protected endpoint
   - If validation succeeds, the request is processed
   - If validation fails, a 401 Unauthorized response is returned

3. **Token Refresh**:
   - Tokens expire after a configured time period
   - Refresh tokens are used to obtain new access tokens
   - If refresh fails, user is redirected to login

## Backend Middleware

The backend uses Flask middleware to protect API endpoints:

### `@requires_auth` Decorator

The primary decorator that validates JWT tokens:

```python
@app.route('/api/protected-endpoint')
@requires_auth
def protected_endpoint(current_user):
    # Access is granted only with valid token
    # current_user contains the decoded token payload
    return jsonify({"data": "Protected data"})
```

### `@requires_role` Decorator

Restricts access based on user role:

```python
@app.route('/api/admin-only')
@requires_role('admin')
def admin_endpoint(current_user):
    # Only users with 'admin' role can access
    return jsonify({"data": "Admin data"})
```

### `@requires_org_context` Decorator

Ensures the request has an organization context for multi-tenant operations:

```python
@app.route('/api/org-data')
@requires_org_context
def org_data(current_user, org_id):
    # Access restricted to users with org context
    # org_id is added to kwargs
    return jsonify({"org_data": f"Data for organization {org_id}"})
```

## Development Mode

When the `SUPABASE_JWT_SECRET` environment variable is not set, the backend operates in development mode:

- JWT signature validation is skipped
- A mock user is provided if no token is present
- Allows testing without valid tokens during development

## Environment Variables

- `SUPABASE_URL`: The URL of your Supabase project
- `SUPABASE_KEY`: The public API key for your Supabase project
- `SUPABASE_JWT_SECRET`: The JWT secret for token validation

## Security Considerations

- JWT tokens are transmitted over HTTPS
- Token validation includes signature verification
- Token expiration is enforced
- Role-based access control adds additional security layer
- Options requests correctly handle CORS with Authorization headers

## Testing

The `test_auth.py` script provides tests for authentication endpoints:

```
python backend/test_auth.py
```

To test with a valid token, set the `TEST_TOKEN` environment variable.

## Endpoints

### Authentication Endpoints
- `/api/auth/validate`: Validates token and returns user information
- `/api/auth/logout`: Handles user logout

### User Profile Endpoints
- `GET /api/users/profile`: Retrieves the authenticated user's profile information
- `PUT /api/users/profile`: Updates the authenticated user's profile information

### Admin Endpoints
- `GET /api/admin/users`: Admin-only endpoint to list all users (role-based access control example)

### Protected API Endpoints
All API endpoints now require authentication:
- `/api/process`: Document processing endpoint
- `/api/chat`: Chat endpoint for AI interactions
- `/api/highlight-pdf`: PDF highlighting endpoint
- `/api/pdf-preview/<filename>`: PDF preview endpoint

## Testing

The `test_auth.py` script provides tests for all authentication endpoints:

```bash
# Run all tests
python backend/test_auth.py

# Run with a real token for more thorough testing
TEST_TOKEN=your_jwt_token python backend/test_auth.py
```

## Next Steps

- Implement organization management for multi-tenant operation
- Add user role management functionality
- Implement invitation system for organizations
- Add password reset functionality
- Add email verification flow