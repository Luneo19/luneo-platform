/**
 * Rate Limit Decorator
 * Configures rate limiting for endpoints
 */

import { SetMetadata } from '@nestjs/common';
import { RateLimitConfig } from './sliding-window.service';

export const RATE_LIMIT_METADATA = 'rate_limit';
export const RATE_LIMIT_SKIP_METADATA = 'rate_limit_skip';

/**
 * Configure rate limiting for an endpoint
 * 
 * @example
 * ```typescript
 * @RateLimit({ limit: 100, window: 60 }) // 100 requests per minute
 * @Get('products')
 * async getProducts() { ... }
 * ```
 */
export function RateLimit(config: RateLimitConfig) {
  return SetMetadata(RATE_LIMIT_METADATA, config);
}

/**
 * Skip rate limiting for an endpoint
 * Useful for health checks, public endpoints, etc.
 */
export function SkipRateLimit() {
  return SetMetadata(RATE_LIMIT_SKIP_METADATA, true);
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * Strict: 10 requests per minute
   */
  STRICT: { limit: 10, window: 60 },
  
  /**
   * Standard: 100 requests per minute
   */
  STANDARD: { limit: 100, window: 60 },
  
  /**
   * Generous: 1000 requests per minute
   */
  GENEROUS: { limit: 1000, window: 60 },
  
  /**
   * API: 60 requests per minute
   */
  API: { limit: 60, window: 60 },
  
  /**
   * Auth: 5 requests per minute (login attempts)
   */
  AUTH: { limit: 5, window: 60 },
  
  /**
   * Upload: 10 requests per hour
   */
  UPLOAD: { limit: 10, window: 3600 },
  
  /**
   * Webhook: 1000 requests per hour
   */
  WEBHOOK: { limit: 1000, window: 3600 },
} as const;

