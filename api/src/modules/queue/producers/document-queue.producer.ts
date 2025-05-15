import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, JobOptions } from 'bull';
import { 
  DocumentProcessingJob, 
  DocumentAnalysisJob, 
  CertificateGenerationJob 
} from '../dtos/document-job.dto';

@Injectable()
export class DocumentQueueProducer {
  constructor(
    @InjectQueue('document-processing') private documentQueue: Queue,
  ) {}

  /**
   * Add a document processing job to the queue
   */
  async addDocumentProcessingJob(
    job: DocumentProcessingJob,
    options?: JobOptions,
  ) {
    return this.documentQueue.add('process', job, {
      ...options,
      attempts: options?.attempts || 3,
      backoff: options?.backoff || {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  /**
   * Add a document analysis job to the queue
   */
  async addDocumentAnalysisJob(
    job: DocumentAnalysisJob,
    options?: JobOptions,
  ) {
    return this.documentQueue.add('analyze', job, {
      ...options,
      attempts: options?.attempts || 2,
      backoff: options?.backoff || {
        type: 'fixed',
        delay: 3000,
      },
    });
  }

  /**
   * Add a certificate generation job to the queue
   */
  async addCertificateGenerationJob(
    job: CertificateGenerationJob,
    options?: JobOptions,
  ) {
    return this.documentQueue.add('generate-certificate', job, {
      ...options,
      attempts: options?.attempts || 2,
      priority: options?.priority || 2, // Higher priority
    });
  }

  /**
   * Get job progress and status
   */
  async getJobStatus(jobId: string) {
    const job = await this.documentQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job._progress;
    const result = job.returnvalue;
    const failReason = job.failedReason;

    return {
      id: job.id,
      state,
      progress,
      result,
      failReason,
      data: job.data,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  /**
   * Get all active jobs for an organization
   */
  async getActiveJobsByOrganization(organizationId: string) {
    // Get active jobs
    const activeJobs = await this.documentQueue.getActive();
    const waitingJobs = await this.documentQueue.getWaiting();
    const delayedJobs = await this.documentQueue.getDelayed();
    
    // Filter by organization ID
    const allJobs = [...activeJobs, ...waitingJobs, ...delayedJobs];
    const orgJobs = allJobs.filter(
      job => job.data.organizationId === organizationId,
    );
    
    return orgJobs.map(job => ({
      id: job.id,
      state: job.finishedOn ? 'completed' : job.processedOn ? 'active' : 'waiting',
      data: job.data,
      timestamp: job.timestamp,
    }));
  }

  /**
   * Clean completed jobs for an organization
   */
  async cleanCompletedJobs(organizationId: string) {
    // Get completed jobs
    const completedJobs = await this.documentQueue.getCompleted();
    
    // Filter by organization ID and remove them
    for (const job of completedJobs) {
      if (job.data.organizationId === organizationId) {
        await job.remove();
      }
    }
    
    return { removed: completedJobs.length };
  }
}