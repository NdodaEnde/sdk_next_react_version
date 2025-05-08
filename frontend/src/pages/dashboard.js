import React from 'react';
import Link from 'next/link';
import MainLayout from '../components/MainLayout';

// Dashboard components
const StatCard = ({ title, value, change, icon }) => {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span className={`font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </span>{' '}
          <span className="text-gray-500">from previous month</span>
        </div>
      </div>
    </div>
  );
};

const RecentActivityCard = () => {
  const activities = [
    { id: 1, user: 'Dr. Smith', action: 'created a new certificate', time: '5 min ago', patient: 'John Doe' },
    { id: 2, user: 'Dr. Johnson', action: 'updated patient record', time: '2 hours ago', patient: 'Jane Smith' },
    { id: 3, user: 'Nurse Williams', action: 'uploaded a document', time: '4 hours ago', patient: 'Robert Brown' },
    { id: 4, user: 'Dr. Taylor', action: 'created a new certificate', time: 'Yesterday', patient: 'Alice Johnson' },
    { id: 5, user: 'Admin Wilson', action: 'added a new user', time: 'Yesterday', patient: null },
  ];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <li key={activity.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">
                <span className="font-semibold text-blue-600">{activity.user}</span> {activity.action}
                {activity.patient && <span> for <span className="text-indigo-600">{activity.patient}</span></span>}
              </p>
              <div className="ml-2 flex-shrink-0 flex">
                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                  {activity.time}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
        <button className="text-sm font-medium text-blue-600 hover:text-blue-500">View all activity</button>
      </div>
    </div>
  );
};

const UpcomingExpirations = () => {
  const expirations = [
    { id: 1, patient: 'John Doe', certificateType: 'Fitness for Work', expiryDate: '2025-06-15', daysLeft: 7 },
    { id: 2, patient: 'Jane Smith', certificateType: 'Medical Clearance', expiryDate: '2025-06-20', daysLeft: 12 },
    { id: 3, patient: 'Robert Brown', certificateType: 'Fit to Drive', expiryDate: '2025-06-22', daysLeft: 14 },
  ];

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Upcoming Certificate Expirations</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {expirations.map((cert) => (
          <li key={cert.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{cert.patient}</p>
                <p className="text-sm text-gray-500">{cert.certificateType}</p>
              </div>
              <div className="ml-2 flex-shrink-0 flex">
                <p 
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${cert.daysLeft <= 7 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}
                >
                  Expires in {cert.daysLeft} days
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="px-4 py-4 sm:px-6 border-t border-gray-200">
        <button className="text-sm font-medium text-blue-600 hover:text-blue-500">View all expirations</button>
      </div>
    </div>
  );
};

export default function Dashboard() {
  return (
    <MainLayout title="Dashboard - Surgiscan Platform">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Patients" 
          value="1,284" 
          change={12}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <StatCard 
          title="Certificates Issued" 
          value="846" 
          change={7.5}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard 
          title="Documents Processed" 
          value="2,541" 
          change={-3.2}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard 
          title="Active Organizations" 
          value="12" 
          change={25}
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* Charts Section */}
      <div className="mt-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Certificate Issuance Trend</h3>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            <p className="text-gray-500">Chart will be implemented here</p>
          </div>
        </div>
      </div>

      {/* Activity and Upcoming Expirations */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RecentActivityCard />
        <UpcomingExpirations />
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-100 text-blue-600 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Add Patient</h3>
              <p className="mt-1 text-sm text-gray-500">Register a new patient in the system</p>
              <button className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Add Patient
              </button>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-green-600 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">New Certificate</h3>
              <p className="mt-1 text-sm text-gray-500">Create a new medical certificate</p>
              <button className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Create Certificate
              </button>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-100 text-purple-600 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Upload Documents</h3>
              <p className="mt-1 text-sm text-gray-500">Upload and process documents</p>
              <Link href="/documents?tab=uploads" passHref>
                <button className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  Upload Documents
                </button>
              </Link>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5 flex flex-col items-center text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-100 text-orange-600 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
              <p className="mt-1 text-sm text-gray-500">View detailed analytics & reports</p>
              <button className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}