import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useApiClient } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to fetch organizations
 */
export function useOrganizations() {
  const apiClient = useApiClient();
  const { user } = useAuth();
  
  return useQuery(
    ['organizations'],
    async () => {
      const response = await apiClient.get('/organizations');
      return response.data;
    },
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

/**
 * Hook to fetch a single organization
 */
export function useOrganization(organizationId) {
  const apiClient = useApiClient();
  
  return useQuery(
    ['organization', organizationId],
    async () => {
      const response = await apiClient.get(`/organizations/${organizationId}`);
      return response.data;
    },
    {
      enabled: !!organizationId,
    }
  );
}

/**
 * Hook to create a new organization
 */
export function useCreateOrganization() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation(
    async (organizationData) => {
      const response = await apiClient.post('/organizations', organizationData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['organizations']);
      },
    }
  );
}

/**
 * Hook to update an organization
 */
export function useUpdateOrganization() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation(
    async ({ organizationId, data }) => {
      const response = await apiClient.put(`/organizations/${organizationId}`, data);
      return response.data;
    },
    {
      onSuccess: (data, { organizationId }) => {
        queryClient.invalidateQueries(['organizations']);
        queryClient.invalidateQueries(['organization', organizationId]);
      },
    }
  );
}

/**
 * Hook to switch the current organization
 */
export function useSwitchOrganization() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { updateProfile } = useAuth();
  
  return useMutation(
    async (organizationId) => {
      // Call the API to switch organization
      const response = await apiClient.post('/user/switch-organization', { organizationId });
      
      // Update local auth state with the new organization
      await updateProfile({ organizationId });
      
      // Update API client headers with new organization ID
      apiClient.defaults.headers.common['X-Organization-ID'] = organizationId;
      
      return response.data;
    },
    {
      onSuccess: () => {
        // Invalidate all queries that might be affected by the organization switch
        queryClient.invalidateQueries();
      },
    }
  );
}