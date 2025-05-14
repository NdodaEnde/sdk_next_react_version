"""
Email Verification API Endpoints

This module provides the API endpoints for email verification.
"""

import os
import time
import secrets
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import Blueprint, request, jsonify, redirect, url_for, current_app
from auth_middleware import requires_auth, AuthError

# Create a Blueprint for email verification routes
email_verification_routes = Blueprint('email_verification_routes', __name__)

# In-memory store for email verification tokens
# In a real application, this would be stored in a database
verification_tokens = {}

def generate_verification_token():
    """Generate a secure random token for email verification"""
    return secrets.token_hex(32)

def create_verification_token(user_id, email):
    """Create a verification token for a user"""
    token = generate_verification_token()
    expires_at = datetime.now() + timedelta(hours=24)
    
    verification_tokens[token] = {
        'user_id': user_id,
        'email': email,
        'created_at': datetime.now().isoformat(),
        'expires_at': expires_at.isoformat(),
        'is_used': False
    }
    
    return token

def get_verification_token(token):
    """Get a verification token from the store"""
    return verification_tokens.get(token)

def mark_token_used(token):
    """Mark a token as used"""
    if token in verification_tokens:
        verification_tokens[token]['is_used'] = True
        verification_tokens[token]['used_at'] = datetime.now().isoformat()
        return True
    return False

def is_token_valid(token):
    """Check if a token is valid"""
    token_data = get_verification_token(token)
    if not token_data:
        return False
    
    if token_data['is_used']:
        return False
    
    expires_at = datetime.fromisoformat(token_data['expires_at'])
    if expires_at < datetime.now():
        return False
    
    return True

# Mock user database
# In a real application, this would be a real database
user_profiles = {}

def get_user_profile(user_id):
    """Get a user profile from the store"""
    return user_profiles.get(user_id, {})

def update_user_profile(user_id, data):
    """Update a user profile in the store"""
    if user_id not in user_profiles:
        user_profiles[user_id] = {}
    
    user_profiles[user_id].update(data)
    return user_profiles[user_id]

def mark_email_verified(user_id, email):
    """Mark a user's email as verified"""
    profile = get_user_profile(user_id)
    profile['email_verified'] = True
    profile['email_verified_at'] = datetime.now().isoformat()
    profile['email'] = email
    update_user_profile(user_id, profile)
    return True

# Email verification routes

@email_verification_routes.route('/auth/email/verification/send', methods=['POST'])
@requires_auth
def send_verification_email_endpoint(current_user):
    """Send a verification email to the user"""
    try:
        data = request.json
        if not data or 'email' not in data:
            return jsonify({"error": "Email is required"}), 400

        email = data['email']
        user_id = current_user.get('sub')

        # Create a verification token
        token = create_verification_token(user_id, email)

        # Build the verification URL
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        verification_link = f"{frontend_url}/auth/verify-email?token={token}"

        # Send the email
        from email_service import send_verification_email
        email_sent = send_verification_email(email, verification_link)

        # For debug purposes, include the link in dev environments
        debug_info = {}
        if os.getenv('FLASK_ENV') == 'development':
            debug_info['debug_link'] = verification_link

        # Return success response
        return jsonify({
            "status": "success",
            "message": "Verification email sent" if email_sent else "Email service not configured, but token created",
            **debug_info
        })

    except Exception as e:
        print(f"Error sending verification email: {e}")
        return jsonify({"error": str(e)}), 500

@email_verification_routes.route('/auth/email/verify', methods=['GET'])
def verify_email():
    """Verify a user's email address"""
    token = request.args.get('token')
    if not token:
        return jsonify({"error": "Token is required"}), 400
    
    # Check if token is valid
    if not is_token_valid(token):
        return jsonify({"error": "Invalid or expired token"}), 400
    
    # Get token data
    token_data = get_verification_token(token)
    user_id = token_data.get('user_id')
    email = token_data.get('email')
    
    # Mark token as used
    mark_token_used(token)
    
    # Mark email as verified
    mark_email_verified(user_id, email)
    
    # In a real application, you might redirect to a success page
    return jsonify({
        "status": "success",
        "message": "Email verified successfully"
    })

@email_verification_routes.route('/auth/email/verification/status', methods=['GET'])
@requires_auth
def check_verification_status(current_user):
    """Check if the user's email is verified"""
    user_id = current_user.get('sub')
    profile = get_user_profile(user_id)
    
    return jsonify({
        "verified": profile.get('email_verified', False),
        "email": profile.get('email', current_user.get('email')),
        "verified_at": profile.get('email_verified_at')
    })

# Additional helper function for other parts of the application
def requires_verified_email(f):
    """Decorator that requires a verified email"""
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
            user_id = current_user.get('sub')
            profile = get_user_profile(user_id)
            
            if not profile.get('email_verified', False):
                raise AuthError({
                    'code': 'email_not_verified',
                    'description': 'Email verification required'
                }, 403)
            
            return f(*args, **kwargs)
        except AuthError as e:
            return jsonify(e.error), e.status_code
    
    # Make sure to apply the requires_auth decorator first
    return requires_auth(decorated)