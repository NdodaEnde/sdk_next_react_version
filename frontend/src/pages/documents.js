import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import MainLayout from '../components/MainLayout';
import FileUploader from '../components/FileUploader';
import DocumentViewer from '../components/DocumentViewer';
import ChatInterface from '../components/ChatInterface';
import APIResponseViewer from '../components/APIResponseViewer';
import EvidenceSummary from '../components/EvidenceSummary';
import CertificateTemplate from '../components/templates/CertificateTemplate';
import { extractDocumentData, mapToCertificateFields } from '../utils/dataExtractor';
import { mockEvidenceData, sampleCertificateData } from '../utils/sampleData';

export default function Documents() {
  const router = useRouter();
  
  // Basic state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processedData, setProcessedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [error, setError] = useState(null);
  const [showUploader, setShowUploader] = useState(true);
  
  // Enhanced UI state
  const [activeTab, setActiveTab] = useState('documents'); // 'documents', 'uploads', 'security'
  
  // Check for tab query parameter when the component mounts
  useEffect(() => {
    if (router.query.tab) {
      setActiveTab(router.query.tab);
    }
  }, [router.query]);
  
  // Track current document view state for document viewer
  const [currentFile, setCurrentFile] = useState(null);
  const [currentDocPage, setCurrentDocPage] = useState(1);
  
  // Helper function to get evidence for a specific document page
  const getCurrentPageEvidence = (fileName, pageNum) => {
    if (!processedData || !processedData.evidence) return [];
    
    const evidenceKey = `${fileName}:${pageNum}`;
    return processedData.evidence[evidenceKey] || [];
  };
  
  // Add fullscreen change event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const rightPanel = document.getElementById('rightPanelContent');
      if (document.fullscreenElement === rightPanel) {
        rightPanel.classList.add('p-6', 'max-w-7xl', 'mx-auto', 'bg-gray-100', 'dark:bg-gray-900');
      } else {
        rightPanel.classList.remove('p-6', 'max-w-7xl', 'mx-auto', 'bg-gray-100', 'dark:bg-gray-900');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Get template component based on document type and filename
  // Instead of using image files, we'll render SVG templates directly
  const getTemplateType = (file) => {
    if (!file) return 'certificate';

    console.log("Getting template type for file:", file.name);

    // PRIORITY 1: Check if there's a document type from the upload dropdown
    let uploadDocType = null;
    if (processedData && processedData.documentType) {
      console.log("Document type from upload dropdown:", processedData.documentType);
      uploadDocType = processedData.documentType.toLowerCase();
    }

    // PRIORITY 2: Try to find a matching document in our predefined list
    const matchingDoc = documentList.find(doc => doc.name === file.name);
    console.log("Matching document from list:", matchingDoc);

    // PRIORITY 3: Check if the filename contains keywords that indicate the document type
    const filename = file.name.toLowerCase();

    // Determine document category from filename
    let fileCategory = null;
    if (filename.includes('certificate') || filename.includes('fitness')) {
      fileCategory = 'certificate';
    } else if (filename.includes('questionnaire') || filename.includes('medical')) {
      fileCategory = 'questionnaire';
    } else if (filename.includes('audiogram')) {
      fileCategory = 'audiogram';
    } else if (filename.includes('spirometer')) {
      fileCategory = 'spirometer';
    } else if (filename.includes('xray') || filename.includes('x-ray')) {
      fileCategory = 'xray';
    } else if (filename.includes('referal') || filename.includes('referral')) {
      fileCategory = 'referral';
    }

    console.log("Detected category from filename:", fileCategory);

    // Determine the actual category to use based on priorities
    let finalCategory = 'certificate'; // Default to certificate

    // First priority: document type from upload dropdown
    if (uploadDocType) {
      if (uploadDocType.includes('certificate') || uploadDocType.includes('fitness')) {
        finalCategory = 'certificate';
      } else if (uploadDocType.includes('questionnaire') || uploadDocType.includes('medical')) {
        finalCategory = 'questionnaire';
      } else if (uploadDocType.includes('audiogram')) {
        finalCategory = 'audiogram';
      } else if (uploadDocType.includes('spirometer')) {
        finalCategory = 'spirometer';
      } else if (uploadDocType.includes('xray') || uploadDocType.includes('x-ray')) {
        finalCategory = 'xray';
      } else if (uploadDocType.includes('referal') || uploadDocType.includes('referral')) {
        finalCategory = 'referral';
      }
    }

    // Second priority: document from list
    if ((!finalCategory || finalCategory === 'certificate') && matchingDoc) {
      if (matchingDoc.category === 'certificates') {
        finalCategory = 'certificate';
      } else if (matchingDoc.category) {
        finalCategory = matchingDoc.category;
      }
    }

    // Third priority: detected from filename
    if (!finalCategory && fileCategory) {
      finalCategory = fileCategory;
    }

    console.log("Final determined template type:", finalCategory);
    return finalCategory;
  };
  
  // UI state for document listing
  const [chatApiTab, setChatApiTab] = useState('chat'); // 'chat', 'api', or 'template'
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1); // For pagination
  const [itemsPerPage] = useState(6);

  // State for template data population
  const [extractedTemplateData, setExtractedTemplateData] = useState(null);

  // Filter documents by categories (mock data)
  const documentCategories = [
    { id: 'all', name: 'All Documents' },
    { id: 'certificates', name: 'Certificate of Fitness' },
    { id: 'questionnaire', name: 'Medical Questionnaire' },
    { id: 'audiogram', name: 'Audiogram' },
    { id: 'spirometer', name: 'Spirometer' },
    { id: 'xray', name: 'X-Ray Report' },
    { id: 'referal', name: 'Referal Form' },
  ];

  const [activeCategory, setActiveCategory] = useState('all');

  // Mock document list with review status and timestamps
  const documentList = [
    { 
      id: "DOC-2025-001", 
      name: 'John_Doe_Certificate.pdf', 
      category: 'certificates', 
      uploadDate: '2025-05-01', 
      uploadTime: '09:23:45',
      processedTime: '09:25:12', 
      status: 'processed', 
      patient: 'John Doe',
      patientId: '8501235678091', 
      reviewStatus: 'reviewed'
    },
    { 
      id: "DOC-2025-002", 
      name: 'Jane_Smith_Questionnaire.pdf', 
      category: 'questionnaire', 
      uploadDate: '2025-05-03', 
      uploadTime: '11:05:33',
      processedTime: '11:08:46', 
      status: 'processed', 
      patient: 'Jane Smith',
      patientId: '9203186543210', 
      reviewStatus: 'not-reviewed'
    },
    { 
      id: "DOC-2025-003", 
      name: 'Robert_Brown_Audiogram.pdf', 
      category: 'audiogram', 
      uploadDate: '2025-05-05', 
      uploadTime: '14:32:11',
      processedTime: null, 
      status: 'processing', 
      patient: 'Robert Brown',
      patientId: '7712245839017', 
      reviewStatus: 'not-reviewed'
    },
    { 
      id: "DOC-2025-004", 
      name: 'Alice_Johnson_Spirometer.pdf', 
      category: 'spirometer', 
      uploadDate: '2025-05-07', 
      uploadTime: '08:45:22',
      processedTime: '08:50:17', 
      status: 'processed', 
      patient: 'Alice Johnson',
      patientId: '8903122547893', 
      reviewStatus: 'needs-correction'
    },
    { 
      id: "DOC-2025-005", 
      name: 'Michael_Wilson_Certificate.pdf', 
      category: 'certificates', 
      uploadDate: '2025-05-10', 
      uploadTime: '15:17:32',
      processedTime: '15:19:54', 
      status: 'processed', 
      patient: 'Michael Wilson',
      patientId: '9001019283745', 
      reviewStatus: 'reviewed'
    },
    { 
      id: "DOC-2025-006", 
      name: 'Sarah_Davis_Xray.pdf', 
      category: 'xray', 
      uploadDate: '2025-05-12', 
      uploadTime: '13:21:05',
      processedTime: '13:25:33', 
      status: 'processed', 
      patient: 'Sarah Davis',
      patientId: '8606157269384', 
      reviewStatus: 'not-reviewed'
    },
    { 
      id: "DOC-2025-007", 
      name: 'James_Wilson_Referal.pdf', 
      category: 'referal', 
      uploadDate: '2025-05-14', 
      uploadTime: '10:05:18',
      processedTime: '10:12:45', 
      status: 'processed', 
      patient: 'James Wilson',
      patientId: '8204176283940', 
      reviewStatus: 'not-reviewed'
    },
    { 
      id: "DOC-2025-008", 
      name: 'Emily_Johnson_Audiogram.pdf', 
      category: 'audiogram', 
      uploadDate: '2025-05-16', 
      uploadTime: '16:43:29',
      processedTime: '16:44:51', 
      status: 'processed', 
      patient: 'Emily Johnson',
      patientId: '9505236584930', 
      reviewStatus: 'reviewed'
    },
  ];

  // Get unique document types
  const uniqueDocumentTypes = [...new Set(documentList.map(doc => doc.category))];

  // Update the handleFileUploadComplete function
const handleFileUploadComplete = (files, data) => {
  setUploadedFiles(files);

  // Set the first file as the current file
  if (files && files.length > 0) {
    setCurrentFile(files[0]);
  }

  // Store the document type if it was passed from the FileUploader
  if (data && data.documentType) {
    console.log("Document type from upload:", data.documentType);

    // Store the document type correctly
    setProcessedData({
      ...data,
      documentType: data.documentType
    });
  } else {
    setProcessedData(data);
  }

  // Reset any previously extracted template data
  setExtractedTemplateData(null);

  setShowUploader(false);

  console.log("Uploaded files:", files);
  console.log("Processed data:", data);
  console.log("Current file set to:", files[0]); // Debug log

  // Initialize chat with a welcome message
  setChatHistory([{
    role: 'assistant',
    content: `${files.length} document${files.length !== 1 ? 's' : ''} processed successfully! You can now ask questions about the content.`
  }]);
};

  // Handle chat messages
  const handleChatMessage = async (message) => {
    if (!processedData) return;
    
    // Add user message to chat
    const newChatHistory = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(newChatHistory);
    
    // Add loading message
    setChatHistory([...newChatHistory, { role: 'assistant', content: '...', loading: true }]);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2 * 60 * 1000); // 2 minute timeout for chat
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          evidence: processedData.evidence || processedData || {}
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get answer');
      }
      
      const data = await response.json();
      
      // Update chat history (replace loading message with actual response)
      setChatHistory([
        ...newChatHistory, 
        { role: 'assistant', content: data.answer }
      ]);
      
      // Update highlighted evidence if available
      if (data.best_chunks && data.best_chunks.length > 0) {
        setProcessedData(prev => ({
          ...prev,
          highlightedEvidence: data.best_chunks
        }));
      }
      
    } catch (error) {
      console.error('Error with chat:', error);
      // Replace loading message with error
      let errorMessage = error.message;
      
      if (error.name === 'AbortError') {
        errorMessage = 'The request timed out. Your question may be too complex for the current document set.';
      }
      
      setChatHistory([
        ...newChatHistory,
        { role: 'assistant', content: 'Sorry, I encountered an error: ' + errorMessage }
      ]);
    }
  };

  // Function to update document review status
  const updateDocumentReviewStatus = (documentId, reviewStatus) => {
    // In a real app, this would make an API call
    // For now, we'll just simulate it by showing a notification
    console.log(`Document ${documentId} marked as ${reviewStatus}`);
    // We would then refetch the document list
  };

  // Apply all filters to documents
  const filteredDocuments = documentList
    .filter(doc => {
      // Category filter
      if (activeCategory !== 'all' && doc.category !== activeCategory) return false;
      
      // Status filter
      if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
      
      // Document type filter
      if (documentTypeFilter !== 'all' && doc.category !== documentTypeFilter) return false;
      
      // Search term
      if (searchTerm && !doc.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      return true;
    });

  // Pagination
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Review status counts
  const notReviewedCount = filteredDocuments.filter(doc => 
    doc.reviewStatus === 'not-reviewed'
  ).length;
  
  const reviewedCount = filteredDocuments.filter(doc => 
    doc.reviewStatus === 'reviewed'
  ).length;
  
  const needsCorrectionCount = filteredDocuments.filter(doc => 
    doc.reviewStatus === 'needs-correction'
  ).length;

  // Function to get review status badge
  const getReviewStatusBadge = (reviewStatus) => {
    if (reviewStatus === 'not-reviewed') {
      return <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-full">Not Reviewed</span>;
    } else if (reviewStatus === 'reviewed') {
      return <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">Reviewed</span>;
    } else if (reviewStatus === 'needs-correction') {
      return <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">Needs Correction</span>;
    }
  };

  // Function to generate pagination links
  const generatePaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <li key="first">
        <button 
          onClick={() => setCurrentPage(1)}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
            currentPage === 1 
              ? 'bg-blue-50 text-blue-600' 
              : 'bg-white text-gray-500 hover:bg-gray-50'
          }`}
        >
          1
        </button>
      </li>
    );
    
    // If there are many pages, add ellipsis after first page
    if (currentPage > 3) {
      items.push(
        <li key="ellipsis1">
          <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
            ...
          </span>
        </li>
      );
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      items.push(
        <li key={i}>
          <button 
            onClick={() => setCurrentPage(i)}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
              currentPage === i 
                ? 'bg-blue-50 text-blue-600' 
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {i}
          </button>
        </li>
      );
    }
    
    // If there are many pages, add ellipsis before last page
    if (currentPage < totalPages - 2) {
      items.push(
        <li key="ellipsis2">
          <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700">
            ...
          </span>
        </li>
      );
    }
    
    // Always show last page if it's not the first page
    if (totalPages > 1) {
      items.push(
        <li key="last">
          <button 
            onClick={() => setCurrentPage(totalPages)}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
              currentPage === totalPages 
                ? 'bg-blue-50 text-blue-600' 
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {totalPages}
          </button>
        </li>
      );
    }
    
    return items;
  };

  // Render document card view
  const renderDocumentCard = (doc) => (
    <div key={doc.id} className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4">
        {/* Header with document name and review status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {doc.category === 'certificates' ? (
              <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : doc.category === 'questionnaire' ? (
              <svg className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            ) : doc.category === 'audiogram' ? (
              <svg className="h-6 w-6 text-purple-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 01.707-7.072m-2.829 9.9a9 9 0 010-12.728" />
              </svg>
            ) : doc.category === 'spirometer' ? (
              <svg className="h-6 w-6 text-indigo-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 010-7.072m0 0a5 5 0 017.072 0M6 9h.01M15 9h.01M9 9h.01M12 9h.01" />
              </svg>
            ) : doc.category === 'xray' ? (
              <svg className="h-6 w-6 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-orange-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5h7a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2z" />
              </svg>
            )}
            <div className="mr-2">
              <h3 className="font-medium text-gray-900 truncate" title={doc.name}>
                {doc.name}
              </h3>
              <p className="text-xs text-gray-500">{doc.id}</p>
            </div>
          </div>
          {getReviewStatusBadge(doc.reviewStatus)}
        </div>
        
        {/* Patient information */}
        <div className="mt-3 flex flex-col">
          <div className="text-sm text-gray-700 font-medium">
            Patient: {doc.patient}
          </div>
          <div className="text-xs text-gray-500">
            ID: {doc.patientId}
          </div>
        </div>
        
        {/* Upload and processing info */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="text-xs">
            <span className="text-gray-500">Uploaded:</span>
            <div className="font-medium">
              {doc.uploadDate}
              <div className="text-gray-500">{doc.uploadTime}</div>
            </div>
          </div>
          
          <div className="text-xs text-right">
            <span className="text-gray-500">Processed:</span>
            <div className="font-medium">
              {doc.processedTime ? (
                <span>{doc.processedTime}</span>
              ) : (
                <span className="text-yellow-600">In progress...</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Status badge */}
        <div className="mt-3 flex justify-end">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            doc.status === 'processed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {doc.status === 'processed' ? 'Processed' : 'Processing'}
          </span>
        </div>
      </div>
      
      {/* Card footer with actions */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex justify-between">
        <button onClick={() => {}} className="text-sm font-medium text-blue-600 hover:text-blue-500">
          View
        </button>
        <div className="flex space-x-2">
          <button 
            onClick={() => updateDocumentReviewStatus(doc.id, 'reviewed')} 
            className="text-sm text-green-600 hover:text-green-500"
            title="Mark as reviewed"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button 
            onClick={() => updateDocumentReviewStatus(doc.id, 'needs-correction')} 
            className="text-sm text-red-600 hover:text-red-500"
            title="Mark as needs correction"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  // Function to extract and populate certificate data from the evidence
  const extractAndPopulateTemplateData = () => {
    if (!currentFile || !processedData || !processedData.evidence) {
      alert('No document data available for extraction');
      return;
    }

    // Get the type of document to ensure correct template mapping
    const docType = getTemplateType(currentFile);

    // Process document data
    try {
      // Extract structured data from OCR output
      const extractedData = extractDocumentData(processedData.evidence, docType);
      console.log('Extracted document data:', extractedData);

      // Map the extracted data to certificate fields
      const certificateData = mapToCertificateFields(extractedData);
      console.log('Mapped certificate data:', certificateData);

      // Update state with the template data
      setExtractedTemplateData(certificateData);

      // Switch to template tab to show the populated template
      setChatApiTab('template');
    } catch (error) {
      console.error('Error processing document data:', error);
      alert('Failed to extract certificate data: ' + error.message);
    }
  };

  // Render document list item
  const renderDocumentListItem = (doc) => (
    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg mb-2 hover:bg-gray-50">
      <div className="flex items-center space-x-4">
        {doc.category === 'certificates' ? (
          <svg className="h-8 w-8 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : doc.category === 'questionnaire' ? (
          <svg className="h-8 w-8 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ) : doc.category === 'audiogram' ? (
          <svg className="h-8 w-8 text-purple-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 01.707-7.072m-2.829 9.9a9 9 0 010-12.728" />
          </svg>
        ) : doc.category === 'spirometer' ? (
          <svg className="h-8 w-8 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 010-7.072m0 0a5 5 0 017.072 0M6 9h.01M15 9h.01M9 9h.01M12 9h.01" />
          </svg>
        ) : doc.category === 'xray' ? (
          <svg className="h-8 w-8 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="h-8 w-8 text-orange-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5h7a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2z" />
          </svg>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <h3 className="font-medium text-gray-900 truncate mr-2">{doc.name}</h3>
            <span className="text-xs text-gray-500 truncate">({doc.id})</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-700">
              <span className="font-medium">Patient:</span> {doc.patient}
              <div className="text-xs text-gray-500">ID: {doc.patientId}</div>
            </div>
            
            <div className="text-sm text-gray-700">
              <div>
                <span className="font-medium">Uploaded:</span> {doc.uploadDate} at {doc.uploadTime}
              </div>
              <div>
                <span className="font-medium">Processed:</span> {doc.processedTime || 'In progress...'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 flex-shrink-0">
        <div className="hidden md:flex flex-col items-end space-y-1">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            doc.status === 'processed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {doc.status === 'processed' ? 'Processed' : 'Processing'}
          </span>
          {getReviewStatusBadge(doc.reviewStatus)}
        </div>
        
        <div className="flex space-x-2">
          <button onClick={() => {}} className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
            View
          </button>
          <button 
            onClick={() => updateDocumentReviewStatus(doc.id, 'reviewed')} 
            className="text-sm p-1 text-green-600 hover:text-green-700 rounded-full hover:bg-green-50"
            title="Mark as reviewed"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button 
            onClick={() => updateDocumentReviewStatus(doc.id, 'needs-correction')} 
            className="text-sm p-1 text-red-600 hover:text-red-700 rounded-full hover:bg-red-50"
            title="Mark as needs correction"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout title="Documents - Surgiscan Platform">
      {/* Header section */}
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">Documents</h2>
        <div className="mt-3 sm:mt-0 sm:ml-4 flex space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => {
              setActiveTab('uploads');
              setShowUploader(true);
            }}
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Upload New Documents
          </button>
        </div>
      </div>

      {/* Main Tabs - Documents, Uploads, Security */}
      <div className="mt-6 mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('documents')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('uploads')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'uploads'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upload Documents
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security
            </button>
          </nav>
        </div>
      </div>

      {/* Documents Tab Content */}
      {activeTab === 'documents' && (
        <>
          {/* Search and Filters */}
          <div className="mb-6 sm:flex sm:items-center sm:justify-between">
            <div className="max-w-lg w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Search documents"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                />
              </div>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-4 flex space-x-3">
              <div>
                <label htmlFor="status-filter" className="sr-only">Filter by Status</label>
                <select
                  id="status-filter"
                  name="status-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                >
                  <option value="all">All Statuses</option>
                  <option value="processed">Processed</option>
                  <option value="processing">Processing</option>
                </select>
              </div>
              <div>
                <label htmlFor="type-filter" className="sr-only">Filter by Type</label>
                <select
                  id="type-filter"
                  name="type-filter"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={documentTypeFilter}
                  onChange={(e) => {
                    setDocumentTypeFilter(e.target.value);
                    setCurrentPage(1); // Reset to first page on filter change
                  }}
                >
                  <option value="all">All Types</option>
                  {uniqueDocumentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* View Toggle and Review Status Summary */}
          <div className="mb-6 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'card'
                    ? 'bg-gray-200 text-gray-800'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'list'
                    ? 'bg-gray-200 text-gray-800'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            {filteredDocuments.length > 0 && (
              <div className="mt-3 sm:mt-0 flex items-center text-sm text-gray-500">
                <div className="mr-4">
                  <span className="font-medium text-gray-900">Review Status:</span>
                </div>
                <div className="flex space-x-4">
                  {notReviewedCount > 0 && (
                    <span className="text-gray-600">
                      {notReviewedCount} not reviewed
                    </span>
                  )}
                  {reviewedCount > 0 && (
                    <span className="text-green-600">
                      {reviewedCount} reviewed
                    </span>
                  )}
                  {needsCorrectionCount > 0 && (
                    <span className="text-red-600">
                      {needsCorrectionCount} needs correction
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Document List or Empty State */}
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12 bg-white shadow overflow-hidden rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDocumentTypeFilter('all');
                    setActiveCategory('all');
                  }}
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Document Grid or List */}
              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedDocuments.map(doc => renderDocumentCard(doc))}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedDocuments.map(doc => renderDocumentListItem(doc))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <nav className="border-t border-gray-200 px-4 flex items-center justify-between sm:px-0">
                    <div className="w-0 flex-1 flex">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={`${
                          currentPage === 1 ? 'cursor-not-allowed text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        } border-t-2 border-transparent pt-4 pr-1 inline-flex items-center text-sm font-medium`}
                      >
                        <svg className="mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Previous
                      </button>
                    </div>
                    <div className="hidden md:flex">
                      <div className="border-t-2 border-transparent">
                        <ul className="flex items-center -mt-px space-x-1">
                          {generatePaginationItems()}
                        </ul>
                      </div>
                    </div>
                    <div className="w-0 flex-1 flex justify-end">
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={`${
                          currentPage === totalPages ? 'cursor-not-allowed text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        } border-t-2 border-transparent pt-4 pl-1 inline-flex items-center text-sm font-medium`}
                      >
                        Next
                        <svg className="ml-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </nav>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Uploads Tab Content */}
      {activeTab === 'uploads' && (
        <div className="max-w-3xl mx-auto">
          <FileUploader onUpload={handleFileUploadComplete} loading={loading} />
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              Error: {error}
            </div>
          )}
        </div>
      )}

      {/* Security Tab Content */}
      {activeTab === 'security' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Document Security Settings</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure security settings for your documents and document processing.
          </p>
          <div className="mt-6 space-y-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="encryption"
                  name="encryption"
                  type="checkbox"
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  defaultChecked
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="encryption" className="font-medium text-gray-700">Enable encryption</label>
                <p className="text-gray-500">All documents will be encrypted at rest and during transit.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="audit-logs"
                  name="audit-logs"
                  type="checkbox"
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  defaultChecked
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="audit-logs" className="font-medium text-gray-700">Enable audit logs</label>
                <p className="text-gray-500">Track all user interactions with documents for compliance purposes.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="auto-deletion"
                  name="auto-deletion"
                  type="checkbox"
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="auto-deletion" className="font-medium text-gray-700">Auto-deletion of documents</label>
                <p className="text-gray-500">Automatically delete documents after a specified period of time.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer and Chat */}
{!showUploader && processedData && (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
    <div className="relative bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-medium text-gray-900">Document Viewer</h3>
        <button 
          onClick={() => {
            setShowUploader(true);
            setProcessedData(null);
            setUploadedFiles([]);
          }}
          className="text-gray-400 hover:text-gray-500"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column - Document Viewer */}
        <div className="w-full lg:w-3/5 overflow-auto p-4">
          <DocumentViewer 
            files={uploadedFiles} 
            highlightedEvidence={processedData.evidence || processedData.highlightedEvidence || {}}
            baseUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
            onFileChange={setCurrentFile}
            onPageChange={setCurrentDocPage}
          />
        </div>
        
        {/* Right Column - Chat & API Response */}
        <div className="w-full lg:w-2/5 overflow-auto border-t lg:border-t-0 lg:border-l border-gray-200">
          <div className="p-4">
            <div className="mb-4 border-b">
              <div className="flex justify-between items-center">
                <div className="flex">
                  <button
                    className={`py-2 px-4 ${chatApiTab === 'chat'
                      ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setChatApiTab('chat')}
                  >
                    Chat with Document
                  </button>
                  <button
                    className={`py-2 px-4 ${chatApiTab === 'api'
                      ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setChatApiTab('api')}
                  >
                    Extracted Data
                  </button>
                  <button
                    className={`py-2 px-4 ${chatApiTab === 'template'
                      ? 'border-b-2 border-blue-500 font-medium text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setChatApiTab('template')}
                  >
                    Template
                  </button>
                </div>
                <button
                  onClick={() => {
                    const rightPanel = document.getElementById('rightPanelContent');
                    if (rightPanel && rightPanel.requestFullscreen) {
                      rightPanel.requestFullscreen();
                    }
                  }}
                  className="px-3 py-1 border rounded text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                  Full Screen
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            <div id="rightPanelContent" className="h-full overflow-y-auto">
            {chatApiTab === 'chat' ? (
              <ChatInterface
                history={chatHistory}
                onSendMessage={handleChatMessage}
              />
            ) : chatApiTab === 'api' ? (
              <>
                <APIResponseViewer data={processedData} />

                {/* Extract evidence summary for current document */}
                {currentFile && currentDocPage && processedData && (
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Highlighted Evidence</h3>
                    <EvidenceSummary
                      evidence={getCurrentPageEvidence(currentFile.name, currentDocPage)}
                    />
                  </div>
                )}
              </>
            ) : (
  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
    <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">Document Template</h3>

    {currentFile ? (
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden bg-gray-100 p-4">
          {/* Template Population Controls */}
          <div className="bg-white p-3 mb-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900">Certificate Data Population</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => extractAndPopulateTemplateData()}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Extract & Populate Data
                </button>
                <button
                  onClick={() => {
                    // Load sample evidence data for testing
                    if (process.env.NODE_ENV !== 'production') {
                      console.log('Loading sample data for testing');

                      // If no processed data exists yet, create it
                      if (!processedData) {
                        setProcessedData({
                          evidence: mockEvidenceData
                        });
                      } else {
                        // Otherwise just add the evidence to existing data
                        setProcessedData({
                          ...processedData,
                          evidence: mockEvidenceData
                        });
                      }

                      // Load the sample certificate data
                      setExtractedTemplateData(sampleCertificateData);
                      setChatApiTab('template');
                    } else {
                      alert('Test data is only available in development mode');
                    }
                  }}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                >
                  Load Test Data
                </button>
              </div>
            </div>
            {extractedTemplateData && (
              <div className="mt-2 text-xs text-gray-600">
                <div className="flex items-center">
                  <span className="w-24">Patient:</span>
                  <span className="font-medium">{extractedTemplateData.name || 'Not detected'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24">ID Number:</span>
                  <span className="font-medium">{extractedTemplateData.id_number || 'Not detected'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24">Company:</span>
                  <span className="font-medium">{extractedTemplateData.company || 'Not detected'}</span>
                </div>
              </div>
            )}
          </div>

          {/* SVG Templates based on document type */}
          {(() => {
            const templateType = getTemplateType(currentFile);

            switch(templateType) {
              case 'certificate':
                return <CertificateTemplate data={extractedTemplateData} />;

  case 'questionnaire':
                return (
                  <div className="p-4 bg-white rounded-lg border border-gray-300 max-w-2xl mx-auto">
                    <div className="text-center border-b pb-4 border-gray-200">
                      <h1 className="text-2xl font-bold text-gray-800">MEDICAL QUESTIONNAIRE</h1>
                    </div>
                    <div className="py-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-sm">
                          <div className="text-gray-500">Patient Name:</div>
                          <div className="h-6 bg-gray-100 rounded"></div>
                        </div>
                        <div className="text-sm">
                          <div className="text-gray-500">Date of Birth:</div>
                          <div className="h-6 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );

              case 'audiogram':
                return (
                  <div className="p-4 bg-white rounded-lg border border-gray-300 max-w-2xl mx-auto">
                    <div className="text-center border-b pb-4 border-gray-200">
                      <h1 className="text-2xl font-bold text-gray-800">AUDIOGRAM</h1>
                    </div>
                    <div className="py-4 space-y-4">
                      <div className="h-60 bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-gray-400">Audiogram Chart</div>
                      </div>
                    </div>
                  </div>
                );

              case 'spirometer':
                return (
                  <div className="p-4 bg-white rounded-lg border border-gray-300 max-w-2xl mx-auto">
                    <div className="text-center border-b pb-4 border-gray-200">
                      <h1 className="text-2xl font-bold text-gray-800">SPIROMETRY REPORT</h1>
                    </div>
                    <div className="py-4 space-y-4">
                      <div className="h-60 bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-gray-400">Spirometry Graph</div>
                      </div>
                    </div>
                  </div>
                );

              case 'xray':
                return (
                  <div className="p-4 bg-white rounded-lg border border-gray-300 max-w-2xl mx-auto">
                    <div className="text-center border-b pb-4 border-gray-200">
                      <h1 className="text-2xl font-bold text-gray-800">X-RAY REPORT</h1>
                    </div>
                    <div className="py-4 space-y-4">
                      <div className="h-60 bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-gray-400">X-Ray Image</div>
                      </div>
                    </div>
                  </div>
                );

              case 'referral':
                return (
                  <div className="p-4 bg-white rounded-lg border border-gray-300 max-w-2xl mx-auto">
                    <div className="text-center border-b pb-4 border-gray-200">
                      <h1 className="text-2xl font-bold text-gray-800">REFERRAL FORM</h1>
                    </div>
                    <div className="py-4 space-y-4">
                      <div className="text-sm">
                        <div className="text-gray-500">Referring Doctor:</div>
                        <div className="h-6 bg-gray-100 rounded"></div>
                      </div>
                      <div className="text-sm">
                        <div className="text-gray-500">Referred To:</div>
                        <div className="h-6 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  </div>
                );

              default:
                return (
                  <div className="p-4 bg-white rounded-lg border border-gray-300 max-w-2xl mx-auto">
                    <div className="text-center border-b pb-4 border-gray-200">
                      <h1 className="text-2xl font-bold text-gray-800">DOCUMENT TEMPLATE</h1>
                      <p className="mt-2 text-sm text-gray-500">Generic document template</p>
                    </div>
                    <div className="py-4 space-y-4">
                      <div className="h-60 bg-gray-100 rounded flex items-center justify-center">
                        <div className="text-gray-400">Document Content</div>
                      </div>
                    </div>
                  </div>
                );
            }
          })()}
        </div>
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">
        <p>Please select a document to view its template</p>
      </div>
    )}
  </div>
)}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}    
    </MainLayout>
  );
}