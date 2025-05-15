import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MainLayout from '../components/MainLayout';
import { useOrganization } from '../utils/organizationContext';
import OrganizationCard, { OrganizationList, OrganizationTypeBadge } from '../components/OrganizationCard';

export default function Organizations() {
  const router = useRouter();
  const { 
    organizations,
    currentOrganization,
    loading,
    error,
    createOrganization,
    refreshOrganizations
  } = useOrganization();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  const [newOrgType, setNewOrgType] = useState('direct_client');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  
  // Organization type options - imported from OrganizationCard.jsx
  const orgTypeOptions = [
    { value: 'direct_client', label: 'Direct Client' },
    { value: 'service_provider', label: 'Service Provider' },
    { value: 'healthcare_facility', label: 'Healthcare Facility' },
    { value: 'partner', label: 'Partner Organization' },
    { value: 'vendor', label: 'Vendor' }
  ];
  
  useEffect(() => {
    // Refresh organizations when the page loads
    refreshOrganizations();
  }, []);
  
  // Simple slugify function
  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-')   // Replace multiple - with single -
      .replace(/^-+/, '')       // Trim - from start of text
      .replace(/-+$/, '');      // Trim - from end of text
  };
  
  // Handle name change and auto-generate slug
  const handleNameChange = (e) => {
    const name = e.target.value;
    setNewOrgName(name);
    
    // Auto-generate slug if user hasn't manually changed it
    if (!newOrgSlug || newOrgSlug === slugify(newOrgName)) {
      setNewOrgSlug(slugify(name));
    }
  };
  
  // Handle organization creation
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      setIsSubmitting(true);
      
      // Validate input
      if (!newOrgName || !newOrgSlug) {
        throw new Error('Name and slug are required');
      }
      
      // Create organization
      await createOrganization({
        name: newOrgName,
        slug: newOrgSlug,
        description: newOrgDescription || `Organization for ${newOrgName}`,
        type: newOrgType
      });
      
      // Reset form
      setNewOrgName('');
      setNewOrgSlug('');
      setNewOrgDescription('');
      setNewOrgType('direct_client');
      setShowCreateForm(false);
      
      // Refresh organizations list
      await refreshOrganizations();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle organization selection
  const handleViewOrg = (orgId) => {
    router.push(`/organizations/${orgId}`);
  };
  
  return (
    <MainLayout title="Organizations - Surgiscan Platform">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Organizations</h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Organization
            </button>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Create Organization Form */}
          {showCreateForm && (
            <div className="mb-8 p-6 bg-white shadow rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">Create New Organization</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateOrg}>
                {formError && (
                  <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md text-sm">
                    {formError}
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={newOrgName}
                    onChange={handleNameChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="My Organization"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      /org/
                    </span>
                    <input
                      type="text"
                      id="slug"
                      value={newOrgSlug}
                      onChange={(e) => setNewOrgSlug(e.target.value)}
                      className="flex-1 block w-full border border-gray-300 rounded-none rounded-r-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="my-organization"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Used in URLs and API endpoints. Cannot be changed after creation.
                  </p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                  <textarea
                    id="description"
                    value={newOrgDescription}
                    onChange={(e) => setNewOrgDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter a description for your organization"
                  />
                </div>
                
                <div className="mb-6">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">Organization Type</label>
                  <select
                    id="type"
                    value={newOrgType}
                    onChange={(e) => setNewOrgType(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {orgTypeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select the type of organization you are creating.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Organization'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
              Error loading organizations: {error}
            </div>
          )}
          
          {/* Loading state */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          
          {/* Empty state */}
          {!loading && organizations.length === 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-12 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No organizations found</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating a new organization.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Create Organization
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Organizations list */}
          {!loading && organizations.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="bg-white px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Your Organizations</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You belong to {organizations.length} organization{organizations.length !== 1 ? 's' : ''}.
                </p>
              </div>
              <div className="p-4">
                <OrganizationList 
                  organizations={organizations} 
                  onOrganizationClick={handleViewOrg}
                  className="space-y-4"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}