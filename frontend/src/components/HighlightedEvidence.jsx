import React from 'react';

export default function HighlightedEvidence({ 
  evidence, 
  containerWidth = 800, 
  containerHeight = 1100,
  highlightColor = 'rgba(255, 230, 0, 0.3)'
}) {
  if (!evidence || evidence.length === 0) {
    return null;
  }
  
  // Position absolute overlay on top of the PDF view
  return (
    <div 
      className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none"
      style={{ width: containerWidth, height: containerHeight }}
    >
      {evidence.map((chunk, index) => (
        <React.Fragment key={index}>
          {chunk.bboxes && chunk.bboxes.map((bbox, bboxIndex) => {
            // Each bbox is [x, y, width, height]
            const [x, y, width, height] = bbox;
            
            return (
              <div 
                key={`highlight-${index}-${bboxIndex}`}
                className="absolute border-2 border-yellow-500"
                style={{
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  width: `${width * 100}%`,
                  height: `${height * 100}%`,
                  backgroundColor: highlightColor,
                  boxShadow: '0 0 0 2px rgba(255, 230, 0, 0.5)',
                  zIndex: 10
                }}
              />
            );
          })}
        </React.Fragment>
      ))}
      
      {/* Supporting evidence sidebar */}
      <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-3 max-w-xs max-h-[80%] overflow-y-auto pointer-events-auto opacity-90 hover:opacity-100 transition-opacity border">
        <h3 className="text-sm font-medium mb-2">Supporting Evidence</h3>
        
        {evidence.map((chunk, index) => (
          <div key={index} className="mb-3 text-xs">
            {chunk.captions && chunk.captions.length > 0 && (
              <div className="mt-1 p-2 bg-yellow-50 rounded">
                {chunk.captions.map((caption, captionIndex) => (
                  <p key={captionIndex} className="text-gray-800 mb-1">{caption}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}