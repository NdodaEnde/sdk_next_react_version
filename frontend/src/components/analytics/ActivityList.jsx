import React from 'react';
import { useUserActivity } from '../../hooks';

/**
 * Component for displaying recent user activity
 */
export default function ActivityList() {
  const { data: activities, isLoading } = useUserActivity(10);
  
  // Format the activity timestamp to a relative time string
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hours ago`;
    } else if (diffMins > 0) {
      return `${diffMins} min ago`;
    } else {
      return 'Just now';
    }
  };
  
  // Get an icon for the activity type
  const getActivityIcon = (action) => {
    if (action.includes('created') || action.includes('added')) {
      return (
        <div className="bg-green-100 dark:bg-green-800 p-2 rounded-full">
          <svg className="h-5 w-5 text-green-600 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else if (action.includes('updated') || action.includes('edited')) {
      return (
        <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </div>
      );
    } else if (action.includes('deleted') || action.includes('removed')) {
      return (
        <div className="bg-red-100 dark:bg-red-800 p-2 rounded-full">
          <svg className="h-5 w-5 text-red-600 dark:text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else if (action.includes('uploaded') || action.includes('import')) {
      return (
        <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-full">
          <svg className="h-5 w-5 text-purple-600 dark:text-purple-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
          <svg className="h-5 w-5 text-gray-600 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
  };
  
  // Loading skeleton
  const ActivitySkeleton = () => (
    <div className="animate-pulse">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-center px-4 py-3">
          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="ml-3 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Recent Activity</h3>
      </div>
      
      {isLoading ? (
        <ActivitySkeleton />
      ) : activities?.length > 0 ? (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {activities.map((activity) => (
            <li key={activity.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.action)}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{activity.metadata?.user_name || 'A user'}</span> {activity.action}
                    {activity.metadata?.entity_name && 
                      <span> for <span className="text-indigo-600 dark:text-indigo-400">{activity.metadata.entity_name}</span></span>
                    }
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(activity.created_at)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
          <p>No recent activity.</p>
        </div>
      )}
      
      {activities?.length > 0 && (
        <div className="px-4 py-4 sm:px-6 border-t border-gray-200 dark:border-gray-700">
          <button className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
}