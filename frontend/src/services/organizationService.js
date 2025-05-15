/**
 * Organization Service - Handles API calls for organization management
 */

import { 
  apiGet, 
  apiPost, 
  apiPut, 
  apiDelete, 
  isAuthError, 
  handleAuthError 
} from '../utils/apiUtils';

// Base API URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';

/**
 * Get all organizations for the current user
 */
export const getOrganizations = async () => {
  try {
    const data = await apiGet('/api/organizations');
    return data.organizations || [];
  } catch (error) {
    console.error('Error fetching organizations:', error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock organization data for development');
      return [
        {
          id: 'org1',
          name: 'Metro Health Services',
          slug: 'metro-health',
          description: 'Main healthcare services organization',
          role: 'owner',
          is_default: true
        },
        {
          id: 'org2',
          name: 'Western Cape Medical',
          slug: 'western-cape-medical',
          description: 'Regional healthcare provider',
          role: 'member',
          is_default: false
        }
      ];
    }
    
    throw error;
  }
};

/**
 * Get a specific organization by ID
 */
export const getOrganization = async (orgId) => {
  try {
    return await apiGet(`/api/organizations/${orgId}`);
  } catch (error) {
    console.error(`Error fetching organization ${orgId}:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock organization data for development');
      return {
        id: orgId,
        name: orgId === 'org1' ? 'Metro Health Services' : 'Western Cape Medical',
        slug: orgId === 'org1' ? 'metro-health' : 'western-cape-medical',
        description: 'Healthcare service provider',
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        settings: {},
        subscription_tier: 'professional',
        subscription_status: 'active',
        is_active: true
      };
    }
    
    throw error;
  }
};

/**
 * Create a new organization
 */
export const createOrganization = async (organizationData) => {
  try {
    return await apiPost('/api/organizations', organizationData);
  } catch (error) {
    console.error('Error creating organization:', error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock response for organization creation in development');
      return {
        id: 'new-org-' + Date.now(),
        name: organizationData.name,
        slug: organizationData.slug,
        message: 'Organization created successfully'
      };
    }
    
    throw error;
  }
};

/**
 * Update an organization
 */
export const updateOrganization = async (orgId, updateData) => {
  try {
    return await apiPut(`/api/organizations/${orgId}`, updateData);
  } catch (error) {
    console.error(`Error updating organization ${orgId}:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock response for organization update in development');
      return {
        message: 'Organization updated successfully',
        organization: {
          id: orgId,
          name: updateData.name || 'Updated Organization',
          description: updateData.description || 'Updated description',
          slug: 'org-slug',
          updated_at: new Date().toISOString()
        }
      };
    }
    
    throw error;
  }
};

/**
 * Delete an organization
 */
export const deleteOrganization = async (orgId) => {
  try {
    return await apiDelete(`/api/organizations/${orgId}`);
  } catch (error) {
    console.error(`Error deleting organization ${orgId}:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock response for organization deletion in development');
      return {
        message: 'Organization deleted successfully'
      };
    }
    
    throw error;
  }
};

/**
 * Get all members of an organization
 */
export const getOrganizationMembers = async (orgId) => {
  try {
    const data = await apiGet(`/api/organizations/${orgId}/members`);
    return data.members || [];
  } catch (error) {
    console.error(`Error fetching members for organization ${orgId}:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock members data for development');
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
 * Add a member to an organization
 */
export const addOrganizationMember = async (orgId, memberData) => {
  try {
    return await apiPost(`/api/organizations/${orgId}/members`, memberData);
  } catch (error) {
    console.error(`Error adding member to organization ${orgId}:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    throw error;
  }
};

/**
 * Remove a member from an organization
 */
export const removeOrganizationMember = async (orgId, userId) => {
  try {
    return await apiDelete(`/api/organizations/${orgId}/members/${userId}`);
  } catch (error) {
    console.error(`Error removing member from organization ${orgId}:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    throw error;
  }
};

/**
 * Update a member's role in an organization
 */
export const updateMemberRole = async (orgId, userId, roleData) => {
  try {
    return await apiPut(`/api/organizations/${orgId}/members/${userId}/role`, roleData);
  } catch (error) {
    console.error(`Error updating member role in organization ${orgId}:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    throw error;
  }
};

/**
 * Create an invitation to join an organization
 */
export const createInvitation = async (orgId, invitationData) => {
  try {
    return await apiPost(`/api/organizations/${orgId}/invitations`, invitationData);
  } catch (error) {
    console.error(`Error creating invitation for organization ${orgId}:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock response for invitation creation in development');
      const token = 'invite-' + Math.random().toString(36).substring(2, 15);
      return {
        message: 'Invitation created successfully',
        invitation: {
          id: 'invitation-' + Date.now(),
          organization_id: orgId,
          email: invitationData.email,
          role: invitationData.role || 'member',
          invited_by: 'current-user',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          token: token,
          status: 'pending'
        }
      };
    }
    
    throw error;
  }
};

/**
 * Get invitations for an organization
 */
export const getOrganizationInvitations = async (orgId) => {
  try {
    const data = await apiGet(`/api/organizations/${orgId}/invitations`);
    return data.invitations || [];
  } catch (error) {
    console.error(`Error fetching invitations for organization ${orgId}:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    throw error;
  }
};

/**
 * Get pending invitations for the current user
 */
export const getUserInvitations = async () => {
  try {
    const data = await apiGet('/api/invitations');
    return data.invitations || [];
  } catch (error) {
    console.error('Error fetching invitations:', error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock invitations data for development');
      return [
        {
          id: 'invitation1',
          organization_id: 'org3',
          organization: {
            id: 'org3',
            name: 'Northern Medical Center',
            slug: 'northern-medical'
          },
          email: 'current.user@example.com',
          role: 'member',
          invited_by: 'user5',
          created_at: '2025-05-01T14:30:00Z',
          expires_at: '2025-05-08T14:30:00Z',
          token: 'token123',
          status: 'pending'
        }
      ];
    }
    
    throw error;
  }
};

/**
 * Get a specific invitation by token
 */
export const getInvitationByToken = async (token) => {
  try {
    return await apiGet(`/api/invitations/${token}`);
  } catch (error) {
    console.error(`Error fetching invitation with token ${token}:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    throw error;
  }
};

/**
 * Accept an invitation
 */
export const acceptInvitation = async (token) => {
  try {
    return await apiPost(`/api/invitations/${token}/accept`);
  } catch (error) {
    console.error(`Error accepting invitation with token ${token}:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock response for invitation acceptance in development');
      return {
        message: 'Invitation accepted successfully',
        member: {
          id: 'new-member-' + Date.now(),
          organization_id: 'org3',
          user_id: 'current-user',
          role: 'member',
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
 * Decline an invitation
 */
export const declineInvitation = async (token) => {
  try {
    return await apiPost(`/api/invitations/${token}/decline`);
  } catch (error) {
    console.error(`Error declining invitation with token ${token}:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock response for invitation decline in development');
      return {
        message: 'Invitation declined successfully'
      };
    }
    
    throw error;
  }
};

/**
 * Cancel an invitation (as an organization admin)
 */
export const cancelInvitation = async (orgId, invitationId) => {
  try {
    return await apiDelete(`/api/organizations/${orgId}/invitations/${invitationId}`);
  } catch (error) {
    console.error(`Error cancelling invitation ${invitationId}:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    throw error;
  }
};

/**
 * Set default organization for user
 */
export const setDefaultOrganization = async (orgId) => {
  try {
    return await apiPost(`/api/user/default-organization/${orgId}`);
  } catch (error) {
    console.error(`Error setting organization ${orgId} as default:`, error);
    
    // Check for auth errors
    if (isAuthError(error)) {
      handleAuthError(error);
    }
    
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      console.log('Using mock response for setting default organization in development');
      return {
        message: 'Default organization updated successfully'
      };
    }
    
    throw error;
  }
};