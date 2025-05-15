import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../components/MainLayout';
import { useOrganization } from '../../utils/organizationContext';
import { RoleDisplay, OrganizationRoleList } from '../../components/RoleBadge';
import { ROLES, hasRolePermission } from '../../utils/permissions';

export default function OrganizationDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const { 
    organizations,
    currentOrganization,
    getOrganizationMembers,
    inviteMember,
    switchOrganization
  } = useOrganization();
  
  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('members');
  
  // Invitation form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  
  // Find organization in the list or fetch it
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Try to find the organization in the existing list
        const org = organizations.find(o => o.id === id);
        if (org) {
          setOrganization(org);
          
          // If it's not the current organization, switch to it
          if (currentOrganization?.id !== id) {
            await switchOrganization(id);
          }
        } else {
          // If not found, we might need to fetch it (in a real implementation)
          setError('Organization not found');
        }
        
        // Fetch members
        const membersList = await getOrganizationMembers(id);
        setMembers(membersList || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching organization data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, organizations]);
  
  // Handle sending invitation
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError(null);
    setInviteSuccess(false);
    
    try {
      // Validate email
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }
      
      // Send invitation
      await inviteMember(id, email, role);
      
      // Reset form and show success message
      setEmail('');
      setRole('member');
      setInviteSuccess(true);
      setShowInviteForm(false);
      
      // Refresh members list after a successful invitation
      const updatedMembers = await getOrganizationMembers(id);
      setMembers(updatedMembers || []);
    } catch (err) {
      console.error('Error sending invitation:', err);
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };
  
  // Check if the current user has admin/owner role
  const isAdminOrOwner = organization && 
    (organization.role === ROLES.ADMIN || organization.role === ROLES.OWNER);
  
  // Check if the current user is the owner
  const isOwner = organization && organization.role === ROLES.OWNER;
  
  if (!id) {
    return <div>Organization ID is missing</div>;
  }
  
  return (
    <MainLayout title={organization ? `${organization.name} - Organizations` : 'Organization Details'}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
              {error}
            </div>
          ) : organization ? (
            <>
              {/* Organization header */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-600">
                      {organization.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <h1 className="text-2xl font-semibold text-gray-900">{organization.name}</h1>
                      <div className="mt-1 flex items-center">
                        <span className="text-sm text-gray-500 mr-3">/org/{organization.slug}</span>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {organization.is_default ? 'Default' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {isAdminOrOwner && (
                    <button
                      onClick={() => router.push(`/organizations/${id}/settings`)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                      Organization Settings
                    </button>
                  )}
                </div>
                
                {organization.description && (
                  <div className="mt-4 text-sm text-gray-500">
                    {organization.description}
                  </div>
                )}
              </div>
              
              {/* Tabs */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('members')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'members'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Members
                  </button>
                  <button
                    onClick={() => setActiveTab('invitations')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'invitations'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Invitations
                  </button>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'activity'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Activity Log
                  </button>
                </nav>
              </div>
              
              {/* Content based on active tab */}
              {activeTab === 'members' && (
                <div>
                  {/* Members management */}
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="flex justify-between items-center px-4 py-5 sm:px-6 border-b border-gray-200">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">Organization Members</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                          {members.length} {members.length === 1 ? 'member' : 'members'} in this organization
                        </p>
                      </div>
                      
                      {isAdminOrOwner && (
                        <button
                          onClick={() => setShowInviteForm(true)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                          </svg>
                          Invite Member
                        </button>
                      )}
                    </div>
                    
                    {inviteSuccess && (
                      <div className="p-4 bg-green-50 border-l-4 border-green-500">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-green-700">
                              Invitation sent successfully!
                            </p>
                          </div>
                          <div className="ml-auto pl-3">
                            <div className="-mx-1.5 -my-1.5">
                              <button
                                onClick={() => setInviteSuccess(false)}
                                className="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <span className="sr-only">Dismiss</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Invite Member Form */}
                    {showInviteForm && (
                      <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Invite a New Member</h4>
                        <form onSubmit={handleInvite}>
                          {inviteError && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                              {inviteError}
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                              <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="colleague@example.com"
                                required
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                              <select
                                id="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              >
                                <option value="member">Member</option>
                                {isOwner && (
                                  <>
                                    <option value="admin">Admin</option>
                                    <option value="owner">Owner</option>
                                  </>
                                )}
                                {isAdminOrOwner && !isOwner && (
                                  <option value="admin">Admin</option>
                                )}
                              </select>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => {
                                setShowInviteForm(false);
                                setEmail('');
                                setRole('member');
                                setInviteError(null);
                              }}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              disabled={inviteLoading}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              disabled={inviteLoading}
                            >
                              {inviteLoading ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Sending...
                                </>
                              ) : (
                                'Send Invitation'
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                    
                    {/* Members List */}
                    {members.length === 0 ? (
                      <div className="px-4 py-12 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No members found</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by inviting members to your organization.</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {members.map((member) => (
                          <li key={member.id} className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <RoleDisplay user={{
                                name: member.name || member.email,
                                email: member.email,
                                role: member.role
                              }} horizontal />
                              
                              {isAdminOrOwner && (
                                <div className="ml-2 flex-shrink-0 flex">
                                  <button
                                    onClick={() => {
                                      // Handle edit member (in a real implementation)
                                      console.log('Edit member:', member.id);
                                    }}
                                    className="mr-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    Edit
                                  </button>
                                  
                                  {isOwner && member.role !== 'owner' && (
                                    <button
                                      onClick={() => {
                                        // Handle remove member (in a real implementation)
                                        console.log('Remove member:', member.id);
                                      }}
                                      className="inline-flex items-center px-2.5 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'invitations' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Invitations</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Manage invitations to your organization
                    </p>
                  </div>
                  
                  <div className="px-4 py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No pending invitations</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      All invitations have been accepted or declined.
                    </p>
                    {isAdminOrOwner && (
                      <div className="mt-6">
                        <button
                          onClick={() => setShowInviteForm(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                          </svg>
                          Invite New Member
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'activity' && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Activity Log</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      Recent activity in this organization
                    </p>
                  </div>
                  
                  <div className="px-4 py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No activity records</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Activity tracking will be available in a future update.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Organization not found</h3>
                <p className="mt-1 text-sm text-gray-500">The organization you're looking for doesn't exist or you don't have access to it.</p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/organizations')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View All Organizations
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}