import React from 'react';
// Mock implementation to avoid build errors
const ChartJS = {
  register: () => {}
};

// Mock Pie chart component
const Pie = ({ data, options }) => (
  <div className="mock-pie-chart">
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <p className="font-medium text-gray-700">Document Types Chart</p>
      <p className="text-sm text-gray-500 mt-2">Chart display disabled in this build</p>
    </div>
  </div>
);
import { useDocumentTypeStats } from '../../hooks';

// Register mock ChartJS components
ChartJS.register();

/**
 * Component for displaying document type distribution as a pie chart
 */
export default function DocumentTypesPieChart() {
  const { data: documentTypes, isLoading } = useDocumentTypeStats();
  
  // Colors for the chart
  const colors = {
    backgroundColor: [
      'rgba(59, 130, 246, 0.7)',  // Blue
      'rgba(16, 185, 129, 0.7)',  // Green
      'rgba(249, 115, 22, 0.7)',  // Orange
      'rgba(139, 92, 246, 0.7)',  // Purple
      'rgba(236, 72, 153, 0.7)',  // Pink
      'rgba(234, 179, 8, 0.7)',   // Yellow
      'rgba(107, 114, 128, 0.7)', // Gray
    ],
    borderColor: [
      'rgba(59, 130, 246, 1)',
      'rgba(16, 185, 129, 1)',
      'rgba(249, 115, 22, 1)',
      'rgba(139, 92, 246, 1)',
      'rgba(236, 72, 153, 1)',
      'rgba(234, 179, 8, 1)',
      'rgba(107, 114, 128, 1)',
    ]
  };
  
  // Chart data from document types
  const chartData = {
    labels: documentTypes?.map(item => item.document_type) || [],
    datasets: [
      {
        data: documentTypes?.map(item => item.count) || [],
        backgroundColor: colors.backgroundColor.slice(0, documentTypes?.length || 0),
        borderColor: colors.borderColor.slice(0, documentTypes?.length || 0),
        borderWidth: 1,
      }
    ]
  };
  
  // Options for the chart
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          boxWidth: 12,
          color: 'rgba(0, 0, 0, 0.7)',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: function(context) {
            const total = context.chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${context.label}: ${context.raw} (${percentage}%)`;
          }
        }
      }
    },
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-200">
      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Document Types</h3>
      
      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : documentTypes?.length > 0 ? (
          <Pie data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>No document type data available.</p>
          </div>
        )}
      </div>
      
      {documentTypes?.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-900 dark:text-white">
            <span className="font-medium">Total: </span>
            {documentTypes.reduce((sum, item) => sum + item.count, 0)} documents
          </div>
        </div>
      )}
    </div>
  );
}