import { Ratelimit } from '@upstash/ratelimit';
import { Redis, type Redis as RedisType } from '@upstash/redis';
import { logger } from './logger';

// Lazy initialization to avoid build-time errors
let redisInstance: RedisType | null | undefined = undefined;

function getRedis(): RedisType | null {
  if (redisInstance !== undefined) {
    return redisInstance;
  }

  const hasRedisConfig =
    Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (!hasRedisConfig) {
    redisInstance = null;
    return null;
  }

  try {
    const instance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!.trim(),
      token: process.env.UPSTASH_REDIS_REST_TOKEN!.trim(),
    });
    redisInstance = instance;
    return instance;
  } catch (error) {
    logger.warn('Failed to initialize Redis', { error: error instanceof Error ? error.message : String(error) });
    redisInstance = null;
    return null;
  }
}

type RateLimiterResult = Awaited<ReturnType<Ratelimit['limit']>>;
export type RateLimiter = Pick<Ratelimit, 'limit'>;
type SlidingWindowInterval = Parameters<typeof Ratelimit.slidingWindow>[1];

const createNoopLimiter = (): RateLimiter => ({
  async limit(): Promise<RateLimiterResult> {
    const now = Date.now();
    return {
      success: true,
      limit: Number.MAX_SAFE_INTEGER,
      remaining: Number.MAX_SAFE_INTEGER,
      reset: now,
      pending: Promise.resolve(0),
    };
  },
});

// Lazy-created limiters
let apiRateLimitInstance: RateLimiter | null = null;
let authRateLimitInstance: RateLimiter | null = null;
let aiGenerateRateLimitInstance: RateLimiter | null = null;
let stripeWebhookRateLimitInstance: RateLimiter | null = null;

const createSlidingWindowLimiter = (
  points: number,
  window: SlidingWindowInterval,
  prefix: string
): RateLimiter => {
  const redis = getRedis();
  if (!redis) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Upstash Redis non configuré - rate limiting désactivé', {
        prefix,
        points,
        window: typeof window === 'string' ? window : `${window}ms`,
      });
    }
    return createNoopLimiter();
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(points, window),
    analytics: true,
    prefix,
  });
};

// Getter functions for lazy initialization
export const getApiRateLimit = (): RateLimiter => {
  if (!apiRateLimitInstance) {
    apiRateLimitInstance = createSlidingWindowLimiter(100, '1 m', 'ratelimit:api');
  }
  return apiRateLimitInstance;
};

export const getAuthRateLimit = (): RateLimiter => {
  if (!authRateLimitInstance) {
    authRateLimitInstance = createSlidingWindowLimiter(5, '15 m', 'ratelimit:auth');
  }
  return authRateLimitInstance;
};

export const getAiGenerateRateLimit = (): RateLimiter => {
  if (!aiGenerateRateLimitInstance) {
    aiGenerateRateLimitInstance = createSlidingWindowLimiter(10, '1 h', 'ratelimit:ai');
  }
  return aiGenerateRateLimitInstance;
};

export const getStripeWebhookRateLimit = (): RateLimiter => {
  if (!stripeWebhookRateLimitInstance) {
    stripeWebhookRateLimitInstance = createSlidingWindowLimiter(1000, '1 m', 'ratelimit:stripe');
  }
  return stripeWebhookRateLimitInstance;
};

// Legacy exports for backwards compatibility (use getters when possible)
export const apiRateLimit = { limit: async (identifier: string) => getApiRateLimit().limit(identifier) };
export const authRateLimit = { limit: async (identifier: string) => getAuthRateLimit().limit(identifier) };
export const aiGenerateRateLimit = { limit: async (identifier: string) => getAiGenerateRateLimit().limit(identifier) };
export const stripeWebhookRateLimit = { limit: async (identifier: string) => getStripeWebhookRateLimit().limit(identifier) };

/**
 * Fonction helper pour vérifier le rate limit
 * @param identifier - Identifiant unique (IP, user ID, etc.)
 * @param limiter - Instance de Ratelimit à utiliser
 * @returns { success: boolean, remaining: number, reset: Date }
 */
export async function checkRateLimit(
  identifier: string,
  limiter: RateLimiter = getApiRateLimit()
) {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  return {
    success,
    limit,
    remaining,
    reset: new Date(reset),
  };
}

/**
 * Get client identifier (IP or user ID)
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  
  // Essayer d'obtenir l'IP depuis les headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }
  
  if (realIp) {
    return `ip:${realIp}`;
  }
  
  return 'ip:unknown';
}
