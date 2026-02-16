import { Injectable, Logger } from '@nestjs/common';
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

  constructor(private readonly redis: RedisOptimizedService) {}

  /**
   * Attempt to acquire a distributed lock.
   * @param key Lock name (e.g. 'subscription-enforcement')
   * @param ttlSeconds Auto-expire after this many seconds (safety net)
   * @returns true if lock was acquired, false if already held by another instance
   */
  async acquire(key: string, ttlSeconds: number = 300): Promise<boolean> {
    const client = this.redis.client;
    if (!client) {
      // Redis unavailable — allow execution (single-instance mode)
      this.logger.debug(`Redis unavailable, allowing lock ${key} (single-instance mode)`);
      return true;
    }

    try {
      const result = await client.set(
        `${this.PREFIX}${key}`,
        `${process.pid}:${Date.now()}`,
        'EX',
        ttlSeconds,
        'NX',
      );
      const acquired = result === 'OK';
      if (!acquired) {
        this.logger.debug(`Lock ${key} already held by another instance, skipping`);
      }
      return acquired;
    } catch (error) {
      this.logger.warn(`Failed to acquire lock ${key}, allowing execution`, error);
      return true; // Fail-open: if Redis errors, allow execution
    }
  }

  /**
   * Release a distributed lock.
   */
  async release(key: string): Promise<void> {
    const client = this.redis.client;
    if (!client) return;

    try {
      await client.del(`${this.PREFIX}${key}`);
    } catch (error) {
      this.logger.warn(`Failed to release lock ${key}`, error);
    }
  }
}
