import os
import json
import time
from functools import wraps
from flask import request, jsonify, current_app
import jwt
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get Supabase JWT secret from environment
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')
if not SUPABASE_JWT_SECRET:
    print("Warning: SUPABASE_JWT_SECRET not set in .env")

class AuthError(Exception):
    """Custom exception for authentication errors"""
    def __init__(self, error, status_code):
        self.error = error
        self.status_code = status_code

def get_token_auth_header():
    """Get the Access Token from the Authorization Header"""
    auth = request.headers.get('Authorization', None)
    print(f"Authorization header: {auth}")
    if not auth:
        raise AuthError({
            'code': 'authorization_header_missing',
            'description': 'Authorization header is expected'
        }, 401)

    parts = auth.split()

    if parts[0].lower() != 'bearer':
        raise AuthError({
            'code': 'invalid_header',
            'description': 'Authorization header must start with Bearer'
        }, 401)
    elif len(parts) == 1:
        raise AuthError({
            'code': 'invalid_header',
            'description': 'Token not found'
        }, 401)
    elif len(parts) > 2:
        raise AuthError({
            'code': 'invalid_header',
            'description': 'Authorization header must be Bearer token'
        }, 401)

    token = parts[1]
    return token

def validate_jwt(token):
    """Validate the JWT token"""
    try:
        # Decode the JWT token
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=['HS256'],
            options={'verify_signature': SUPABASE_JWT_SECRET is not None}
        )
        
        # Check token expiration
        if 'exp' in payload and payload['exp'] < time.time():
            raise AuthError({
                'code': 'token_expired',
                'description': 'Token has expired'
            }, 401)
        
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthError({
            'code': 'token_expired',
            'description': 'Token has expired'
        }, 401)
    except jwt.InvalidTokenError:
        raise AuthError({
            'code': 'invalid_token',
            'description': 'Token is invalid'
        }, 401)

def requires_auth(f):
    """Decorator that checks for a valid JWT token in the Authorization header"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            # If supabase JWT secret is not set, skip validation in development
            if not SUPABASE_JWT_SECRET:
                current_app.logger.warning("SUPABASE_JWT_SECRET not set - skipping JWT validation")
                # In dev mode, still try to parse the token if provided
                try:
                    token = get_token_auth_header()
                    payload = jwt.decode(token, options={"verify_signature": False})
                    kwargs['current_user'] = payload
                except:
                    # If no token or invalid token, use a mock user in dev mode
                    kwargs['current_user'] = {
                        'sub': 'mock-user-id',
                        'email': 'mock-user@example.com',
                        'org_id': 'mock-org-id',
                        'role': 'admin'
                    }
                return f(*args, **kwargs)
            
            token = get_token_auth_header()
            payload = validate_jwt(token)
            kwargs['current_user'] = payload
            return f(*args, **kwargs)
        except AuthError as e:
            return jsonify(e.error), e.status_code
    return decorated

def verify_token():
    """Verify the token and return the user info"""
    try:
        # If supabase JWT secret is not set, skip validation in development
        if not SUPABASE_JWT_SECRET:
            current_app.logger.warning("SUPABASE_JWT_SECRET not set - skipping JWT validation")
            # In dev mode, still try to parse the token if provided
            try:
                token = get_token_auth_header()
                payload = jwt.decode(token, options={"verify_signature": False})
                return payload
            except:
                # If no token or invalid token, use a mock user in dev mode
                print("Using mock user in development mode")
                return {
                    'sub': 'mock-user-id',
                    'email': 'mock-user@example.com',
                    'org_id': 'mock-org-id',
                    'role': 'admin'
                }
        
        token = get_token_auth_header()
        payload = validate_jwt(token)
        return payload
    except AuthError as e:
        # Create a response with proper CORS headers
        response = jsonify(e.error)
        response.headers.add('Access-Control-Allow-Origin', request.headers.get('Origin', 'http://localhost:3000'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.status_code = e.status_code
        
        # We can't just return the response here because it would bypass the Flask view function
        # So we need to raise the exception for the caller to handle
        raise e


def requires_role(required_role):
    """Decorator that checks if the user has the required role"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            try:
                # Get current user from the requires_auth decorator
                if 'current_user' not in kwargs:
                    raise AuthError({
                        'code': 'missing_user',
                        'description': 'Current user not found in request'
                    }, 500)
                
                current_user = kwargs['current_user']
                
                # Check if user has the required role
                user_role = current_user.get('role', None)
                if user_role != required_role:
                    raise AuthError({
                        'code': 'insufficient_permissions',
                        'description': f'Requires {required_role} role'
                    }, 403)
                
                return f(*args, **kwargs)
            except AuthError as e:
                return jsonify(e.error), e.status_code
        
        # Make sure to apply the requires_auth decorator first
        return requires_auth(decorated)
    return decorator

def requires_org_context(f):
    """Decorator that ensures the request has an organization context"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            # Get current user from the requires_auth decorator
            if 'current_user' not in kwargs:
                raise AuthError({
                    'code': 'missing_user',
                    'description': 'Current user not found in request'
                }, 500)
            
            current_user = kwargs['current_user']
            
            # Check if user has an organization context
            org_id = current_user.get('org_id', None)
            if not org_id:
                raise AuthError({
                    'code': 'missing_org_context',
                    'description': 'Organization context required for this operation'
                }, 403)
            
            # Add the organization ID to the kwargs for the endpoint to use
            kwargs['org_id'] = org_id
            
            return f(*args, **kwargs)
        except AuthError as e:
            return jsonify(e.error), e.status_code
    
    # Make sure to apply the requires_auth decorator first
    return requires_auth(decorated)

def get_current_user_id(request):
    """Helper function to get the current user ID from the request context"""
    try:
        token = get_token_auth_header()
        payload = validate_jwt(token)
        return payload.get('sub')
    except:
        return None

def get_current_org_id(request):
    """Helper function to get the current organization ID from the request context

    Priority:
    1. From custom X-Organization-ID header
    2. From the JWT token's org_id claim
    3. None if not found
    """
    try:
        # First check for the org_id in headers
        org_id_from_header = request.headers.get('X-Organization-ID')
        if org_id_from_header:
            return org_id_from_header

        # Otherwise try to get it from the JWT token
        token = get_token_auth_header()
        payload = validate_jwt(token)
        return payload.get('org_id')
    except:
        return None

def with_org_context(f):
    """Decorator that adds organization context if available but doesn't require it"""
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            # Get the current user from the requires_auth decorator
            if 'current_user' not in kwargs:
                raise AuthError({
                    'code': 'missing_user',
                    'description': 'Current user not found in request'
                }, 500)

            current_user = kwargs['current_user']

            # Add organization ID to kwargs if it's in the request header
            org_id = request.headers.get('X-Organization-ID')
            if org_id:
                # In a real implementation, verify the user belongs to this org
                kwargs['org_id'] = org_id
            elif 'org_id' in current_user:
                # If not in header but in token, use that
                kwargs['org_id'] = current_user.get('org_id')

            return f(*args, **kwargs)
        except AuthError as e:
            return jsonify(e.error), e.status_code

    # Make sure to apply the requires_auth decorator first
    return requires_auth(decorated)