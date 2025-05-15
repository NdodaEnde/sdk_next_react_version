import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '@app/common/prisma/prisma.service';
import { 
  DocumentProcessingJob, 
  DocumentAnalysisJob, 
  CertificateGenerationJob,
  JobStatus
} from '../dtos/document-job.dto';

@Processor('document-processing')
@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);

  constructor(private prisma: PrismaService) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(
      `Processing job ${job.id} of type ${job.name} with data ${JSON.stringify(job.data)}`,
    );

    // Update job status in database
    this.updateJobStatus(job.id.toString(), job.data.documentId, JobStatus.PROCESSING);
  }

  @OnQueueCompleted()
  async onCompleted(job: Job, result: any) {
    this.logger.debug(
      `Completed job ${job.id} of type ${job.name} with result ${JSON.stringify(result)}`,
    );

    // Update job status and result in database
    await this.updateJobCompletion(
      job.id.toString(), 
      job.data.documentId, 
      result, 
      JobStatus.COMPLETED
    );

    // Update document metadata with extracted data if available
    if (result?.extractedData && job.data.documentId) {
      await this.prisma.document.update({
        where: { id: job.data.documentId },
        data: {
          metadata: {
            ...(typeof result.extractedData === 'object' 
              ? result.extractedData 
              : { content: result.extractedData })
          }
        }
      });
    }
  }

  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    this.logger.error(
      `Failed job ${job.id} of type ${job.name} with error ${error.message}`,
      error.stack,
    );

    // Update job status and error in database
    await this.updateJobCompletion(
      job.id.toString(), 
      job.data.documentId, 
      null, 
      JobStatus.FAILED, 
      error.message
    );
  }

  @Process('process')
  async processDocument(job: Job<DocumentProcessingJob>) {
    this.logger.log(`Processing document ${job.data.documentId}`);
    const startTime = Date.now();

    try {
      // Simulate document processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      const documentType = job.data.documentType || 'unknown';
      let extractedText = '';

      // Simulate text extraction based on document type
      switch (documentType) {
        case 'medical_certificate':
          extractedText = this.simulateMedicalCertificateExtraction();
          break;
        case 'fitness_declaration':
          extractedText = this.simulateFitnessDeclarationExtraction();
          break;
        default:
          extractedText = this.simulateGenericTextExtraction();
          break;
      }

      // Return the extracted text and processing time
      const processingTime = Date.now() - startTime;
      return {
        documentId: job.data.documentId,
        mimeType: job.data.mimeType,
        extractedText,
        documentType,
        processingTimeMs: processingTime,
        extractedData: {
          documentType,
          text: extractedText,
          confidence: 0.87,
          processingTimeMs: processingTime,
        }
      };
    } catch (error) {
      this.logger.error(`Error processing document: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('analyze')
  async analyzeDocument(job: Job<DocumentAnalysisJob>) {
    this.logger.log(`Analyzing document ${job.data.documentId}`);
    const startTime = Date.now();

    try {
      // Simulate document analysis time
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Extract structure from the content
      const extractedData = this.simulateDataExtraction(job.data.content);

      // Return the analyzed data and processing time
      const processingTime = Date.now() - startTime;
      return {
        documentId: job.data.documentId,
        extractedData,
        processingTimeMs: processingTime,
        confidence: 0.92,
      };
    } catch (error) {
      this.logger.error(`Error analyzing document: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('generate-certificate')
  async generateCertificate(job: Job<CertificateGenerationJob>) {
    this.logger.log(`Generating certificate for document ${job.data.documentId}`);
    const startTime = Date.now();

    try {
      // Simulate certificate generation time
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate certificate URL
      const certificateUrl = `https://storage.example.com/certificates/${job.data.documentId}.pdf`;

      // Return the certificate data and processing time
      const processingTime = Date.now() - startTime;
      return {
        documentId: job.data.documentId,
        certificateUrl,
        templateId: job.data.templateId,
        processingTimeMs: processingTime,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error generating certificate: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper methods to update job status in the database
  private async updateJobStatus(
    jobId: string, 
    documentId: string, 
    status: JobStatus,
  ) {
    // This would normally update a job tracking table in the database
    this.logger.debug(`Updated job ${jobId} to status ${status}`);
  }

  private async updateJobCompletion(
    jobId: string, 
    documentId: string, 
    result: any, 
    status: JobStatus,
    error?: string,
  ) {
    // This would normally update a job tracking table with results
    this.logger.debug(`Completed job ${jobId} with status ${status}`);
    
    if (error) {
      this.logger.error(`Job error: ${error}`);
    }
  }

  // Simulation methods for document processing
  private simulateMedicalCertificateExtraction(): string {
    return `MEDICAL CERTIFICATE
      
Patient Name: John Smith
Date of Birth: 12/05/1985
Date of Examination: 15/06/2025
Doctor: Dr. Sarah Johnson
Medical License: ML12345
      
The patient has been examined and is found to be fit for work.
No restrictions or limitations apply.
      
Signed: Dr. Sarah Johnson
Expiry Date: 15/12/2025`;
  }

  private simulateFitnessDeclarationExtraction(): string {
    return `FITNESS DECLARATION
      
Candidate Name: Emily Wilson
Date of Birth: 22/09/1990
Position Applied For: Construction Worker
Date of Declaration: 10/06/2025
      
I hereby declare that I am physically fit and do not have any medical conditions 
that would prevent me from performing the duties required for the position.
      
Signed: Emily Wilson
Date: 10/06/2025`;
  }

  private simulateGenericTextExtraction(): string {
    return `This is a generic document with some text content.
It may contain various information but is not in a specific format.
Some numbers: 12345, 67890
Some dates: 01/01/2025, 31/12/2025
End of document.`;
  }

  private simulateDataExtraction(content: string): Record<string, any> {
    // Simple extraction simulation
    const nameMatch = content.match(/name:?\s*([^\n]+)/i);
    const dateMatch = content.match(/date:?\s*([^\n]+)/i);
    const dobMatch = content.match(/date of birth:?\s*([^\n]+)/i);
    
    return {
      name: nameMatch ? nameMatch[1].trim() : null,
      date: dateMatch ? dateMatch[1].trim() : null,
      dateOfBirth: dobMatch ? dobMatch[1].trim() : null,
      content: content.substring(0, 100) + '...',
    };
  }
}