import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RateLimiterService } from '../services/rate-limiter.service';
import { RateLimitConfig } from '../services/rate-limiter.service';

export const RATE_LIMIT_KEY = 'rateLimit';
export const RATE_LIMIT_CONFIG_KEY = 'rateLimitConfig';

/**
 * Decorator to set rate limit configuration for a route
 */
export const RateLimit = (config?: Partial<RateLimitConfig>) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(RATE_LIMIT_KEY, true, descriptor.value);
      if (config) {
        Reflect.defineMetadata(RATE_LIMIT_CONFIG_KEY, config, descriptor.value);
      }
    } else {
      Reflect.defineMetadata(RATE_LIMIT_KEY, true, target);
      if (config) {
        Reflect.defineMetadata(RATE_LIMIT_CONFIG_KEY, config, target);
      }
    }
  };
};

/**
 * Tenant-aware rate limit guard
 * Extracts tenant ID from request (brandId or user.brandId) and applies rate limiting
 */
@Injectable()
export class TenantRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimiter: RateLimiterService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Check if rate limiting is enabled for this route
    const handler = context.getHandler();
    const isRateLimited = this.reflector.getAllAndOverride<boolean>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isRateLimited) {
      return true; // Rate limiting not enabled for this route
    }

    // Extract tenant ID
    const tenantId = this.extractTenantId(request);
    if (!tenantId) {
      // If no tenant ID, allow request (could also deny - depends on requirements)
      return true;
    }

    // Get custom config if provided
    const customConfig = this.reflector.getAllAndOverride<Partial<RateLimitConfig>>(
      RATE_LIMIT_CONFIG_KEY,
      [handler, context.getClass()],
    );

    // Check rate limit
    const result = await this.rateLimiter.checkRateLimit(tenantId, 1, customConfig);

    if (!result.allowed) {
      // Set rate limit headers
      const response = context.switchToHttp().getResponse();
      response.setHeader('X-RateLimit-Limit', customConfig?.capacity || 100);
      response.setHeader('X-RateLimit-Remaining', result.remaining);
      response.setHeader('X-RateLimit-Reset', result.resetAt);
      if (result.retryAfter) {
        response.setHeader('Retry-After', result.retryAfter);
      }

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          error: 'Too Many Requests',
          retryAfter: result.retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Set rate limit headers on success
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', customConfig?.capacity || 100);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', result.resetAt);

    return true;
  }

  private extractTenantId(request: Request): string | null {
    // Try multiple sources for tenant ID (brandId)
    if (request['brandId']) {
      return request['brandId'];
    }

    if (request.user && (request.user as any).brandId) {
      return (request.user as any).brandId;
    }

    if (request['apiKey'] && (request['apiKey'] as any).brandId) {
      return (request['apiKey'] as any).brandId;
    }

    // Try to extract from query params (for public APIs)
    if (request.query?.brandId) {
      return request.query.brandId as string;
    }

    return null;
  }
}
