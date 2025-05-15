import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { createContext, useContext, useMemo } from 'react';

// Create an Axios instance with default configuration
export const createApiClient = (
  baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  options = {}
): AxiosInstance => {
  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  // Add request interceptor for authentication
  client.interceptors.request.use((config) => {
    // Get the token from storage
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('auth_token') 
      : null;
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  });

  // Add response interceptor for handling errors
  client.interceptors.response.use(
    (response) => response.data,
    (error) => {
      // Handle specific error cases (e.g., 401 Unauthorized)
      if (error.response?.status === 401) {
        // Clear token and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
      }
      
      return Promise.reject(error);
    }
  );

  return client;
};

// Create a React context for the API client
export const ApiClientContext = createContext<AxiosInstance | null>(null);

// Create a provider component
export const ApiClientProvider = ({ 
  children, 
  baseURL,
  options = {}
}: { 
  children: React.ReactNode;
  baseURL?: string;
  options?: AxiosRequestConfig;
}) => {
  const apiClient = useMemo(() => createApiClient(baseURL, options), [baseURL, options]);
  
  return (
    <ApiClientContext.Provider value={apiClient}>
      {children}
    </ApiClientContext.Provider>
  );
};

// Create a hook to use the API client
export const useApiClient = (): AxiosInstance => {
  const apiClient = useContext(ApiClientContext);
  
  if (!apiClient) {
    throw new Error('useApiClient must be used within an ApiClientProvider');
  }
  
  return apiClient;
};