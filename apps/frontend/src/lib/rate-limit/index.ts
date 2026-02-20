/**
 * Rate Limiting Library for Next.js
 * Uses Upstash Redis for distributed rate limiting
 * Inspired by Vercel Edge Rate Limiting and Stripe API
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

// Initialize Redis client (Upstash)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Rate limit configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Auth endpoints - strict (5 req/min)
  auth: {
    limit: 5,
    window: '1 m',
  },
  // API endpoints - standard (100 req/min)
  api: {
    limit: 100,
    window: '1 m',
  },
  // Public endpoints - generous (200 req/min)
  public: {
    limit: 200,
    window: '1 m',
  },
  // Upload endpoints - strict (10 req/hour)
  upload: {
    limit: 10,
    window: '1 h',
  },
  // Webhook endpoints - very generous (1000 req/hour)
  webhook: {
    limit: 1000,
    window: '1 h',
  },
} as const;

/**
 * Create rate limiter instance
 */
function createRateLimiter(limit: number, window: string) {
  return new Ratelimit({
    redis,
    // Upstash Ratelimit accepts window as string e.g. '1 m', '1 h'
    limiter: Ratelimit.slidingWindow(limit, window as '1 s' | '1 m' | '1 h' | '1 d'),
    analytics: true,
    prefix: '@luneo/rate-limit',
  });
}

/**
 * Rate limiters for each endpoint type
 */
export const rateLimiters = {
  auth: createRateLimiter(rateLimitConfigs.auth.limit, rateLimitConfigs.auth.window),
  api: createRateLimiter(rateLimitConfigs.api.limit, rateLimitConfigs.api.window),
  public: createRateLimiter(rateLimitConfigs.public.limit, rateLimitConfigs.public.window),
  upload: createRateLimiter(rateLimitConfigs.upload.limit, rateLimitConfigs.upload.window),
  webhook: createRateLimiter(rateLimitConfigs.webhook.limit, rateLimitConfigs.webhook.window),
};

/**
 * Get client identifier for rate limiting
 * Priority: User ID > Session ID > IP Address
 */
export function getClientIdentifier(request: Request): string {
  // Try to get user ID from headers (set by auth middleware)
  const userId = request.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get session ID from cookies
  const sessionId = request.headers.get('cookie')?.match(/sessionId=([^;]+)/)?.[1];
  if (sessionId) {
    return `session:${sessionId}`;
  }

  // Fallback to IP address
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * Check rate limit for a given identifier and config
 */
export async function checkRateLimit(
  identifier: string,
  config: { limit: number; window: string },
): Promise<{ success: boolean; remaining: number; reset: Date }> {
  // If Redis is not configured, allow all requests in development
  if (!process.env.UPSTASH_REDIS_REST_URL && process.env.NODE_ENV === 'development') {
    return {
      success: true,
      remaining: config.limit,
      reset: new Date(Date.now() + 60000), // 1 minute from now
    };
  }

  // If Redis is not configured in production, use in-memory fallback
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    logger.warn('UPSTASH_REDIS_REST_URL not configured — using in-memory rate limiting (not suitable for multi-instance)');
    return inMemoryRateLimit(identifier, config);
  }

  const limiter = createRateLimiter(config.limit, config.window);
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    remaining: result.remaining,
    reset: new Date(result.reset),
  };
}

/**
 * Get rate limit config for API endpoints
 */
export function getApiRateLimit(): { limit: number; window: string } {
  return rateLimitConfigs.api;
}

/**
 * Get rate limit config for auth endpoints
 */
export function getAuthRateLimit(): { limit: number; window: string } {
  return rateLimitConfigs.auth;
}

/**
 * Get rate limit config for upload endpoints
 */
export function getUploadRateLimit(): { limit: number; window: string } {
  return rateLimitConfigs.upload;
}

const inMemoryStore = new Map<string, { count: number; resetTime: number }>();

function inMemoryRateLimit(
  identifier: string,
  config: { limit: number; window: string },
): { success: boolean; remaining: number; reset: Date } {
  const windowMs = parseWindow(config.window);
  const now = Date.now();
  const entry = inMemoryStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    inMemoryStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: config.limit - 1, reset: new Date(now + windowMs) };
  }

  entry.count++;
  const remaining = Math.max(0, config.limit - entry.count);
  return {
    success: entry.count <= config.limit,
    remaining,
    reset: new Date(entry.resetTime),
  };
}

function parseWindow(window: string): number {
  const parts = window.trim().split(/\s+/);
  const value = parseInt(parts[0], 10) || 1;
  const unit = (parts[1] || 'm').charAt(0);
  switch (unit) {
    case 's': return value * 1000;
    case 'h': return value * 3600000;
    case 'd': return value * 86400000;
    default: return value * 60000;
  }
}

/**
 * Get rate limit config based on pathname
 */
export function getRateLimitConfig(pathname: string): { limit: number; window: string } {
  if (pathname.startsWith('/api/auth')) {
    return rateLimitConfigs.auth;
  }
  if (pathname.startsWith('/api/upload') || pathname.startsWith('/api/files')) {
    return rateLimitConfigs.upload;
  }
  if (pathname.startsWith('/api/webhook')) {
    return rateLimitConfigs.webhook;
  }
  if (pathname.startsWith('/api/')) {
    return rateLimitConfigs.api;
  }
  return rateLimitConfigs.public;
}
