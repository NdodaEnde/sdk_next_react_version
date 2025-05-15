import { AuthService } from './auth-service';

/**
 * Configuration options for auth client
 */
export interface AuthClientConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
}

/**
 * Creates an auth client with the given configuration
 * 
 * @param config Configuration options
 * @returns AuthService instance
 */
export const createAuthClient = (config?: AuthClientConfig): AuthService => {
  return new AuthService();
};

// Singleton instance
let authClientInstance: AuthService | null = null;

/**
 * Gets or creates a singleton auth client
 * 
 * @param config Configuration options
 * @returns AuthService instance
 */
export const getAuthClient = (config?: AuthClientConfig): AuthService => {
  if (!authClientInstance) {
    authClientInstance = createAuthClient(config);
  }
  
  return authClientInstance;
};