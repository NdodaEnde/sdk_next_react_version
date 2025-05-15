import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates and configures a Supabase client instance
 * 
 * @param {string} supabaseUrl - The URL of your Supabase project
 * @param {string} supabaseKey - The API key for your Supabase project
 * @returns {SupabaseClient} A configured Supabase client instance
 */
export const createSupabaseClient = (
  supabaseUrl: string,
  supabaseKey: string
): SupabaseClient => {
  if (!supabaseUrl) {
    throw new Error('Supabase URL is required');
  }

  if (!supabaseKey) {
    throw new Error('Supabase API key is required');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    }
  });
};

/**
 * Function to create a singleton instance of the Supabase client
 * to be used throughout the application
 */
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (
  supabaseUrl?: string,
  supabaseKey?: string
): SupabaseClient => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // If there's no existing instance, create one
  if (!supabaseUrl || !supabaseKey) {
    // In browser environments, try to get from environment variables
    const envUrl = typeof window !== 'undefined' 
      ? process.env.NEXT_PUBLIC_SUPABASE_URL 
      : process.env.SUPABASE_URL;
      
    const envKey = typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      : process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!envUrl || !envKey) {
      throw new Error(
        'Supabase URL and API key must be provided either as arguments or environment variables'
      );
    }

    supabaseInstance = createSupabaseClient(envUrl, envKey);
  } else {
    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseKey);
  }

  return supabaseInstance;
};