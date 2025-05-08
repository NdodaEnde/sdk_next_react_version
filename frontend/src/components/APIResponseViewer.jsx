import { useState } from 'react';

export default function APIResponseViewer({ data }) {
  const [viewMode, setViewMode] = useState('markdown'); // 'markdown' or 'json'
  
  if (!data) {
    return (
      <div className="flex justify-center items-center h-[600px] border rounded-lg bg-gray-50">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }
  
  // Get the evidence object from data
  const evidence = data.evidence || data;
  
  // Convert evidence to markdown format
  const getMarkdownContent = () => {
    let markdown = '';
    
    // Add metadata if available
    if (data.document_type) {
      markdown += `# Document Information\n\n`;
      markdown += `- **Document Type:** ${data.document_type}\n`;
      markdown += `- **Processing Time:** ${data.processing_time || 'Not available'}\n`;
      markdown += `- **Files Processed:** ${data.files_processed || 'Not available'}\n`;
      markdown += `- **Pages with Content:** ${data.total_pages_with_content || 'Not available'}\n\n`;
      markdown += `---\n\n`;
    }
    
    markdown += `# Extracted Content\n\n`;
    
    for (const [key, chunks] of Object.entries(evidence)) {
      const [filename, page] = key.split(':');
      markdown += `## ${filename} - Page ${page}\n\n`;
      
      for (const chunk of chunks) {
        for (const caption of (chunk.captions || [])) {
          markdown += `- ${caption}\n`;
        }
      }
      
      markdown += '\n---\n\n';
    }
    
    return markdown || 'No extracted data available.';
  };
  
  // Render markdown content
  const renderMarkdown = () => {
    const markdown = getMarkdownContent();
    
    // Simple markdown rendering
    const html = markdown
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^\- \*\*(.+):\*\* (.+)$/gm, '<div class="mb-1"><span class="font-semibold">$1:</span> $2</div>')
      .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
      .replace(/\n---\n/g, '<hr class="my-4" />');
    
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };
  
  return (
    <div className="border rounded-lg overflow-hidden h-[600px]">
      {/* View mode tabs */}
      <div className="flex bg-gray-100 border-b">
        <button
          className={`px-4 py-2 text-sm ${
            viewMode === 'markdown' 
              ? 'bg-white border-b-2 border-blue-500 font-medium' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setViewMode('markdown')}
        >
          Markdown
        </button>
        <button
          className={`px-4 py-2 text-sm ${
            viewMode === 'json' 
              ? 'bg-white border-b-2 border-blue-500 font-medium' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setViewMode('json')}
        >
          JSON
        </button>
      </div>
      
      {/* Content area */}
      <div className="p-4 overflow-y-auto h-[calc(600px-40px)]">
        {viewMode === 'markdown' ? (
          renderMarkdown()
        ) : (
          <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}