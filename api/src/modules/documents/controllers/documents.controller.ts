import { Controller, Get, Post, Put, Delete, Body, Param, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from '../services/documents.service';
import { Tenant } from '../../../common/tenant/decorators/tenant.decorator';

@ApiTags('documents')
@Controller('documents')
@ApiBearerAuth()
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all documents for the current organization' })
  findAll(@Tenant() tenantId: string) {
    return this.documentsService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by ID' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new document' })
  create(@Body() createDocumentDto: any, @Request() req, @Tenant() tenantId: string) {
    return this.documentsService.create(
      { 
        ...createDocumentDto, 
        organizationId: tenantId 
      }, 
      req.user.sub,
      tenantId
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a document' })
  update(@Param('id') id: string, @Body() updateDocumentDto: any) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  delete(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create a new version of a document' })
  createVersion(
    @Param('id') id: string,
    @Body() createVersionDto: any,
    @Request() req,
    @Tenant() tenantId: string,
  ) {
    return this.documentsService.createVersion(
      id,
      createVersionDto,
      req.user.sub,
      tenantId
    );
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Process a document through the queue' })
  processDocument(
    @Param('id') id: string,
    @Request() req,
    @Tenant() tenantId: string,
  ) {
    return this.documentsService.processDocument(
      id,
      req.user.sub,
      tenantId
    );
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: 'Analyze document content through the queue' })
  analyzeDocument(
    @Param('id') id: string,
    @Body() body: { content?: string },
    @Request() req,
    @Tenant() tenantId: string,
  ) {
    return this.documentsService.analyzeDocument(
      id,
      req.user.sub,
      tenantId,
      body.content
    );
  }
}