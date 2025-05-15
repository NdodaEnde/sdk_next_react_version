import { useMutation, useQuery, useApiClient } from '../query-provider';
import { queryClient } from '../query-client';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'service_provider' | 'client';
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  type: 'service_provider' | 'client';
  parentId?: string;
}

export function useOrganizations() {
  const apiClient = useApiClient();
  
  return useQuery(
    ['organizations'],
    () => apiClient.get<Organization[]>('/organizations'),
  );
}

export function useOrganization(id: string) {
  const apiClient = useApiClient();
  
  return useQuery(
    ['organizations', id],
    () => apiClient.get<Organization>(`/organizations/${id}`),
    {
      enabled: !!id,
    }
  );
}

export function useCreateOrganization() {
  const apiClient = useApiClient();
  
  return useMutation<Organization, CreateOrganizationDto>(
    (data) => apiClient.post<Organization>('/organizations', data),
    {
      onSuccess: () => {
        // Invalidate the organizations query to refetch the list
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
      },
    }
  );
}

export function useUpdateOrganization() {
  const apiClient = useApiClient();
  
  return useMutation<Organization, { id: string, data: Partial<CreateOrganizationDto> }>(
    ({ id, data }) => apiClient.put<Organization>(`/organizations/${id}`, data),
    {
      onSuccess: (data) => {
        // Invalidate the specific organization query
        queryClient.invalidateQueries({ queryKey: ['organizations', data.id] });
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
      },
    }
  );
}

export function useSelectOrganization() {
  const apiClient = useApiClient();
  
  return useMutation<void, string>(
    (organizationId) => {
      apiClient.setOrganizationId(organizationId);
      // We'll return a resolved promise since this is a client-side operation
      return Promise.resolve();
    },
    {
      onSuccess: () => {
        // Invalidate queries that might depend on the organization context
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
      },
    }
  );
}

export function useAddOrganizationMember() {
  const apiClient = useApiClient();
  
  return useMutation<any, { organizationId: string, userId: string, role?: string }>(
    ({ organizationId, userId, role }) => 
      apiClient.post(`/organizations/${organizationId}/members/${userId}`, { role }),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ 
          queryKey: ['organizations', variables.organizationId] 
        });
      },
    }
  );
}

export function useRemoveOrganizationMember() {
  const apiClient = useApiClient();
  
  return useMutation<any, { organizationId: string, userId: string }>(
    ({ organizationId, userId }) => 
      apiClient.delete(`/organizations/${organizationId}/members/${userId}`),
    {
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ 
          queryKey: ['organizations', variables.organizationId] 
        });
      },
    }
  );
}