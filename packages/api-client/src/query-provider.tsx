import React, { ReactNode } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  QueryErrorResetBoundary,
  useQuery as useReactQuery,
  useMutation as useReactMutation,
} from '@tanstack/react-query';
import { ApiClient } from './api-client';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export type ApiProviderProps = {
  children: ReactNode;
  apiClient: ApiClient;
};

// Context for the API client
const ApiClientContext = React.createContext<ApiClient | undefined>(undefined);

// Provider component that wraps your app and makes the API client available
export const ApiProvider: React.FC<ApiProviderProps> = ({ children, apiClient }) => {
  return (
    <ApiClientContext.Provider value={apiClient}>
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {children}
        </QueryErrorResetBoundary>
      </QueryClientProvider>
    </ApiClientContext.Provider>
  );
};

// Hook to use the API client
export const useApiClient = (): ApiClient => {
  const context = React.useContext(ApiClientContext);
  if (context === undefined) {
    throw new Error('useApiClient must be used within an ApiProvider');
  }
  return context;
};

// Custom hook for queries
export const useQuery = <T,>(
  queryKey: string[], 
  queryFn: () => Promise<T>, 
  options?: any
) => {
  return useReactQuery<T>({
    queryKey,
    queryFn,
    ...options,
  });
};

// Custom hook for mutations
export const useMutation = <T, V = any,>(
  mutationFn: (variables: V) => Promise<T>, 
  options?: any
) => {
  return useReactMutation<T, Error, V>({
    mutationFn,
    ...options,
  });
};