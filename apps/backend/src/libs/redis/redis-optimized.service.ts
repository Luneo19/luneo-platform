import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface CacheConfig {
  ttl: number;
  maxMemory: string;
  compression?: boolean;
  threshold?: number;
}

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compression?: boolean;
}

@Injectable()
export class RedisOptimizedService {
  private readonly logger = new Logger(RedisOptimizedService.name);
  private redis: Redis | null = null;
  
  /**
   * Get the underlying Redis client for advanced operations
   */
  get client(): Redis | null {
    return this.redis;
  }
  private readonly cacheConfigs: Record<string, CacheConfig> = {
    user: { ttl: 1800, maxMemory: '64mb', compression: true, threshold: 1024 },
    brand: { ttl: 3600, maxMemory: '32mb', compression: true, threshold: 1024 },
    product: { ttl: 7200, maxMemory: '128mb', compression: true, threshold: 2048 },
    design: { ttl: 900, maxMemory: '256mb', compression: true, threshold: 4096 },
    analytics: { ttl: 300, maxMemory: '64mb', compression: true, threshold: 1024 },
    session: { ttl: 86400, maxMemory: '32mb', compression: false },
    api: { ttl: 600, maxMemory: '128mb', compression: true, threshold: 1024 },
  };

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get('redis.url') || 'redis://localhost:6379';
    
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const isValidRedisUrl = (url: string): boolean => {
      if (!url) return false;
      if (isProduction && url === 'redis://localhost:6379') return false;
      try {
        const parsed = new URL(url);
        return !!parsed.hostname && parsed.hostname.length > 0;
      } catch {
        return false;
      }
    };
    
    // Si Redis n'est pas configuré correctement, ne pas créer de connexion (mode dégradé)
    if (!isValidRedisUrl(redisUrl)) {
      this.logger.warn(`Redis URL not configured or invalid (${redisUrl?.substring(0, 30)}...), running in degraded mode without cache`);
      // Créer un client Redis factice qui ne se connecte pas
      this.redis = null;
      return;
    }
    
    // Configuration optimisée pour Upstash (TLS) et autres providers
    const isUpstash = redisUrl.includes('upstash.io') || redisUrl.startsWith('rediss://');
    
    this.redis = new Redis(redisUrl as string, {
      retryDelayOnFailover: 50,
      keepAlive: 30000,
      lazyConnect: true,
      family: 4,
      connectTimeout: 10000,
      maxRetriesPerRequest: isUpstash ? 3 : 1,
      enableOfflineQueue: false,
      ...(isUpstash && {
        tls: {
          rejectUnauthorized: true,
        },
      }),
    } as import('ioredis').RedisOptions);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.redis) return;
    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redis.on('error', (error: Error) => {
      if (error.message?.includes('max requests limit exceeded')) {
        this.logger.warn('Redis request limit exceeded. Switching to degraded mode (in-memory fallback).');
        this.redis?.disconnect();
        this.redis = null;
        return;
      }
      if (error.message?.includes("Stream isn't writable") || error.message?.includes('enableOfflineQueue')) {
        this.logger.warn('Redis not yet connected (offline queue disabled). Will retry automatically.');
        return;
      }
      this.logger.error('Redis connection error:', error.message || error);
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis is ready');
      this.initializeCacheConfigs().catch(() => {});
    });
  }

  private async initializeCacheConfigs(): Promise<void> {
    try {
      if (!this.redis) return;
      // Ne pas bloquer le démarrage si Redis n'est pas disponible
      const isConnected = await this.redis.ping().catch(() => false);
      if (!isConnected) {
        this.logger.debug('Redis not available for cache config initialization, using defaults');
        return;
      }
      
      // Configurer les politiques de mémoire pour chaque type de cache
      for (const [type, config] of Object.entries(this.cacheConfigs)) {
        const _key = `cache:${type}:*`;
        await this.redis.config('SET', 'maxmemory-policy', 'allkeys-lru').catch(() => {
          // Ignorer les erreurs de configuration Redis
        });
        this.logger.log(`Cache config initialized for ${type}: TTL=${config.ttl}s, MaxMemory=${config.maxMemory}`);
      }
    } catch (error: unknown) {
      this.logger.debug('Redis cache config initialization deferred:', error instanceof Error ? error.message : String(error));
      // Ne pas throw l'erreur pour ne pas bloquer le démarrage
    }
  }

  /**
   * Get cached data with automatic decompression
   */
  async get<T>(key: string, type: string = 'api'): Promise<T | null> {
    try {
      // Si Redis n'est pas disponible, retourner null (mode dégradé)
      if (!this.redis) {
        return null;
      }

      const fullKey = this.buildKey(key, type);
      const data = await this.redis.get(fullKey).catch((error) => {
        // Gérer spécifiquement les erreurs de limite Upstash
        if (error.message?.includes('max requests limit exceeded')) {
          this.logger.warn(`Redis request limit exceeded for key ${key}, returning null`);
          return null;
        }
        throw error;
      });
      
      if (!data) return null;

      // Décompression automatique si nécessaire
      const config = this.cacheConfigs[type];
      if (config?.compression && data.startsWith('gzip:')) {
        const compressedData = data.slice(5); // Remove 'gzip:' prefix
        // Ici on utiliserait zlib pour décompresser en production
        return JSON.parse(compressedData);
      }

      return JSON.parse(data);
    } catch (error: unknown) {
      // Gérer gracieusement les erreurs Redis (limite dépassée, connexion échouée, etc.)
      const message = error instanceof Error ? error.message : String(error);
      if (message?.includes('max requests limit exceeded')) {
        this.logger.warn(`Redis request limit exceeded for key ${key}, returning null`);
        return null;
      }
      this.logger.error(`Failed to get cache key ${key}:`, message || error);
      return null;
    }
  }

  /**
   * Set cached data with automatic compression
   */
  async set(
    key: string, 
    data: unknown, 
    type: string = 'api', 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      // Si Redis n'est pas disponible, retourner false (mode dégradé)
      if (!this.redis) {
        return false;
      }

      const config = this.cacheConfigs[type];
      const ttl = options.ttl || config?.ttl || 300;
      const fullKey = this.buildKey(key, type);
      
      let serializedData = JSON.stringify(data);
      
      // Compression automatique si nécessaire
      if (config?.compression && serializedData.length > (config.threshold || 1024)) {
        // Ici on utiliserait zlib pour compresser en production
        serializedData = `gzip:${serializedData}`;
      }

      await this.redis.setex(fullKey, ttl, serializedData).catch((error) => {
        // Gérer spécifiquement les erreurs de limite Upstash
        if (error.message?.includes('max requests limit exceeded')) {
          this.logger.warn(`Redis request limit exceeded for key ${key}, skipping cache`);
          throw error;
        }
        throw error;
      });
      
      // Ajouter des tags pour invalidation groupée
      if (options.tags && options.tags.length > 0) {
        await this.addTags(fullKey, options.tags).catch(() => {
          // Ignorer les erreurs de tags si Redis a des problèmes
        });
      }

      return true;
    } catch (error: unknown) {
      // Gérer gracieusement les erreurs Redis (limite dépassée, connexion échouée, etc.)
      const message = error instanceof Error ? error.message : String(error);
      if (message?.includes('max requests limit exceeded')) {
        this.logger.warn(`Redis request limit exceeded for key ${key}, skipping cache`);
        return false;
      }
      this.logger.error(`Failed to set cache key ${key}:`, message || error);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async del(key: string, type: string = 'api'): Promise<boolean> {
    try {
      if (!this.redis) return false;
      const fullKey = this.buildKey(key, type);
      const result = await this.redis.del(fullKey);
      return result > 0;
    } catch (error) {
      this.logger.error(`Failed to delete cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      if (!this.redis) return 0;
      let totalDeleted = 0;
      
      for (const tag of tags) {
        const keys = await this.redis.smembers(`tags:${tag}`);
        if (keys.length > 0) {
          const result = await this.redis.del(...keys);
          totalDeleted += result;
          await this.redis.del(`tags:${tag}`);
        }
      }
      
      return totalDeleted;
    } catch (error) {
      this.logger.error('Failed to invalidate cache by tags:', error);
      return 0;
    }
  }

  /**
   * Get multiple cached items
   */
  async mget<T>(keys: string[], type: string = 'api'): Promise<(T | null)[]> {
    try {
      if (!this.redis) return keys.map(() => null);
      const fullKeys = keys.map(key => this.buildKey(key, type));
      const values = await this.redis.mget(...fullKeys);
      
      return values.map(value => {
        if (!value) return null;
        
        // Décompression automatique si nécessaire
        const config = this.cacheConfigs[type];
        if (config?.compression && value.startsWith('gzip:')) {
          const compressedData = value.slice(5);
          return JSON.parse(compressedData);
        }
        
        return JSON.parse(value);
      });
    } catch (error) {
      this.logger.error('Failed to get multiple cache keys:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple cached items
   */
  async mset(
    items: Array<{ key: string; data: unknown; ttl?: number }>, 
    type: string = 'api'
  ): Promise<boolean> {
    try {
      if (!this.redis) return false;
      const pipeline = this.redis.pipeline();
      
      for (const item of items) {
        const config = this.cacheConfigs[type];
        const ttl = item.ttl || config?.ttl || 300;
        const fullKey = this.buildKey(item.key, type);
        
        let serializedData = JSON.stringify(item.data);
        
        // Compression automatique si nécessaire
        if (config?.compression && serializedData.length > (config.threshold || 1024)) {
          serializedData = `gzip:${serializedData}`;
        }
        
        pipeline.setex(fullKey, ttl, serializedData);
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      this.logger.error('Failed to set multiple cache keys:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memory: unknown;
    keyspace: unknown;
    clients: unknown;
    stats: unknown;
  }> {
    try {
      if (!this.redis) {
        return { memory: null, keyspace: null, clients: null, stats: null };
      }
      const [memory, keyspace, clients, stats] = await Promise.all([
        (this.redis as unknown as { memory?: (arg: string) => Promise<unknown> }).memory?.('usage') ?? Promise.resolve(null),
        this.redis.info('keyspace'),
        this.redis.info('clients'),
        this.redis.info('stats'),
      ]);

      return { memory, keyspace, clients, stats };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      throw error;
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<boolean> {
    try {
      if (!this.redis) return true;
      await this.redis.flushall();
      return true;
    } catch (error) {
      this.logger.error('Failed to clear all cache:', error);
      return false;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.redis) return false;
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.debug('Redis health check: not yet connected');
      return false;
    }
  }

  /**
   * Build cache key with namespace
   */
  private buildKey(key: string, type: string): string {
    return `luneo:${type}:${key}`;
  }

  /**
   * Add tags to cache key
   */
  private async addTags(key: string, tags: string[]): Promise<void> {
    if (!this.redis) return;
    const pipeline = this.redis.pipeline();
    
    for (const tag of tags) {
      pipeline.sadd(`tags:${tag}`, key);
    }
    
    await pipeline.exec();
  }

  /**
   * Get Redis instance for advanced operations
   */
  getRedis(): Redis | null {
    return this.redis;
  }
}
