import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/tenant/guards/tenant.guard';
import { Tenant } from '../../common/tenant/decorators/tenant.decorator';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('documents')
  @ApiOperation({ summary: 'Get document processing statistics' })
  @ApiResponse({ status: 200, description: 'Returns document processing statistics' })
  @ApiQuery({ name: 'period', enum: ['day', 'week', 'month', 'year'], required: false })
  async getDocumentStats(
    @Tenant('id') tenantId: string,
    @Query('period') period: 'day' | 'week' | 'month' | 'year' = 'month',
  ) {
    return this.analyticsService.getDocumentStats(tenantId, period);
  }

  @Get('certificates/expirations')
  @ApiOperation({ summary: 'Get certificate expiration statistics' })
  @ApiResponse({ status: 200, description: 'Returns certificate expiration statistics' })
  async getCertificateExpirations(@Tenant('id') tenantId: string) {
    return this.analyticsService.getCertificateExpirations(tenantId);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get user activity feed' })
  @ApiResponse({ status: 200, description: 'Returns user activity feed' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserActivity(
    @Tenant('id') tenantId: string,
    @Query('limit') limit?: number,
  ) {
    return this.analyticsService.getUserActivity(tenantId, limit ? parseInt(limit.toString()) : 10);
  }

  @Get('processing-time')
  @ApiOperation({ summary: 'Get document processing time statistics' })
  @ApiResponse({ status: 200, description: 'Returns document processing time statistics' })
  async getProcessingTimeStats(@Tenant('id') tenantId: string) {
    return this.analyticsService.getProcessingTimeStats(tenantId);
  }

  @Get('document-types')
  @ApiOperation({ summary: 'Get document type distribution statistics' })
  @ApiResponse({ status: 200, description: 'Returns document type distribution statistics' })
  async getDocumentTypeStats(@Tenant('id') tenantId: string) {
    return this.analyticsService.getDocumentTypeStats(tenantId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get dashboard summary statistics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard summary statistics' })
  async getDashboardStats(@Tenant('id') tenantId: string) {
    return this.analyticsService.getDashboardStats(tenantId);
  }
}