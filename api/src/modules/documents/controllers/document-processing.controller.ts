import { Controller, Post, Body, HttpStatus, HttpCode, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../tenant/guards/tenant.guard';
import { User } from '../../users/decorators/user.decorator';
import { Tenant } from '../../tenant/decorators/tenant.decorator';
import { DocumentService } from '../services/document.service';
import { DocumentProcessingResultDto } from '../dto/document-processing-result.dto';

@ApiTags('documents')
@Controller('documents')
export class DocumentProcessingController {
  private readonly logger = new Logger(DocumentProcessingController.name);

  constructor(private readonly documentService: DocumentService) {}

  @Post('process-result')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive document processing result from worker' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Processing result saved successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request data' })
  async receiveProcessingResult(
    @Body() result: DocumentProcessingResultDto,
  ) {
    this.logger.log(`Received processing result for document ${result.documentId}`);
    
    try {
      // Update document with processing results
      await this.documentService.updateDocumentWithProcessingResult(
        result.documentId,
        result.organizationId,
        {
          status: result.status === 'success' ? 'processed' : 'processing_failed',
          resultPath: result.resultPath,
          extractedData: result.extractedData,
          error: result.error,
        },
      );
      
      return { success: true, message: 'Document processing result saved successfully' };
    } catch (error) {
      this.logger.error(`Error saving processing result: ${error.message}`, error.stack);
      return { 
        success: false, 
        message: 'Failed to save document processing result',
        error: error.message 
      };
    }
  }

  @Post('trigger-processing')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger document processing' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Document processing triggered' })
  async triggerDocumentProcessing(
    @Body('documentId') documentId: string,
    @User('id') userId: string,
    @Tenant('id') tenantId: string,
  ) {
    this.logger.log(`User ${userId} triggered processing for document ${documentId}`);
    
    // Trigger document processing via the queue
    const job = await this.documentService.queueDocumentForProcessing(documentId, tenantId);
    
    return { 
      success: true, 
      message: 'Document processing triggered',
      jobId: job.id
    };
  }
}