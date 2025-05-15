import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import { useOrganization } from '../../utils/organizationContext';
import { useAuth } from '../../hooks/useAuth';
import { RoleBadge } from '../../components/RoleBadge';
import { acceptInvitation, declineInvitation } from '../../services/organizationService';

export default function InvitationAccept() {
  const router = useRouter();
  const { token } = router.query;
  const { user, isAuthenticated, isLoading: authLoading, login } = useAuth();
  const { refreshOrganizations } = useOrganization();
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(null);
  
  // Fetch invitation details when component mounts and token is available
  useEffect(() => {
    if (!token) return;
    
    fetchInvitationDetails();
  }, [token]);
  
  // Fetch the invitation details
  const fetchInvitationDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, we would make an API call here
      // to get the invitation details from the token
      const response = await fetch(`/api/invitations/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user ? `Bearer ${localStorage.getItem('supabase.auth.token')}` : '',
        },
      });
      
      if (!response.ok) {
        throw new Error('Unable to fetch invitation details');
      }
      
      const data = await response.json();
      setInvitation(data.invitation);
    } catch (err) {
      console.error('Error fetching invitation:', err);
      setError(err.message || 'Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle accepting an invitation
  const handleAccept = async () => {
    if (!isAuthenticated) {
      // Save the current URL so we can redirect back after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      router.push('/login');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      const result = await acceptInvitation(token);
      
      setSuccess({
        type: 'accepted',
        message: 'You have successfully joined the organization!',
        organizationName: invitation?.organization?.name,
      });
      
      // Refresh the organizations list
      await refreshOrganizations();
      
      // After a delay, redirect to the organizations page
      setTimeout(() => {
        router.push('/organizations');
      }, 3000);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };
  
  // Handle declining an invitation
  const handleDecline = async () => {
    if (!isAuthenticated) {
      // Save the current URL so we can redirect back after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      router.push('/login');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      await declineInvitation(token);
      
      setSuccess({
        type: 'declined',
        message: 'You have declined the invitation.',
        organizationName: invitation?.organization?.name,
      });
      
      // After a delay, redirect to the invitations page
      setTimeout(() => {
        router.push('/invitations');
      }, 3000);
    } catch (err) {
      console.error('Error declining invitation:', err);
      setError(err.message || 'Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Render loading state
  if (loading || authLoading) {
    return (
      <MainLayout title="Processing Invitation">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Handle error state
  if (error || !invitation) {
    return (
      <MainLayout title="Invitation Error">
        <div className="py-6">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex flex-col items-center">
                  <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">Invalid Invitation</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {error || 'This invitation is invalid, expired, or has already been used.'}
                  </p>
                  <div className="mt-6">
                    <Link href="/invitations">
                      <a className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        View All Invitations
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Handle success state
  if (success) {
    return (
      <MainLayout title={`Invitation ${success.type === 'accepted' ? 'Accepted' : 'Declined'}`}>
        <div className="py-6">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex flex-col items-center">
                  {success.type === 'accepted' ? (
                    <svg className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    {success.type === 'accepted' ? 'Invitation Accepted' : 'Invitation Declined'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {success.message}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {success.type === 'accepted' ? (
                      <>Redirecting to Organizations page...</>
                    ) : (
                      <>Redirecting to Invitations page...</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Render invitation details
  return (
    <MainLayout title="Organization Invitation">
      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-blue-50 border-b border-blue-200">
              <h3 className="text-lg leading-6 font-medium text-blue-900">Organization Invitation</h3>
              <p className="mt-1 max-w-2xl text-sm text-blue-700">
                You have been invited to join an organization
              </p>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {invitation.organization?.name || 'Unknown Organization'}
                  </h4>
                  {invitation.organization?.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {invitation.organization.description}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">You are invited as:</span>
                  <RoleBadge role={invitation.role} small />
                </div>
                
                <div className="text-sm text-gray-500">
                  <p>Invited by: {invitation.invited_by_name || invitation.invited_by || 'An organization admin'}</p>
                  <p>Expires on: {formatDate(invitation.expires_at)}</p>
                </div>
                
                {!isAuthenticated && (
                  <div className="rounded-md bg-yellow-50 p-4 my-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Login Required</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            You need to be logged in to accept or decline this invitation.
                            You will be redirected to the login page.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={handleDecline}
                  disabled={processing}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  disabled={processing}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {processing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Accept Invitation'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}