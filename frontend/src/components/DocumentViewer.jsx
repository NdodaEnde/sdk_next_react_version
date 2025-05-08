import { useState, useEffect } from 'react';
import HighlightedEvidence from './HighlightedEvidence';

export default function DocumentViewer({ files, highlightedEvidence, baseUrl = 'http://localhost:8000' }) {
  const [currentFile, setCurrentFile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfUrls, setPdfUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Initialize the component with the first file when files change
  useEffect(() => {
    if (files && files.length > 0) {
      setCurrentFile(files[0]);
      
      // Create object URLs for the PDFs
      const urls = files.map(file => URL.createObjectURL(file));
      setPdfUrls(urls);
      
      return () => {
        // Clean up the object URLs when the component unmounts
        urls.forEach(url => URL.revokeObjectURL(url));
      };
    }
  }, [files]);
  
  if (!files || files.length === 0) {
    return (
      <div className="flex justify-center items-center h-full border rounded-lg bg-gray-50">
        <p className="text-gray-500">No documents available for viewing</p>
      </div>
    );
  }
  
  // Get the current file's URL
  const currentFileUrl = currentFile ? 
    pdfUrls[files.indexOf(currentFile)] : 
    null;
  
  // Extract the key for looking up evidence - filename:page
  const getCurrentEvidenceKey = () => {
    if (!currentFile) return null;
    return `${currentFile.name}:${currentPage}`;
  };
  
  // Get evidence for the current page
  const getCurrentEvidence = () => {
    const key = getCurrentEvidenceKey();
    if (!highlightedEvidence || !key) return [];
    return highlightedEvidence[key] || [];
  };
  
  const handleFileChange = (file) => {
    setCurrentFile(file);
    setCurrentPage(1); // Reset to first page when changing files
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* File selector tabs */}
      {files.length > 1 && (
        <div className="flex overflow-x-auto border-b mb-4">
          {files.map((file, index) => (
            <button
              key={index}
              onClick={() => handleFileChange(file)}
              className={`px-4 py-2 whitespace-nowrap ${
                currentFile === file 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {file.name}
            </button>
          ))}
        </div>
      )}
      
      {/* Document display area */}
      <div className="flex-1 relative overflow-hidden border rounded-lg">
        {currentFileUrl ? (
          <>
            {/* PDF embed */}
            <div className="w-full h-full">
              <object
                data={currentFileUrl}
                type="application/pdf"
                className="w-full h-full"
              >
                <p>Your browser does not support embedded PDFs. 
                  <a href={currentFileUrl} target="_blank" rel="noopener noreferrer">Download the PDF</a> instead.
                </p>
              </object>
            </div>
            
            {/* Overlay for evidence highlighting */}
            {getCurrentEvidence().length > 0 && (
              <HighlightedEvidence 
                evidence={getCurrentEvidence()} 
                containerWidth={800} // Adjust based on your layout
                containerHeight={1000} // Adjust based on your layout
              />
            )}
          </>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Select a document to view</p>
          </div>
        )}
      </div>
      
      {/* Navigation controls */}
      <div className="flex items-center justify-between mt-4 border-t pt-4">
        <div className="flex items-center">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1 border rounded mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous Page
          </button>
          <span className="text-sm">
            Page <span className="font-medium">{currentPage}</span>
          </span>
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-3 py-1 border rounded ml-2"
          >
            Next Page
          </button>
        </div>
        
        <div>
          <button
            onClick={() => {
              // Implement full screen
              const elem = document.documentElement;
              if (elem.requestFullscreen) {
                elem.requestFullscreen();
              }
            }}
            className="px-3 py-1 border rounded"
          >
            Full Screen
          </button>
        </div>
      </div>
    </div>
  );
}