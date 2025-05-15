import React from 'react';

/**
 * A card component for displaying a key statistic with an icon and optional trend
 */
export default function StatCard({ title, value, change, icon, loading = false, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200 ${className}`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 dark:bg-blue-600 text-white">
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
              <dd>
                {loading ? (
                  <div className="animate-pulse h-6 w-16 bg-gray-200 dark:bg-gray-600 rounded"></div>
                ) : (
                  <div className="text-lg font-medium text-gray-900 dark:text-white">{value}</div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {change !== undefined && (
        <div className="bg-gray-50 dark:bg-gray-700 px-5 py-3 transition-colors duration-200">
          {loading ? (
            <div className="animate-pulse h-4 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
          ) : (
            <div className="text-sm">
              <span className={`font-medium ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change}%
              </span>{' '}
              <span className="text-gray-500 dark:text-gray-400">from previous period</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}