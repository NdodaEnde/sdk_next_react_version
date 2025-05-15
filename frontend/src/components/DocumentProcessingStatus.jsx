import React, { useEffect } from 'react';
import { useJobStatus } from '../hooks/useDocumentProcessing';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

const statusIcons = {
  waiting: <Clock className="h-5 w-5 text-yellow-500" />,
  active: <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />,
  completed: <CheckCircle className="h-5 w-5 text-green-500" />,
  failed: <XCircle className="h-5 w-5 text-red-500" />,
  delayed: <Clock className="h-5 w-5 text-yellow-500" />,
};

const statusLabels = {
  waiting: 'Waiting to process',
  active: 'Processing document',
  completed: 'Processing complete',
  failed: 'Processing failed',
  delayed: 'Processing delayed',
};

export default function DocumentProcessingStatus({ jobId, onCompleted }) {
  const { data: jobStatus, isLoading, error, refetch } = useJobStatus(jobId);

  // Call the onCompleted callback when processing is done
  useEffect(() => {
    if (jobStatus && jobStatus.status === 'completed' && onCompleted) {
      onCompleted(jobStatus);
    }
  }, [jobStatus, onCompleted]);

  if (!jobId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Loading job status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-500">
        <XCircle className="h-4 w-4" />
        <span>Error loading job status</span>
        <button 
          className="text-sm text-blue-500 hover:underline" 
          onClick={() => refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const status = jobStatus?.status || 'waiting';
  const progress = jobStatus?.progress || 0;
  const icon = statusIcons[status] || statusIcons.waiting;
  const label = statusLabels[status] || 'Unknown status';
  
  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      
      {status === 'active' && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-500 h-2.5 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      
      {status === 'failed' && jobStatus?.failedReason && (
        <div className="text-sm text-red-500 mt-1 p-2 bg-red-50 rounded border border-red-200">
          {jobStatus.failedReason}
        </div>
      )}
    </div>
  );
}