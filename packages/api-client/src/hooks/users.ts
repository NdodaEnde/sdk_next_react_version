import { useMutation, useQuery, useApiClient } from '../query-provider';
import { queryClient } from '../query-client';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
  organizations?: {
    organization: {
      id: string;
      name: string;
      slug: string;
      type: string;
    };
    role: string;
    isPrimary: boolean;
  }[];
}

export interface UpdateUserDto {
  fullName?: string;
  avatarUrl?: string;
}

export function useUsers() {
  const apiClient = useApiClient();
  
  return useQuery(
    ['users'],
    () => apiClient.get<User[]>('/users'),
  );
}

export function useUser(id: string) {
  const apiClient = useApiClient();
  
  return useQuery(
    ['users', id],
    () => apiClient.get<User>(`/users/${id}`),
    {
      enabled: !!id,
    }
  );
}

export function useCurrentUserProfile() {
  const apiClient = useApiClient();
  
  return useQuery(
    ['users', 'me'],
    () => apiClient.get<User>('/users/me'),
  );
}

export function useUpdateUser() {
  const apiClient = useApiClient();
  
  return useMutation<User, { id: string, data: UpdateUserDto }>(
    ({ id, data }) => apiClient.put<User>(`/users/${id}`, data),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['users', data.id] });
        
        // If this was the current user, also invalidate the current user query
        queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
        queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      },
    }
  );
}