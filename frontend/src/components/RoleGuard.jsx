import React from 'react';
import { hasPermission, hasRolePermission } from '../utils/permissions';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../utils/organizationContext';

/**
 * RoleGuard Component
 * 
 * A component that conditionally renders its children based on user role and permissions.
 * 
 * @param {Object} props
 * @param {string} props.requiredRole - The minimum role required to view the content
 * @param {string} props.requiredPermission - The specific permission required
 * @param {boolean} props.matchAll - If true, user must meet both role and permission requirements
 * @param {React.ReactNode} props.children - Content to render if authorized
 * @param {React.ReactNode} props.fallback - Content to render if not authorized
 */
export default function RoleGuard({
  requiredRole,
  requiredPermission,
  matchAll = false,
  children,
  fallback = null
}) {
  const { user, isAuthenticated } = useAuth();
  const { currentOrganization } = useOrganization();
  
  // Default role is guest (unauthenticated)
  let userRole = 'guest';
  
  // If user is authenticated, get their role
  if (isAuthenticated && user) {
    // Get role from organization context if available
    if (currentOrganization) {
      userRole = currentOrganization.role;
    } else if (user.role) {
      // Fallback to user's global role if no organization context
      userRole = user.role;
    }
  }
  
  // Check if user meets the role requirement
  const hasRole = requiredRole ? hasRolePermission(userRole, requiredRole) : true;
  
  // Check if user meets the permission requirement
  const hasPermissionAccess = requiredPermission ? hasPermission(userRole, requiredPermission) : true;
  
  // Determine if the user has access based on matchAll flag
  const hasAccess = matchAll 
    ? (hasRole && hasPermissionAccess) 
    : (hasRole || hasPermissionAccess);
  
  // Render children if user has access, otherwise render fallback
  return hasAccess ? children : fallback;
}

/**
 * PermissionGuard Component
 * 
 * A specialized RoleGuard that only checks for specific permissions.
 */
export function PermissionGuard({ permission, children, fallback = null }) {
  return (
    <RoleGuard
      requiredPermission={permission}
      children={children}
      fallback={fallback}
    />
  );
}

/**
 * AdminGuard Component
 * 
 * A specialized RoleGuard that only allows admin and owner roles.
 */
export function AdminGuard({ children, fallback = null }) {
  return (
    <RoleGuard
      requiredRole="admin"
      children={children}
      fallback={fallback}
    />
  );
}

/**
 * OwnerGuard Component
 * 
 * A specialized RoleGuard that only allows owner roles.
 */
export function OwnerGuard({ children, fallback = null }) {
  return (
    <RoleGuard
      requiredRole="owner"
      children={children}
      fallback={fallback}
    />
  );
}

/**
 * MemberGuard Component
 * 
 * A specialized RoleGuard that ensures the user is at least a member.
 */
export function MemberGuard({ children, fallback = null }) {
  return (
    <RoleGuard
      requiredRole="member"
      children={children}
      fallback={fallback}
    />
  );
}

/**
 * AuthGuard Component
 * 
 * A guard that only checks if the user is authenticated.
 */
export function AuthGuard({ children, fallback = null }) {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? children : fallback;
}