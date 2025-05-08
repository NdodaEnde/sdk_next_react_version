import React from 'react';

export default function HighlightedEvidence({ evidence }) {
  if (!evidence || evidence.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 border rounded-lg p-4 bg-gray-50">
      <h3 className="text-lg font-medium mb-2">Supporting Evidence</h3>
      
      {evidence.map((chunk, index) => (
        <div key={index} className="mb-4 border-b pb-3 last:border-b-0">
          <div className="flex justify-between">
            <h4 className="font-medium">{chunk.file} - Page {chunk.page}</h4>
            {chunk.bboxes && chunk.bboxes.length > 0 && (
              <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">
                {chunk.bboxes.length} highlight{chunk.bboxes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {chunk.captions && chunk.captions.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-700 font-medium">Content:</p>
              <ul className="list-disc pl-5 text-sm text-gray-600">
                {chunk.captions.map((caption, captionIndex) => (
                  <li key={captionIndex}>{caption}</li>
                ))}
              </ul>
            </div>
          )}
          
          {chunk.reason && (
            <div className="mt-2">
              <p className="text-sm text-gray-700 font-medium">Relevance:</p>
              <p className="text-sm text-gray-600 pl-5">{chunk.reason}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}