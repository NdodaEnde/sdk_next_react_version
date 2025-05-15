import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../../../components/MainLayout';
import { useOrganization } from '../../../utils/organizationContext';
import { ROLES, hasRolePermission } from '../../../utils/permissions';

export default function OrganizationSettings() {
  const router = useRouter();
  const { id } = router.query;
  
  const { 
    organizations,
    currentOrganization,
    refreshOrganizations
  } = useOrganization();
  
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  
  // Danger zone states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOrgName, setDeleteOrgName] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Initialize form with organization data
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Find organization in the list
        const org = organizations.find(o => o.id === id);
        if (org) {
          setOrganization(org);
          setName(org.name);
          setDescription(org.description || '');
        } else {
          setError('Organization not found');
        }
      } catch (err) {
        console.error('Error fetching organization data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, organizations]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    setSaveSuccess(false);
    
    try {
      // In a real implementation, we would make an API call here
      // to update the organization details
      const response = await fetch(`/api/organizations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify({
          name,
          description
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating organization: ${response.statusText}`);
      }
      
      // Refresh organizations list to get the updated data
      await refreshOrganizations();
      
      // Show success message
      setSaveSuccess(true);
      
      // Automatically hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error updating organization:', err);
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle organization deletion
  const handleDelete = async () => {
    if (deleteOrgName !== name) {
      setFormError('Please enter the organization name correctly to confirm deletion');
      return;
    }
    
    setDeleting(true);
    setFormError(null);
    
    try {
      // In a real implementation, we would make an API call here
      // to delete the organization
      const response = await fetch(`/api/organizations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error deleting organization: ${response.statusText}`);
      }
      
      // Refresh organizations list to get the updated data
      await refreshOrganizations();
      
      // Redirect to organizations page
      router.push('/organizations');
    } catch (err) {
      console.error('Error deleting organization:', err);
      setFormError(err.message);
      setDeleting(false);
    }
  };
  
  // Check if the current user has permissions to edit
  const isAdminOrOwner = organization && 
    (organization.role === ROLES.ADMIN || organization.role === ROLES.OWNER);
  
  // Check if the current user is the owner
  const isOwner = organization && organization.role === ROLES.OWNER;
  
  if (!id) {
    return <div>Organization ID is missing</div>;
  }
  
  return (
    <MainLayout title={organization ? `${organization.name} - Settings` : 'Organization Settings'}>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <button 
              onClick={() => router.push('/organizations')}
              className="hover:text-gray-700"
            >
              Organizations
            </button>
            <svg className="mx-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <button 
              onClick={() => router.push(`/organizations/${id}`)}
              className="hover:text-gray-700"
            >
              {organization?.name || 'Organization'}
            </button>
            <svg className="mx-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span>Settings</span>
          </div>
          
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Organization Settings</h1>
          
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
          ) : (
            <div className="space-y-6">
              {/* Main Settings Form */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">General Settings</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Update your organization's basic information.
                  </p>
                </div>
                
                {/* Form */}
                <div className="px-4 py-5 sm:p-6">
                  {saveSuccess && (
                    <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-green-700">
                            Organization settings saved successfully!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {formError && (
                    <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md text-sm">
                      {formError}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Organization Name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            disabled={!isAdminOrOwner || saving}
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                          Slug
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                            /org/
                          </span>
                          <input
                            type="text"
                            name="slug"
                            id="slug"
                            value={organization?.slug || ''}
                            className="flex-1 block w-full border border-gray-300 rounded-none rounded-r-md shadow-sm py-2 px-3 bg-gray-100 text-gray-500 sm:text-sm"
                            disabled
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Organization slugs cannot be changed after creation.
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="description"
                            name="description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            disabled={!isAdminOrOwner || saving}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Brief description of your organization. This will be displayed in your organization profile.
                        </p>
                      </div>
                      
                      {isAdminOrOwner && (
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            disabled={saving}
                          >
                            {saving ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                              </>
                            ) : (
                              'Save Changes'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              </div>
              
              {/* Danger Zone */}
              {isOwner && (
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                  <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-red-50">
                    <h3 className="text-lg leading-6 font-medium text-red-800">Danger Zone</h3>
                    <p className="mt-1 max-w-2xl text-sm text-red-700">
                      Critical operations that can't be undone.
                    </p>
                  </div>
                  
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete this organization</h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                      <p>
                        Once you delete an organization, there is no going back. This action is permanent and will remove all data associated with this organization.
                      </p>
                    </div>
                    
                    {showDeleteConfirm ? (
                      <div className="mt-5">
                        <div className="rounded-md bg-red-50 p-4 mb-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-red-800">Attention required</h3>
                              <div className="mt-2 text-sm text-red-700">
                                <p>
                                  This action cannot be undone. This will permanently delete the <strong>{name}</strong> organization and all of its data.
                                </p>
                                <p className="mt-2">
                                  Please type <strong>{name}</strong> to confirm.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="text"
                            name="confirm"
                            placeholder={`Type "${name}" to confirm`}
                            value={deleteOrgName}
                            onChange={(e) => setDeleteOrgName(e.target.value)}
                            className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-64 sm:text-sm border-gray-300 rounded-md mr-3"
                          />
                          
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            {deleting ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Deleting...
                              </>
                            ) : (
                              'Delete Organization'
                            )}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setShowDeleteConfirm(false);
                              setDeleteOrgName('');
                            }}
                            className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            disabled={deleting}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Delete Organization
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}