import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the endpoint is marked to skip tenant verification
    const skipTenant = this.reflector.getAllAndOverride<boolean>('skipTenant', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipTenant) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    
    // Skip tenant check for public routes
    if (!req.user) {
      return true;
    }

    // Get organization ID from request header or user claims
    const organizationId = 
      req.headers['x-organization-id'] || 
      (req.user && req.user.organizationId);

    if (!organizationId) {
      throw new UnauthorizedException('Organization context is required');
    }

    // Verify the user has access to this organization
    const userOrganization = await this.prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: req.user.sub,
        },
      },
    });

    if (!userOrganization) {
      throw new UnauthorizedException('User does not have access to this organization');
    }

    // Set tenant ID in request object for use in controllers
    req.tenantId = organizationId;

    // Set the tenant context in database session
    await this.prisma.$executeRawUnsafe(`SELECT set_current_tenant('${organizationId}'::uuid)`);

    return true;
  }
}