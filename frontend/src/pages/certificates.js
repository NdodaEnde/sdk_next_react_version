import React, { useState } from 'react';
import MainLayout from '../components/MainLayout';
import Link from 'next/link';
import CertificateTemplate from '../components/templates/CertificateTemplate';

export default function Certificates() {
  const [activeTab, setActiveTab] = useState('issued'); // 'issued', 'templates', 'settings'
  const [showPreview, setShowPreview] = useState(false);
  
  // Demo certificate template data
  const demoTemplateData = {
    name: "John Smith",
    id_number: "8801015555088",
    company: "ABC Corporation",
    exam_date: "2025-04-10",
    expiry_date: "2026-04-10",
    job: "Senior Engineer",
    examinationType: "periodical", 
    medicalExams: {
      blood: true,
      vision: true,
      hearing: true,
      lung: true,
      xray: true,
      drugScreen: true
    },
    medicalResults: {
      blood: "Normal",
      vision: "20/20",
      hearing: "0.2",
      lung: "Normal",
      xray: "Clear",
      drugScreen: "Negative"
    },
    restrictions: {
      heights: false,
      dust: false,
      motorized: false,
      hearingProtection: true,
      confinedSpaces: false,
      chemical: false,
      spectacles: true,
      treatment: false
    },
    fitnessDeclaration: "fit",
    comments: "Sample certificate preview"
  };
  
  return (
    <MainLayout title="Certificates - Surgiscan Platform">
      {/* Header section */}
      <div className="pb-5 border-b border-gray-200 dark:border-gray-700 sm:flex sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">Certificates</h2>
        <div className="mt-3 sm:mt-0 sm:ml-4 flex space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? "Hide Preview" : "View Template Preview"}
          </button>
        </div>
      </div>

      {/* Certificate template preview */}
      {showPreview && (
        <div className="mt-6 mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Certificate Template Preview</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">This is a preview of how your certificates will look when generated.</p>
          </div>
          <CertificateTemplate data={demoTemplateData} />
        </div>
      )}

      {/* Tabs */}
      <div className="mt-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('issued')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'issued'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Issued Certificates
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Certificate Templates
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'issued' && (
        <div className="py-6">
          <div className="text-center bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Certificate Management</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              This feature is under development in this preview version.
            </p>
            <div className="mt-6">
              <Link href="/documents" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Go to Documents
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="py-6">
          <div className="text-center bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Template Management</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Template customization is coming soon. Currently, you can test certificate templates from the Documents page.
            </p>
            <div className="mt-6">
              <Link href="/documents" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Go to Documents
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="py-6">
          <div className="text-center bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Certificate Settings</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Advanced certificate settings will be available in the full version.
            </p>
            <div className="mt-6">
              <Link href="/documents" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                Go to Documents
              </Link>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}