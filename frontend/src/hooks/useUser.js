import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useApiClient } from '../context/ApiContext';
import { useAuth } from '../context/AuthContext';

/**
 * Hook to fetch the current user's profile
 */
export function useCurrentUserProfile() {
  const apiClient = useApiClient();
  const { user } = useAuth();
  
  return useQuery(
    ['currentUser'],
    async () => {
      const response = await apiClient.get('/user/profile');
      return response.data;
    },
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // 5 minutes
      // If the API request fails, fallback to the user in auth context
      onError: () => {
        return user;
      },
    }
  );
}

/**
 * Hook to fetch users in the current organization
 */
export function useUsers() {
  const apiClient = useApiClient();
  const { user } = useAuth();
  
  return useQuery(
    ['users'],
    async () => {
      const response = await apiClient.get('/users');
      return response.data;
    },
    {
      enabled: !!user,
    }
  );
}

/**
 * Hook to fetch a single user
 */
export function useUser(userId) {
  const apiClient = useApiClient();
  
  return useQuery(
    ['user', userId],
    async () => {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    },
    {
      enabled: !!userId,
    }
  );
}

/**
 * Hook to update user profile
 */
export function useUpdateUserProfile() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  const { updateProfile } = useAuth();
  
  return useMutation(
    async (userData) => {
      const response = await apiClient.put('/user/profile', userData);
      
      // Also update the local auth context
      await updateProfile(userData);
      
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['currentUser']);
      },
    }
  );
}

/**
 * Hook to create a user
 */
export function useCreateUser() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation(
    async (userData) => {
      const response = await apiClient.post('/users', userData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users']);
      },
    }
  );
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();
  
  return useMutation(
    async ({ userId, data }) => {
      const response = await apiClient.put(`/users/${userId}`, data);
      return response.data;
    },
    {
      onSuccess: (data, { userId }) => {
        queryClient.invalidateQueries(['users']);
        queryClient.invalidateQueries(['user', userId]);
      },
    }
  );
}