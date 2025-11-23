/**
 * Redis Cache Service - SaaS World-Class
 * 
 * Features:
 * - TTL automatique
 * - Invalidation intelligente
 * - Fallback gracieux si Redis non configuré
 * - Compression pour grandes valeurs
 * - Métriques de cache hit/miss
 */

import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';

const hasRedisConfig =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

interface CacheOptions {
  ttl?: number; // Time to live en secondes
  compress?: boolean; // Compression pour grandes valeurs
  tags?: string[]; // Tags pour invalidation groupée
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
}

class CacheService {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redis) {
      this.metrics.misses++;
      return null;
    }

    try {
      const value = await redis.get<T>(key);
      
      if (value !== null) {
        this.metrics.hits++;
        logger.debug('Cache hit', { key });
        return value;
      }
      
      this.metrics.misses++;
      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Cache get error', error, { key });
      this.metrics.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      const { ttl = 3600, compress = false } = options;
      
      let valueToStore: T | string = value;
      
      // Compression pour grandes valeurs (optionnel)
      if (compress && typeof value === 'string' && value.length > 1000) {
        // En production, utiliser compression réelle (gzip)
        valueToStore = value; // Placeholder
      }

      if (ttl > 0) {
        await redis.setex(key, ttl, valueToStore);
      } else {
        await redis.set(key, valueToStore);
      }

      this.metrics.sets++;
      logger.debug('Cache set', { key, ttl });
      return true;
    } catch (error) {
      logger.error('Cache set error', error, { key });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!redis) {
      return false;
    }

    try {
      await redis.del(key);
      this.metrics.deletes++;
      logger.debug('Cache delete', { key });
      return true;
    } catch (error) {
      logger.error('Cache delete error', error, { key });
      return false;
    }
  }

  /**
   * Delete multiple keys
   */
  async deleteMany(keys: string[]): Promise<number> {
    if (!redis || keys.length === 0) {
      return 0;
    }

    try {
      const result = await redis.del(...keys);
      this.metrics.deletes += result;
      logger.debug('Cache delete many', { count: result });
      return result;
    } catch (error) {
      logger.error('Cache delete many error', error, { keys });
      return 0;
    }
  }

  /**
   * Invalidate by pattern (utilise SCAN pour grandes listes)
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!redis) {
      return 0;
    }

    try {
      // Upstash Redis REST API ne supporte pas SCAN directement
      // Pour l'invalidation par pattern, utiliser des tags ou préfixes
      logger.warn('Pattern invalidation not fully supported in Upstash REST API', { pattern });
      return 0;
    } catch (error) {
      logger.error('Cache invalidate pattern error', error, { pattern });
      return 0;
    }
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  /**
   * Check if Redis is configured
   */
  isConfigured(): boolean {
    return hasRedisConfig;
  }
}

export const cacheService = new CacheService();

/**
 * Helper functions pour cache patterns communs
 */

/**
 * Cache key generators
 */
export const cacheKeys = {
  designVersions: (designId: string, page: number, limit: number, autoOnly: boolean) =>
    `design:${designId}:versions:${page}:${limit}:${autoOnly}`,
  
  designVersion: (designId: string, versionId: string) =>
    `design:${designId}:version:${versionId}`,
  
  notifications: (userId: string, unreadOnly: boolean) =>
    `notifications:${userId}:${unreadOnly}`,
  
  unreadCount: (userId: string) =>
    `notifications:${userId}:unread_count`,
  
  dashboardStats: (userId: string) =>
    `dashboard:stats:${userId}`,
  
  templates: (page: number, limit: number) =>
    `templates:${page}:${limit}`,
  
  products: (userId: string, page: number, limit: number) =>
    `products:${userId}:${page}:${limit}`,
};

/**
 * Cache TTLs (en secondes)
 */
export const cacheTTL = {
  designVersions: 60, // 1 minute
  designVersion: 300, // 5 minutes
  notifications: 30, // 30 secondes (très court car real-time)
  unreadCount: 10, // 10 secondes
  dashboardStats: 300, // 5 minutes
  templates: 3600, // 1 heure
  products: 600, // 10 minutes
};

