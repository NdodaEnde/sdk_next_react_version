import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from './auth-service';
import { AuthContextValue, AuthState, Organization, UserProfile } from './types';
import { Session } from '@supabase/supabase-js';

// Create auth context with default values
const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  error: null,
  organization: null,
  isAuthenticated: false,
  signUp: async () => ({ data: null, error: new Error('Not implemented') }),
  signIn: async () => ({ data: null, error: new Error('Not implemented') }),
  signInWithMagicLink: async () => ({ data: null, error: new Error('Not implemented') }),
  signOut: async () => {},
  resetPassword: async () => ({ data: null, error: new Error('Not implemented') }),
  updatePassword: async () => ({ data: null, error: new Error('Not implemented') }),
  updateProfile: async () => ({ data: null, error: new Error('Not implemented') }),
});

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
  authService?: AuthService;
  initialOrganization?: Organization | null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  authService,
  initialOrganization = null,
}) => {
  // Initialize auth service
  const auth = authService || new AuthService();
  
  // State for auth data
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });
  
  // State for current organization
  const [organization, setOrganization] = useState<Organization | null>(initialOrganization);
  
  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: sessionData, error: sessionError } = await auth.getSession();
        
        if (sessionError) {
          setState({ user: null, session: null, loading: false, error: sessionError });
          return;
        }
        
        if (sessionData?.session) {
          // Fetch user data
          const { data: userData, error: userError } = await auth.getUser();
          
          if (userError) {
            setState({ user: null, session: sessionData.session, loading: false, error: userError });
            return;
          }
          
          // Set authenticated state
          setState({
            user: userData.user as UserProfile,
            session: sessionData.session,
            loading: false,
            error: null,
          });
        } else {
          setState({ user: null, session: null, loading: false, error: null });
        }
      } catch (error) {
        setState({ user: null, session: null, loading: false, error: error as Error });
      }
    };
    
    initializeAuth();
    
    // Subscribe to auth changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Update state with new session
        auth.getUser().then(({ data, error }) => {
          if (error) {
            setState(prev => ({ ...prev, error }));
            return;
          }
          
          setState({
            user: data.user as UserProfile,
            session,
            loading: false,
            error: null,
          });
        });
      } else if (event === 'SIGNED_OUT') {
        // Reset state on sign out
        setState({
          user: null,
          session: null,
          loading: false,
          error: null,
        });
        setOrganization(null);
      }
    });
    
    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [auth]);
  
  // Authentication methods
  const signUp = async (email: string, password: string, metadata?: any) => {
    setState(prev => ({ ...prev, loading: true }));
    const result = await auth.signUp(email, password, metadata);
    setState(prev => ({ ...prev, loading: false }));
    return result;
  };
  
  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true }));
    const result = await auth.signIn(email, password);
    setState(prev => ({ ...prev, loading: false }));
    return result;
  };
  
  const signInWithMagicLink = async (email: string) => {
    setState(prev => ({ ...prev, loading: true }));
    const result = await auth.signInWithMagicLink(email);
    setState(prev => ({ ...prev, loading: false }));
    return result;
  };
  
  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true }));
    await auth.signOut();
    setState({
      user: null,
      session: null, 
      loading: false,
      error: null,
    });
    setOrganization(null);
  };
  
  const resetPassword = async (email: string) => {
    setState(prev => ({ ...prev, loading: true }));
    const result = await auth.resetPassword(email);
    setState(prev => ({ ...prev, loading: false }));
    return result;
  };
  
  const updatePassword = async (newPassword: string) => {
    setState(prev => ({ ...prev, loading: true }));
    const result = await auth.updatePassword(newPassword);
    setState(prev => ({ ...prev, loading: false }));
    return result;
  };
  
  const updateProfile = async (data: Partial<UserProfile>) => {
    setState(prev => ({ ...prev, loading: true }));
    const result = await auth.updateUserMetadata(data);
    
    if (!result.error && result.data.user) {
      setState(prev => ({
        ...prev,
        user: { ...prev.user, ...result.data.user } as UserProfile,
        loading: false,
      }));
    } else {
      setState(prev => ({ ...prev, loading: false, error: result.error }));
    }
    
    return result;
  };
  
  // Set current organization
  const setCurrentOrganization = (org: Organization) => {
    setOrganization(org);
    
    // Update user metadata with current organization
    if (state.user) {
      auth.updateUserMetadata({ current_organization_id: org.id });
    }
  };
  
  // Compute final context value
  const contextValue: AuthContextValue = {
    user: state.user,
    session: state.session,
    loading: state.loading,
    error: state.error,
    organization,
    isAuthenticated: !!state.session && !!state.user,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    setCurrentOrganization,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;