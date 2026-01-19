/**
 * Sliding Window Rate Limiting Service
 * Implements sliding window algorithm using Redis
 * More accurate than fixed window for rate limiting
 */

import { Injectable, Logger } from '@nestjs/common';
import { RedisOptimizedService } from '../redis/redis-optimized.service';

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  limit: number;
  
  /**
   * Time window in seconds
   */
  window: number;
  
  /**
   * Optional: Custom key prefix
   */
  keyPrefix?: string;
  
  /**
   * Optional: Block duration in seconds when limit exceeded
   */
  blockDuration?: number;
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;
  
  /**
   * Remaining requests in the window
   */
  remaining: number;
  
  /**
   * Total limit
   */
  limit: number;
  
  /**
   * Reset time (timestamp in milliseconds)
   */
  resetTime: number;
  
  /**
   * Retry after (seconds) if blocked
   */
  retryAfter?: number;
}

@Injectable()
export class SlidingWindowRateLimitService {
  private readonly logger = new Logger(SlidingWindowRateLimitService.name);

  constructor(private readonly redis: RedisOptimizedService) {}

  /**
   * Check rate limit using sliding window algorithm
   * 
   * Algorithm:
   * 1. Store each request timestamp in a sorted set
   * 2. Remove timestamps outside the window
   * 3. Count remaining timestamps
   * 4. If count < limit, add current timestamp and allow
   * 5. If count >= limit, reject
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const { limit, window, keyPrefix = 'rate_limit', blockDuration } = config;
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - window * 1000;

    try {
      // Get Redis client (we'll need direct access for sorted sets)
      const redisClient = this.redis.getRedis();
      if (!redisClient) {
        this.logger.warn('Redis not available, allowing request');
        return {
          allowed: true,
          remaining: limit,
          limit,
          resetTime: now + window * 1000,
        };
      }

      // Timeout global de 2 secondes pour toutes les opérations Redis
      const redisTimeout = 2000;
      
      // Helper pour ajouter timeout à une promesse Redis
      const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, defaultValue: T): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((resolve) => setTimeout(() => resolve(defaultValue), timeoutMs)),
        ]);
      };

      // Remove old entries outside the window (timeout 500ms)
      await withTimeout(
        redisClient.zremrangebyscore(key, 0, windowStart),
        500,
        undefined as any
      ).catch(() => {}); // Ignore errors

      // Count current requests in the window (timeout 500ms)
      const count = await withTimeout(
        redisClient.zcard(key),
        500,
        0
      ).catch(() => 0);

      // Check if limit exceeded
      if (count >= limit) {
        // Get the oldest timestamp to calculate reset time (timeout 500ms)
        const oldestTimestamps = await withTimeout(
          redisClient.zrange(key, 0, 0, 'WITHSCORES'),
          500,
          []
        ).catch(() => []);
        
        const oldestTimestamp = oldestTimestamps.length > 0 
          ? parseInt(oldestTimestamps[1]) 
          : now;
        
        const resetTime = oldestTimestamp + window * 1000;
        const retryAfter = blockDuration 
          ? blockDuration 
          : Math.ceil((resetTime - now) / 1000);

        return {
          allowed: false,
          remaining: 0,
          limit,
          resetTime,
          retryAfter: Math.max(0, retryAfter),
        };
      }

      // Add current request timestamp (timeout 500ms)
      await withTimeout(
        redisClient.zadd(key, now, `${now}-${Math.random()}`),
        500,
        undefined as any
      ).catch(() => {}); // Ignore errors

      // Set expiration on the key (timeout 500ms)
      await withTimeout(
        redisClient.expire(key, window + 60),
        500,
        undefined as any
      ).catch(() => {}); // Ignore errors

      // Calculate remaining requests
      const remaining = Math.max(0, limit - count - 1);

      // Calculate reset time (oldest entry + window) - timeout 500ms
      const oldestTimestamps = await withTimeout(
        redisClient.zrange(key, 0, 0, 'WITHSCORES'),
        500,
        []
      ).catch(() => []);
      
      const oldestTimestamp = oldestTimestamps.length > 0 
        ? parseInt(oldestTimestamps[1]) 
        : now;
      const resetTime = oldestTimestamp + window * 1000;

      return {
        allowed: true,
        remaining,
        limit,
        resetTime,
      };
    } catch (error) {
      this.logger.error(`Rate limit check error for ${key}:`, error);
      // On error, allow the request (fail open)
      return {
        allowed: true,
        remaining: limit,
        limit,
        resetTime: now + window * 1000,
      };
    }
  }

  /**
   * Reset rate limit for an identifier
   */
  async reset(identifier: string, keyPrefix: string = 'rate_limit'): Promise<void> {
    try {
      const key = `${keyPrefix}:${identifier}`;
      const redisClient = this.redis.client;
      if (redisClient) {
        await redisClient.del(key);
      }
    } catch (error) {
      this.logger.error(`Rate limit reset error for ${identifier}:`, error);
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(
    identifier: string,
    config: RateLimitConfig,
  ): Promise<RateLimitResult> {
    const { limit, window, keyPrefix = 'rate_limit' } = config;
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - window * 1000;

    try {
      const redisClient = this.redis.client;
      if (!redisClient) {
        return {
          allowed: true,
          remaining: limit,
          limit,
          resetTime: now + window * 1000,
        };
      }

      // Remove old entries
      await redisClient.zremrangebyscore(key, 0, windowStart);

      // Count current requests
      const count = await redisClient.zcard(key);
      const remaining = Math.max(0, limit - count);

      // Get reset time
      const oldestTimestamps = await redisClient.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTimestamp = oldestTimestamps.length > 0 
        ? parseInt(oldestTimestamps[1]) 
        : now;
      const resetTime = oldestTimestamp + window * 1000;

      return {
        allowed: count < limit,
        remaining,
        limit,
        resetTime,
      };
    } catch (error) {
      this.logger.error(`Rate limit status error for ${key}:`, error);
      return {
        allowed: true,
        remaining: limit,
        limit,
        resetTime: now + window * 1000,
      };
    }
  }
}

