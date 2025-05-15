/**
 * API utilities for making authenticated requests to the backend
 */

// Base API URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004';

/**
 * Get common headers for API requests including authorization if available
 */
export const getApiHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Add authorization token if available
  const token = localStorage.getItem('supabase.auth.token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (process.env.NODE_ENV === 'development') {
    // In development, if no token is available, add a default one
    headers['Authorization'] = 'Bearer dev-token';
  }
  
  // Add organization context header if available
  const orgId = localStorage.getItem('currentOrganizationId');
  if (orgId) {
    headers['X-Organization-ID'] = orgId;
  }
  
  return headers;
};

/**
 * Handle API response and extract data or error
 */
export const handleApiResponse = async (response) => {
  // First check if the response is ok (status in the range 200-299)
  if (!response.ok) {
    let errorMessage;
    
    try {
      // Try to parse error as JSON
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || `API Error: ${response.status} ${response.statusText}`;
    } catch (e) {
      // If parsing fails, use status text
      errorMessage = `API Error: ${response.status} ${response.statusText}`;
    }
    
    // In development mode, return empty data structures rather than throwing errors
    // This allows the app to continue functioning even if the backend is not running
    if (process.env.NODE_ENV === 'development') {
      console.warn(`API Error suppressed in development mode: ${errorMessage}`);
      
      // For authentication errors, return a specific response
      if (response.status === 401) {
        return { 
          message: 'Using mock data in development mode',
          organizations: [],
          members: []
        };
      }
      
      // For other errors, return an empty success response
      return { success: true };
    }
    
    // Throw error to be caught by the caller
    throw new Error(errorMessage);
  }
  
  // For empty responses (like 204 No Content)
  if (response.status === 204) {
    return { success: true };
  }
  
  // For successful responses with content, parse JSON
  return await response.json();
};

/**
 * Make a GET request to the API
 */
export const apiGet = async (endpoint, customHeaders = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...getApiHeaders(),
        ...customHeaders
      },
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error(`API GET Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Make a POST request to the API
 */
export const apiPost = async (endpoint, data = null, customHeaders = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...getApiHeaders(),
        ...customHeaders
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error(`API POST Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Make a PUT request to the API
 */
export const apiPut = async (endpoint, data, customHeaders = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...getApiHeaders(),
        ...customHeaders
      },
      body: JSON.stringify(data),
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error(`API PUT Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Make a DELETE request to the API
 */
export const apiDelete = async (endpoint, customHeaders = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        ...getApiHeaders(),
        ...customHeaders
      },
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    console.error(`API DELETE Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Determine if an error is an authentication error
 */
export const isAuthError = (error) => {
  if (!error) return false;
  
  const errorMessage = error.message || '';
  return (
    error.status === 401 ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('not authenticated') ||
    errorMessage.includes('Not authenticated') ||
    errorMessage.includes('invalid token') ||
    errorMessage.includes('Invalid token') ||
    errorMessage.includes('token expired') ||
    errorMessage.includes('Token expired')
  );
};

/**
 * Handle authentication errors by redirecting to login
 */
export const handleAuthError = (error) => {
  if (isAuthError(error) && typeof window !== 'undefined') {
    // Save current location for redirect after login
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/login') {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }
    
    // Clear token if it's invalid or expired
    localStorage.removeItem('supabase.auth.token');
    
    // Redirect to login
    window.location.href = '/login';
    return true;
  }
  
  return false;
};