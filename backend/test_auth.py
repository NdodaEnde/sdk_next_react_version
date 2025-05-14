#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Test script for authentication endpoints and JWT validation.

This script tests the authentication endpoints in the Flask backend
by making requests to the API with and without valid JWT tokens.
"""

import os
import requests
import json
import pytest
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set base URL for API requests
BASE_URL = "http://localhost:8000"

# Test token (can be replaced with a valid token for testing)
# This is just a placeholder - in a real test, you would use a real token
TEST_TOKEN = os.getenv("TEST_TOKEN", "")

def test_validate_endpoint_no_token():
    """Test that the validate endpoint returns 401 without a token"""
    url = f"{BASE_URL}/api/auth/validate"
    response = requests.get(url)
    assert response.status_code == 401
    data = response.json()
    assert "authorization_header_missing" in data.get("code", "")

def test_validate_endpoint_invalid_token():
    """Test that the validate endpoint returns 401 with an invalid token"""
    url = f"{BASE_URL}/api/auth/validate"
    headers = {"Authorization": f"Bearer invalid_token"}
    response = requests.get(url, headers=headers)
    
    # If SUPABASE_JWT_SECRET is set, we expect 401
    # If it's not set (dev mode), we expect 200 with mock data
    if os.getenv("SUPABASE_JWT_SECRET"):
        assert response.status_code == 401
        data = response.json()
        assert "invalid_token" in data.get("code", "")
    else:
        # In dev mode without JWT secret, we should get mock user data
        assert response.status_code == 200
        data = response.json()
        assert data.get("user_id") == "mock-user-id"
        assert data.get("authenticated") is True

def test_validate_endpoint_with_token():
    """Test that the validate endpoint returns 200 with a valid token"""
    # Skip if no test token is provided
    if not TEST_TOKEN:
        pytest.skip("No TEST_TOKEN provided in environment")
        
    url = f"{BASE_URL}/api/auth/validate"
    headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
    response = requests.get(url, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data.get("authenticated") is True
    assert "user_id" in data
    assert "email" in data

def test_protected_endpoints_no_token():
    """Test that protected endpoints return 401 without a token"""
    # Test process endpoint
    url = f"{BASE_URL}/api/process"
    response = requests.post(url)
    assert response.status_code == 401
    
    # Test chat endpoint
    url = f"{BASE_URL}/api/chat"
    response = requests.post(url)
    assert response.status_code == 401
    
    # Test highlight-pdf endpoint
    url = f"{BASE_URL}/api/highlight-pdf"
    response = requests.post(url)
    assert response.status_code == 401
    
    # Test pdf-preview endpoint (need a filename)
    url = f"{BASE_URL}/api/pdf-preview/test.pdf"
    response = requests.get(url)
    assert response.status_code == 401

def test_logout_endpoint():
    """Test the logout endpoint"""
    url = f"{BASE_URL}/api/auth/logout"

    # Without token, should fail
    response = requests.post(url)
    assert response.status_code == 401

    # With valid token (or in dev mode)
    if TEST_TOKEN:
        headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
        response = requests.post(url, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"
    elif not os.getenv("SUPABASE_JWT_SECRET"):
        # In dev mode without JWT secret
        headers = {"Authorization": "Bearer fake_token"}
        response = requests.post(url, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"

def test_user_profile_endpoint():
    """Test the user profile endpoint"""
    url = f"{BASE_URL}/api/users/profile"

    # Without token, should fail
    response = requests.get(url)
    assert response.status_code == 401

    # With valid token (or in dev mode)
    if TEST_TOKEN:
        headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
        response = requests.get(url, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
    elif not os.getenv("SUPABASE_JWT_SECRET"):
        # In dev mode without JWT secret
        headers = {"Authorization": "Bearer fake_token"}
        response = requests.get(url, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data.get("id") == "mock-user-id"
        assert data.get("email") == "mock-user@example.com"

def test_update_profile_endpoint():
    """Test the update profile endpoint"""
    url = f"{BASE_URL}/api/users/profile"
    profile_update = {
        "name": "Test User",
        "avatar_url": "https://example.com/avatar.png",
        "preferences": {
            "theme": "dark",
            "notifications": True
        }
    }

    # Without token, should fail
    response = requests.put(url, json=profile_update)
    assert response.status_code == 401

    # With valid token (or in dev mode)
    if TEST_TOKEN:
        headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
        response = requests.put(url, headers=headers, json=profile_update)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"
        assert data.get("user", {}).get("name") == "Test User"
    elif not os.getenv("SUPABASE_JWT_SECRET"):
        # In dev mode without JWT secret
        headers = {"Authorization": "Bearer fake_token"}
        response = requests.put(url, headers=headers, json=profile_update)
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "success"
        assert data.get("user", {}).get("name") == "Test User"

def test_admin_role_endpoint():
    """Test the admin-only endpoint with role-based access control"""
    url = f"{BASE_URL}/api/admin/users"

    # Without token, should fail
    response = requests.get(url)
    assert response.status_code == 401

    # With non-admin token
    # In a real test, you would use a real token for a non-admin user
    # For dev mode, the mock user is an admin, so we can't fully test this

    # With admin token (or in dev mode)
    if TEST_TOKEN:
        headers = {"Authorization": f"Bearer {TEST_TOKEN}"}
        response = requests.get(url, headers=headers)
        # The response could be 200 or 403 depending on if the token belongs to an admin
        if response.status_code == 200:
            data = response.json()
            assert "users" in data
            assert "total" in data
            assert "admin" in data
    elif not os.getenv("SUPABASE_JWT_SECRET"):
        # In dev mode without JWT secret, mock user is an admin
        headers = {"Authorization": "Bearer fake_token"}
        response = requests.get(url, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert len(data.get("users", [])) > 0
        assert data.get("admin", {}).get("role") == "admin"

if __name__ == "__main__":
    # Simple manual test runner
    print("Testing authentication endpoints...")

    # Test validate endpoint without token
    print("\nTest: Validate endpoint without token")
    test_validate_endpoint_no_token()
    print("✅ Test passed")

    # Test validate endpoint with invalid token
    print("\nTest: Validate endpoint with invalid token")
    test_validate_endpoint_invalid_token()
    print("✅ Test passed")

    # Test validate endpoint with token
    if TEST_TOKEN:
        print("\nTest: Validate endpoint with valid token")
        test_validate_endpoint_with_token()
        print("✅ Test passed")
    else:
        print("\nSkipping test with valid token (TEST_TOKEN not provided)")

    # Test protected endpoints without token
    print("\nTest: Protected endpoints without token")
    test_protected_endpoints_no_token()
    print("✅ Test passed")

    # Test logout endpoint
    print("\nTest: Logout endpoint")
    test_logout_endpoint()
    print("✅ Test passed")

    # Test user profile endpoint
    print("\nTest: User profile endpoint")
    test_user_profile_endpoint()
    print("✅ Test passed")

    # Test update profile endpoint
    print("\nTest: Update profile endpoint")
    test_update_profile_endpoint()
    print("✅ Test passed")

    # Test admin role endpoint
    print("\nTest: Admin role endpoint")
    test_admin_role_endpoint()
    print("✅ Test passed")

    print("\nAll tests completed successfully!")