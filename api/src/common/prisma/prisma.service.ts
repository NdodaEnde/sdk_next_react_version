import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method to create a Prisma client for a specific tenant
  async createTransactionClient(tenantId?: string) {
    if (!tenantId) {
      return this;
    }

    // Return a transaction with the tenant context set
    return this.$transaction(async (tx) => {
      // Set the tenant context
      await tx.$executeRawUnsafe(`SELECT set_current_tenant('${tenantId}'::uuid)`);
      return tx;
    });
  }
}