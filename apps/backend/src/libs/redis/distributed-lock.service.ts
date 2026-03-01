import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisOptimizedService } from './redis-optimized.service';

/**
 * Simple distributed lock using Redis SET NX EX.
 * Prevents multiple instances from running the same cron job concurrently.
 *
 * Usage:
 *   const acquired = await this.distributedLock.acquire('my-cron-job', 300);
 *   if (!acquired) return; // another instance is running
 *   try { ... } finally { await this.distributedLock.release('my-cron-job'); }
 */
@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);
  private readonly PREFIX = 'dlock:';
  private readonly localLockTokens = new Map<string, string>();

  constructor(private readonly redis: RedisOptimizedService) {}

  /**
   * Attempt to acquire a distributed lock.
   * @param key Lock name (e.g. 'subscription-enforcement')
   * @param ttlSeconds Auto-expire after this many seconds (safety net)
   * @param failOpen When true, continues on Redis errors (default).
   * @returns true if lock was acquired, false if already held by another instance
   */
  async acquire(key: string, ttlSeconds: number = 300, failOpen: boolean = true): Promise<boolean> {
    const client = this.redis.client;
    const redisKey = `${this.PREFIX}${key}`;
    if (!client) {
      if (failOpen) {
        this.logger.debug(`Redis unavailable, allowing lock ${key} (single-instance mode)`);
        return true;
      }
      this.logger.warn(`Redis unavailable, refusing lock ${key} (fail-safe mode)`);
      return false;
    }

    try {
      const lockToken = randomUUID();
      const result = await client.set(
        redisKey,
        lockToken,
        'EX',
        ttlSeconds,
        'NX',
      );
      const acquired = result === 'OK';
      if (!acquired) {
        this.logger.debug(`Lock ${key} already held by another instance, skipping`);
      } else {
        this.localLockTokens.set(redisKey, lockToken);
      }
      return acquired;
    } catch (error) {
      if (failOpen) {
        this.logger.warn(`Failed to acquire lock ${key}, allowing execution`, error);
        return true;
      }
      this.logger.warn(`Failed to acquire lock ${key}, refusing execution (fail-safe mode)`, error);
      return false;
    }
  }

  /**
   * Release a distributed lock.
   */
  async release(key: string): Promise<void> {
    const client = this.redis.client;
    if (!client) return;
    const redisKey = `${this.PREFIX}${key}`;
    const lockToken = this.localLockTokens.get(redisKey);
    if (!lockToken) {
      this.logger.debug(`No local token found for lock ${key}, skipping release`);
      return;
    }

    try {
      const releaseScript = `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("DEL", KEYS[1])
        else
          return 0
        end
      `;
      await client.eval(releaseScript, 1, redisKey, lockToken);
      this.localLockTokens.delete(redisKey);
    } catch (error) {
      this.logger.warn(`Failed to release lock ${key}`, error);
    }
  }
}
