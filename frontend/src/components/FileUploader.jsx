import React, { useState, useEffect, useRef } from 'react';

export default function FileUploader({ onUpload, loading: externalLoading }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);
  
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
      
      // Pass the processed data to the parent component
      onUpload(files, data);
      
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
    <div className="bg-white rounded-lg p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">Upload Documents</h2>
      
      <div className="flex flex-col items-center">
        {/* File selection area with label approach (works in all browsers) */}
        <label 
          htmlFor="pdf-file-input" 
          className={`w-full mb-6 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:bg-gray-100 transition-colors ${loading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          
          <div className="mt-4 text-center">
            <span className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Select PDF Files
            </span>
            <p className="text-xs text-gray-500 mt-2">PDF files only</p>
          </div>
        </label>
        
        {/* Hidden file input */}
        <input 
          id="pdf-file-input"
          type="file" 
          accept="application/pdf" 
          multiple 
          onChange={handleFileChange}
          className="hidden" // Completely hidden - label takes care of it
          disabled={loading}
        />
        
        {/* Display selected files */}
        {files.length > 0 && !loading && (
          <div className="mb-6 w-full">
            <h3 className="text-md font-medium mb-2">Selected Files ({files.length}):</h3>
            <ul className="bg-gray-50 rounded-md border border-gray-200 overflow-hidden divide-y divide-gray-200">
              {files.map((file, index) => (
                <li key={index} className="px-4 py-3 flex justify-between items-center hover:bg-gray-100">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-blue-600 font-medium">{file.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Progress bar and status */}
        {loading && (
          <div className="w-full mb-6 space-y-2">
            {/* Elapsed time display */}
            <div className="text-center mb-1">
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
            
            {/* Status and percentage */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">{processingStatus}</span>
              <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
            </div>
          </div>
        )}
        
        {/* Process button */}
        {files.length > 0 && !loading && (
          <button 
            onClick={handleSubmit}
            disabled={loading || externalLoading}
            className={`w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white ${
              (loading || externalLoading) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {externalLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Documents...
              </>
            ) : (
              <>Process Documents</>
            )}
          </button>
        )}
        
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
      </div>
    </div>
  );
}