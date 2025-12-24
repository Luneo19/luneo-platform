import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract timezone from request headers
 * Usage: @Timezone() timezone: string
 */
export const Timezone = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-timezone'] || 'UTC';
  },
);

