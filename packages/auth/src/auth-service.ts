import { 
  SupabaseClient, 
  User, 
  Session,
  UserResponse,
  AuthResponse,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials
} from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';

/**
 * Authentication service for managing users and sessions
 * using Supabase Auth
 */
export class AuthService {
  private supabase: SupabaseClient;
  
  /**
   * Creates a new AuthService instance
   * 
   * @param {SupabaseClient} supabaseClient - Optional Supabase client to use
   */
  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || getSupabaseClient();
  }
  
  /**
   * Sign up a new user with email and password
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {object} metadata - Optional user metadata
   * @returns {Promise<AuthResponse>} - Auth response with user and session data
   */
  async signUp(
    email: string, 
    password: string, 
    metadata?: { [key: string]: any }
  ): Promise<AuthResponse> {
    const credentials: SignUpWithPasswordCredentials = {
      email,
      password,
      options: {
        data: metadata
      }
    };
    
    return this.supabase.auth.signUp(credentials);
  }
  
  /**
   * Sign in a user with email and password
   * 
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<AuthResponse>} - Auth response with user and session data
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const credentials: SignInWithPasswordCredentials = {
      email,
      password
    };
    
    return this.supabase.auth.signInWithPassword(credentials);
  }
  
  /**
   * Sign in a user with a magic link (passwordless)
   * 
   * @param {string} email - User email
   * @returns {Promise<AuthResponse>} - Auth response
   */
  async signInWithMagicLink(email: string): Promise<AuthResponse> {
    return this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' 
          ? window.location.origin + '/auth/callback'
          : undefined
      }
    });
  }
  
  /**
   * Sign out the current user
   * 
   * @returns {Promise<{ error: Error | null }>} - Result of the sign out operation
   */
  async signOut(): Promise<{ error: Error | null }> {
    return this.supabase.auth.signOut();
  }
  
  /**
   * Get the current user
   * 
   * @returns {Promise<UserResponse>} - The current user if authenticated
   */
  async getUser(): Promise<UserResponse> {
    return this.supabase.auth.getUser();
  }
  
  /**
   * Get the current session
   * 
   * @returns {Promise<{ data: { session: Session | null }, error: Error | null }>} - Current session data
   */
  async getSession(): Promise<{ data: { session: Session | null }, error: Error | null }> {
    return this.supabase.auth.getSession();
  }
  
  /**
   * Set up an auth state change listener
   * 
   * @param {Function} callback - Function to call when auth state changes
   * @returns {Function} - Unsubscribe function
   */
  onAuthStateChange(
    callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'PASSWORD_RECOVERY', session: Session | null) => void
  ): { data: { subscription: { unsubscribe: () => void } } } {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
  
  /**
   * Send a password reset email
   * 
   * @param {string} email - User's email address
   * @returns {Promise<{ data: {}, error: Error | null }>} - Result of the operation
   */
  async resetPassword(email: string): Promise<{ data: {}, error: Error | null }> {
    return this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' 
        ? window.location.origin + '/auth/reset-password'
        : undefined
    });
  }
  
  /**
   * Update the user's password
   * 
   * @param {string} newPassword - New password
   * @returns {Promise<UserResponse>} - Updated user data
   */
  async updatePassword(newPassword: string): Promise<UserResponse> {
    return this.supabase.auth.updateUser({
      password: newPassword
    });
  }
  
  /**
   * Update user metadata
   * 
   * @param {object} metadata - User metadata to update
   * @returns {Promise<UserResponse>} - Updated user data
   */
  async updateUserMetadata(metadata: { [key: string]: any }): Promise<UserResponse> {
    return this.supabase.auth.updateUser({
      data: metadata
    });
  }
}