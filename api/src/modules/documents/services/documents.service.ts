import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { DocumentQueueProducer } from '../../queue/producers/document-queue.producer';

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private documentQueue: DocumentQueueProducer,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.document.findMany({
      where: { organizationId: tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            createdBy: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async create(data: any, userId: string, organizationId: string) {
    // Create the document in the database
    const document = await this.prisma.document.create({
      data: {
        ...data,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    // If storage path and mime type are provided, queue document for processing
    if (document.storagePath && document.mimeType) {
      const job = await this.documentQueue.addDocumentProcessingJob({
        documentId: document.id,
        organizationId,
        userId,
        storagePath: document.storagePath,
        mimeType: document.mimeType,
        documentType: document.type,
      });

      // Return the document with job information
      return {
        ...document,
        processingJob: {
          id: job.id,
          status: 'queued',
        },
      };
    }

    return document;
  }

  async update(id: string, data: any) {
    return this.prisma.document.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.document.delete({
      where: { id },
    });
  }

  async createVersion(documentId: string, data: any, userId: string, organizationId: string) {
    // Get the document to check its type
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { type: true, mimeType: true },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Get the current highest version number
    const latestVersion = await this.prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
    });

    const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    // Create the new version
    const version = await this.prisma.documentVersion.create({
      data: {
        ...data,
        documentId,
        versionNumber,
        createdById: userId,
      },
    });

    // Queue the version for processing if it has a storage path
    if (version.storagePath) {
      const job = await this.documentQueue.addDocumentProcessingJob({
        documentId,
        organizationId,
        userId,
        storagePath: version.storagePath,
        mimeType: document.mimeType || 'application/octet-stream',
        documentType: document.type,
      });

      // Return the version with job information
      return {
        ...version,
        processingJob: {
          id: job.id,
          status: 'queued',
        },
      };
    }

    return version;
  }

  async processDocument(id: string, userId: string, organizationId: string) {
    // Get the document
    const document = await this.prisma.document.findUnique({
      where: { id },
      select: { 
        id: true, 
        storagePath: true, 
        mimeType: true, 
        type: true, 
        metadata: true 
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Queue the document for processing
    const job = await this.documentQueue.addDocumentProcessingJob({
      documentId: document.id,
      organizationId,
      userId,
      storagePath: document.storagePath,
      mimeType: document.mimeType,
      documentType: document.type,
    });

    return {
      document,
      processingJob: {
        id: job.id,
        status: 'queued',
      },
    };
  }

  async analyzeDocument(id: string, userId: string, organizationId: string, content?: string) {
    // Get the document
    const document = await this.prisma.document.findUnique({
      where: { id },
      select: { 
        id: true, 
        metadata: true 
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Use content from parameters or from document metadata
    const textContent = content || 
      (document.metadata && typeof document.metadata === 'object' && document.metadata.extractedText);

    if (!textContent) {
      throw new Error('No content available for analysis');
    }

    // Queue the document for analysis
    const job = await this.documentQueue.addDocumentAnalysisJob({
      documentId: document.id,
      organizationId,
      userId,
      content: textContent,
      metadata: document.metadata as Record<string, any>,
    });

    return {
      document,
      processingJob: {
        id: job.id,
        status: 'queued',
      },
    };
  }
}