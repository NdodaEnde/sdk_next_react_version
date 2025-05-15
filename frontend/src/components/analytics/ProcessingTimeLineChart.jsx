import React from 'react';
// Mock implementation to avoid build errors
const ChartJS = {
  register: () => {}
};

// Mock Line chart component
const Line = ({ data, options }) => (
  <div className="mock-line-chart">
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <p className="font-medium text-gray-700">Processing Time Chart</p>
      <p className="text-sm text-gray-500 mt-2">Chart display disabled in this build</p>
    </div>
  </div>
);
import { useProcessingTimeStats } from '../../hooks';

// Register mock ChartJS components
ChartJS.register();

/**
 * Component for displaying document processing time statistics as a line chart
 */
export default function ProcessingTimeLineChart() {
  const { data: stats, isLoading } = useProcessingTimeStats();
  
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
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw} seconds`;
          }
        }
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
          callback: function(value) {
            return `${value}s`;
          }
        },
      },
    },
  };
  
  // Chart data from stats
  const chartData = {
    labels: stats?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Avg. Processing Time',
        data: stats?.map(item => item.avg_processing_time_seconds) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-200">
      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Document Processing Time</h3>
      
      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : stats?.length > 0 ? (
          <Line options={options} data={chartData} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>No processing time data available.</p>
          </div>
        )}
      </div>
      
      {stats?.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
          <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-30 rounded-md p-2">
            <p className="text-gray-500 dark:text-gray-400">Avg. Processing Time</p>
            <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
              {(stats.reduce((sum, item) => sum + item.avg_processing_time_seconds, 0) / stats.length).toFixed(1)}s
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-30 rounded-md p-2">
            <p className="text-gray-500 dark:text-gray-400">Fastest</p>
            <p className="text-lg font-medium text-green-600 dark:text-green-400">
              {Math.min(...stats.map(item => item.avg_processing_time_seconds)).toFixed(1)}s
            </p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-30 rounded-md p-2">
            <p className="text-gray-500 dark:text-gray-400">Slowest</p>
            <p className="text-lg font-medium text-yellow-600 dark:text-yellow-400">
              {Math.max(...stats.map(item => item.avg_processing_time_seconds)).toFixed(1)}s
            </p>
          </div>
        </div>
      )}
    </div>
  );
}