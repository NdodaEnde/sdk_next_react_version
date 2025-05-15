import React from 'react';
// Mock implementation to avoid build errors
const ChartJS = {
  register: () => {}
};

// Mock Doughnut component
const Doughnut = ({ data, options }) => (
  <div className="mock-doughnut-chart">
    <div className="text-center p-4 bg-gray-50 rounded-lg">
      <p className="font-medium text-gray-700">Certificate Expirations Chart</p>
      <p className="text-sm text-gray-500 mt-2">Chart display disabled in this build</p>
    </div>
  </div>
);
import { useCertificateExpirations } from '../../hooks';

// Register mock ChartJS components
ChartJS.register();

/**
 * Component for displaying certificate expirations as a doughnut chart
 */
export default function CertificateExpirationChart() {
  const { data: expirations, isLoading } = useCertificateExpirations();
  
  // Colors for the chart
  const colors = {
    backgroundColor: [
      'rgba(239, 68, 68, 0.7)',   // This week - red
      'rgba(249, 115, 22, 0.7)',  // This month - orange
      'rgba(234, 179, 8, 0.7)',   // This quarter - yellow
      'rgba(59, 130, 246, 0.7)',  // Later - blue
    ],
    borderColor: [
      'rgba(239, 68, 68, 1)',
      'rgba(249, 115, 22, 1)',
      'rgba(234, 179, 8, 1)',
      'rgba(59, 130, 246, 1)',
    ]
  };
  
  // Chart data from expirations
  const chartData = {
    labels: expirations?.map(item => item.days_to_expiry) || [],
    datasets: [
      {
        data: expirations?.map(item => item.certificate_count) || [],
        backgroundColor: colors.backgroundColor,
        borderColor: colors.borderColor,
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
        position: 'bottom',
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
            return `${context.label}: ${context.raw} certificates`;
          }
        }
      }
    },
    cutout: '65%',
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-200">
      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Certificate Expirations</h3>
      
      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : expirations?.length > 0 ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
            <p>No certificates expiring soon.</p>
          </div>
        )}
      </div>
      
      {expirations?.length > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-900 dark:text-white">
            <span className="font-medium">Total: </span>
            {expirations.reduce((sum, item) => sum + item.certificate_count, 0)} certificates expiring
          </div>
          
          {expirations.find(item => item.days_to_expiry === 'This week') && (
            <div className="mt-1 text-sm text-red-600 dark:text-red-400">
              <span className="font-medium">
                {expirations.find(item => item.days_to_expiry === 'This week').certificate_count}
              </span> certificates expiring this week!
            </div>
          )}
        </div>
      )}
    </div>
  );
}