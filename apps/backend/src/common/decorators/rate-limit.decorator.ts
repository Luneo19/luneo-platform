import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rateLimit';
export const RATE_LIMIT_TTL_KEY = 'rateLimitTtl';

/**
 * Decorator to configure rate limiting per endpoint
 * @param limit Maximum number of requests
 * @param ttl Time window in seconds
 */
export const RateLimit = (limit: number, ttl: number = 60) => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      SetMetadata(RATE_LIMIT_KEY, limit)(target, propertyKey, descriptor);
      SetMetadata(RATE_LIMIT_TTL_KEY, ttl)(target, propertyKey, descriptor);
    }
  };
};




















