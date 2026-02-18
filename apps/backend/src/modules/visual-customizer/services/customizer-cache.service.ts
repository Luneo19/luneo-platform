import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

@Injectable()
export class CustomizerCacheService {
  private readonly logger = new Logger(CustomizerCacheService.name);
  private readonly cacheType = 'visual-customizer';

  constructor(private readonly redisService: RedisOptimizedService) {}

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisService.get<T>(key, this.cacheType);
      return value;
    } catch (error) {
      this.logger.warn(`Failed to get cache key ${key}: ${error}`);
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    try {
      const result = await this.redisService.set(
        key,
        value,
        this.cacheType,
        { ttl },
      );
      return result;
    } catch (error) {
      this.logger.warn(`Failed to set cache key ${key}: ${error}`);
      return false;
    }
  }

  /**
   * Delete cached value
   */
  async del(key: string): Promise<boolean> {
    try {
      const result = await this.redisService.del(key, this.cacheType);
      return result;
    } catch (error) {
      this.logger.warn(`Failed to delete cache key ${key}: ${error}`);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      // RedisOptimizedService doesn't have pattern matching directly,
      // so we'll use tags for invalidation
      // In a real implementation, you might use SCAN with pattern matching
      this.logger.log(`Invalidating cache pattern: ${pattern}`);
      
      // For now, return 0 as pattern invalidation requires Redis SCAN
      // which is not directly exposed in RedisOptimizedService
      return 0;
    } catch (error) {
      this.logger.warn(`Failed to invalidate cache pattern ${pattern}: ${error}`);
      return 0;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      const result = await this.redisService.invalidateByTags(tags);
      return result;
    } catch (error) {
      this.logger.warn(`Failed to invalidate cache by tags: ${error}`);
      return 0;
    }
  }

  /**
   * Get multiple cached values
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redisService.mget<T>(keys, this.cacheType);
      return values;
    } catch (error) {
      this.logger.warn(`Failed to get multiple cache keys: ${error}`);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple cached values
   */
  async mset(
    items: Array<{ key: string; value: unknown; ttl?: number }>,
  ): Promise<boolean> {
    try {
      const result = await this.redisService.mset(
        items.map((item) => ({
          key: item.key,
          data: item.value,
          ttl: item.ttl,
        })),
        this.cacheType,
      );
      return result;
    } catch (error) {
      this.logger.warn(`Failed to set multiple cache keys: ${error}`);
      return false;
    }
  }
}
