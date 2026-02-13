/**
 * Cache Extension Service
 * Extended caching capabilities with tags, invalidation, and warming
 */

import { Injectable, Logger } from '@nestjs/common';
import { RedisOptimizedService } from './redis-optimized.service';

export interface CacheTag {
  name: string;
  keys: string[];
}

export interface CacheWarmupConfig {
  key: string;
  type: string;
  generator: () => Promise<unknown>;
  ttl?: number;
  tags?: string[];
}

@Injectable()
export class CacheExtensionService {
  private readonly logger = new Logger(CacheExtensionService.name);
  private readonly TAG_PREFIX = 'tag:';
  private readonly WARMUP_PREFIX = 'warmup:';

  constructor(private readonly redis: RedisOptimizedService) {}

  /**
   * Set cache with tags for invalidation
   */
  async setWithTags(
    key: string,
    data: unknown,
    type: string = 'api',
    tags: string[] = [],
    ttl?: number,
  ): Promise<boolean> {
    // Set the cache value
    const setResult = await this.redis.set(key, data, type, { ttl, tags });

    if (setResult && tags.length > 0) {
      const client = this.redis.client;
      if (client) {
        for (const tag of tags) {
          await client.sadd(`${this.TAG_PREFIX}${tag}`, key);
          await client.expire(`${this.TAG_PREFIX}${tag}`, ttl || 3600);
        }
      }
    }

    return setResult;
  }

  /**
   * Invalidate cache by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    const client = this.redis.client;
    if (!client) return 0;
    const tagKey = `${this.TAG_PREFIX}${tag}`;
    const keys = await client.smembers(tagKey);

    if (keys.length === 0) {
      return 0;
    }

    const deleted = await client.del(...keys);
    await client.del(tagKey);

    this.logger.log(`Invalidated ${deleted} cache entries for tag: ${tag}`);

    return deleted;
  }

  /**
   * Invalidate cache by multiple tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let totalDeleted = 0;

    for (const tag of tags) {
      const deleted = await this.invalidateByTag(tag);
      totalDeleted += deleted;
    }

    return totalDeleted;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    memory: string;
    keys: number;
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    const client = this.redis.client;
    if (!client) {
      return { memory: '0B', keys: 0, hits: 0, misses: 0, hitRate: 0 };
    }
    const info = await client.info('stats');
    const memoryInfo = await client.info('memory');

    const keyspaceHits = this.parseInfoValue(info, 'keyspace_hits') || '0';
    const keyspaceMisses = this.parseInfoValue(info, 'keyspace_misses') || '0';
    const hits = parseInt(keyspaceHits, 10);
    const misses = parseInt(keyspaceMisses, 10);
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;

    const usedMemory = this.parseInfoValue(memoryInfo, 'used_memory_human') || '0B';
    const dbSize = await client.dbsize();

    return {
      memory: usedMemory,
      keys: dbSize,
      hits,
      misses,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Register cache warmup configuration
   */
  async registerWarmup(config: CacheWarmupConfig): Promise<void> {
    const warmupKey = `${this.WARMUP_PREFIX}${config.key}`;
    await this.redis.set(warmupKey, config, 'api', { ttl: 86400 }); // Store config for 24h
  }

  /**
   * Warm up cache with registered configurations
   */
  async warmupCache(): Promise<{ warmed: number; failed: number }> {
    const client = this.redis.client;
    if (!client) return { warmed: 0, failed: 0 };
    const pattern = `${this.WARMUP_PREFIX}*`;
    const keys = await client.keys(pattern);

    let warmed = 0;
    let failed = 0;

    for (const key of keys) {
      try {
        const raw = await this.redis.get(key.replace(this.WARMUP_PREFIX, ''), 'api');
        const config = raw as CacheWarmupConfig | null;

        if (config && config.generator) {
          const data = await config.generator();
          await this.setWithTags(
            config.key,
            data,
            config.type,
            config.tags || [],
            config.ttl,
          );
          warmed++;
        }
      } catch (error) {
        this.logger.error(`Failed to warmup cache for ${key}:`, error);
        failed++;
      }
    }

    this.logger.log(`Cache warmup completed: ${warmed} warmed, ${failed} failed`);

    return { warmed, failed };
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    const client = this.redis.client;
    if (client) {
      await client.flushdb();
      this.logger.log('All cache cleared');
    }
  }

  /**
   * Get cache keys by pattern
   */
  async getKeysByPattern(pattern: string): Promise<string[]> {
    const client = this.redis.client;
    if (!client) return [];
    return client.keys(pattern);
  }

  /**
   * Parse Redis INFO output
   */
  private parseInfoValue(info: string, key: string): string | null {
    const regex = new RegExp(`${key}:(.+)`);
    const match = info.match(regex);
    return match ? match[1].trim() : null;
  }
}
