import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';

/**
 * Auth callback page for handling redirects from Supabase Auth
 * Used for magic link and OAuth flows
 */
export default function AuthCallback() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [message, setMessage] = useState('Processing authentication...');
  const [error, setError] = useState('');

  useEffect(() => {
    // The hash fragment and query parameters will be processed
    // automatically by the Supabase Auth client
    
    // We just need to wait for the auth state to update
    const redirectTimer = setTimeout(() => {
      if (isAuthenticated) {
        // If authenticated, redirect to dashboard
        router.push('/dashboard');
      } else {
        // If timeout and still not authenticated, show error
        setError('Authentication failed or timed out. Please try again.');
        
        // Redirect to login after a delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    }, 5000); // Wait for 5 seconds

    return () => clearTimeout(redirectTimer);
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h1 className="text-2xl font-bold text-blue-600">MedCert</h1>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Authentication</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  <p className="mt-2 text-sm text-red-700">
                    Redirecting you back to the login page...
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-center text-gray-700">{message}</p>
              <p className="text-sm text-gray-500 mt-2">You'll be redirected automatically.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}