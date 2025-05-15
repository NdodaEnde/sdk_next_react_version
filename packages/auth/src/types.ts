import { User, Session } from '@supabase/supabase-js';

/**
 * Extended user profile with additional fields
 */
export interface UserProfile extends User {
  organization_id?: string;
  role?: string;
  full_name?: string;
  avatar_url?: string;
  is_admin?: boolean;
}

/**
 * Authentication state
 */
export interface AuthState {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Organization information
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'service_provider' | 'client';
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Authentication context value type
 */
export interface AuthContextValue {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  organization?: Organization | null; 
  isAuthenticated: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithMagicLink: (email: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  updatePassword: (newPassword: string) => Promise<any>;
  updateProfile: (data: Partial<UserProfile>) => Promise<any>;
  setCurrentOrganization?: (org: Organization) => void;
}

/**
 * Tenant context information
 */
export interface TenantContext {
  organizationId: string;
  userId: string;
}

/**
 * JWT token payload with tenant information
 */
export interface JwtPayloadWithTenant {
  sub: string;
  email?: string;
  org_id?: string;
  role?: string;
  iat: number;
  exp: number;
  aud: string;
}