import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useOrganization } from '../utils/organizationContext';
import { getNavigationItems } from '../utils/permissions';
import OrganizationSwitcher from './OrganizationSwitcher';

/**
 * Navigation Component
 * 
 * A role-based navigation menu that adapts to the user's permissions.
 */
export default function Navigation() {
  const { user, isAuthenticated, signOut } = useAuth();
  const { currentOrganization } = useOrganization();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  
  // Get the current role from organization context or user
  const currentRole = currentOrganization?.role || user?.role || 'guest';
  
  // Generate navigation items based on role
  const navItems = getNavigationItems(currentRole);
  
  // Filter visible items
  const visibleItems = navItems.filter(item => item.visible);
  
  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <img
                  className="h-8 w-auto"
                  src="/images/logo.svg"
                  alt="MedicData Analytics"
                />
              </Link>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {visibleItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    router.pathname === item.href
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* User Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {isAuthenticated ? (
                <div className="relative ml-3">
                  <div className="flex items-center space-x-4">
                    <OrganizationSwitcher />
                    
                    <div className="text-sm">
                      <div className="text-white">{user?.email}</div>
                      <div className="text-gray-400 text-xs">
                        {currentOrganization?.name && (
                          <>
                            {currentOrganization.name} / {currentRole}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={signOut}
                      className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-x-4">
                  <Link
                    href="/login"
                    className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {expanded ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {expanded && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {visibleItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  router.pathname === item.href
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Mobile user menu */}
          {isAuthenticated ? (
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="px-4">
                <div className="text-sm font-medium text-white">{user?.email}</div>
                <div className="text-sm text-gray-400">
                  {currentOrganization?.name && (
                    <>
                      {currentOrganization.name} / {currentRole}
                    </>
                  )}
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <button
                  onClick={signOut}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="px-2 space-y-1">
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}