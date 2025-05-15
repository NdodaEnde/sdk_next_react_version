import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  supabase, 
  getCurrentUser, 
  signIn as supabaseSignIn, 
  signUp as supabaseSignUp,
  signOut as supabaseSignOut,
  resetPassword as supabaseResetPassword,
  updatePassword as supabaseUpdatePassword,
  signInWithMagicLink as supabaseSignInWithMagicLink,
  onAuthStateChange
} from '../lib/supabase';

// Create auth context
const SupabaseAuthContext = createContext(null);

/**
 * Supabase Auth Provider component for wrapping the application
 * to provide authentication state and methods
 */
export function SupabaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Load user on initial render
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          setSession(sessionData.session);
          
          // Get user details
          const { user, error } = await getCurrentUser();
          
          if (error) {
            throw error;
          }
          
          if (user) {
            setUser(user);
            setIsAuthenticated(true);
            
            // Store organizationId in user metadata if available
            const organizationId = user.user_metadata?.organization_id || null;
            if (organizationId) {
              setUser(prev => ({
                ...prev,
                organizationId
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthError(error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    // Set up auth state change listener
    const { data: authListener } = onAuthStateChange((event, session) => {
      setSession(session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUser(null);
        setIsAuthenticated(false);
      } else if (event === 'USER_UPDATED' && session?.user) {
        setUser(session.user);
      }
    });
    
    // Clean up auth listener on unmount
    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  // Function to handle login
  const login = async (email, password) => {
    try {
      setAuthError(null);
      
      const { user: authUser, session, error } = await supabaseSignIn(email, password);
      
      if (error) {
        throw error;
      }
      
      if (authUser && session) {
        setUser(authUser);
        setSession(session);
        setIsAuthenticated(true);
        
        // Store auth token
        localStorage.setItem('auth_token', session.access_token);
        
        return { success: true, user: authUser };
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthError(error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  // Function to handle logout
  const logout = async () => {
    try {
      setAuthError(null);
      
      const { error } = await supabaseSignOut();
      
      if (error) {
        throw error;
      }
      
      // Clear local state
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      
      // Clear localStorage
      localStorage.removeItem('auth_token');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      setAuthError(error);
      return { success: false, error: error.message || 'Logout failed' };
    }
  };

  // Function to handle registration
  const register = async (email, password, metadata = {}) => {
    try {
      setAuthError(null);
      
      const { user: authUser, session, error } = await supabaseSignUp(email, password, {
        metadata,
        redirectTo: `${window.location.origin}/auth/verify-email`,
      });
      
      if (error) {
        throw error;
      }
      
      // Note: With email confirmation enabled, the user won't be authenticated yet
      if (authUser) {
        // If email confirmation is not required, set the user
        if (session) {
          setUser(authUser);
          setSession(session);
          setIsAuthenticated(true);
          
          // Store auth token
          localStorage.setItem('auth_token', session.access_token);
        }
        
        return { success: true, user: authUser, session, emailConfirmationRequired: !session };
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setAuthError(error);
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  // Function to handle password reset
  const resetPassword = async (email) => {
    try {
      setAuthError(null);
      
      const { data, error } = await supabaseResetPassword(email);
      
      if (error) {
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Password reset error:', error);
      setAuthError(error);
      return { success: false, error: error.message || 'Password reset failed' };
    }
  };

  // Function to handle password update
  const updatePassword = async (password) => {
    try {
      setAuthError(null);
      
      const { user: updatedUser, error } = await supabaseUpdatePassword(password);
      
      if (error) {
        throw error;
      }
      
      if (updatedUser) {
        setUser(updatedUser);
        return { success: true, user: updatedUser };
      } else {
        throw new Error('Password update failed');
      }
    } catch (error) {
      console.error('Password update error:', error);
      setAuthError(error);
      return { success: false, error: error.message || 'Password update failed' };
    }
  };

  // Function to handle magic link sign in
  const signInWithMagicLink = async (email) => {
    try {
      setAuthError(null);
      
      const { data, error } = await supabaseSignInWithMagicLink(email);
      
      if (error) {
        throw error;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Magic link sign in error:', error);
      setAuthError(error);
      return { success: false, error: error.message || 'Magic link sign in failed' };
    }
  };

  // Function to update user profile
  const updateProfile = async (userData) => {
    try {
      setAuthError(null);
      
      const { data, error } = await supabase.auth.updateUser({
        data: userData,
      });
      
      if (error) {
        throw error;
      }
      
      if (data?.user) {
        setUser(prev => ({
          ...prev,
          ...data.user,
        }));
        
        return { success: true, user: data.user };
      } else {
        throw new Error('Profile update failed');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      setAuthError(error);
      return { success: false, error: error.message || 'Failed to update profile' };
    }
  };

  // Create an auth value object with state and methods
  const authValue = {
    user,
    session,
    loading,
    isAuthenticated,
    error: authError,
    login,
    logout,
    register,
    resetPassword,
    updatePassword,
    signInWithMagicLink,
    updateProfile
  };
  
  // In development mode, always provide authentication if needed
  const isDev = process.env.NODE_ENV === 'development';
  const finalAuthValue = isDev && !isAuthenticated ? {
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
    <SupabaseAuthContext.Provider value={finalAuthValue}>
      {children}
    </SupabaseAuthContext.Provider>
  );
}

/**
 * Custom hook to use the Supabase auth context
 * 
 * @returns {Object} Authentication state and methods
 */
export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}