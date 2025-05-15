/**
 * User Service - Handles API calls for user management
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';

/**
 * Get all users in an organization
 */
export const getOrganizationUsers = async (orgId) => {
  try {
    const response = await fetch(`${API_URL}/api/organizations/${orgId}/members`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // In a real app, we would add an Authorization header
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch organization users');
    }
    
    const data = await response.json();
    return data.members || [];
  } catch (error) {
    console.error('Error fetching organization users:', error);
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock user data for development');
      return [
        {
          id: 'member1',
          organization_id: orgId,
          user_id: 'user1',
          name: 'Dr. John Doe',
          email: 'john.doe@example.com',
          role: 'owner',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
          is_default: true
        },
        {
          id: 'member2',
          organization_id: orgId,
          user_id: 'user2',
          name: 'Dr. Jane Smith',
          email: 'jane.smith@example.com',
          role: 'admin',
          created_at: '2025-01-16T14:30:00Z',
          updated_at: '2025-01-16T14:30:00Z',
          is_default: false
        },
        {
          id: 'member3',
          organization_id: orgId,
          user_id: 'user3',
          name: 'Robert Johnson',
          email: 'robert.johnson@example.com',
          role: 'member',
          created_at: '2025-01-17T09:45:00Z',
          updated_at: '2025-01-17T09:45:00Z',
          is_default: false
        }
      ];
    }
    
    throw error;
  }
};

/**
 * Add a user directly to an organization
 */
export const addUserToOrganization = async (orgId, userData) => {
  try {
    const response = await fetch(`${API_URL}/api/organizations/${orgId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add user to organization');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error adding user to organization ${orgId}:`, error);
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock response for adding user in development');
      return {
        message: 'Member added successfully',
        member: {
          id: 'member-' + Date.now(),
          organization_id: orgId,
          user_id: userData.user_id,
          role: userData.role || 'member',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_default: false
        }
      };
    }
    
    throw error;
  }
};

/**
 * Remove a user from an organization
 */
export const removeUserFromOrganization = async (orgId, userId) => {
  try {
    const response = await fetch(`${API_URL}/api/organizations/${orgId}/members/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove user from organization');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error removing user ${userId} from organization ${orgId}:`, error);
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock response for removing user in development');
      return {
        message: 'Member removed successfully'
      };
    }
    
    throw error;
  }
};

/**
 * Update a user's role in an organization
 */
export const updateUserRole = async (orgId, userId, roleData) => {
  try {
    const response = await fetch(`${API_URL}/api/organizations/${orgId}/members/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roleData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user role');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error updating role for user ${userId} in organization ${orgId}:`, error);
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock response for updating user role in development');
      return {
        message: 'Member role updated successfully'
      };
    }
    
    throw error;
  }
};

/**
 * Get current user profile
 */
export const getCurrentUser = async () => {
  try {
    const response = await fetch(`${API_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock user profile for development');
      return {
        id: 'current-user',
        email: 'john.doe@example.com',
        name: 'Dr. John Doe',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        organization_id: 'org1',
        role: 'admin',
        created_at: '2024-12-15T10:00:00Z',
        last_sign_in_at: '2025-05-10T08:30:00Z'
      };
    }
    
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profileData) => {
  try {
    const response = await fetch(`${API_URL}/api/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock response for updating user profile in development');
      return {
        status: 'success',
        message: 'Profile updated successfully',
        user: {
          id: 'current-user',
          email: 'john.doe@example.com',
          name: profileData.name || 'Dr. John Doe',
          avatar_url: profileData.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
          organization_id: 'org1',
          role: 'admin',
          updated_at: new Date().toISOString()
        }
      };
    }
    
    throw error;
  }
};