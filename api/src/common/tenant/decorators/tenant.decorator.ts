import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Decorator to extract tenant ID from request
export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);

// Decorator to skip tenant requirement for a route
export const SkipTenant = () => {
  return (target: any, key?: string, descriptor?: any) => {
    if (descriptor) {
      // Method decorator
      Reflect.defineMetadata('skipTenant', true, descriptor.value);
      return descriptor;
    }
    // Class decorator
    Reflect.defineMetadata('skipTenant', true, target);
    return target;
  };
};