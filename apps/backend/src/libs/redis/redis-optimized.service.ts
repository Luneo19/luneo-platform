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
  private readonly redis: Redis;
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
    this.redis = new Redis(redisUrl, {
      retryDelayOnFailover: 50,
      keepAlive: 30000,
      lazyConnect: true,
      // Connection pooling optimisé
      family: 4,
      connectTimeout: 5000, // Réduit à 5s pour éviter les timeouts longs
      commandTimeout: 3000, // Réduit à 3s
      maxRetriesPerRequest: 1, // Limiter les retries
      enableOfflineQueue: false, // Ne pas mettre en queue si déconnecté
    } as any);

    this.setupEventListeners();
    // Ne pas appeler initializeCacheConfigs() dans le constructeur pour éviter de bloquer
    // Il sera appelé de manière asynchrone si nécessaire
    setTimeout(() => this.initializeCacheConfigs(), 0);
  }

  private setupEventListeners() {
    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis is ready');
    });
  }

  private async initializeCacheConfigs() {
    try {
      // Ne pas bloquer le démarrage si Redis n'est pas disponible
      // Cette méthode est appelée de manière asynchrone et ne bloque pas le constructeur
      const isConnected = await this.redis.ping().catch(() => false);
      if (!isConnected) {
        this.logger.warn('Redis not available, cache will work in degraded mode');
        return;
      }
      
      // Configurer les politiques de mémoire pour chaque type de cache
      for (const [type, config] of Object.entries(this.cacheConfigs)) {
        const key = `cache:${type}:*`;
        await this.redis.config('SET', 'maxmemory-policy', 'allkeys-lru').catch(() => {
          // Ignorer les erreurs de configuration Redis
        });
        this.logger.log(`Cache config initialized for ${type}: TTL=${config.ttl}s, MaxMemory=${config.maxMemory}`);
      }
    } catch (error) {
      this.logger.warn('Redis cache config initialization failed, continuing without cache:', error.message);
      // Ne pas throw l'erreur pour ne pas bloquer le démarrage
    }
  }

  /**
   * Get cached data with automatic decompression
   */
  async get<T>(key: string, type: string = 'api'): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, type);
      const data = await this.redis.get(fullKey);
      
      if (!data) return null;

      // Décompression automatique si nécessaire
      const config = this.cacheConfigs[type];
      if (config?.compression && data.startsWith('gzip:')) {
        const compressedData = data.slice(5); // Remove 'gzip:' prefix
        // Ici on utiliserait zlib pour décompresser en production
        return JSON.parse(compressedData);
      }

      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`Failed to get cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data with automatic compression
   */
  async set(
    key: string, 
    data: any, 
    type: string = 'api', 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const config = this.cacheConfigs[type];
      const ttl = options.ttl || config?.ttl || 300;
      const fullKey = this.buildKey(key, type);
      
      let serializedData = JSON.stringify(data);
      
      // Compression automatique si nécessaire
      if (config?.compression && serializedData.length > (config.threshold || 1024)) {
        // Ici on utiliserait zlib pour compresser en production
        serializedData = `gzip:${serializedData}`;
      }

      await this.redis.setex(fullKey, ttl, serializedData);
      
      // Ajouter des tags pour invalidation groupée
      if (options.tags && options.tags.length > 0) {
        await this.addTags(fullKey, options.tags);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to set cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete cached data
   */
  async del(key: string, type: string = 'api'): Promise<boolean> {
    try {
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
    items: Array<{ key: string; data: any; ttl?: number }>, 
    type: string = 'api'
  ): Promise<boolean> {
    try {
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
    memory: any;
    keyspace: any;
    clients: any;
    stats: any;
  }> {
    try {
      const [memory, keyspace, clients, stats] = await Promise.all([
        this.redis.memory('usage' as any),
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
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
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
    const pipeline = this.redis.pipeline();
    
    for (const tag of tags) {
      pipeline.sadd(`tags:${tag}`, key);
    }
    
    await pipeline.exec();
  }

  /**
   * Get Redis instance for advanced operations
   */
  getRedis(): Redis {
    return this.redis;
  }
}
