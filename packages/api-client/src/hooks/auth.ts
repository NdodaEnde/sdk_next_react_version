import { useMutation, useQuery, useApiClient } from '../query-provider';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: any;
}

export function useLogin() {
  const apiClient = useApiClient();
  
  return useMutation<AuthResponse, LoginCredentials>(
    (credentials) => apiClient.post<AuthResponse>('/auth/login', credentials),
    {
      onSuccess: (data) => {
        if (data.token) {
          apiClient.setToken(data.token);
        }
      },
    }
  );
}

export function useLogout() {
  const apiClient = useApiClient();
  
  return useMutation<void, void>(
    () => apiClient.post<void>('/auth/logout'),
    {
      onSuccess: () => {
        apiClient.setToken(null);
        apiClient.setOrganizationId(null);
      },
    }
  );
}

export function useCurrentUser() {
  const apiClient = useApiClient();
  
  return useQuery(
    ['currentUser'],
    () => apiClient.get('/auth/me'),
    {
      // Don't refetch the user unnecessarily
      staleTime: 1000 * 60 * 60, // 1 hour
    }
  );
}

export function useValidateToken(token: string) {
  const apiClient = useApiClient();
  
  return useMutation<any, { token: string }>(
    ({ token }) => apiClient.post('/auth/validate', { token }),
    {
      onSuccess: (data) => {
        if (data.valid && token) {
          apiClient.setToken(token);
        }
      },
    }
  );
}