import React from 'react';
import { ROLES } from '../utils/permissions';

/**
 * Role color mappings
 */
const ROLE_COLORS = {
  [ROLES.OWNER]: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    darkBg: 'dark:bg-purple-800',
    darkText: 'dark:text-purple-100',
    border: 'border-purple-200',
    hoverBg: 'hover:bg-purple-200',
    icon: (
      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
      </svg>
    )
  },
  [ROLES.ADMIN]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    darkBg: 'dark:bg-blue-800',
    darkText: 'dark:text-blue-100',
    border: 'border-blue-200',
    hoverBg: 'hover:bg-blue-200',
    icon: (
      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
      </svg>
    )
  },
  [ROLES.MEMBER]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    darkBg: 'dark:bg-green-800',
    darkText: 'dark:text-green-100',
    border: 'border-green-200',
    hoverBg: 'hover:bg-green-200',
    icon: (
      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    )
  },
  [ROLES.GUEST]: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    darkBg: 'dark:bg-gray-800',
    darkText: 'dark:text-gray-100',
    border: 'border-gray-200',
    hoverBg: 'hover:bg-gray-200',
    icon: (
      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    )
  },
};

/**
 * RoleBadge Component
 * 
 * Displays a badge with the user's role.
 * 
 * @param {Object} props
 * @param {string} props.role - The role to display
 * @param {boolean} props.small - Whether to use a smaller size
 * @param {boolean} props.large - Whether to use a larger size
 * @param {boolean} props.border - Whether to show a border
 * @param {boolean} props.showIcon - Whether to show the role icon
 * @param {boolean} props.pill - Whether to use a pill shape
 */
export default function RoleBadge({ 
  role = 'guest',
  small = false,
  large = false,
  border = false,
  showIcon = true,
  pill = true,
  className = ''
}) {
  // Normalize role to lowercase and ensure it's a valid role
  const normalizedRole = role.toLowerCase();
  const roleInfo = ROLE_COLORS[normalizedRole] || ROLE_COLORS[ROLES.GUEST];
  
  // Determine size classes
  const sizeClasses = small 
    ? 'px-1.5 py-0.5 text-xs' 
    : (large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs');
  
  // Determine shape classes
  const shapeClasses = pill ? 'rounded-full' : 'rounded';
  
  // Determine border classes
  const borderClasses = border ? `border ${roleInfo.border}` : '';
  
  // Combine all classes
  const badgeClasses = `
    inline-flex items-center 
    ${sizeClasses} 
    ${shapeClasses} 
    font-medium 
    ${roleInfo.bg} 
    ${roleInfo.text} 
    ${roleInfo.darkBg} 
    ${roleInfo.darkText}
    ${borderClasses} 
    ${roleInfo.hoverBg} 
    transition-colors duration-200
    ${className}
  `;
  
  // Capitalize first letter of role for display
  const displayRole = normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1);
  
  return (
    <span className={badgeClasses}>
      {showIcon && roleInfo.icon}
      {displayRole}
    </span>
  );
}

/**
 * RoleDisplay Component
 * 
 * Shows user information with their role.
 * 
 * @param {Object} props
 * @param {Object} props.user - The user object with name, email, and role
 * @param {boolean} props.horizontal - Whether to use horizontal layout
 */
export function RoleDisplay({ user, horizontal = false }) {
  if (!user) return null;
  
  // Basic layout for vertical display
  if (!horizontal) {
    return (
      <div className="flex flex-col items-start">
        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name || user.email}</div>
        {user.name && <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>}
        <div className="mt-1">
          <RoleBadge role={user.role} />
        </div>
      </div>
    );
  }
  
  // Horizontal layout
  return (
    <div className="flex items-center space-x-3">
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {(user.name ? user.name[0] : user.email[0]).toUpperCase()}
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name || user.email}</div>
        {user.name && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>}
      </div>
      <div>
        <RoleBadge role={user.role} small />
      </div>
    </div>
  );
}

/**
 * OrganizationRoleList Component
 * 
 * Displays a list of users with their roles in an organization.
 * 
 * @param {Object} props
 * @param {Array} props.users - Array of user objects with role information
 */
export function OrganizationRoleList({ users = [] }) {
  if (!users.length) return null;
  
  return (
    <div className="flow-root mt-6">
      <ul className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
        {users.map((user) => (
          <li key={user.id} className="py-4">
            <RoleDisplay user={user} horizontal />
          </li>
        ))}
      </ul>
    </div>
  );
}