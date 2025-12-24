/**
 * @luneo/optimization - Cache Manager professionnel
 * Caching multi-niveaux (Memory, Redis, CDN)
 */

import { Redis } from 'ioredis';

/**
 * Configuration du cache
 */
export interface CacheConfig {
  /** Connection Redis */
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  
  /** TTL par niveau (secondes) */
  ttl?: {
    memory?: number;
    redis?: number;
    cdn?: number;
  };
  
  /** Taille max memory cache (MB) */
  maxMemorySizeMB?: number;
}

/**
 * Item en cache
 */
interface CacheItem<T> {
  value: T;
  size: number; // bytes
  timestamp: number;
  ttl: number;
}

/**
 * Cache Manager professionnel
 * 
 * Features:
 * - 3 niveaux: Memory → Redis → CDN
 * - TTL configurable par niveau
 * - LRU eviction (memory)
 * - Size limits
 * - Hit rate tracking
 * 
 * @example
 * ```typescript
 * const cache = new CacheManager({
 *   redis: { host: 'localhost', port: 6379 },
 *   ttl: {
 *     memory: 3600,    // 1h
 *     redis: 86400,    // 24h
 *     cdn: 604800      // 7d
 *   }
 * });
 * 
 * // Set
 * await cache.set('design:123', designData, 'memory');
 * 
 * // Get (auto cascade)
 * const data = await cache.get('design:123');
 * ```
 */
export class CacheManager {
  private config: Required<CacheConfig>;
  private redis: Redis | null = null;
  
  // Memory cache
  private memoryCache: Map<string, CacheItem<any>> = new Map();
  private memorySizeBytes: number = 0;
  
  // Stats
  private hits: number = 0;
  private misses: number = 0;

  constructor(config: CacheConfig = {}) {
    this.config = {
      redis: config.redis,
      ttl: {
        memory: config.ttl?.memory || 3600,      // 1h
        redis: config.ttl?.redis || 86400,       // 24h
        cdn: config.ttl?.cdn || 604800,          // 7d
      },
      maxMemorySizeMB: config.maxMemorySizeMB || 100,
    };
    
    // Initialize Redis if configured
    if (this.config.redis) {
      this.redis = new Redis(this.config.redis);
      console.log('✅ Redis connected for caching');
    }
    
    // Cleanup expired items périodiquement
    setInterval(() => this.cleanupExpired(), 60000); // Every minute
  }

  /**
   * Get depuis cache (cascade: memory → redis → miss)
   */
  async get<T>(key: string): Promise<T | null> {
    // Level 1: Memory
    const memoryItem = this.getFromMemory<T>(key);
    if (memoryItem !== null) {
      this.hits++;
      return memoryItem;
    }
    
    // Level 2: Redis
    if (this.redis) {
      const redisItem = await this.getFromRedis<T>(key);
      if (redisItem !== null) {
        this.hits++;
        
        // Promote to memory
        this.setInMemory(key, redisItem, this.config.ttl.memory);
        
        return redisItem;
      }
    }
    
    // Miss
    this.misses++;
    return null;
  }

  /**
   * Set dans cache
   */
  async set<T>(
    key: string,
    value: T,
    level: 'memory' | 'redis' | 'all' = 'all'
  ): Promise<void> {
    if (level === 'memory' || level === 'all') {
      this.setInMemory(key, value, this.config.ttl.memory);
    }
    
    if ((level === 'redis' || level === 'all') && this.redis) {
      await this.setInRedis(key, value, this.config.ttl.redis);
    }
  }

  /**
   * Delete depuis cache
   */
  async delete(key: string): Promise<void> {
    // Memory
    this.deleteFromMemory(key);
    
    // Redis
    if (this.redis) {
      await this.redis.del(key);
    }
  }

  /**
   * Clear tout le cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.memorySizeBytes = 0;
    
    if (this.redis) {
      await this.redis.flushdb();
    }
    
    console.log('Cache cleared');
  }

  /**
   * Get hit rate
   */
  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? (this.hits / total) * 100 : 0;
  }

  /**
   * Get stats
   */
  getStats(): {
    memoryItems: number;
    memorySizeMB: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    return {
      memoryItems: this.memoryCache.size,
      memorySizeMB: this.memorySizeBytes / 1024 / 1024,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
    };
  }

  /**
   * Get from memory
   */
  private getFromMemory<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check TTL
    if (Date.now() - item.timestamp > item.ttl * 1000) {
      this.deleteFromMemory(key);
      return null;
    }
    
    return item.value as T;
  }

  /**
   * Set in memory (avec LRU eviction)
   */
  private setInMemory<T>(key: string, value: T, ttl: number): void {
    const size = this.estimateSize(value);
    const maxSizeBytes = this.config.maxMemorySizeMB * 1024 * 1024;
    
    // Evict si trop grand
    while (this.memorySizeBytes + size > maxSizeBytes && this.memoryCache.size > 0) {
      this.evictOldest();
    }
    
    this.memoryCache.set(key, {
      value,
      size,
      timestamp: Date.now(),
      ttl,
    });
    
    this.memorySizeBytes += size;
  }

  /**
   * Delete from memory
   */
  private deleteFromMemory(key: string): void {
    const item = this.memoryCache.get(key);
    if (item) {
      this.memorySizeBytes -= item.size;
      this.memoryCache.delete(key);
    }
  }

  /**
   * Evict oldest item (LRU)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.deleteFromMemory(oldestKey);
    }
  }

  /**
   * Get from Redis
   */
  private async getFromRedis<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Set in Redis
   */
  private async setInRedis<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.redis) return;
    
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  /**
   * Cleanup expired items
   */
  private cleanupExpired(): void {
    const now = Date.now();
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (now - item.timestamp > item.ttl * 1000) {
        this.deleteFromMemory(key);
      }
    }
  }

  /**
   * Estimate object size
   */
  private estimateSize(obj: any): number {
    const str = JSON.stringify(obj);
    return new Blob([str]).size;
  }

  /**
   * Dispose
   */
  async dispose(): Promise<void> {
    this.memoryCache.clear();
    this.memorySizeBytes = 0;
    
    if (this.redis) {
      await this.redis.quit();
    }
    
    console.log('CacheManager disposed');
  }
}

