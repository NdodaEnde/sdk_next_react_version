"""
Organization Management API Routes

This module provides routes for managing organizations in a multi-tenant application.
"""

import os
import time
import uuid
import json
from flask import Blueprint, request, jsonify, current_app
from auth_middleware import requires_auth, requires_role, requires_org_context, AuthError
from datetime import datetime, timedelta

# Create a Blueprint for organization routes
org_routes = Blueprint('org_routes', __name__)

# In a real application, this would connect to your database
# For this example, we'll use in-memory storage
organizations = {}
org_members = {}
org_invitations = {}

# Mock database functions
def get_user_organizations(user_id):
    """Get organizations for a specific user"""
    user_orgs = []
    for org_id, members in org_members.items():
        for member in members:
            if member['user_id'] == user_id:
                if org_id in organizations:
                    user_orgs.append({
                        'id': org_id,
                        'name': organizations[org_id]['name'],
                        'slug': organizations[org_id]['slug'],
                        'role': member['role'],
                        'is_default': member.get('is_default', False)
                    })
    return user_orgs

def get_organization(org_id):
    """Get details of a specific organization"""
    return organizations.get(org_id)

def get_organization_members(org_id):
    """Get members of a specific organization"""
    return org_members.get(org_id, [])

def create_organization(name, slug, description, user_id):
    """Create a new organization and add the creator as owner"""
    org_id = str(uuid.uuid4())
    
    # Create organization
    organizations[org_id] = {
        'id': org_id,
        'name': name,
        'slug': slug,
        'description': description,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'settings': {},
        'subscription_tier': 'free',
        'subscription_status': 'active',
        'is_active': True
    }
    
    # Add creator as owner
    if org_id not in org_members:
        org_members[org_id] = []
    
    org_members[org_id].append({
        'id': str(uuid.uuid4()),
        'organization_id': org_id,
        'user_id': user_id,
        'role': 'owner',
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'is_default': True
    })
    
    return org_id

def update_organization(org_id, data):
    """Update organization details"""
    if org_id in organizations:
        for key, value in data.items():
            if key in ['name', 'description', 'settings']:
                organizations[org_id][key] = value
        
        organizations[org_id]['updated_at'] = datetime.now().isoformat()
        return True
    return False

def add_organization_member(org_id, user_id, role='member', is_default=False):
    """Add a member to an organization"""
    if org_id not in org_members:
        org_members[org_id] = []
    
    # Check if user is already a member
    for member in org_members[org_id]:
        if member['user_id'] == user_id:
            member['role'] = role
            member['updated_at'] = datetime.now().isoformat()
            return member
    
    new_member = {
        'id': str(uuid.uuid4()),
        'organization_id': org_id,
        'user_id': user_id,
        'role': role,
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat(),
        'is_default': is_default
    }
    
    org_members[org_id].append(new_member)
    return new_member

def remove_organization_member(org_id, user_id):
    """Remove a member from an organization"""
    if org_id in org_members:
        org_members[org_id] = [m for m in org_members[org_id] if m['user_id'] != user_id]
        return True
    return False

def update_member_role(org_id, user_id, new_role):
    """Update a member's role in an organization"""
    if org_id in org_members:
        for member in org_members[org_id]:
            if member['user_id'] == user_id:
                member['role'] = new_role
                member['updated_at'] = datetime.now().isoformat()
                return True
    return False

def create_invitation(org_id, email, role, invited_by):
    """Create an invitation to join an organization"""
    if org_id not in org_invitations:
        org_invitations[org_id] = []
    
    # Check for existing invitation
    for invitation in org_invitations[org_id]:
        if invitation['email'] == email and invitation['status'] == 'pending':
            return invitation
    
    # Generate a secure token
    token = str(uuid.uuid4())
    
    invitation = {
        'id': str(uuid.uuid4()),
        'organization_id': org_id,
        'email': email,
        'role': role,
        'invited_by': invited_by,
        'created_at': datetime.now().isoformat(),
        'expires_at': (datetime.now() + timedelta(days=7)).isoformat(),
        'token': token,
        'status': 'pending'
    }
    
    org_invitations[org_id].append(invitation)
    return invitation

def get_invitation_by_token(token):
    """Get an invitation by its token"""
    for org_id, invites in org_invitations.items():
        for invite in invites:
            if invite['token'] == token:
                return invite
    return None

def accept_invitation(token, user_id):
    """Accept an invitation and add user to the organization"""
    invitation = get_invitation_by_token(token)
    if not invitation or invitation['status'] != 'pending':
        return None
    
    # Update invitation status
    invitation['status'] = 'accepted'
    
    # Add user to organization
    member = add_organization_member(
        invitation['organization_id'],
        user_id,
        invitation['role']
    )
    
    return member

def decline_invitation(token):
    """Decline an invitation"""
    invitation = get_invitation_by_token(token)
    if not invitation or invitation['status'] != 'pending':
        return False
    
    invitation['status'] = 'declined'
    return True

def set_default_organization(user_id, org_id):
    """Set a user's default organization"""
    # First, unset current default
    for o_id, members in org_members.items():
        for member in members:
            if member['user_id'] == user_id and member.get('is_default', False):
                member['is_default'] = False
    
    # Set new default
    if org_id in org_members:
        for member in org_members[org_id]:
            if member['user_id'] == user_id:
                member['is_default'] = True
                return True
    
    return False

def get_pending_invitations_for_email(email):
    """Get pending invitations for a specific email"""
    pending_invites = []
    for org_id, invites in org_invitations.items():
        for invite in invites:
            if invite['email'] == email and invite['status'] == 'pending':
                # Add organization info
                invite_with_org = invite.copy()
                if org_id in organizations:
                    invite_with_org['organization'] = {
                        'id': org_id,
                        'name': organizations[org_id]['name'],
                        'slug': organizations[org_id]['slug']
                    }
                pending_invites.append(invite_with_org)
    return pending_invites

def check_organization_access(user_id, org_id, required_roles=None):
    """Check if a user has access to an organization with optional role check"""
    if org_id in org_members:
        for member in org_members[org_id]:
            if member['user_id'] == user_id:
                if required_roles and member['role'] not in required_roles:
                    return False
                return True
    return False

# Routes

@org_routes.route('/organizations', methods=['GET'])
@requires_auth
def list_organizations(current_user):
    """List organizations for the current user"""
    user_id = current_user.get('sub')
    user_orgs = get_user_organizations(user_id)
    
    return jsonify({
        'organizations': user_orgs,
        'total': len(user_orgs)
    })

@org_routes.route('/organizations', methods=['POST'])
@requires_auth
def create_new_organization(current_user):
    """Create a new organization"""
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        required_fields = ['name', 'slug']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Check for duplicate slug
        for org_id, org in organizations.items():
            if org['slug'] == data['slug']:
                return jsonify({"error": "Organization with this slug already exists"}), 409
        
        user_id = current_user.get('sub')
        org_id = create_organization(
            data['name'],
            data['slug'],
            data.get('description', ''),
            user_id
        )
        
        return jsonify({
            'id': org_id,
            'name': data['name'],
            'slug': data['slug'],
            'message': 'Organization created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@org_routes.route('/organizations/<org_id>', methods=['GET'])
@requires_auth
def get_organization_details(current_user, org_id):
    """Get details of a specific organization"""
    user_id = current_user.get('sub')
    
    # Check access
    if not check_organization_access(user_id, org_id):
        return jsonify({"error": "Access denied"}), 403
    
    org = get_organization(org_id)
    if not org:
        return jsonify({"error": "Organization not found"}), 404
    
    return jsonify(org)

@org_routes.route('/organizations/<org_id>', methods=['PUT'])
@requires_auth
def update_organization_details(current_user, org_id):
    """Update organization details"""
    try:
        user_id = current_user.get('sub')
        
        # Check admin/owner access
        if not check_organization_access(user_id, org_id, ['admin', 'owner']):
            return jsonify({"error": "Access denied - requires admin or owner role"}), 403
        
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Only allow updating certain fields
        allowed_fields = ['name', 'description', 'settings']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        
        if not update_data:
            return jsonify({"error": "No valid fields to update"}), 400
        
        success = update_organization(org_id, update_data)
        if not success:
            return jsonify({"error": "Organization not found"}), 404
        
        return jsonify({
            "message": "Organization updated successfully",
            "organization": get_organization(org_id)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@org_routes.route('/organizations/<org_id>/members', methods=['GET'])
@requires_auth
def list_organization_members(current_user, org_id):
    """List members of a specific organization"""
    user_id = current_user.get('sub')
    
    # Check access
    if not check_organization_access(user_id, org_id):
        return jsonify({"error": "Access denied"}), 403
    
    members = get_organization_members(org_id)
    
    return jsonify({
        'members': members,
        'total': len(members)
    })

@org_routes.route('/organizations/<org_id>/members', methods=['POST'])
@requires_auth
def add_member_to_organization(current_user, org_id):
    """Add a new member to an organization directly (without invitation)"""
    try:
        user_id = current_user.get('sub')
        
        # Check admin/owner access
        if not check_organization_access(user_id, org_id, ['admin', 'owner']):
            return jsonify({"error": "Access denied - requires admin or owner role"}), 403
        
        data = request.json
        if not data or 'user_id' not in data:
            return jsonify({"error": "Missing required field: user_id"}), 400
        
        new_member = add_organization_member(
            org_id,
            data['user_id'],
            data.get('role', 'member')
        )
        
        return jsonify({
            "message": "Member added successfully",
            "member": new_member
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@org_routes.route('/organizations/<org_id>/members/<user_id>', methods=['DELETE'])
@requires_auth
def remove_member_from_organization(current_user, org_id, user_id):
    """Remove a member from an organization"""
    try:
        current_user_id = current_user.get('sub')
        
        # Check admin/owner access
        if not check_organization_access(current_user_id, org_id, ['admin', 'owner']):
            return jsonify({"error": "Access denied - requires admin or owner role"}), 403
        
        # Can't remove yourself if you're the last owner
        if current_user_id == user_id:
            owners = [m for m in get_organization_members(org_id) 
                     if m['role'] == 'owner']
            if len(owners) == 1 and owners[0]['user_id'] == current_user_id:
                return jsonify({
                    "error": "Cannot remove the last owner from an organization"
                }), 400
        
        success = remove_organization_member(org_id, user_id)
        if not success:
            return jsonify({"error": "Member not found"}), 404
        
        return jsonify({
            "message": "Member removed successfully"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@org_routes.route('/organizations/<org_id>/members/<user_id>/role', methods=['PUT'])
@requires_auth
def update_member_role_in_organization(current_user, org_id, user_id):
    """Update a member's role in an organization"""
    try:
        current_user_id = current_user.get('sub')
        
        # Check owner access for changing roles
        if not check_organization_access(current_user_id, org_id, ['owner']):
            return jsonify({"error": "Access denied - requires owner role"}), 403
        
        data = request.json
        if not data or 'role' not in data:
            return jsonify({"error": "Missing required field: role"}), 400
        
        # Validate role
        if data['role'] not in ['member', 'admin', 'owner']:
            return jsonify({"error": "Invalid role"}), 400
        
        success = update_member_role(org_id, user_id, data['role'])
        if not success:
            return jsonify({"error": "Member not found"}), 404
        
        return jsonify({
            "message": "Member role updated successfully"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@org_routes.route('/organizations/<org_id>/invitations', methods=['POST'])
@requires_auth
def create_organization_invitation(current_user, org_id):
    """Create an invitation to join an organization"""
    try:
        user_id = current_user.get('sub')
        
        # Check admin/owner access
        if not check_organization_access(user_id, org_id, ['admin', 'owner']):
            return jsonify({"error": "Access denied - requires admin or owner role"}), 403
        
        data = request.json
        if not data or 'email' not in data:
            return jsonify({"error": "Missing required field: email"}), 400
        
        invitation = create_invitation(
            org_id,
            data['email'],
            data.get('role', 'member'),
            user_id
        )
        
        # In a real app, you would send an email here
        # with a link containing the invitation token
        
        return jsonify({
            "message": "Invitation created successfully",
            "invitation": invitation
        }), 201
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@org_routes.route('/invitations', methods=['GET'])
@requires_auth
def list_user_invitations(current_user):
    """List pending invitations for the current user"""
    email = current_user.get('email')
    if not email:
        return jsonify({"error": "No email associated with current user"}), 400
    
    invitations = get_pending_invitations_for_email(email)
    
    return jsonify({
        'invitations': invitations,
        'total': len(invitations)
    })

@org_routes.route('/invitations/<token>/accept', methods=['POST'])
@requires_auth
def accept_organization_invitation(current_user, token):
    """Accept an invitation to join an organization"""
    try:
        user_id = current_user.get('sub')
        
        member = accept_invitation(token, user_id)
        if not member:
            return jsonify({"error": "Invalid or expired invitation"}), 400
        
        return jsonify({
            "message": "Invitation accepted successfully",
            "member": member
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@org_routes.route('/invitations/<token>/decline', methods=['POST'])
@requires_auth
def decline_organization_invitation(current_user, token):
    """Decline an invitation to join an organization"""
    try:
        success = decline_invitation(token)
        if not success:
            return jsonify({"error": "Invalid or expired invitation"}), 400
        
        return jsonify({
            "message": "Invitation declined successfully"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@org_routes.route('/user/default-organization/<org_id>', methods=['POST'])
@requires_auth
def set_user_default_organization(current_user, org_id):
    """Set a user's default organization"""
    try:
        user_id = current_user.get('sub')
        
        # Check access to the organization
        if not check_organization_access(user_id, org_id):
            return jsonify({"error": "Access denied - not a member of this organization"}), 403
        
        success = set_default_organization(user_id, org_id)
        if not success:
            return jsonify({"error": "Organization not found or user is not a member"}), 404
        
        return jsonify({
            "message": "Default organization updated successfully"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500