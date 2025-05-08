import { useState, useEffect } from 'react';

export default function CorsTest() {
  const [apiStatus, setApiStatus] = useState('Loading...');
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Use port 8000 instead of 5000
  const apiBaseUrl = 'http://localhost:8000';

  useEffect(() => {
    // Test basic API connection
    fetch(`${apiBaseUrl}/api/test`)
      .then(response => response.json())
      .then(data => {
        setApiStatus(JSON.stringify(data, null, 2));
      })
      .catch(error => {
        setApiStatus(`Error: ${error.message}`);
      });
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    setUploadStatus('Uploading...');

    const formData = new FormData();
    formData.append('files', selectedFile);

    try {
      // Log all request details for debugging
      console.log(`Making request to: ${apiBaseUrl}/api/process`);
      
      const response = await fetch(`${apiBaseUrl}/api/process`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setUploadStatus(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CORS Test Page</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">API Test Status:</h2>
        <p className="mb-2 text-gray-600">Testing connection to: {apiBaseUrl}/api/test</p>
        <pre className="bg-gray-200 p-3 rounded whitespace-pre-wrap">{apiStatus}</pre>
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">File Upload Test:</h2>
        <input 
          type="file" 
          onChange={handleFileChange} 
          className="mb-4 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        
        <button 
          onClick={handleUpload}
          disabled={!selectedFile}
          className={`px-4 py-2 rounded-md text-white ${
            !selectedFile ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          Upload File
        </button>
        
        {uploadStatus && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg">
            <h3 className="text-md font-semibold mb-2">Upload Result:</h3>
            <pre className="bg-gray-200 p-3 rounded whitespace-pre-wrap">{uploadStatus}</pre>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-semibold">Debugging Tips:</h3>
        <ul className="list-disc pl-5 mt-2">
          <li>Check browser console (F12) for detailed error messages</li>
          <li>Make sure Flask backend is running on port 8000</li>
          <li>Check Flask console for any errors or request logs</li>
        </ul>
      </div>
    </div>
  );
}