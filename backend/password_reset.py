"""
Password Reset API Endpoints

This module provides the API endpoints for password reset functionality.
"""

import os
import time
import re
import secrets
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import Blueprint, request, jsonify, redirect, url_for, current_app

# Create a Blueprint for password reset routes
password_reset_routes = Blueprint('password_reset_routes', __name__)

# In-memory store for password reset tokens
# In a real application, this would be stored in a database
reset_tokens = {}

# Mock user database
# In a real application, this would be a real database
# For this example, we'll use a simple dict with email -> password_hash
user_db = {
    "user@example.com": {
        "id": "user123",
        "password_hash": bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        "name": "Test User"
    }
}

def generate_reset_token():
    """Generate a secure random token for password reset"""
    return secrets.token_hex(32)

def create_reset_token(user_id, email):
    """Create a reset token for a user"""
    token = generate_reset_token()
    expires_at = datetime.now() + timedelta(hours=1)
    
    reset_tokens[token] = {
        'user_id': user_id,
        'email': email,
        'created_at': datetime.now().isoformat(),
        'expires_at': expires_at.isoformat(),
        'is_used': False
    }
    
    return token

def get_reset_token(token):
    """Get a reset token from the store"""
    return reset_tokens.get(token)

def mark_token_used(token):
    """Mark a token as used"""
    if token in reset_tokens:
        reset_tokens[token]['is_used'] = True
        reset_tokens[token]['used_at'] = datetime.now().isoformat()
        return True
    return False

def is_token_valid(token):
    """Check if a token is valid"""
    token_data = get_reset_token(token)
    if not token_data:
        return False
    
    if token_data['is_used']:
        return False
    
    expires_at = datetime.fromisoformat(token_data['expires_at'])
    if expires_at < datetime.now():
        return False
    
    return True

def find_user_by_email(email):
    """Find a user by email"""
    if email in user_db:
        return {
            "id": user_db[email]["id"],
            "email": email,
            "name": user_db[email]["name"]
        }
    return None

def update_user_password(user_id, new_password):
    """Update a user's password"""
    # Find the user by ID
    user_email = None
    for email, user_data in user_db.items():
        if user_data["id"] == user_id:
            user_email = email
            break
    
    if not user_email:
        return False
    
    # Hash the new password
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Update the password
    user_db[user_email]["password_hash"] = password_hash
    
    return True

def is_valid_password(password):
    """Check if a password meets the complexity requirements"""
    # Minimum 8 characters
    if len(password) < 8:
        return False
    
    # At least one uppercase letter
    if not re.search(r'[A-Z]', password):
        return False
    
    # At least one lowercase letter
    if not re.search(r'[a-z]', password):
        return False
    
    # At least one digit
    if not re.search(r'\d', password):
        return False
    
    # At least one special character
    if not re.search(r'[@$!%*?&]', password):
        return False
    
    return True

# Password reset routes

@password_reset_routes.route('/auth/password/reset/request', methods=['POST'])
def request_password_reset():
    """Request a password reset"""
    try:
        data = request.json
        if not data or 'email' not in data:
            return jsonify({"error": "Email is required"}), 400
        
        email = data['email']
        
        # Find user by email
        user = find_user_by_email(email)
        
        # If user exists, create a reset token and send an email
        if user:
            token = create_reset_token(user["id"], email)
            
            # Build the reset URL
            frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
            reset_link = f"{frontend_url}/auth/reset-password?token={token}"
            
            # In a real application, this would send an actual email
            # For now, we'll just log it
            from email_service import send_password_reset_email
            send_password_reset_email(email, reset_link)
            
            print(f"Password reset token for {email}: {token}")
            print(f"Password reset link: {reset_link}")
        
        # Always return success to prevent user enumeration
        return jsonify({
            "status": "success",
            "message": "If your email exists in our system, you will receive password reset instructions"
        })
        
    except Exception as e:
        print(f"Error in password reset request: {e}")
        return jsonify({"error": str(e)}), 500

@password_reset_routes.route('/auth/password/reset/verify', methods=['GET'])
def verify_reset_token():
    """Verify a password reset token"""
    token = request.args.get('token')
    if not token:
        return jsonify({
            "status": "error",
            "valid": False,
            "message": "Token is required"
        }), 400
    
    # Check if token is valid
    if not is_token_valid(token):
        return jsonify({
            "status": "error",
            "valid": False,
            "message": "Invalid or expired token"
        }), 400
    
    # Get token data
    token_data = get_reset_token(token)
    
    return jsonify({
        "status": "success",
        "valid": True,
        "email": token_data.get('email')
    })

@password_reset_routes.route('/auth/password/reset', methods=['POST'])
def reset_password():
    """Reset a user's password"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Check required fields
        required_fields = ['token', 'password', 'password_confirmation']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        token = data['token']
        password = data['password']
        password_confirmation = data['password_confirmation']
        
        # Check if token is valid
        if not is_token_valid(token):
            return jsonify({
                "status": "error",
                "message": "Invalid or expired token"
            }), 400
        
        # Check if passwords match
        if password != password_confirmation:
            return jsonify({
                "status": "error",
                "message": "Passwords do not match"
            }), 400
        
        # Check password complexity
        if not is_valid_password(password):
            return jsonify({
                "status": "error",
                "message": "Password does not meet complexity requirements: minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character"
            }), 400
        
        # Get token data
        token_data = get_reset_token(token)
        user_id = token_data.get('user_id')
        
        # Update the user's password
        success = update_user_password(user_id, password)
        if not success:
            return jsonify({
                "status": "error",
                "message": "Failed to update password"
            }), 500
        
        # Mark token as used
        mark_token_used(token)
        
        return jsonify({
            "status": "success",
            "message": "Password reset successfully"
        })
        
    except Exception as e:
        print(f"Error in password reset: {e}")
        return jsonify({"error": str(e)}), 500