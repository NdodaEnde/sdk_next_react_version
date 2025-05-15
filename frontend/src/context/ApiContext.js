import React, { createContext, useContext } from 'react';
import axios from 'axios';

// Create a default Axios instance
const defaultApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Create API context
const ApiContext = createContext(defaultApiClient);

/**
 * API Provider component for wrapping the application
 * to provide an API client instance
 */
export function ApiProvider({ children, apiClient = defaultApiClient }) {
  return (
    <ApiContext.Provider value={apiClient}>
      {children}
    </ApiContext.Provider>
  );
}

/**
 * Custom hook to use the API client
 * 
 * @returns {AxiosInstance} Axios API client instance
 */
export function useApiClient() {
  const apiClient = useContext(ApiContext);
  if (!apiClient) {
    throw new Error('useApiClient must be used within an ApiProvider');
  }
  return apiClient;
}

// Create a simple hook to get data from the API
export function useApiGet(url, options = {}) {
  const apiClient = useApiClient();
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(url, options);
        setData(response.data);
        setError(null);
      } catch (error) {
        setError(error);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, error, loading };
}

// Post data to the API
export function useApiPost() {
  const apiClient = useApiClient();
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const postData = async (url, payload, options = {}) => {
    try {
      setLoading(true);
      const response = await apiClient.post(url, payload, options);
      setData(response.data);
      setError(null);
      return response.data;
    } catch (error) {
      setError(error);
      setData(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { postData, data, error, loading };
}