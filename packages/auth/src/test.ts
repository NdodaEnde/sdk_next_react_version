// Simple test file to check if the auth package is working
import { AuthService, getSupabaseClient } from './index';

// This is a simple test that checks if the auth package can be imported
// and if the AuthService class can be instantiated
function testAuthPackage() {
  try {
    // This will throw an error if environment variables are not set, which is expected
    // but we just want to test the imports
    try {
      const supabase = getSupabaseClient();
      console.log('Supabase client initialized successfully');
    } catch (error) {
      console.log('Supabase client initialization failed (expected without env vars)');
    }

    // Create an auth service with a mock client
    const mockClient = {} as any;
    const authService = new AuthService(mockClient);
    
    console.log('Auth service initialized successfully');

    return 'Auth package test passed';
  } catch (error) {
    console.error('Auth package test failed', error);
    return 'Auth package test failed';
  }
}

// Run the test
const result = testAuthPackage();
console.log(result);