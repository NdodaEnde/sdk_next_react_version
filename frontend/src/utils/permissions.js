/**
 * Permission Utility Functions
 * 
 * This module provides functions for checking user roles and permissions.
 */

/**
 * Role hierarchy from highest to lowest permissions
 */
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  GUEST: 'guest',  // Not stored in DB, used for public/unauthenticated access
};

/**
 * Role weights for comparison (higher number = higher permissions)
 */
export const ROLE_WEIGHTS = {
  [ROLES.OWNER]: 100,
  [ROLES.ADMIN]: 75,
  [ROLES.MEMBER]: 50,
  [ROLES.GUEST]: 0,
};

/**
 * Permission definitions mapped to specific actions
 */
export const PERMISSIONS = {
  // Organization Management
  CREATE_ORGANIZATION: [ROLES.GUEST], // Anyone can create an organization
  VIEW_ORGANIZATION: [ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER],
  EDIT_ORGANIZATION: [ROLES.ADMIN, ROLES.OWNER],
  DELETE_ORGANIZATION: [ROLES.OWNER],
  
  // Member Management
  VIEW_MEMBERS: [ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER],
  INVITE_MEMBERS: [ROLES.ADMIN, ROLES.OWNER],
  REMOVE_MEMBERS: [ROLES.ADMIN, ROLES.OWNER],
  CHANGE_MEMBER_ROLE: [ROLES.OWNER],
  
  // Document Management
  VIEW_DOCUMENTS: [ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER],
  UPLOAD_DOCUMENTS: [ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER],
  DELETE_DOCUMENTS: [ROLES.ADMIN, ROLES.OWNER],
  SHARE_DOCUMENTS: [ROLES.ADMIN, ROLES.OWNER],
  
  // Admin Features
  VIEW_ANALYTICS: [ROLES.ADMIN, ROLES.OWNER],
  MANAGE_SETTINGS: [ROLES.ADMIN, ROLES.OWNER],
  MANAGE_BILLING: [ROLES.OWNER],
  
  // User Settings
  EDIT_PROFILE: [ROLES.GUEST], // Users can edit their own profiles
};

/**
 * Check if a role has a specific permission
 * @param {string} role - The user role to check
 * @param {string} permission - The permission to check for
 * @returns {boolean} True if the role has the permission
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  
  return allowedRoles.includes(role);
}

/**
 * Check if a role has permission based on role hierarchy
 * @param {string} userRole - The user's role
 * @param {string} requiredRole - The minimum role required
 * @returns {boolean} True if the user's role is equal to or higher than the required role
 */
export function hasRolePermission(userRole, requiredRole) {
  if (!userRole || !requiredRole) return false;
  
  const userWeight = ROLE_WEIGHTS[userRole] || 0;
  const requiredWeight = ROLE_WEIGHTS[requiredRole] || 0;
  
  return userWeight >= requiredWeight;
}

/**
 * Get all permissions available to a specific role
 * @param {string} role - The role to check
 * @returns {string[]} Array of permission keys available to this role
 */
export function getAvailablePermissions(role) {
  if (!role) return [];
  
  return Object.entries(PERMISSIONS)
    .filter(([permission, allowedRoles]) => allowedRoles.includes(role))
    .map(([permission]) => permission);
}

/**
 * Check if the current user can perform an action on a resource
 * @param {Object} user - The current user object
 * @param {string} action - The action to perform (e.g., 'edit', 'delete')
 * @param {Object} resource - The resource object (e.g., organization, document)
 * @param {Object} context - Additional context information
 * @returns {boolean} True if the user can perform the action
 */
export function canPerformAction(user, action, resource, context = {}) {
  if (!user || !action || !resource) return false;
  
  // Check if user is the resource owner
  const isOwner = resource.created_by === user.id || resource.owner_id === user.id;
  if (isOwner) return true;
  
  // If we have organization context
  if (context.organization && user.organization_role) {
    // Special owner check for organization
    if (resource.type === 'organization' && resource.id === context.organization.id) {
      return hasRolePermission(user.organization_role, action === 'delete' ? ROLES.OWNER : ROLES.ADMIN);
    }
    
    // Determine required role based on action and resource type
    let requiredRole;
    
    switch (resource.type) {
      case 'document':
        requiredRole = action === 'delete' ? ROLES.ADMIN : ROLES.MEMBER;
        break;
      case 'member':
        requiredRole = action === 'update_role' ? ROLES.OWNER : ROLES.ADMIN;
        break;
      case 'settings':
        requiredRole = ROLES.ADMIN;
        break;
      default:
        requiredRole = ROLES.MEMBER;
    }
    
    return hasRolePermission(user.organization_role, requiredRole);
  }
  
  return false;
}

/**
 * Generate a list of navigation items based on user role
 * @param {string} role - The user's role
 * @returns {Object[]} Array of navigation items with their visibility status
 */
export function getNavigationItems(role = ROLES.GUEST) {
  return [
    {
      label: 'Dashboard',
      href: '/dashboard',
      visible: hasPermission(role, 'VIEW_ORGANIZATION'),
      icon: 'dashboard'
    },
    {
      label: 'Organizations',
      href: '/organizations',
      visible: true, // Always visible when logged in
      icon: 'building'
    },
    {
      label: 'Documents',
      href: '/documents',
      visible: hasPermission(role, 'VIEW_DOCUMENTS'),
      icon: 'document'
    },
    {
      label: 'Invitations',
      href: '/invitations',
      visible: true, // Always visible when logged in
      icon: 'mail'
    },
    {
      label: 'Analytics',
      href: '/analytics',
      visible: hasPermission(role, 'VIEW_ANALYTICS'),
      icon: 'chart'
    },
    {
      label: 'Settings',
      href: '/settings',
      visible: hasPermission(role, 'MANAGE_SETTINGS'),
      icon: 'settings',
      children: [
        {
          label: 'Profile',
          href: '/settings/profile',
          visible: true, // Always visible when logged in
        },
        {
          label: 'Organization',
          href: '/settings/organization',
          visible: hasPermission(role, 'EDIT_ORGANIZATION'),
        },
        {
          label: 'Billing',
          href: '/settings/billing',
          visible: hasPermission(role, 'MANAGE_BILLING'),
        },
        {
          label: 'API Keys',
          href: '/settings/api-keys',
          visible: hasPermission(role, 'MANAGE_SETTINGS'),
        }
      ]
    }
  ];
}