/**
 * Organization Context Utility
 * 
 * This utility handles organization switching and management in the frontend.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiGet, apiPost, apiPut } from './apiUtils';

// Create organization context
const OrganizationContext = createContext(null);

/**
 * Organization Provider component
 * Provides organization context to the application
 */
export function OrganizationProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [currentOrganization, setCurrentOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's organizations
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserOrganizations();
    } else {
      setOrganizations([]);
      setCurrentOrganization(null);
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch user's organizations from API
  const fetchUserOrganizations = async () => {
    try {
      setLoading(true);
      
      const data = await apiGet('/api/organizations');
      setOrganizations(data.organizations || []);
      
      // Set current organization to the default one or the first in the list
      const defaultOrg = data.organizations.find(org => org.is_default);
      setCurrentOrganization(defaultOrg || data.organizations[0] || null);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      
      // For development, use mock data if API call fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock organization data for development');
        const mockOrgs = [
          {
            id: 'org1',
            name: 'Metro Health Services',
            slug: 'metro-health',
            description: 'Main healthcare services organization',
            role: 'owner',
            is_default: true,
            type: 'healthcare_facility'
          },
          {
            id: 'org2',
            name: 'Western Cape Medical',
            slug: 'western-cape-medical',
            description: 'Regional healthcare provider',
            role: 'member',
            is_default: false,
            type: 'service_provider'
          },
          {
            id: 'org3',
            name: 'Cape Town Clinic',
            slug: 'cape-town-clinic',
            description: 'Local medical clinic',
            role: 'admin',
            is_default: false,
            type: 'direct_client'
          }
        ];
        setOrganizations(mockOrgs);
        setCurrentOrganization(mockOrgs[0]);
      }
      
      setError(err.message);
      setLoading(false);
    }
  };

  // Switch to a different organization
  const switchOrganization = async (orgId) => {
    try {
      // Find the organization in the list
      const org = organizations.find(o => o.id === orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      // Update current organization
      setCurrentOrganization(org);

      // Set as default if it's not already
      if (!org.is_default) {
        await setDefaultOrganization(orgId);
      }

      return true;
    } catch (err) {
      console.error('Error switching organization:', err);
      setError(err.message);
      return false;
    }
  };

  // Set default organization
  const setDefaultOrganization = async (orgId) => {
    try {
      await apiPost(`/api/user/default-organization/${orgId}`);

      // Update local state
      setOrganizations(orgs => orgs.map(org => ({
        ...org,
        is_default: org.id === orgId
      })));

      return true;
    } catch (err) {
      console.error('Error setting default organization:', err);
      setError(err.message);
      return false;
    }
  };

  // Create a new organization
  const createOrganization = async (orgData) => {
    try {
      const data = await apiPost('/api/organizations', orgData);
      
      // Refetch organizations to get the updated list
      await fetchUserOrganizations();
      
      return data;
    } catch (err) {
      console.error('Error creating organization:', err);
      setError(err.message);
      throw err;
    }
  };

  // Get organization members
  const getOrganizationMembers = async (orgId) => {
    try {
      const data = await apiGet(`/api/organizations/${orgId}/members`);
      return data.members || [];
    } catch (err) {
      console.error('Error fetching organization members:', err);
      
      // For development, return mock data
      if (process.env.NODE_ENV === 'development') {
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
      
      setError(err.message);
      throw err;
    }
  };

  // Invite a new member to the organization
  const inviteMember = async (orgId, email, role = 'member') => {
    try {
      return await apiPost(`/api/organizations/${orgId}/invitations`, { email, role });
    } catch (err) {
      console.error('Error inviting member:', err);
      setError(err.message);
      throw err;
    }
  };

  // Get API headers with organization context
  const getApiHeaders = () => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
    };

    if (currentOrganization) {
      headers['X-Organization-ID'] = currentOrganization.id;
    }

    return headers;
  };

  // Prepare context value
  const contextValue = {
    organizations,
    currentOrganization,
    loading,
    error,
    switchOrganization,
    createOrganization,
    getOrganizationMembers,
    inviteMember,
    getApiHeaders,
    refreshOrganizations: fetchUserOrganizations,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

/**
 * Hook to use the organization context
 */
export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
}

/**
 * Higher-order component to add organization context to a component
 */
export function withOrganization(Component) {
  return function WithOrganizationComponent(props) {
    return (
      <OrganizationContext.Consumer>
        {(context) => <Component {...props} organization={context} />}
      </OrganizationContext.Consumer>
    );
  };
}

/**
 * Hook to handle API requests with organization context
 */
export function useOrganizationApi() {
  const { getApiHeaders, currentOrganization } = useOrganization();
  
  // Make an API request with organization context
  const apiRequest = async (url, options = {}) => {
    // Get headers with organization context
    const headers = getApiHeaders();
    
    // Merge with provided options
    const mergedOptions = {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    };
    
    // Make the request
    const response = await fetch(url, mergedOptions);
    
    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || response.statusText);
    }
    
    return response.json();
  };
  
  return {
    apiRequest,
    orgId: currentOrganization?.id,
  };
}