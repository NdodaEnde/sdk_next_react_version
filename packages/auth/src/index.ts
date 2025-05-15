// Export Supabase client utilities
export { createSupabaseClient, getSupabaseClient } from './supabase';

// Export auth service
export { AuthService } from './auth-service';

// Export types
export * from './types';

// Default export for convenience
import { AuthService } from './auth-service';
export default AuthService;