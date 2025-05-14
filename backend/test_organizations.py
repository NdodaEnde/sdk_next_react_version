#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script for organization management endpoints.

This script tests the organization management endpoints in the Flask backend
by making requests to the API with proper authentication.
"""

import os
import requests
import json
import pytest
from dotenv import load_dotenv
import uuid

# Load environment variables
load_dotenv()

# Set base URL for API requests
BASE_URL = "http://localhost:8000"

# Test token (can be replaced with a valid token for testing)
# This is just a placeholder - in a real test, you would use a real token
TEST_TOKEN = os.getenv("TEST_TOKEN", "")

def get_headers():
    """Get headers with authentication token"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {TEST_TOKEN}"
    }

def test_list_organizations():
    """Test listing user's organizations"""
    url = f"{BASE_URL}/api/organizations"
    
    # Without token, should fail
    response = requests.get(url)
    assert response.status_code == 401
    
    # With token (if available)
    if TEST_TOKEN:
        headers = get_headers()
        response = requests.get(url, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "organizations" in data
        assert "total" in data
        print(f"Found {data['total']} organizations")

def test_create_organization():
    """Test creating a new organization"""
    url = f"{BASE_URL}/api/organizations"
    
    # Skip if no token
    if not TEST_TOKEN:
        pytest.skip("No TEST_TOKEN provided in environment")
    
    # Random org name and slug to avoid conflicts
    random_id = str(uuid.uuid4())[:8]
    org_data = {
        "name": f"Test Org {random_id}",
        "slug": f"test-org-{random_id}",
        "description": "Test organization created by test script"
    }
    
    headers = get_headers()
    response = requests.post(url, headers=headers, json=org_data)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == org_data["name"]
    assert data["slug"] == org_data["slug"]
    
    # Return the created org ID for other tests
    return data["id"]

def test_get_organization_details(org_id=None):
    """Test getting organization details"""
    # Skip if no token
    if not TEST_TOKEN:
        pytest.skip("No TEST_TOKEN provided in environment")
    
    # Create org if none provided
    if not org_id:
        org_id = test_create_organization()
    
    url = f"{BASE_URL}/api/organizations/{org_id}"
    headers = get_headers()
    response = requests.get(url, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["id"] == org_id
    assert "name" in data
    assert "slug" in data

def test_update_organization(org_id=None):
    """Test updating organization details"""
    # Skip if no token
    if not TEST_TOKEN:
        pytest.skip("No TEST_TOKEN provided in environment")
    
    # Create org if none provided
    if not org_id:
        org_id = test_create_organization()
    
    url = f"{BASE_URL}/api/organizations/{org_id}"
    update_data = {
        "name": f"Updated Org {uuid.uuid4()[:6]}",
        "description": "Updated test organization description"
    }
    
    headers = get_headers()
    response = requests.put(url, headers=headers, json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "organization" in data
    assert data["organization"]["name"] == update_data["name"]
    assert data["organization"]["description"] == update_data["description"]

def test_list_organization_members(org_id=None):
    """Test listing organization members"""
    # Skip if no token
    if not TEST_TOKEN:
        pytest.skip("No TEST_TOKEN provided in environment")
    
    # Create org if none provided
    if not org_id:
        org_id = test_create_organization()
    
    url = f"{BASE_URL}/api/organizations/{org_id}/members"
    headers = get_headers()
    response = requests.get(url, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "members" in data
    assert "total" in data
    # For a newly created org, should have at least 1 member (the creator)
    assert data["total"] >= 1
    
    # Check first member is owner
    assert data["members"][0]["role"] == "owner"

def test_create_invitation(org_id=None):
    """Test creating an invitation to join an organization"""
    # Skip if no token
    if not TEST_TOKEN:
        pytest.skip("No TEST_TOKEN provided in environment")
    
    # Create org if none provided
    if not org_id:
        org_id = test_create_organization()
    
    url = f"{BASE_URL}/api/organizations/{org_id}/invitations"
    invitation_data = {
        "email": f"test{uuid.uuid4()[:8]}@example.com",
        "role": "member"
    }
    
    headers = get_headers()
    response = requests.post(url, headers=headers, json=invitation_data)
    assert response.status_code == 201
    data = response.json()
    assert "message" in data
    assert "invitation" in data
    assert data["invitation"]["email"] == invitation_data["email"]
    assert data["invitation"]["role"] == invitation_data["role"]
    assert data["invitation"]["status"] == "pending"
    
    # Return invitation token for other tests
    return data["invitation"]["token"]

def test_list_user_invitations():
    """Test listing user's pending invitations"""
    # Skip if no token
    if not TEST_TOKEN:
        pytest.skip("No TEST_TOKEN provided in environment")
    
    url = f"{BASE_URL}/api/invitations"
    headers = get_headers()
    response = requests.get(url, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "invitations" in data
    assert "total" in data

def test_accept_invitation(invitation_token=None):
    """Test accepting an invitation"""
    # Skip if no token
    if not TEST_TOKEN:
        pytest.skip("No TEST_TOKEN provided in environment")
    
    # Create invitation if none provided
    if not invitation_token:
        org_id = test_create_organization()
        invitation_token = test_create_invitation(org_id)
    
    url = f"{BASE_URL}/api/invitations/{invitation_token}/accept"
    headers = get_headers()
    response = requests.post(url, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "member" in data
    assert data["message"] == "Invitation accepted successfully"

def test_decline_invitation(invitation_token=None):
    """Test declining an invitation"""
    # Skip if no token
    if not TEST_TOKEN:
        pytest.skip("No TEST_TOKEN provided in environment")
    
    # Create invitation if none provided
    if not invitation_token:
        org_id = test_create_organization()
        invitation_token = test_create_invitation(org_id)
    
    url = f"{BASE_URL}/api/invitations/{invitation_token}/decline"
    headers = get_headers()
    response = requests.post(url, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "Invitation declined successfully"

def test_set_default_organization(org_id=None):
    """Test setting a user's default organization"""
    # Skip if no token
    if not TEST_TOKEN:
        pytest.skip("No TEST_TOKEN provided in environment")
    
    # Create org if none provided
    if not org_id:
        org_id = test_create_organization()
    
    url = f"{BASE_URL}/api/user/default-organization/{org_id}"
    headers = get_headers()
    response = requests.post(url, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert data["message"] == "Default organization updated successfully"
    
    # Verify it's now the default by listing orgs
    orgs_response = requests.get(f"{BASE_URL}/api/organizations", headers=headers)
    orgs_data = orgs_response.json()
    
    # Find the org in the list
    found_org = next((org for org in orgs_data["organizations"] if org["id"] == org_id), None)
    assert found_org is not None
    assert found_org["is_default"] is True

if __name__ == "__main__":
    # Simple manual test runner
    print("Testing organization endpoints...")
    
    if not TEST_TOKEN:
        print("WARNING: No TEST_TOKEN provided in environment. Most tests will be skipped.")
    
    # Run tests
    print("\nTest: List organizations")
    test_list_organizations()
    print("✅ Test passed")
    
    # Some tests will be skipped without a token
    if TEST_TOKEN:
        print("\nTest: Create organization")
        org_id = test_create_organization()
        print(f"✅ Test passed (Created org: {org_id})")
        
        print("\nTest: Get organization details")
        test_get_organization_details(org_id)
        print("✅ Test passed")
        
        print("\nTest: Update organization")
        test_update_organization(org_id)
        print("✅ Test passed")
        
        print("\nTest: List organization members")
        test_list_organization_members(org_id)
        print("✅ Test passed")
        
        print("\nTest: Create invitation")
        invitation_token = test_create_invitation(org_id)
        print(f"✅ Test passed (Created invitation: {invitation_token})")
        
        print("\nTest: List user invitations")
        test_list_user_invitations()
        print("✅ Test passed")
        
        print("\nTest: Accept invitation")
        test_accept_invitation(invitation_token)
        print("✅ Test passed")
        
        # Create a second invitation for the decline test
        print("\nTest: Decline invitation")
        invitation_token2 = test_create_invitation(org_id)
        test_decline_invitation(invitation_token2)
        print("✅ Test passed")
        
        print("\nTest: Set default organization")
        test_set_default_organization(org_id)
        print("✅ Test passed")
    
    print("\nAll tests completed!")