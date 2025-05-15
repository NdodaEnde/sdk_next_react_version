import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentQueueProducer } from '../../queue/producers/document-queue.producer';
import { S3Service } from '../../storage/services/s3.service';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentQueueProducer: DocumentQueueProducer,
    private readonly s3Service: S3Service,
  ) {}

  async findById(id: string, organizationId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found in organization ${organizationId}`);
    }

    return document;
  }

  async createDocument(data: {
    name: string;
    filePath: string;
    contentType: string;
    size: number;
    organizationId: string;
    uploadedById: string;
    documentType?: string;
  }) {
    const document = await this.prisma.document.create({
      data: {
        name: data.name,
        filePath: data.filePath,
        contentType: data.contentType,
        size: data.size,
        status: 'uploaded',
        organizationId: data.organizationId,
        uploadedById: data.uploadedById,
        documentType: data.documentType || 'unknown',
      },
    });

    // Automatically queue document for processing
    await this.queueDocumentForProcessing(document.id, data.organizationId);

    return document;
  }

  async updateDocumentWithProcessingResult(
    documentId: string,
    organizationId: string,
    result: {
      status: string;
      resultPath?: string;
      extractedData?: Record<string, any>;
      error?: string;
    },
  ) {
    const document = await this.findById(documentId, organizationId);

    // Update document with processing results
    return await this.prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        status: result.status,
        resultPath: result.resultPath,
        extractedData: result.extractedData,
        processingError: result.error,
        processedAt: new Date(),
      },
    });
  }

  async queueDocumentForProcessing(documentId: string, organizationId: string) {
    // Get document details
    const document = await this.findById(documentId, organizationId);

    // Determine processing type based on document type or content
    const processingType = this.determineProcessingType(document);

    // Update document status to 'processing'
    await this.prisma.document.update({
      where: {
        id: documentId,
      },
      data: {
        status: 'processing',
      },
    });

    // Create a job in the queue
    const job = await this.documentQueueProducer.addDocumentProcessingJob({
      type: 'process',
      documentId,
      organizationId,
      filePath: document.filePath,
      contentType: document.contentType,
      processingType,
    });

    this.logger.log(`Document ${documentId} queued for processing with job ID ${job.id}`);

    return job;
  }

  private determineProcessingType(document: any): string {
    // Logic to determine what type of processing to use based on the document
    const documentType = document.documentType?.toLowerCase() || '';
    const fileName = document.name?.toLowerCase() || '';
    
    if (documentType === 'certificate' || fileName.includes('certificate')) {
      return 'certificate';
    } else if (documentType === 'medical_test' || fileName.includes('test') || fileName.includes('lab')) {
      return 'medical_test';
    } else if (documentType === 'fitness_declaration' || fileName.includes('fitness') || fileName.includes('declaration')) {
      return 'fitness_declaration';
    }
    
    // Default to certificate processing
    return 'certificate';
  }

  async findDocumentsByOrganization(organizationId: string, options: {
    skip?: number;
    take?: number;
    orderBy?: any;
    where?: any;
  } = {}) {
    const { skip = 0, take = 50, orderBy = { createdAt: 'desc' }, where = {} } = options;

    const documents = await this.prisma.document.findMany({
      where: {
        organizationId,
        ...where,
      },
      skip,
      take,
      orderBy,
    });

    const count = await this.prisma.document.count({
      where: {
        organizationId,
        ...where,
      },
    });

    return {
      data: documents,
      meta: {
        total: count,
        skip,
        take,
      },
    };
  }
}