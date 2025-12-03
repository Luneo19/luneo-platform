/**
 * Advanced Cache Service
 * OPT-001: Système de cache Redis avancé avec fallback mémoire
 */

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

// Cache entry with metadata
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags?: string[];
}

// Cache options
interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
  staleWhileRevalidate?: number; // seconds
}

// Cache stats
interface CacheStats {
  hits: number;
  misses: number;
  writes: number;
  deletes: number;
  errors: number;
}

// In-memory cache for fallback
const memoryCache = new Map<string, CacheEntry<any>>();
const MAX_MEMORY_CACHE_SIZE = 1000;

class CacheService {
  private static instance: CacheService;
  private redis: Redis | null = null;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    writes: 0,
    deletes: 0,
    errors: 0,
  };
  private readonly defaultTTL = 3600; // 1 hour

  private constructor() {
    this.initRedis();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Initialize Redis connection
   */
  private initRedis(): void {
    try {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (url && token) {
        this.redis = new Redis({ url, token });
        logger.info('Redis cache initialized');
      } else {
        logger.warn('Redis not configured, using memory cache only');
      }
    } catch (error) {
      logger.error('Failed to initialize Redis', { error });
      this.redis = null;
    }
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (this.redis) {
        const cached = await this.redis.get<CacheEntry<T>>(key);
        if (cached) {
          this.stats.hits++;
          return cached.data;
        }
      }

      // Fallback to memory cache
      const memoryCached = memoryCache.get(key);
      if (memoryCached) {
        // Check if expired
        if (Date.now() < memoryCached.timestamp + memoryCached.ttl * 1000) {
          this.stats.hits++;
          return memoryCached.data as T;
        }
        // Expired, remove it
        memoryCache.delete(key);
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl ?? this.defaultTTL;
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl,
      tags: options.tags,
    };

    try {
      // Set in Redis
      if (this.redis) {
        await this.redis.set(key, entry, { ex: ttl });
        
        // Index by tags for invalidation
        if (options.tags?.length) {
          for (const tag of options.tags) {
            await this.redis.sadd(`tag:${tag}`, key);
          }
        }
      }

      // Set in memory cache
      this.setMemoryCache(key, entry);
      this.stats.writes++;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache set error', { key, error });
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(key);
      }
      memoryCache.delete(key);
      this.stats.deletes++;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache delete error', { key, error });
    }
  }

  /**
   * Invalidate by tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    try {
      let count = 0;

      if (this.redis) {
        const keys = await this.redis.smembers(`tag:${tag}`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          await this.redis.del(`tag:${tag}`);
          count = keys.length;
        }
      }

      // Also clear from memory cache
      for (const [key, entry] of memoryCache.entries()) {
        if (entry.tags?.includes(tag)) {
          memoryCache.delete(key);
          count++;
        }
      }

      logger.info('Cache invalidated by tag', { tag, count });
      return count;
    } catch (error) {
      this.stats.errors++;
      logger.error('Cache invalidate error', { tag, error });
      return 0;
    }
  }

  /**
   * Get or set with callback (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();

    // Cache the result
    await this.set(key, data, options);

    return data;
  }

  /**
   * Stale-while-revalidate pattern
   */
  async getStaleWhileRevalidate<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions & { staleWhileRevalidate: number }
  ): Promise<T> {
    try {
      // Check cache
      let cached: CacheEntry<T> | null = null;
      
      if (this.redis) {
        cached = await this.redis.get<CacheEntry<T>>(key);
      }
      
      if (!cached) {
        const memoryCached = memoryCache.get(key);
        if (memoryCached) {
          cached = memoryCached as CacheEntry<T>;
        }
      }

      if (cached) {
        const age = Date.now() - cached.timestamp;
        const maxAge = cached.ttl * 1000;
        const staleAge = maxAge + (options.staleWhileRevalidate * 1000);

        // Fresh: return cached data
        if (age < maxAge) {
          this.stats.hits++;
          return cached.data;
        }

        // Stale but within revalidate window: return stale data, revalidate in background
        if (age < staleAge) {
          this.stats.hits++;
          // Revalidate in background
          this.revalidateInBackground(key, fetcher, options);
          return cached.data;
        }
      }

      // No cache or too stale: fetch fresh
      this.stats.misses++;
      const data = await fetcher();
      await this.set(key, data, options);
      return data;
    } catch (error) {
      this.stats.errors++;
      logger.error('SWR cache error', { key, error });
      throw error;
    }
  }

  /**
   * Revalidate in background
   */
  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<void> {
    try {
      const data = await fetcher();
      await this.set(key, data, options);
      logger.debug('Background revalidation completed', { key });
    } catch (error) {
      logger.error('Background revalidation failed', { key, error });
    }
  }

  /**
   * Set in memory cache with size limit
   */
  private setMemoryCache<T>(key: string, entry: CacheEntry<T>): void {
    // Evict oldest entries if at capacity
    if (memoryCache.size >= MAX_MEMORY_CACHE_SIZE) {
      const keysToDelete = Array.from(memoryCache.keys()).slice(0, 100);
      keysToDelete.forEach((k) => memoryCache.delete(k));
    }
    memoryCache.set(key, entry);
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.flushdb();
      }
      memoryCache.clear();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error', { error });
    }
  }

  /**
   * Get cache stats
   */
  getStats(): CacheStats & { hitRate: number; memorySize: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0,
      memorySize: memoryCache.size,
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ redis: boolean; memory: boolean }> {
    let redisHealthy = false;
    
    if (this.redis) {
      try {
        await this.redis.ping();
        redisHealthy = true;
      } catch {
        redisHealthy = false;
      }
    }

    return {
      redis: redisHealthy,
      memory: true,
    };
  }
}

export const cacheService = CacheService.getInstance();
export default CacheService;

// Utility functions for common cache patterns

/**
 * Create cache key from parts
 */
export function createCacheKey(...parts: (string | number)[]): string {
  return parts.join(':');
}

/**
 * Cache decorator for class methods (manual usage)
 */
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: CacheOptions
): Promise<T> {
  return cacheService.getOrSet(key, fetcher, options);
}


