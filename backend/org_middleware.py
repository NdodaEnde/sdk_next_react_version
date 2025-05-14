"""
Organization middleware for Flask applications

This module extends auth_middleware with organization-specific functionality.
"""

import os
from functools import wraps
from flask import request, jsonify, current_app
from auth_middleware import requires_auth, requires_role, AuthError, get_token_auth_header, validate_jwt

def verify_org_membership(user_id, org_id, required_roles=None):
    """
    Verify if a user is a member of an organization with optional role check
    
    This would typically query the database. For our example, we'll assume 
    membership is valid in development mode.
    """
    # In development mode, assume membership is valid
    supabase_jwt_secret = os.getenv('SUPABASE_JWT_SECRET')
    if not supabase_jwt_secret:
        return True
        
    # In a real implementation, query the database to verify membership
    # Example: query organization_members table for user_id and org_id
    # If required_roles is provided, also check if user's role is in the required_roles list
    
    # For now, just return True (dev implementation)
    # In production, this should actually check the database
    return True

def get_organization_context(request, current_user):
    """
    Get the organization context from the request or user token
    
    Priority:
    1. From custom X-Organization-ID header
    2. From the JWT token's org_id claim
    """
    # First check for the org_id in headers
    org_id = request.headers.get('X-Organization-ID')
    
    # If not in header, check the token
    if not org_id and current_user and 'org_id' in current_user:
        org_id = current_user.get('org_id')
        
    return org_id

def requires_organization(f):
    """Decorator that requires an organization context for the endpoint"""
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
            user_id = current_user.get('sub')
            
            # Get organization ID from header or token
            org_id = get_organization_context(request, current_user)
            
            if not org_id:
                raise AuthError({
                    'code': 'missing_org_context',
                    'description': 'Organization context required for this operation'
                }, 403)
            
            # Verify the user belongs to this org
            if not verify_org_membership(user_id, org_id):
                raise AuthError({
                    'code': 'invalid_org_context',
                    'description': 'User is not a member of this organization'
                }, 403)
                
            # Add the organization ID to the kwargs for the endpoint to use
            kwargs['org_id'] = org_id
            
            return f(*args, **kwargs)
        except AuthError as e:
            return jsonify(e.error), e.status_code
    
    # Make sure to apply the requires_auth decorator first
    return requires_auth(decorated)

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
            user_id = current_user.get('sub')
            
            # Get organization ID from header or token
            org_id = get_organization_context(request, current_user)
            
            if org_id:
                # Verify the user belongs to this org
                if verify_org_membership(user_id, org_id):
                    kwargs['org_id'] = org_id
                else:
                    raise AuthError({
                        'code': 'invalid_org_context',
                        'description': 'User is not a member of this organization'
                    }, 403)
            
            # Continue even if no organization context is found
            return f(*args, **kwargs)
        except AuthError as e:
            return jsonify(e.error), e.status_code
    
    # Make sure to apply the requires_auth decorator first
    return requires_auth(decorated)

def requires_org_role(org_role):
    """Decorator that requires a specific role within the organization"""
    def decorator(f):
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
                user_id = current_user.get('sub')
                
                # Get organization ID from header or token
                org_id = get_organization_context(request, current_user)
                
                if not org_id:
                    raise AuthError({
                        'code': 'missing_org_context',
                        'description': 'Organization context required for this operation'
                    }, 403)
                
                # Verify the user has the required role in this org
                if not verify_org_membership(user_id, org_id, [org_role]):
                    raise AuthError({
                        'code': 'insufficient_org_permissions',
                        'description': f'Requires {org_role} role in the organization'
                    }, 403)
                    
                # Add the organization ID to the kwargs for the endpoint to use
                kwargs['org_id'] = org_id
                
                return f(*args, **kwargs)
            except AuthError as e:
                return jsonify(e.error), e.status_code
        
        # Make sure to apply the requires_auth decorator first
        return requires_auth(decorated)
    return decorator