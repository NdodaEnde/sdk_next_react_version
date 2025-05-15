import React, { useState } from 'react';
import MainLayout from '../../components/MainLayout';
import Link from 'next/link';
import { useTheme } from '../../context/ThemeContext';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, toggleTheme } = useTheme();

  return (
    <MainLayout title="Settings - Surgiscan Platform">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('appearance')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'appearance'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Appearance
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'notifications'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'security'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Security
                </button>
              </nav>
            </div>
            
            {/* Tab content */}
            {activeTab === 'profile' && (
              <div className="mt-6">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Profile Settings</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Profile settings are available in the full version. In the meantime, you can view
                    the Documents and Certificate pages to try out the certificate functionality.
                  </p>
                  <div className="mt-4">
                    <Link href="/documents" 
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Go to Documents
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'appearance' && (
              <div className="mt-6">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Appearance Settings</h2>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Theme
                    </label>
                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => theme === 'dark' && toggleTheme()}
                        className={`flex flex-col items-center p-3 border rounded-md ${
                          theme === 'light' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <svg className="h-6 w-6 text-gray-900 dark:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="mt-2 text-sm text-gray-900 dark:text-gray-100">Light</span>
                      </button>
                      
                      <button 
                        onClick={() => theme === 'light' && toggleTheme()}
                        className={`flex flex-col items-center p-3 border rounded-md ${
                          theme === 'dark' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        <svg className="h-6 w-6 text-gray-900 dark:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        <span className="mt-2 text-sm text-gray-900 dark:text-gray-100">Dark</span>
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Additional appearance settings will be available in the full version.
                  </p>
                </div>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div className="mt-6">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Notification Settings</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Notification settings are available in the full version. In the meantime, you can view
                    the Documents and Certificate pages to try out the certificate functionality.
                  </p>
                  <div className="mt-4">
                    <Link href="/documents" 
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Go to Documents
                    </Link>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div className="mt-6">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Security Settings</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Security settings are available in the full version. In the meantime, you can view
                    the Documents and Certificate pages to try out the certificate functionality.
                  </p>
                  <div className="mt-4">
                    <Link href="/documents" 
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      Go to Documents
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}