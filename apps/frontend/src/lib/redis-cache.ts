import type { Redis as RedisType } from '@upstash/redis';
import { logger } from '@/lib/logger';

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
    // Dynamic import to avoid build-time initialization
    const { Redis } = require('@upstash/redis');
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

/**
 * Cache configuration for different data types
 */
export const CACHE_TTL = {
  DASHBOARD_STATS: 60, // 1 minute
  ANALYTICS: 300, // 5 minutes
  USER_PROFILE: 600, // 10 minutes
  DESIGNS_LIST: 180, // 3 minutes
  ORDERS_LIST: 120, // 2 minutes
  AR_MODELS: 300, // 5 minutes
  INTEGRATIONS: 180, // 3 minutes
} as const;

/**
 * Get cached data
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) {
    logger.warn('Redis not configured, skipping cache get', { key });
    return null;
  }

  try {
    const cached = await redis.get(key);
    if (!cached) return null;

    return cached as T;
  } catch (error) {
    logger.error('Redis GET error', {
      error,
      key,
    });
    return null;
  }
}

/**
 * Set cache data with TTL
 */
export async function setCache(
  key: string,
  value: unknown,
  ttl: number = CACHE_TTL.DASHBOARD_STATS
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    logger.warn('Redis not configured, skipping cache set', { key, ttl });
    return false;
  }

  try {
    await redis.set(key, value, { ex: ttl });
    return true;
  } catch (error) {
    logger.error('Redis SET error', {
      error,
      key,
      ttl,
    });
    return false;
  }
}

/**
 * Delete cache key
 */
export async function delCache(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    logger.warn('Redis not configured, skipping cache delete', { key });
    return false;
  }

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    logger.error('Redis DEL error', {
      error,
      key,
    });
    return false;
  }
}

/**
 * Delete cache keys by pattern
 */
export async function delCachePattern(pattern: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    logger.warn('Redis not configured, skipping cache delete pattern', { pattern });
    return false;
  }

  try {
    // Get all keys matching the pattern
    const keys = await redis.keys(pattern);
    
    if (keys.length === 0) return true;

    // Delete all matching keys
    await redis.del(...keys);
    return true;
  } catch (error) {
    logger.error('Redis DEL pattern error', {
      error,
      pattern,
    });
    return false;
  }
}

/**
 * Generate cache key for user-specific data
 */
export function userCacheKey(userId: string, resource: string, suffix?: string): string {
  return suffix
    ? `user:${userId}:${resource}:${suffix}`
    : `user:${userId}:${resource}`;
}

/**
 * Cache wrapper for API functions
 * Usage: const result = await cacheWrapper('key', fetchFunction, ttl);
 */
export async function cacheWrapper<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = CACHE_TTL.DASHBOARD_STATS
): Promise<T> {
  // Try to get from cache first
  const cached = await getCache<T>(key);
  if (cached) {
    logger.debug('Cache HIT', { key });
    return cached;
  }

  logger.debug('Cache MISS', { key });

  // Fetch fresh data
  const data = await fetchFn();

  // Set cache (don't await to avoid blocking)
  setCache(key, data, ttl).catch(err => {
    logger.error('Failed to set cache', {
      error: err,
      key,
      ttl,
    });
  });

  return data;
}

/**
 * Invalidate user cache when data changes
 */
export async function invalidateUserCache(userId: string, resource?: string): Promise<void> {
  const pattern = resource
    ? `user:${userId}:${resource}:*`
    : `user:${userId}:*`;

  await delCachePattern(pattern);
  logger.info('Invalidated cache', { pattern, userId, resource });
}
