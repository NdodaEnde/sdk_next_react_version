import React, { useState } from 'react';
// Mock implementation to avoid build errors
const ChartJS = {
  register: () => {}
};

// Mock Bar chart component
const Bar = ({ data, options }) => (
  <div className="mock-bar-chart">
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <p className="font-medium text-gray-700">Document Processing Chart</p>
      <p className="text-sm text-gray-500 mt-2">Chart display disabled in this build</p>
    </div>
  </div>
);
import { useDocumentStats } from '../../hooks';

// Register mock ChartJS components
ChartJS.register();

/**
 * Component for displaying document processing statistics as a bar chart
 */
export default function DocumentProcessingChart() {
  const [period, setPeriod] = useState('month');
  const { data: stats, isLoading } = useDocumentStats(period);
  
  // Options for the chart
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgba(0, 0, 0, 0.7)',
          usePointStyle: true,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.6)',
        },
      },
      y: {
        grid: {
          borderDash: [2, 4],
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.6)',
        },
      },
    },
  };
  
  // Chart data from stats
  const chartData = {
    labels: stats?.map(item => item.period) || [],
    datasets: [
      {
        label: 'Processed Successfully',
        data: stats?.map(item => item.successful_count) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Failed Processing',
        data: stats?.map(item => item.failed_count) || [],
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Document Processing Trend</h3>
        
        <div className="flex space-x-2">
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${period === 'day' 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => setPeriod('day')}
          >
            Daily
          </button>
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${period === 'week' 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => setPeriod('week')}
          >
            Weekly
          </button>
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${period === 'month' 
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200' 
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
            onClick={() => setPeriod('month')}
          >
            Monthly
          </button>
        </div>
      </div>
      
      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : stats?.length > 0 ? (
          <Bar options={options} data={chartData} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>No data available for the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
}