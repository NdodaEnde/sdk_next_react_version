import React from 'react';

export default function HighlightedEvidence({ 
  evidence, 
  containerWidth = "100%", 
  containerHeight = "100%",
  highlightColor = 'rgba(255, 230, 0, 0.3)'
}) {
  if (!evidence || evidence.length === 0) {
    return null;
  }
  
  return (
    <div 
      className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-10"
      style={{ width: containerWidth, height: containerHeight }}
    >
      {/* Highlight boxes that overlay the document */}
      {evidence.map((chunk, index) => (
        <React.Fragment key={index}>
          {chunk.bboxes && chunk.bboxes.map((bbox, bboxIndex) => {
            // Each bbox is [x, y, width, height]
            const [x, y, width, height] = bbox;
            
            return (
              <div 
                key={`highlight-${index}-${bboxIndex}`}
                className="absolute border border-yellow-400"
                style={{
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  width: `${width * 100}%`,
                  height: `${height * 100}%`,
                  backgroundColor: highlightColor,
                  zIndex: 20
                }}
              />
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}