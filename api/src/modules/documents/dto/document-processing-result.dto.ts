import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional, IsEnum } from 'class-validator';

export enum ProcessingStatus {
  SUCCESS = 'success',
  ERROR = 'error',
}

export class DocumentProcessingResultDto {
  @ApiProperty({
    description: 'Status of the document processing',
    enum: ProcessingStatus,
    example: ProcessingStatus.SUCCESS,
  })
  @IsEnum(ProcessingStatus)
  @IsNotEmpty()
  status: ProcessingStatus;

  @ApiProperty({
    description: 'ID of the document that was processed',
    example: 'c7f3d12e-1b8a-4d8f-9e3c-5b9a5f7d1234',
  })
  @IsString()
  @IsNotEmpty()
  documentId: string;

  @ApiProperty({
    description: 'ID of the organization the document belongs to',
    example: 'a4d8c31b-9e5f-4c6d-8b7a-2e1f3c5d4e6a',
  })
  @IsString()
  @IsNotEmpty()
  organizationId: string;

  @ApiPropertyOptional({
    description: 'Path to the result file in the storage',
    example: 'results/a4d8c31b/c7f3d12e/analysis_result.json',
  })
  @IsString()
  @IsOptional()
  resultPath?: string;

  @ApiPropertyOptional({
    description: 'Extracted data from the document',
    type: 'object',
    example: {
      patientName: 'John Doe',
      diagnoses: ['Hypertension', 'Type 2 Diabetes'],
      issueDate: '2023-01-15',
    },
  })
  @IsObject()
  @IsOptional()
  extractedData?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Error message if processing failed',
    example: 'Failed to extract data from document: Invalid format',
  })
  @IsString()
  @IsOptional()
  error?: string;
}