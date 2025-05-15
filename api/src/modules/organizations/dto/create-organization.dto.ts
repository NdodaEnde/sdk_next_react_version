import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, Matches, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({ description: 'Organization name' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ description: 'Organization slug - URL-friendly identifier' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  @MinLength(3)
  slug: string;

  @ApiProperty({ description: 'Organization type', enum: ['service_provider', 'client'] })
  @IsEnum(['service_provider', 'client'])
  type: string;

  @ApiProperty({ description: 'Parent organization ID (for client organizations)', required: false })
  @IsString()
  @IsOptional()
  parentId?: string;
}