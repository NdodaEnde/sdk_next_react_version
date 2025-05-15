export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
  role: 'admin' | 'user' | 'owner';
  organizationId: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export interface Document {
  id: string;
  name: string;
  filePath: string;
  contentType: string;
  size: number;
  status: 'uploaded' | 'processing' | 'processed' | 'processing_failed';
  organizationId: string;
  uploadedById: string;
  documentType?: string;
  resultPath?: string;
  extractedData?: Record<string, any>;
  processingError?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

export interface DocumentProcessingResult {
  status: 'success' | 'error';
  documentId: string;
  organizationId: string;
  resultPath?: string;
  extractedData?: Record<string, any>;
  error?: string;
}

export interface QueueJobStatus {
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  progress: number;
  createdAt: string;
  processedAt?: string;
  failedReason?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}