import React from 'react';
import MainLayout from '../components/MainLayout';
import InvitationList from '../components/organizations/InvitationList';

export default function Invitations() {
  return (
    <MainLayout title="Invitations - Surgiscan Platform">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Organization Invitations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage invitations to join organizations.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <InvitationList />
        </div>
      </div>
    </MainLayout>
  );
}