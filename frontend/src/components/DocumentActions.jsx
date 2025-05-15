import React, { useState } from 'react';
import { useProcessDocument } from '../hooks/useDocumentProcessing';
import DocumentProcessingStatus from './DocumentProcessingStatus';
import { RefreshCw } from 'lucide-react';

export default function DocumentActions({ document, onProcessingComplete }) {
  const [jobId, setJobId] = useState(null);
  const { mutate: processDocument, isLoading } = useProcessDocument();

  const handleProcessDocument = () => {
    processDocument(document.id, {
      onSuccess: (data) => {
        if (data && data.jobId) {
          setJobId(data.jobId);
        }
      },
      onError: (error) => {
        console.error('Failed to trigger document processing:', error);
        alert('Failed to start document processing. Please try again.');
      },
    });
  };

  const handleProcessingComplete = () => {
    setJobId(null);
    if (onProcessingComplete) {
      onProcessingComplete();
    }
  };

  const canProcess = ['uploaded', 'processing_failed'].includes(document.status);

  return (
    <div className="mt-4 border rounded-md p-4 bg-gray-50">
      <h3 className="text-lg font-medium mb-2">Document Processing</h3>
      
      <div className="flex items-center space-x-2">
        <span className="font-medium">Status:</span>
        <span className={`
          ${document.status === 'processed' ? 'text-green-600' : ''}
          ${document.status === 'processing' ? 'text-blue-600' : ''}
          ${document.status === 'processing_failed' ? 'text-red-600' : ''}
          ${document.status === 'uploaded' ? 'text-gray-600' : ''}
        `}>
          {document.status.replace('_', ' ')}
        </span>
      </div>
      
      {document.processingError && (
        <div className="mt-2 text-sm text-red-500 p-2 bg-red-50 rounded border border-red-200">
          {document.processingError}
        </div>
      )}
      
      {jobId ? (
        <DocumentProcessingStatus 
          jobId={jobId} 
          onCompleted={handleProcessingComplete} 
        />
      ) : (
        canProcess && (
          <button
            onClick={handleProcessDocument}
            disabled={isLoading}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center space-x-2"
          >
            {isLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
            <span>{document.status === 'processing_failed' ? 'Retry Processing' : 'Process Document'}</span>
          </button>
        )
      )}
      
      {document.status === 'processed' && document.extractedData && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Extracted Data</h4>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(document.extractedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}