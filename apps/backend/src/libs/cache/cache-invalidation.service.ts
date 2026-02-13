import { Injectable, Inject, Logger } from '@nestjs/common';
import { RedisOptimizedService } from '../redis/redis-optimized.service';

/**
 * Cache Invalidation Service
 * Handles tag-based cache invalidation
 * Inspired by Next.js revalidation and Vercel Edge Cache
 */
@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  constructor(
    @Inject(RedisOptimizedService)
    private readonly redisService: RedisOptimizedService,
  ) {}

  /**
   * Invalidate cache by tags
   * Example: invalidateByTags(['products', 'product:123'])
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const client = this.redisService.client;
      if (!client) return;
      for (const tag of tags) {
        const tagKey = `cache:tag:${tag}`;
        const keys = await client.smembers(tagKey);

        if (keys && keys.length > 0) {
          // Delete all cached keys for this tag
          for (const key of keys) {
            await this.redisService.del(key);
          }

          // Delete the tag set
          await this.redisService.del(tagKey);
        }

        this.logger.log(`Invalidated cache for tag: ${tag} (${keys?.length || 0} keys)`);
      }
    } catch (error) {
      this.logger.error('Cache invalidation error', error);
    }
  }

  /**
   * Invalidate cache by pattern
   * Example: invalidateByPattern('cache:products:*')
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      const client = this.redisService.client;
      if (!client) return;
      const keys = await client.keys(pattern);
      
      if (keys && keys.length > 0) {
        for (const key of keys) {
          await this.redisService.del(key);
        }
        this.logger.log(`Invalidated cache for pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      this.logger.error('Cache invalidation error', error);
    }
  }

  /**
   * Invalidate cache by key
   */
  async invalidateByKey(key: string): Promise<void> {
    try {
      await this.redisService.del(key);
      this.logger.log(`Invalidated cache key: ${key}`);
    } catch (error) {
      this.logger.error('Cache invalidation error', error);
    }
  }

  /**
   * Clear all cache
   * Use with caution!
   */
  async clearAll(): Promise<void> {
    try {
      const client = this.redisService.client;
      if (!client) return;
      const keys = await client.keys('cache:*');
      
      if (keys && keys.length > 0) {
        for (const key of keys) {
          await this.redisService.del(key);
        }
        this.logger.log(`Cleared all cache (${keys.length} keys)`);
      }
    } catch (error) {
      this.logger.error('Cache clear error', error);
    }
  }
}
