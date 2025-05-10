import React from 'react';

export default function EvidenceSummary({ evidence }) {
  if (!evidence || evidence.length === 0) {
    return (
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
        <p className="text-gray-500 dark:text-gray-400">No evidence data available for this document</p>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
      <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Extracted Evidence</h3>
      
      {evidence.map((chunk, index) => (
        <div key={index} className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
          {chunk.captions && chunk.captions.length > 0 && (
            <div className="mt-1">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content:</h4>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-md">
                {chunk.captions.map((caption, captionIndex) => (
                  <p key={captionIndex} className="text-sm text-gray-800 dark:text-gray-200 mb-2 last:mb-0">{caption}</p>
                ))}
              </div>
            </div>
          )}
          
          {chunk.reason && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relevance:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">{chunk.reason}</p>
            </div>
          )}
          
          {(chunk.confidence || chunk.score) && (
            <div className="mt-2 flex items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Confidence: </span>
              <div className="ml-2 h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 dark:bg-green-600" 
                  style={{ width: `${Math.round((chunk.confidence || chunk.score || 0.7) * 100)}%` }}
                ></div>
              </div>
              <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                {Math.round((chunk.confidence || chunk.score || 0.7) * 100)}%
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}