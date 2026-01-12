import { SetMetadata } from '@nestjs/common';
import { ThrottlerOptions } from '@nestjs/throttler';

export const RATE_LIMIT_KEY = 'rateLimit';

/**
 * Custom rate limit decorator
 * Inspired by Stripe and GitHub API rate limiting
 * 
 * Usage:
 * @RateLimit({ limit: 10, ttl: 60000 }) // 10 requests per minute
 */
export const RateLimit = (options: ThrottlerOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
