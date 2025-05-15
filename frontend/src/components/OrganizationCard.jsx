import React from 'react';
import RoleBadge from './RoleBadge';

/**
 * Organization Type Badge Component
 * 
 * Displays a badge indicating the organization type
 */
export function OrganizationTypeBadge({ type, className = '' }) {
  // Organization type options with colors and icons
  const orgTypeOptions = [
    { 
      value: 'direct_client', 
      label: 'Direct Client',
      color: 'blue',
      icon: (
        <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      value: 'service_provider', 
      label: 'Service Provider',
      color: 'green',
      icon: (
        <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
        </svg>
      )
    },
    { 
      value: 'healthcare_facility', 
      label: 'Healthcare Facility',
      color: 'red',
      icon: (
        <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
      )
    },
    { 
      value: 'partner', 
      label: 'Partner Organization',
      color: 'purple',
      icon: (
        <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      )
    },
    { 
      value: 'vendor', 
      label: 'Vendor',
      color: 'amber',
      icon: (
        <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      )
    }
  ];
  
  // Find the organization type info or use default
  const typeInfo = orgTypeOptions.find(opt => opt.value === type) || {
    value: type,
    label: type.replace('_', ' '),
    color: 'gray',
    icon: null
  };
  
  // Color mapping
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    gray: 'bg-gray-50 text-gray-700 border-gray-100'
  };
  
  const classes = `px-2 py-0.5 text-xs inline-flex items-center rounded-md border ${colorClasses[typeInfo.color]} ${className}`;
  
  return (
    <span className={classes}>
      {typeInfo.icon}
      {typeInfo.label}
    </span>
  );
}

/**
 * Organization Card Component
 * 
 * Displays organization information in a card format with badges for role and type
 * 
 * @param {Object} props
 * @param {Object} props.organization - Organization data
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional classes
 */
export default function OrganizationCard({ organization, onClick, className = '', actionButton }) {
  if (!organization) return null;
  
  const {
    id,
    name,
    slug,
    description,
    role,
    type,
    is_default
  } = organization;
  
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center text-lg font-medium text-gray-600">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="flex items-center">
              <h4 className="text-lg font-medium text-gray-900">{name}</h4>
              {is_default && (
                <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  Default
                </span>
              )}
              {type && (
                <OrganizationTypeBadge type={type} className="ml-2" />
              )}
            </div>
            <div className="mt-1 flex items-center">
              <span className="text-sm text-gray-500 mr-3">/org/{slug}</span>
              <RoleBadge role={role} />
            </div>
            {description && (
              <p className="mt-2 text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
        <div>
          {actionButton || (
            <button
              onClick={() => onClick && onClick(id)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Organization List Component
 * 
 * Displays a list of organizations using the OrganizationCard component
 */
export function OrganizationList({ 
  organizations = [],
  onOrganizationClick,
  emptyMessage = "No organizations found",
  className = "",
  renderItem
}) {
  if (!organizations.length) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">{emptyMessage}</h3>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`space-y-4 ${className}`}>
      {organizations.map(org => 
        renderItem ? (
          renderItem(org)
        ) : (
          <OrganizationCard 
            key={org.id} 
            organization={org} 
            onClick={onOrganizationClick}
          />
        )
      )}
    </div>
  );
}