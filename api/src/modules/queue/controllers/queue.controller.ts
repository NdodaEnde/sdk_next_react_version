import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Request
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentQueueProducer } from '../producers/document-queue.producer';
import { DocumentProcessingJob, DocumentAnalysisJob } from '../dtos/document-job.dto';
import { Tenant } from '@app/common/tenant/decorators/tenant.decorator';

@ApiTags('queue')
@Controller('queue')
@ApiBearerAuth()
export class QueueController {
  constructor(private documentQueueProducer: DocumentQueueProducer) {}

  @Post('documents/process')
  @ApiOperation({ summary: 'Add a document processing job to the queue' })
  async processDocument(
    @Body() job: Omit<DocumentProcessingJob, 'organizationId'>,
    @Tenant() tenantId: string,
    @Request() req,
  ) {
    const fullJob: DocumentProcessingJob = {
      ...job,
      organizationId: tenantId,
      userId: req.user.sub,
    };

    const queuedJob = await this.documentQueueProducer.addDocumentProcessingJob(fullJob);
    
    return {
      jobId: queuedJob.id,
      status: 'queued',
      message: 'Document processing job added to queue',
    };
  }

  @Post('documents/analyze')
  @ApiOperation({ summary: 'Add a document analysis job to the queue' })
  async analyzeDocument(
    @Body() job: Omit<DocumentAnalysisJob, 'organizationId'>,
    @Tenant() tenantId: string,
    @Request() req,
  ) {
    const fullJob: DocumentAnalysisJob = {
      ...job,
      organizationId: tenantId,
      userId: req.user.sub,
    };

    const queuedJob = await this.documentQueueProducer.addDocumentAnalysisJob(fullJob);
    
    return {
      jobId: queuedJob.id,
      status: 'queued',
      message: 'Document analysis job added to queue',
    };
  }

  @Get('jobs/:id')
  @ApiOperation({ summary: 'Get job status by ID' })
  async getJobStatus(@Param('id') jobId: string) {
    const status = await this.documentQueueProducer.getJobStatus(jobId);
    
    if (!status) {
      return {
        jobId,
        status: 'not_found',
        message: 'Job not found or already removed',
      };
    }
    
    return status;
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Get active jobs for the current organization' })
  async getActiveJobs(@Tenant() tenantId: string) {
    const jobs = await this.documentQueueProducer.getActiveJobsByOrganization(tenantId);
    
    return {
      count: jobs.length,
      jobs,
    };
  }

  @Post('jobs/clean')
  @ApiOperation({ summary: 'Clean completed jobs for the current organization' })
  async cleanCompletedJobs(@Tenant() tenantId: string) {
    return this.documentQueueProducer.cleanCompletedJobs(tenantId);
  }
}