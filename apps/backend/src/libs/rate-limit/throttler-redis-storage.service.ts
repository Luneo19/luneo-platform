/**
 * Redis-backed ThrottlerStorage for NestJS Throttler module
 * PRODUCTION FIX: Replaces in-memory storage for multi-instance deployments
 *
 * Uses the existing RedisOptimizedService for Redis operations.
 * Falls back to in-memory storage if Redis is not available.
 */

import { Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisOptimizedService } from '../redis/redis-optimized.service';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

export class ThrottlerRedisStorageService implements ThrottlerStorage {
  private readonly logger = new Logger(ThrottlerRedisStorageService.name);
  private useRedis = false;
  // Fallback in-memory store
  private readonly memoryStore = new Map<
    string,
    { totalHits: number; expiresAt: number }
  >();
  storage: Record<string, ThrottlerStorageRecord>;

  constructor(private readonly redisService: RedisOptimizedService) {
    this.storage = {};
    try {
      const redisClient = this.redisService?.client;
      if (redisClient) {
        this.useRedis = true;
        this.logger.log(
          'ThrottlerStorage: Using Redis backend for distributed rate limiting',
        );
      }
    } catch {
      this.logger.warn(
        'ThrottlerStorage: Redis not available, falling back to in-memory storage',
      );
    }
  }

  async increment(
    key: string,
    ttl: number,
  ): Promise<ThrottlerStorageRecord> {
    if (this.useRedis) {
      return this.incrementRedis(key, ttl);
    }

    return this.incrementMemory(key, ttl);
  }

  private async incrementRedis(
    key: string,
    ttl: number,
  ): Promise<ThrottlerStorageRecord> {
    try {
      const redisClient = this.redisService.client;
      if (!redisClient) {
        return this.incrementMemory(key, ttl);
      }

      const ttlSeconds = Math.ceil(ttl / 1000);
      const storageKey = `throttler:${key}`;

      // Use Redis INCR + TTL atomically via pipeline
      const pipeline = redisClient.pipeline();
      pipeline.incr(storageKey);
      pipeline.ttl(storageKey);
      const results = await pipeline.exec();

      const totalHits = (results?.[0]?.[1] as number) || 1;
      const currentTtl = (results?.[1]?.[1] as number) || -1;

      // Set expiration if this is the first hit (TTL = -1 means no expiration set)
      if (currentTtl === -1) {
        await redisClient.expire(storageKey, ttlSeconds);
      }

      const remainingTtl = currentTtl > 0 ? currentTtl : ttlSeconds;

      return {
        totalHits,
        timeToExpire: remainingTtl * 1000,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    } catch (error) {
      this.logger.warn(
        'Redis throttler error, falling back to memory',
        error instanceof Error ? error.message : '',
      );
      return this.incrementMemory(key, ttl);
    }
  }

  private incrementMemory(key: string, ttl: number): ThrottlerStorageRecord {
    const now = Date.now();
    const record = this.memoryStore.get(key);

    if (!record || record.expiresAt <= now) {
      this.memoryStore.set(key, { totalHits: 1, expiresAt: now + ttl });
      return {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    record.totalHits++;
    return {
      totalHits: record.totalHits,
      timeToExpire: record.expiresAt - now,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
