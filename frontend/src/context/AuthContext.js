import React, { useContext, useState, useEffect, createContext } from 'react';

// Create auth context
const AuthContext = createContext(null);

/**
 * Auth Provider component for wrapping the application
 * to provide authentication state and methods
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to handle login
  const login = async (email, password) => {
    try {
      // In a real implementation, this would call your auth API
      // For now, we'll simulate login success
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a mock user object
      const mockUser = {
        id: 'user-123',
        email: email,
        name: 'Test User',
        organizationId: 'org-123',
        role: 'admin',
        token: 'mock-jwt-token'
      };
      
      // Store user in localStorage for persistence
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      localStorage.setItem('auth_token', mockUser.token);
      
      // Update state
      setUser(mockUser);
      setIsAuthenticated(true);
      
      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  // Function to handle logout
  const logout = async () => {
    try {
      // In a real implementation, this would call your auth API
      // For now, we'll just clear the local state
      
      // Clear localStorage
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message || 'Logout failed' };
    }
  };

  // Function to handle registration
  const register = async (email, password, name) => {
    try {
      // In a real implementation, this would call your auth API
      // For now, we'll simulate registration success
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a mock user object
      const mockUser = {
        id: 'user-' + Date.now(),
        email: email,
        name: name,
        organizationId: 'org-123',
        role: 'user',
        token: 'mock-jwt-token'
      };
      
      // Store user in localStorage for persistence
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      localStorage.setItem('auth_token', mockUser.token);
      
      // Update state
      setUser(mockUser);
      setIsAuthenticated(true);
      
      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  // Function to update user profile
  const updateProfile = async (userData) => {
    try {
      // In a real implementation, this would call your auth API
      // For now, we'll just update the local state
      
      // Get current user
      const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
      
      // Update user data
      const updatedUser = { ...currentUser, ...userData };
      
      // Store updated user in localStorage
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      
      // Update state
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message || 'Failed to update profile' };
    }
  };

  // Load user from local storage on initial render
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('auth_user');
        const storedToken = localStorage.getItem('auth_token');
        
        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser);
          setUser(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Create an auth value object with state and methods
  const authValue = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    updateProfile
  };
  
  // In development mode, always provide authentication
  const isDev = process.env.NODE_ENV === 'development';
  const finalAuthValue = isDev ? {
    ...authValue,
    isAuthenticated: true,
    loading: false,
    user: user || { 
      id: 'dev-user', 
      email: 'dev@example.com',
      name: 'Development User',
      organizationId: 'org-123',
      role: 'admin',
      token: 'dev-token'
    }
  } : authValue;

  return (
    <AuthContext.Provider value={finalAuthValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use the auth context
 * 
 * @returns {Object} Authentication state and methods
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Higher-order component for protected routes
 * 
 * @param {Component} Component - Component to be wrapped with authentication
 * @returns {Component} Protected component
 */
export function withAuth(Component) {
  return function ProtectedRoute(props) {
    const { isAuthenticated, loading } = useAuth();
    
    // If auth is still loading, show loading indicator
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
          <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400 mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Loading...</h2>
              <p className="text-gray-500 dark:text-gray-400">Please wait while we set things up for you.</p>
            </div>
          </div>
        </div>
      );
    }
    
    // If not authenticated, component will not render
    // Redirection logic is handled by _app.js
    if (!isAuthenticated) {
      return null;
    }
    
    // If authenticated, render the component
    return <Component {...props} />;
  };
}