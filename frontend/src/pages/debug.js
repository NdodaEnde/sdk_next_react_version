import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import SimpleLayout from '../components/SimpleLayout';

export default function DebugPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Log essential information to help debug
    console.log('Debug page loaded');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Router:', router);
    
    // Check for React Query
    try {
      const hasReactQuery = typeof window !== 'undefined' && window._REACT_QUERY_GLOBAL__;
      console.log('React Query initialized:', hasReactQuery);
    } catch (err) {
      console.log('Error checking React Query:', err);
    }
    
    // Log any potential errors related to PDF.js
    try {
      console.log('PDF.js version:', window.pdfjsLib?.version);
    } catch (err) {
      console.log('Error with PDF.js:', err);
    }
    
    // Check auth state
    try {
      const authUser = localStorage.getItem('auth_user');
      console.log('Auth user in localStorage:', authUser ? JSON.parse(authUser) : null);
    } catch (err) {
      console.log('Error accessing auth state:', err);
    }
  }, [router]);
  
  return (
    <SimpleLayout title="Debug Page">
      <div className="max-w-md w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Debug Page
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          If you can see this page, basic rendering is working!
          Check your browser console for debugging information.
        </p>
        
        <div className="space-y-4">
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <h2 className="font-medium text-gray-800 dark:text-gray-200">Environment</h2>
            <p className="text-gray-600 dark:text-gray-400">{process.env.NODE_ENV}</p>
          </div>
          
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <h2 className="font-medium text-gray-800 dark:text-gray-200">Current Route</h2>
            <p className="text-gray-600 dark:text-gray-400">{router.pathname}</p>
          </div>
          
          <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
            <h2 className="font-medium text-gray-800 dark:text-gray-200">Browser</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {typeof window !== 'undefined' ? window.navigator.userAgent : 'Server Rendering'}
            </p>
          </div>
        </div>
        
        <div className="mt-6 space-y-2">
          <button 
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
          
          <button 
            onClick={() => router.push('/login')}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    </SimpleLayout>
  );
}