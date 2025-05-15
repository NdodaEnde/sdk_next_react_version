import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get document processing statistics
   */
  async getDocumentStats(organizationId: string, period: 'day' | 'week' | 'month' | 'year' = 'month') {
    // In a real implementation, this would use a SQL query or a stored procedure
    // For simulation, we'll return mock data
    
    const mockData = [
      { period: '2025-01', document_count: 32, successful_count: 28, failed_count: 4 },
      { period: '2025-02', document_count: 45, successful_count: 40, failed_count: 5 },
      { period: '2025-03', document_count: 38, successful_count: 35, failed_count: 3 },
      { period: '2025-04', document_count: 42, successful_count: 39, failed_count: 3 },
      { period: '2025-05', document_count: 50, successful_count: 48, failed_count: 2 },
      { period: '2025-06', document_count: 55, successful_count: 52, failed_count: 3 },
    ];
    
    if (period === 'day') {
      // Return daily data for the last 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          period: date.toISOString().split('T')[0],
          document_count: Math.floor(Math.random() * 10) + 5,
          successful_count: Math.floor(Math.random() * 8) + 2,
          failed_count: Math.floor(Math.random() * 2) + 0,
        };
      }).reverse();
    } else if (period === 'week') {
      // Return weekly data for the last 8 weeks
      return Array.from({ length: 8 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7));
        return {
          period: `Week ${date.toISOString().split('T')[0]}`,
          document_count: Math.floor(Math.random() * 20) + 10,
          successful_count: Math.floor(Math.random() * 15) + 8,
          failed_count: Math.floor(Math.random() * 5) + 1,
        };
      }).reverse();
    } else {
      // Return monthly data
      return mockData;
    }
  }

  /**
   * Get certificate expiration statistics
   */
  async getCertificateExpirations(organizationId: string) {
    // In a real implementation, this would use a SQL query or a stored procedure
    // For simulation, we'll return mock data
    
    return [
      { days_to_expiry: 'This week', certificate_count: 5 },
      { days_to_expiry: 'This month', certificate_count: 12 },
      { days_to_expiry: 'This quarter', certificate_count: 28 },
      { days_to_expiry: 'Later', certificate_count: 47 },
    ];
  }

  /**
   * Get user activity feed
   */
  async getUserActivity(organizationId: string, limit: number = 10) {
    // In a real implementation, this would query an activity_log table
    // For simulation, we'll return mock data
    
    const activities = [
      { 
        id: '1', 
        organization_id: organizationId, 
        user_id: 'user1', 
        action: 'created a new certificate', 
        entity_type: 'certificate', 
        entity_id: 'cert1', 
        metadata: { user_name: 'Dr. Smith', entity_name: 'John Doe' }, 
        created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() 
      },
      { 
        id: '2', 
        organization_id: organizationId, 
        user_id: 'user2', 
        action: 'updated patient record', 
        entity_type: 'patient', 
        entity_id: 'patient1', 
        metadata: { user_name: 'Dr. Johnson', entity_name: 'Jane Smith' }, 
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() 
      },
      { 
        id: '3', 
        organization_id: organizationId, 
        user_id: 'user3', 
        action: 'uploaded a document', 
        entity_type: 'document', 
        entity_id: 'doc1', 
        metadata: { user_name: 'Nurse Williams', entity_name: 'Robert Brown' }, 
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString() 
      },
      { 
        id: '4', 
        organization_id: organizationId, 
        user_id: 'user4', 
        action: 'created a new certificate', 
        entity_type: 'certificate', 
        entity_id: 'cert2', 
        metadata: { user_name: 'Dr. Taylor', entity_name: 'Alice Johnson' }, 
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString() 
      },
      { 
        id: '5', 
        organization_id: organizationId, 
        user_id: 'user5', 
        action: 'added a new user', 
        entity_type: 'user', 
        entity_id: 'user6', 
        metadata: { user_name: 'Admin Wilson' }, 
        created_at: new Date(Date.now() - 25 * 3600 * 1000).toISOString() 
      },
    ];
    
    return activities.slice(0, limit);
  }

  /**
   * Get document processing time statistics
   */
  async getProcessingTimeStats(organizationId: string) {
    // In a real implementation, this would use a SQL query or a stored procedure
    // For simulation, we'll return mock data
    
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const randomTime = Math.random() * 10 + 2; // Random time between 2 and 12 seconds
      return {
        date: date.toISOString().split('T')[0],
        avg_processing_time_seconds: parseFloat(randomTime.toFixed(1)),
      };
    }).reverse();
  }

  /**
   * Get document type distribution statistics
   */
  async getDocumentTypeStats(organizationId: string) {
    // In a real implementation, this would use a SQL query or a stored procedure
    // For simulation, we'll return mock data
    
    return [
      { document_type: 'Medical Certificate', count: 48 },
      { document_type: 'Fitness Declaration', count: 32 },
      { document_type: 'Lab Report', count: 25 },
      { document_type: 'X-Ray Report', count: 18 },
      { document_type: 'MRI Report', count: 12 },
      { document_type: 'Other', count: 8 },
    ];
  }

  /**
   * Get dashboard summary statistics
   */
  async getDashboardStats(organizationId: string) {
    // In a real implementation, this would use a SQL query or a stored procedure
    // For simulation, we'll return mock data
    
    return {
      totalDocuments: 143,
      documentsChange: 12.5,
      successRate: 94.5,
      successRateChange: 2.3,
      avgProcessingTime: 5.2,
      processingTimeChange: 8.1, // Reduction in processing time
      expiringCertificates: 17,
      expiringCertificatesChange: -5.2, // Decrease in expiring certificates is good
    };
  }
}