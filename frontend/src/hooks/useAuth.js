import { useState, useEffect, useCallback, useMemo } from 'react';

// Placeholder for actual authentication service
const AuthService = class {
  constructor() {}
  getSession() { return { data: null, error: null }; }
  getUser() { return { data: null, error: null }; }
  onAuthStateChange(callback) { return { data: { subscription: { unsubscribe: () => {} } } }; }
  signIn() { return { data: null, error: null }; }
  signUp() { return { data: null, error: null }; }
  signInWithMagicLink() { return { data: null, error: null }; }
  signOut() { return { data: null, error: null }; }
  resetPassword() { return { data: null, error: null }; }
  updatePassword() { return { data: null, error: null }; }
  updateUserMetadata() { return { data: null, error: null }; }
};

const UserProfile = {
  createProfile: async () => ({}),
  updateProfile: async () => ({}),
  getProfile: async () => ({}),
};

/**
 * Custom hook for authentication functionality in the frontend
 * This is a temporary implementation until the @medic-data/auth package is available
 * @returns {Object} Authentication state and methods
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [organization, setOrganization] = useState(null);

  // Create auth service instance
  const authService = useMemo(() => {
    try {
      return new AuthService();
    } catch (err) {
      console.error('Failed to initialize auth service:', err);
      setError(err);
      return null;
    }
  }, []);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    if (!authService) return;

    try {
      setLoading(true);
      setError(null);

      // Get current session
      const { data: sessionData, error: sessionError } = await authService.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      if (sessionData?.session) {
        setSession(sessionData.session);
        
        // Get user data
        const { data: userData, error: userError } = await authService.getUser();
        
        if (userError) {
          throw userError;
        }

        if (userData?.user) {
          const userProfile = userData.user;
          setUser(userProfile);

          // If the user has an organization_id in their metadata, fetch organization details
          if (userProfile.user_metadata?.organization_id) {
            // Here you would typically fetch organization details from your API
            // For now, we'll just store the ID
            setOrganization({
              id: userProfile.user_metadata.organization_id,
              name: userProfile.user_metadata.organization_name || 'Unknown Organization',
              // Other organization fields would be populated from an API call
            });
          }
        }
      } else {
        // No active session
        setUser(null);
        setSession(null);
        setOrganization(null);
      }
    } catch (err) {
      console.error('Authentication initialization error:', err);
      setError(err);
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [authService]);

  // Set up auth state change listener
  useEffect(() => {
    if (!authService) return;

    // Initialize auth state
    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Re-initialize auth when user signs in or is updated
        initializeAuth();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setOrganization(null);
      }
    });

    // Clean up listener on unmount
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [authService, initializeAuth]);

  // Sign in with email and password
  const signIn = useCallback(
    async (email, password) => {
      if (!authService) return { error: new Error('Auth service not initialized') };

      try {
        setLoading(true);
        setError(null);

        const { data, error: signInError } = await authService.signIn(email, password);
        
        if (signInError) {
          throw signInError;
        }

        return { data };
      } catch (err) {
        console.error('Sign in error:', err);
        setError(err);
        return { error: err };
      } finally {
        setLoading(false);
      }
    },
    [authService]
  );

  // Sign up with email and password
  const signUp = useCallback(
    async (email, password, metadata = {}) => {
      if (!authService) return { error: new Error('Auth service not initialized') };

      try {
        setLoading(true);
        setError(null);

        const { data, error: signUpError } = await authService.signUp(email, password, metadata);
        
        if (signUpError) {
          throw signUpError;
        }

        return { data };
      } catch (err) {
        console.error('Sign up error:', err);
        setError(err);
        return { error: err };
      } finally {
        setLoading(false);
      }
    },
    [authService]
  );

  // Sign in with magic link (passwordless)
  const signInWithMagicLink = useCallback(
    async (email) => {
      if (!authService) return { error: new Error('Auth service not initialized') };

      try {
        setLoading(true);
        setError(null);

        const { data, error: magicLinkError } = await authService.signInWithMagicLink(email);
        
        if (magicLinkError) {
          throw magicLinkError;
        }

        return { data };
      } catch (err) {
        console.error('Magic link sign in error:', err);
        setError(err);
        return { error: err };
      } finally {
        setLoading(false);
      }
    },
    [authService]
  );

  // Sign out
  const signOut = useCallback(async () => {
    if (!authService) return;

    try {
      setLoading(true);
      setError(null);

      const { error: signOutError } = await authService.signOut();
      
      if (signOutError) {
        throw signOutError;
      }

      setUser(null);
      setSession(null);
      setOrganization(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [authService]);

  // Reset password
  const resetPassword = useCallback(
    async (email) => {
      if (!authService) return { error: new Error('Auth service not initialized') };

      try {
        setLoading(true);
        setError(null);

        const { data, error: resetError } = await authService.resetPassword(email);
        
        if (resetError) {
          throw resetError;
        }

        return { data };
      } catch (err) {
        console.error('Password reset error:', err);
        setError(err);
        return { error: err };
      } finally {
        setLoading(false);
      }
    },
    [authService]
  );

  // Update password
  const updatePassword = useCallback(
    async (newPassword) => {
      if (!authService) return { error: new Error('Auth service not initialized') };

      try {
        setLoading(true);
        setError(null);

        const { data, error: updateError } = await authService.updatePassword(newPassword);
        
        if (updateError) {
          throw updateError;
        }

        return { data };
      } catch (err) {
        console.error('Password update error:', err);
        setError(err);
        return { error: err };
      } finally {
        setLoading(false);
      }
    },
    [authService]
  );

  // Update user profile
  const updateProfile = useCallback(
    async (profileData) => {
      if (!authService) return { error: new Error('Auth service not initialized') };

      try {
        setLoading(true);
        setError(null);

        const { data, error: updateError } = await authService.updateUserMetadata(profileData);
        
        if (updateError) {
          throw updateError;
        }

        // Update local user state with new profile data
        if (data?.user) {
          setUser(data.user);
        }

        return { data };
      } catch (err) {
        console.error('Profile update error:', err);
        setError(err);
        return { error: err };
      } finally {
        setLoading(false);
      }
    },
    [authService]
  );

  // Set current organization for multi-tenant functionality
  const setCurrentOrganization = useCallback((org) => {
    setOrganization(org);
  }, []);

  // Return authentication state and methods
  return {
    user,
    session,
    loading,
    error,
    organization,
    isAuthenticated: !!user && !!session,
    signIn,
    signUp,
    signInWithMagicLink,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    setCurrentOrganization
  };
}

// Export the placeholder services for imports in AuthContext
export { AuthService, UserProfile };