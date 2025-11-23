import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from './logger';

const hasRedisConfig =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

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

const createSlidingWindowLimiter = (
  points: number,
  window: SlidingWindowInterval,
  prefix: string
): RateLimiter => {
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

// Rate limiters pour différentes routes
export const apiRateLimit = createSlidingWindowLimiter(100, '1 m', 'ratelimit:api'); // 100 requêtes / minute
export const authRateLimit = createSlidingWindowLimiter(5, '15 m', 'ratelimit:auth'); // 5 tentatives / 15 min
export const aiGenerateRateLimit = createSlidingWindowLimiter(10, '1 h', 'ratelimit:ai'); // 10 générations / heure
export const stripeWebhookRateLimit = createSlidingWindowLimiter(
  1000,
  '1 m',
  'ratelimit:stripe'
); // 1000 webhooks / minute

/**
 * Fonction helper pour vérifier le rate limit
 * @param identifier - Identifiant unique (IP, user ID, etc.)
 * @param limiter - Instance de Ratelimit à utiliser
 * @returns { success: boolean, remaining: number, reset: Date }
 */
export async function checkRateLimit(
  identifier: string,
  limiter: RateLimiter = apiRateLimit
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

