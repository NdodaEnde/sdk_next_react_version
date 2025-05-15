import React from 'react';
import Head from 'next/head';
import { useTheme } from '../context/ThemeContext';

/**
 * A simplified layout component without sidebar navigation or authorization checks
 * Use this for standalone pages and demos
 */
export default function SimpleLayout({ children, title = "Surgiscan Platform" }) {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Surgiscan Platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Header bar */}
      <header className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Surgiscan Demo
          </div>
        </div>
      </header>
      
      {/* Page content */}
      <main className="flex-1 transition-colors duration-200">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}