import React from 'react';
import MainLayout from '../components/MainLayout';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';

export default function Analytics() {
  return (
    <MainLayout title="Analytics - Healthcare Platform">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get insights into your document processing and certificate management.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
          <AnalyticsDashboard />
        </div>
      </div>
    </MainLayout>
  );
}