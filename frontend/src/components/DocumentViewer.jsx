import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function FileUploader({ onUpload, loading }) {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  const onDrop = useCallback((acceptedFiles) => {
    // Filter for PDFs
    const pdfFiles = acceptedFiles.filter(
      file => file.type === 'application/pdf'
    );
    
    if (pdfFiles.length === 0) {
      alert('Please upload PDF files only');
      return;
    }
    
    // Add new files to existing files
    setFiles(prevFiles => [...prevFiles, ...pdfFiles]);
    setUploadStatus(null);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });
  
  const removeFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };
  
  const handleSubmit = async () => {
    if (files.length === 0 || isUploading) return;
    
    setIsUploading(true);
    setUploadStatus('Uploading files...');
    
    try {
      // Create FormData
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      
      // Make direct call to backend API
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/process`;
      
      // Log the request
      console.log('Sending request to:', apiUrl);
      console.log('Uploading files:', files.map(f => f.name).join(', '));
      
      // Make the fetch request with appropriate headers
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Pass the processed data to the parent component
      onUpload(files, data);
      
      setUploadStatus('Files processed successfully!');
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadStatus(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  const clearFiles = () => {
    setFiles([]);
    setUploadStatus(null);
  };
  
  return (
    <div className="mb-8 p-4 border rounded-lg">
      <h2 className="text-xl font-semibold mb-4 text-center">Upload Documents</h2>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed p-8 rounded-lg text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
        style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
      >
        <input {...getInputProps()} />
        
        <div className="mb-4">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400" 
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
        </div>
        
        <p className="text-lg font-medium text-gray-700">
          {isDragActive 
            ? "Drop the PDF files here..." 
            : "Drag and drop PDF files here"}
        </p>
        <p className="mt-2 text-gray-600">
          or <span className="text-blue-500 underline">click to browse</span>
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Multiple PDF files are supported
        </p>
      </div>
      
      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Selected Files ({files.length}):</h3>
            <button 
              onClick={clearFiles}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>
          
          <ul className="mb-4 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600 truncate max-w-xs">
                    {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <button 
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
          
          <button
            onClick={handleSubmit}
            disabled={isUploading}
            className={`w-full py-3 px-4 rounded-md text-white font-medium ${
              isUploading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing {files.length} Document{files.length !== 1 ? 's' : ''}...
              </span>
            ) : (
              `Process ${files.length} Document${files.length !== 1 ? 's' : ''}`
            )}
          </button>
          
          {uploadStatus && (
            <div className={`mt-3 p-2 rounded text-sm ${
              uploadStatus.startsWith('Error') 
                ? 'bg-red-100 text-red-700' 
                : uploadStatus.includes('success') 
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
            }`}>
              {uploadStatus}
            </div>
          )}
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && !files.length && (
        <div className="mt-6 p-4 text-center bg-gray-50 rounded-lg">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-lg text-gray-700">Processing documents...</p>
          <p className="text-sm text-gray-500">This may take a few minutes for large documents</p>
        </div>
      )}
    </div>
  );
}