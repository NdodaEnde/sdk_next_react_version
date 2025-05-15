/**
 * Base document job type
 */
export interface DocumentJob {
  documentId: string;
  organizationId: string;
  userId?: string;
}

/**
 * Job to process a document and extract text/data
 */
export interface DocumentProcessingJob extends DocumentJob {
  storagePath: string;
  mimeType: string;
  documentType?: string;
  extractionType?: string; // certificate, medical_report, etc.
}

/**
 * Job to analyze a document's content
 */
export interface DocumentAnalysisJob extends DocumentJob {
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Job to generate a certificate from data
 */
export interface CertificateGenerationJob extends DocumentJob {
  templateId: string;
  data: Record<string, any>;
}

/**
 * Job status tracking
 */
export enum JobStatus {
  QUEUED = 'queued',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Job result data
 */
export interface DocumentJobResult {
  jobId: string;
  documentId: string;
  status: JobStatus;
  data?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  processingTimeMs?: number;
}