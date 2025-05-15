import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';

const VerifyEmail = () => {
  const router = useRouter();
  const { token } = router.query;
  const { isAuthenticated } = useAuth();
  
  const [verificationState, setVerificationState] = useState({
    status: 'idle', // idle, loading, success, error
    message: '',
    error: null
  });
  
  // Verify the token
  useEffect(() => {
    if (!token) return;
    
    const verifyEmail = async () => {
      try {
        setVerificationState({ status: 'loading', message: 'Verifying your email...', error: null });
        
        const response = await fetch(`/api/auth/email/verify?token=${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setVerificationState({ 
            status: 'success', 
            message: data.message || 'Your email has been verified successfully!', 
            error: null 
          });
        } else {
          setVerificationState({ 
            status: 'error', 
            message: 'Email verification failed', 
            error: data.error || 'Invalid or expired verification link' 
          });
        }
      } catch (error) {
        setVerificationState({ 
          status: 'error', 
          message: 'Email verification failed', 
          error: error.message || 'An unexpected error occurred' 
        });
      }
    };
    
    verifyEmail();
  }, [token]);
  
  // Render loading state
  if (verificationState.status === 'idle' || verificationState.status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="text-center text-3xl font-extrabold text-gray-900">Verifying your email</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Please wait while we verify your email address.
            </p>
          </div>
          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="mt-4 text-center text-sm text-gray-600">
              {verificationState.message}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Render success state
  if (verificationState.status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-3 text-center text-3xl font-extrabold text-gray-900">Email Verified!</h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {verificationState.message}
            </p>
          </div>
          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex flex-col items-center">
              <p className="text-center text-sm text-gray-600">
                Your email has been successfully verified. You can now use all features of the application.
              </p>
              <div className="mt-6">
                {isAuthenticated ? (
                  <Link href="/dashboard" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link href="/login" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-3 text-center text-3xl font-extrabold text-gray-900">Verification Failed</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {verificationState.message}
          </p>
        </div>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex flex-col items-center">
            <p className="text-center text-sm text-red-600">
              {verificationState.error}
            </p>
            <div className="mt-6 space-y-4">
              <button
                onClick={() => router.reload()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <Link href="/dashboard" className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Return to Dashboard
              </Link>
              <Link href="/auth/resend-verification" className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Resend Verification Email
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;