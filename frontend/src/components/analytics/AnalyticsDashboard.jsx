import React from 'react';
import { useDashboardStats } from '../../hooks';
import StatCard from './StatCard';
import DocumentProcessingChart from './DocumentProcessingChart';
import CertificateExpirationChart from './CertificateExpirationChart';
import ActivityList from './ActivityList';
import DocumentTypesPieChart from './DocumentTypesPieChart';
import ProcessingTimeLineChart from './ProcessingTimeLineChart';

export default function AnalyticsDashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Documents" 
          value={stats?.totalDocuments.toString() || '0'} 
          change={stats?.documentsChange || 0}
          loading={isLoading}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        
        <StatCard 
          title="Processing Success Rate" 
          value={`${stats?.successRate || 0}%`} 
          change={stats?.successRateChange || 0}
          loading={isLoading}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <StatCard 
          title="Avg. Processing Time" 
          value={`${stats?.avgProcessingTime || 0}s`} 
          change={-1 * (stats?.processingTimeChange || 0)} // Negative change is good for processing time
          loading={isLoading}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <StatCard 
          title="Certificates Expiring Soon" 
          value={stats?.expiringCertificates.toString() || '0'} 
          change={stats?.expiringCertificatesChange || 0}
          loading={isLoading}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>
      
      {/* Charts Section - Top Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DocumentProcessingChart />
        <ProcessingTimeLineChart />
      </div>
      
      {/* Charts Section - Bottom Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CertificateExpirationChart />
        <DocumentTypesPieChart />
      </div>
      
      {/* Activity Section */}
      <div className="grid grid-cols-1">
        <ActivityList />
      </div>
    </div>
  );
}