import React, { useState } from 'react';
import { useOrganization } from '../utils/organizationContext';

/**
 * Organization Switcher Component
 * 
 * Allows users to switch between organizations and create new ones
 */
export default function OrganizationSwitcher() {
  const { 
    organizations, 
    currentOrganization, 
    switchOrganization, 
    createOrganization,
    loading 
  } = useOrganization();
  
  const [showForm, setShowForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Handle organization change
  const handleOrgChange = (e) => {
    const orgId = e.target.value;
    switchOrganization(orgId);
  };

  // Handle new organization creation
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setError(null);
    
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
        description: `Organization for ${newOrgName}`
      });
      
      // Reset form
      setNewOrgName('');
      setNewOrgSlug('');
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate slug from name
  const handleNameChange = (e) => {
    const name = e.target.value;
    setNewOrgName(name);
    
    // Auto-generate slug if user hasn't manually changed it
    if (!newOrgSlug || newOrgSlug === slugify(newOrgName)) {
      setNewOrgSlug(slugify(name));
    }
  };

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

  if (loading) {
    return <div className="p-4 text-gray-500">Loading organizations...</div>;
  }

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">Organizations</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            New Org
          </button>
        )}
      </div>

      {/* Organization Dropdown */}
      {organizations.length > 0 ? (
        <div className="mb-4">
          <select
            value={currentOrganization?.id || ''}
            onChange={handleOrgChange}
            className="w-full p-2 border rounded bg-gray-50"
          >
            {organizations.map(org => (
              <option key={org.id} value={org.id}>
                {org.name} {org.is_default ? '(Default)' : ''}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="mb-4 text-sm text-gray-500">
          No organizations found. Create your first one!
        </div>
      )}

      {/* New Organization Form */}
      {showForm && (
        <div className="border-t pt-4 mt-2">
          <h4 className="font-medium text-sm mb-2">Create New Organization</h4>
          <form onSubmit={handleCreateOrg}>
            {error && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={newOrgName}
                onChange={handleNameChange}
                className="w-full p-2 border rounded"
                placeholder="My Organization"
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Slug</label>
              <input
                type="text"
                value={newOrgSlug}
                onChange={(e) => setNewOrgSlug(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="my-organization"
                required
              />
              <span className="text-xs text-gray-400">
                Used in URLs: example.com/org/{newOrgSlug || 'my-org'}
              </span>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1 border rounded text-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Current Organization Info */}
      {currentOrganization && (
        <div className="mt-4 border-t pt-4 text-sm">
          <h4 className="font-medium mb-1">Current Organization</h4>
          <p>Name: {currentOrganization.name}</p>
          <p>Role: {currentOrganization.role}</p>
          <p className="text-xs text-gray-500 mt-1">
            ID: {currentOrganization.id}
          </p>
        </div>
      )}
    </div>
  );
}