import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './common/prisma/prisma.module';
import { TenantModule } from './common/tenant/tenant.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { QueueModule } from './modules/queue/queue.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { TenantGuard } from './common/tenant/guards/tenant.guard';

@Module({
  imports: [
    // Core modules
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    TenantModule,
    
    // Feature modules
    AuthModule,
    UsersModule,
    OrganizationsModule,
    DocumentsModule,
    QueueModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [
    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule {}