import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

/**
 * Rate limiting guard that limits requests per tenant (brandId)
 * Uses decorators to configure limits per endpoint
 */
@Injectable()
export class RateLimitByTenantGuard implements CanActivate {
  constructor(
    private readonly cache: SmartCacheService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Skip if no user or brandId (public endpoints)
    if (!user || !user.brandId) {
      return true;
    }

    // Get rate limit configuration from decorator
    const limit = this.reflector.get<number>('rateLimit', context.getHandler()) || 100;
    const ttl = this.reflector.get<number>('rateLimitTtl', context.getHandler()) || 60;
    const key = `rate-limit:${user.brandId}:${request.method}:${request.path}`;

    // Get current count
    const count = (await this.cache.getSimple<number>(key)) || 0;

    if (count >= limit) {
      throw new HttpException(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          limit,
          ttl,
          retryAfter: ttl,
          brandId: user.brandId,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment count
    await this.cache.setSimple(key, count + 1, ttl);
    return true;
  }
}
































