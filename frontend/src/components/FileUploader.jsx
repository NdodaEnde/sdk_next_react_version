import React, { useState, useEffect, useRef } from 'react';

export default function FileUploader({ onUpload, loading: externalLoading }) {
  const [files, setFiles] = useState([]);
  const [documentType, setDocumentType] = useState('Certificate of Fitness');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);
  
  // Document type options
  const documentTypes = [
    'Certificate of Fitness',
    'Medical Questionnaire',
    'Audiogram',
    'Spirometer',
    'X-Ray Report',
    'Referal Form'
  ];
  
  // Timer effect for tracking elapsed time during processing
  useEffect(() => {
    if (loading) {
      // Reset and start timer
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      // Clear timer when not loading
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [loading]);
  
  // Format elapsed time as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    console.log('File change event triggered!');
    console.log('Files selected:', e.target.files);
    
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      // Reset progress when new files are selected
      setUploadProgress(0);
      setProcessingStatus('');
      setElapsedTime(0);
    }
  };
  
  // Submit handler
  const handleSubmit = async () => {
    if (files.length === 0) return;
    
    setLoading(true);
    setProcessingStatus('Preparing upload...');
    setUploadProgress(5);
    
    // Create FormData
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Add document type
    formData.append('documentType', documentType);
    
    try {
      // Make direct call to backend API
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/process`;
      
      console.log('Sending request to:', apiUrl);
      setProcessingStatus('Uploading files...');
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 70) {
            return prev + 5;
          }
          return prev;
        });
      }, 300);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      setUploadProgress(80);
      setProcessingStatus('Processing documents...');
      
      const data = await response.json();
      
      setUploadProgress(100);
      setProcessingStatus('Complete!');
      
      // Stop the timer but keep the final elapsed time displayed
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Add document type to the processed data
      const enhancedData = {
        ...data,
        documentType: documentType
      };
      
      console.log("Passing data with document type:", enhancedData);
      
      // Pass the processed data to the parent component
      onUpload(files, enhancedData);
      
      // Reset progress and status after a delay
      setTimeout(() => {
        setLoading(false);
        setUploadProgress(0);
        setProcessingStatus('');
        setFiles([]);
        setElapsedTime(0);
      }, 2000);
      
    } catch (error) {
      console.error('Error:', error);
      setProcessingStatus('Error: ' + error.message);
      alert('Error uploading files: ' + error.message);
      setLoading(false);
      
      // Stop the timer on error
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Batch Document Upload</h2>
        <span className="text-gray-500">Surgiscan</span>
      </div>
      
      <div className="border-t pt-6">
        {/* Document type selection */}
        <div className="mb-6">
          <label htmlFor="document-type" className="block text-lg font-medium text-gray-700 mb-2">
            Default Document Type
          </label>
          <select
            id="document-type"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-3 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-lg rounded-md"
            disabled={loading}
          >
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">
            This type will be applied to all new files added to the queue
          </p>
        </div>
        
        {/* File selection area */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Select Documents
          </label>
          
          {/* Hidden file input */}
          <input 
            ref={fileInputRef}
            id="document-file-input"
            type="file" 
            accept=".pdf,.png,.jpg,.jpeg,.dcm,.dicom,application/pdf,application/dicom"
            multiple 
            onChange={handleFileChange}
            className="hidden" 
            disabled={loading}
          />
          
          {/* File input with label */}
          <label 
            htmlFor="document-file-input" 
            className="block w-full cursor-pointer border border-gray-300 rounded-md py-3 px-4 text-base text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {files.length > 0 
              ? `${files.length} file${files.length !== 1 ? 's' : ''} selected` 
              : "Choose Files  no files selected"}
          </label>
          
          <p className="mt-2 text-sm text-gray-500">
            Supported formats: PDF, PNG, JPG, JPEG, DICOM (.dcm)
          </p>
          
          <p className="mt-4 text-sm text-gray-500">
            These documents will be uploaded to your organization
          </p>
        </div>
        
        {/* Progress bar and status */}
        {loading && (
          <div className="w-full mb-6 space-y-2">
            {/* Processing time display */}
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">{processingStatus}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Processing Time: {formatTime(elapsedTime)}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            
            {/* Percentage */}
            <div className="text-right">
              <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
            </div>
          </div>
        )}
        
        {/* Upload button */}
        <button 
          onClick={handleSubmit}
          disabled={files.length === 0 || loading || externalLoading}
          className={`mt-4 w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white 
            ${files.length === 0 || loading || externalLoading
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gray-600 hover:bg-gray-700'}`}
        >
          {loading || externalLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Start Batch Upload
            </>
          )}
        </button>
        
        {/* Success message */}
        {uploadProgress === 100 && (
          <div className="mt-4 text-center">
            <div className="text-green-600 font-medium mb-1">
              Upload complete! Processing successful.
            </div>
            <div className="text-gray-500 text-sm">
              Total processing time: {formatTime(elapsedTime)}
            </div>
          </div>
        )}
        
        {/* Display selected files */}
        {files.length > 0 && !loading && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Selected Files:</h3>
            <ul className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden divide-y divide-gray-200">
              {files.map((file, index) => (
                <li key={index} className="px-4 py-3 flex justify-between items-center hover:bg-gray-100">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700 font-medium">{file.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}