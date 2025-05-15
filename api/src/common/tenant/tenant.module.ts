import { Module, Global } from '@nestjs/common';
import { TenantGuard } from './guards/tenant.guard';

@Global()
@Module({
  providers: [TenantGuard],
  exports: [TenantGuard],
})
export class TenantModule {}