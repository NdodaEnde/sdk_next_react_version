import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

/**
 * EmailVerificationBanner Component
 * 
 * A banner that shows the email verification status and provides actions
 * for users with unverified emails.
 */
export default function EmailVerificationBanner() {
  const { user, isAuthenticated } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState({
    loading: true,
    verified: false,
    email: '',
    error: null
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [message, setMessage] = useState('');
  
  // Fetch verification status
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setVerificationStatus({
        loading: false,
        verified: false,
        email: '',
        error: null
      });
      return;
    }
    
    const checkVerificationStatus = async () => {
      try {
        const response = await fetch('/api/auth/email/verification/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setVerificationStatus({
            loading: false,
            verified: data.verified,
            email: data.email,
            error: null
          });
        } else {
          setVerificationStatus({
            loading: false,
            verified: false,
            email: user.email,
            error: 'Could not check verification status'
          });
        }
      } catch (error) {
        setVerificationStatus({
          loading: false,
          verified: false,
          email: user.email,
          error: error.message
        });
      }
    };
    
    checkVerificationStatus();
  }, [isAuthenticated, user]);
  
  // Handle resend verification email
  const handleResendVerification = async () => {
    try {
      setSendingEmail(true);
      setMessage('');
      
      const response = await fetch('/api/auth/email/verification/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({ email: verificationStatus.email || user.email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message || 'Verification email sent successfully');
      } else {
        setMessage(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      setMessage(error.message || 'An unexpected error occurred');
    } finally {
      setSendingEmail(false);
    }
  };
  
  // Don't show banner for verified emails or when loading
  if (verificationStatus.loading || verificationStatus.verified) {
    return null;
  }
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <p className="text-sm text-yellow-700">
            Your email address is not verified. Some features may be limited.
          </p>
          <div className="mt-3 text-sm md:mt-0 md:ml-6">
            {sendingEmail ? (
              <span className="inline-flex items-center text-yellow-700">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              <button
                onClick={handleResendVerification}
                className="whitespace-nowrap font-medium text-yellow-700 hover:text-yellow-600"
              >
                Resend verification email
              </button>
            )}
          </div>
        </div>
      </div>
      
      {message && (
        <div className="mt-2 pl-8 text-sm text-yellow-700">
          {message}
        </div>
      )}
      
      <div className="mt-2 pl-8 text-sm text-yellow-700">
        <Link href="/auth/resend-verification" className="font-medium text-yellow-700 hover:text-yellow-600">
          Change email address
        </Link>
      </div>
    </div>
  );
}

/**
 * EmailVerificationIndicator Component
 * 
 * A small indicator of email verification status for profile pages.
 */
export function EmailVerificationIndicator() {
  const { user } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState({
    loading: true,
    verified: false
  });
  
  // Fetch verification status
  useEffect(() => {
    if (!user) {
      setVerificationStatus({
        loading: false,
        verified: false
      });
      return;
    }
    
    const checkVerificationStatus = async () => {
      try {
        const response = await fetch('/api/auth/email/verification/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setVerificationStatus({
            loading: false,
            verified: data.verified
          });
        } else {
          setVerificationStatus({
            loading: false,
            verified: false
          });
        }
      } catch (error) {
        setVerificationStatus({
          loading: false,
          verified: false
        });
      }
    };
    
    checkVerificationStatus();
  }, [user]);
  
  if (verificationStatus.loading) {
    return null;
  }
  
  if (verificationStatus.verified) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
          <circle cx="4" cy="4" r="3" />
        </svg>
        Verified
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
        <circle cx="4" cy="4" r="3" />
      </svg>
      Not Verified
    </span>
  );
}