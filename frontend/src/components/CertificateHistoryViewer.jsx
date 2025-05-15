import React, { useState, useEffect } from 'react';

/**
 * A component for displaying certificate version history
 * Allows viewing and restoring previous versions of certificates
 */
export default function CertificateHistoryViewer({ documentId, onRestoreVersion, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  // Fetch certificate history when the component mounts
  useEffect(() => {
    if (!documentId) return;
    
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004'}/api/certificate-history/${documentId}`,
          {
            headers: { 
              'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
            },
            credentials: 'include'
          }
        );
        
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          setHistory(data.history || []);
        } else {
          throw new Error(data.message || 'Failed to load history');
        }
      } catch (err) {
        console.error('Error fetching certificate history:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [documentId]);
  
  // Handle restore version click
  const handleRestoreClick = (version) => {
    setSelectedVersion(version);
    setConfirmRestore(true);
  };
  
  // Handle confirm restore 
  const handleConfirmRestore = async () => {
    if (!selectedVersion) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004'}/api/restore-certificate-version`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
          },
          credentials: 'include',
          body: JSON.stringify({
            documentId,
            historyId: selectedVersion.id,
            // For 'create' versions, restore from the 'new_data' field
            // For 'update' versions, restore from the 'previous_data' field to go back to the previous version
            useNewData: selectedVersion.change_type === 'create'
          })
        }
      );
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Call the parent's onRestoreVersion callback with the restored data
        if (onRestoreVersion) {
          // If this is a "create" event, use the new_data field, otherwise use previous_data
          const restoredData = selectedVersion.change_type === 'create' 
            ? selectedVersion.new_data 
            : selectedVersion.previous_data;
          
          onRestoreVersion(restoredData);
        }
        setConfirmRestore(false);
        // Refresh history after restoring
        const newHistoryResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003'}/api/certificate-history/${documentId}`,
          {
            headers: { 
              'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
            }
          }
        );
        
        if (newHistoryResponse.ok) {
          const newHistoryData = await newHistoryResponse.json();
          if (newHistoryData.status === 'success') {
            setHistory(newHistoryData.history || []);
          }
        }
      } else {
        throw new Error(data.message || 'Failed to restore version');
      }
    } catch (err) {
      console.error('Error restoring certificate version:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading && !error && history.length === 0) {
    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Certificate History</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-600">Loading certificate history...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !loading) {
    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Certificate History</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bg-red-50 p-4 rounded-md mb-4 border border-red-200">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading certificate history</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004'}/api/certificate-history/${documentId}`,
                {
                  headers: { 
                    'Authorization': localStorage.getItem('auth_token') ? `Bearer ${localStorage.getItem('auth_token')}` : ''
                  },
                  credentials: 'include'
                }
              )
                .then(response => {
                  if (!response.ok) throw new Error(`Server returned ${response.status}`);
                  return response.json();
                })
                .then(data => {
                  if (data.status === 'success') {
                    setHistory(data.history || []);
                  } else {
                    throw new Error(data.message || 'Failed to load history');
                  }
                })
                .catch(err => {
                  setError(err.message);
                })
                .finally(() => {
                  setLoading(false);
                });
            }}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render no history state
  if (history.length === 0 && !loading) {
    return (
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Certificate History</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No history found</h3>
          <p className="mt-1 text-sm text-gray-500">There is no version history for this certificate yet.</p>
        </div>
      </div>
    );
  }

  // Render history list with restore confirmation
  return (
    <div className="p-4 bg-white border rounded-lg shadow-sm max-h-[600px] overflow-y-auto">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white border-b pb-3">
        <h3 className="text-lg font-medium text-gray-900">Certificate History</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {confirmRestore && selectedVersion && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="text-sm font-medium text-yellow-800">Confirm Restore</h4>
          <p className="mt-1 text-sm text-yellow-700">
            Are you sure you want to restore this certificate version from {selectedVersion.formatted_time}?
            This will overwrite the current certificate data.
          </p>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleConfirmRestore}
              className="px-3 py-1.5 text-sm text-white bg-yellow-600 rounded hover:bg-yellow-700"
              disabled={loading}
            >
              {loading ? 'Restoring...' : 'Yes, Restore This Version'}
            </button>
            <button
              onClick={() => setConfirmRestore(false)}
              className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <ul className="space-y-3">
        {history.map((version) => (
          <li key={version.id} className="border rounded-lg overflow-hidden">
            <div className={`p-3 ${version.change_type === 'create' ? 'bg-green-50' : 'bg-blue-50'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    version.change_type === 'create' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {version.change_type === 'create' ? 'Initial Version' : 'Update'}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">{version.formatted_time}</span>
                </div>
                <button
                  onClick={() => handleRestoreClick(version)}
                  className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restore
                </button>
              </div>
              
              {/* Show the data fields that were changed */}
              <div className="mt-2">
                {version.change_type === 'create' ? (
                  <div className="text-sm text-gray-600">Initial certificate version created</div>
                ) : (
                  <div className="text-sm">
                    <h4 className="font-medium text-gray-700 mb-1">Changes:</h4>
                    <ChangeSummary
                      previousData={version.previous_data}
                      newData={version.new_data}
                    />
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Helper component to show a summary of changes between two certificate versions
 */
function ChangeSummary({ previousData, newData }) {
  if (!previousData || !newData) {
    return <div className="text-gray-500 italic">Change data not available</div>;
  }
  
  // Get all keys from both objects
  const allKeys = new Set([...Object.keys(previousData), ...Object.keys(newData)]);
  
  // Track what fields were changed
  const changes = [];
  
  allKeys.forEach(key => {
    // Skip complex objects for simple display
    if (typeof previousData[key] === 'object' && previousData[key] !== null || 
        typeof newData[key] === 'object' && newData[key] !== null) {
      
      // For nested objects like medicalExams, medicalResults, restrictions
      if (['medicalExams', 'medical_exams', 'medicalResults', 'medical_results', 'restrictions'].includes(key)) {
        const prevObj = previousData[key] || {};
        const newObj = newData[key] || {};
        
        // Get all keys from both nested objects
        const nestedKeys = new Set([...Object.keys(prevObj), ...Object.keys(newObj)]);
        
        nestedKeys.forEach(nestedKey => {
          if (JSON.stringify(prevObj[nestedKey]) !== JSON.stringify(newObj[nestedKey])) {
            const formattedKey = `${key}.${nestedKey}`;
            const oldValue = prevObj[nestedKey];
            const newValue = newObj[nestedKey];
            
            // Format the values nicely, especially for booleans
            const formattedOldValue = typeof oldValue === 'boolean' ? (oldValue ? 'Yes' : 'No') : 
                                     oldValue === undefined ? 'Not set' : String(oldValue);
            const formattedNewValue = typeof newValue === 'boolean' ? (newValue ? 'Yes' : 'No') : 
                                     newValue === undefined ? 'Not set' : String(newValue);
            
            changes.push({
              field: formattedKey,
              oldValue: formattedOldValue,
              newValue: formattedNewValue
            });
          }
        });
      } else {
        // For other objects, just note that they changed
        if (JSON.stringify(previousData[key]) !== JSON.stringify(newData[key])) {
          changes.push({
            field: key,
            oldValue: 'Complex data',
            newValue: 'Complex data (changed)'
          });
        }
      }
    } else {
      // For simple fields, show the old and new values
      if (previousData[key] !== newData[key]) {
        changes.push({
          field: key,
          oldValue: previousData[key] === undefined ? 'Not set' : String(previousData[key]),
          newValue: newData[key] === undefined ? 'Not set' : String(newData[key])
        });
      }
    }
  });
  
  if (changes.length === 0) {
    return <div className="text-gray-500 italic">No detected changes in data</div>;
  }
  
  return (
    <div className="space-y-1 text-xs">
      {changes.map((change, index) => (
        <div key={index} className="grid grid-cols-3 gap-2">
          <div className="font-medium text-gray-700">
            {change.field.charAt(0).toUpperCase() + change.field.slice(1).replace(/([A-Z])/g, ' $1')}
          </div>
          <div className="text-red-600 line-through">{change.oldValue}</div>
          <div className="text-green-600">{change.newValue}</div>
        </div>
      ))}
    </div>
  );
}