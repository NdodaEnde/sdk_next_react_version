import React from 'react';
import MainLayout from '../components/MainLayout';

export default function Users() {
  return (
    <MainLayout title="Users - Surgiscan Platform">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">User Management</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This feature is under development in this preview version.
                </p>
                <p className="mt-4 text-sm text-gray-500">
                  In the full version, this page will allow you to:
                </p>
                <ul className="mt-2 text-sm text-gray-500 list-disc list-inside">
                  <li>View all users in your organization</li>
                  <li>Invite new users to join</li>
                  <li>Edit user permissions and roles</li>
                  <li>Reset user passwords</li>
                  <li>Deactivate user accounts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}