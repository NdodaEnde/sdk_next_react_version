import React, { useState, useEffect } from 'react';
import { useOrganization } from '../../utils/organizationContext';
import { RoleBadge } from '../RoleBadge';

/**
 * InvitationList Component
 * 
 * Displays and manages pending invitations for the current user.
 */
export default function InvitationList() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingInvite, setProcessingInvite] = useState(null);
  
  // Get API functions from organization context
  const { getApiHeaders, refreshOrganizations } = useOrganization();
  
  // Fetch invitations on component mount
  useEffect(() => {
    fetchInvitations();
  }, []);
  
  // Fetch pending invitations for the current user
  const fetchInvitations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/invitations', {
        method: 'GET',
        headers: getApiHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Error fetching invitations: ${response.statusText}`);
      }
      
      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle accepting an invitation
  const handleAccept = async (token) => {
    setProcessingInvite(token);
    
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: getApiHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Error accepting invitation: ${response.statusText}`);
      }
      
      // Remove the invitation from the list
      setInvitations(invitations.filter(invite => invite.token !== token));
      
      // Refresh organizations to get the new one
      await refreshOrganizations();
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError(err.message);
    } finally {
      setProcessingInvite(null);
    }
  };
  
  // Handle declining an invitation
  const handleDecline = async (token) => {
    setProcessingInvite(token);
    
    try {
      const response = await fetch(`/api/invitations/${token}/decline`, {
        method: 'POST',
        headers: getApiHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Error declining invitation: ${response.statusText}`);
      }
      
      // Remove the invitation from the list
      setInvitations(invitations.filter(invite => invite.token !== token));
    } catch (err) {
      console.error('Error declining invitation:', err);
      setError(err.message);
    } finally {
      setProcessingInvite(null);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // If there are no pending invitations
  if (!loading && invitations.length === 0) {
    return (
      <div className="text-center p-6 bg-white rounded-lg shadow">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No pending invitations</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have any pending organization invitations.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Invitations</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Organizations you have been invited to join
        </p>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="px-4 py-8 text-center">
          <svg className="animate-spin mx-auto h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-sm text-gray-500">Loading invitations...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="px-4 py-5 sm:p-6">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading invitations</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchInvitations}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Invitations list */}
      {!loading && !error && invitations.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="px-4 py-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                <div className="mb-4 sm:mb-0">
                  <p className="text-sm font-medium text-gray-900">
                    {invitation.organization?.name || 'Unknown Organization'}
                  </p>
                  <div className="mt-1 flex items-center">
                    <p className="text-sm text-gray-500 mr-3">
                      Invited by: {invitation.invited_by_name || invitation.invited_by}
                    </p>
                    <RoleBadge role={invitation.role} small />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Expires: {formatDate(invitation.expires_at)}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDecline(invitation.token)}
                    disabled={processingInvite === invitation.token}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {processingInvite === invitation.token ? 'Processing...' : 'Decline'}
                  </button>
                  <button
                    onClick={() => handleAccept(invitation.token)}
                    disabled={processingInvite === invitation.token}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {processingInvite === invitation.token ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      'Accept'
                    )}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}