// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { RedisOptimizedService } from '../redis/redis-optimized.service';
import { PrismaOptimizedService } from '../prisma/prisma-optimized.service';

interface CacheStrategy {
  ttl: number;
  refreshThreshold: number; // Pourcentage de TTL restant avant refresh
  maxRetries: number;
  fallbackToCache: boolean;
}

@Injectable()
export class SmartCacheService {
  private readonly logger = new Logger(SmartCacheService.name);
  
  private readonly defaultStrategy: CacheStrategy = { ttl: 1800, refreshThreshold: 0.7, maxRetries: 3, fallbackToCache: true };

  private readonly strategies: Record<string, CacheStrategy> = {
    user: { ttl: 1800, refreshThreshold: 0.8, maxRetries: 3, fallbackToCache: true },
    brand: { ttl: 3600, refreshThreshold: 0.7, maxRetries: 3, fallbackToCache: true },
    product: { ttl: 7200, refreshThreshold: 0.6, maxRetries: 2, fallbackToCache: true },
    design: { ttl: 900, refreshThreshold: 0.9, maxRetries: 5, fallbackToCache: false },
    analytics: { ttl: 300, refreshThreshold: 0.5, maxRetries: 2, fallbackToCache: true },
    session: { ttl: 86400, refreshThreshold: 0.9, maxRetries: 3, fallbackToCache: true },
    api: { ttl: 1800, refreshThreshold: 0.7, maxRetries: 3, fallbackToCache: true },
    cache: { ttl: 3600, refreshThreshold: 0.7, maxRetries: 2, fallbackToCache: true },
    default: { ttl: 1800, refreshThreshold: 0.7, maxRetries: 3, fallbackToCache: true },
  };

  constructor(
    private readonly redisService: RedisOptimizedService,
    private readonly prismaService: PrismaOptimizedService
  ) {}

  /**
   * Smart cache with automatic refresh and fallback
   */
  async get<T>(
    key: string,
    type: string,
    fetchFn: () => Promise<T>,
    options: { ttl?: number; tags?: string[] } = {}
  ): Promise<T | null> {
    const strategy = this.strategies[type] || this.defaultStrategy;
    const cacheKey = `${type}:${key}`;
    
    try {
      // Essayer de récupérer depuis le cache
      const cached = await this.redisService.get<{
        data: T;
        timestamp: number;
        ttl: number;
      }>(cacheKey, type);

      if (cached) {
        const now = Date.now();
        const age = (now - cached.timestamp) / 1000;
        const remainingTtl = cached.ttl - age;

        // Si le cache est encore valide
        if (remainingTtl > 0) {
          // Vérifier si on doit pré-charger (refresh en arrière-plan)
          const shouldRefresh = remainingTtl < (cached.ttl * strategy.refreshThreshold);
          
          if (shouldRefresh) {
            // Refresh en arrière-plan sans bloquer
            this.refreshInBackground(cacheKey, type, fetchFn, options, strategy);
          }

          return cached.data;
        }
      }

      // Cache expiré ou inexistant, récupérer les données
      return await this.fetchAndCache(cacheKey, type, fetchFn, options, strategy);
      
    } catch (error) {
      this.logger.error(`Smart cache error for key ${cacheKey}:`, error);
      
      // Fallback vers le cache même expiré si configuré
      if (strategy.fallbackToCache) {
        const staleCache = await this.redisService.get<{
          data: T;
          timestamp: number;
          ttl: number;
        }>(cacheKey, type);
        
        if (staleCache) {
          this.logger.warn(`Using stale cache for key ${cacheKey}`);
          return staleCache.data;
        }
      }
      
      return null;
    }
  }

  /**
   * Invalide tous les caches avec les tags spécifiés
   */
  async invalidateTags(tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const keys = await this.redisService.get<string[]>(tagKey, 'cache') || [];
      
      // Delete all keys with this tag
      await Promise.all(keys.map(key => this.redisService.del(key, 'cache')));
      
      // Delete tag key itself
      await this.redisService.del(tagKey, 'cache');
    }
  }

  /**
   * Set avec invalidation intelligente et tags
   */
  async set<T>(
    key: string,
    type: string,
    data: T,
    options: { ttl?: number; tags?: string[] } = {}
  ): Promise<boolean> {
    const strategy = this.strategies[type] || this.defaultStrategy;
    const cacheKey = `${type}:${key}`;
    const ttl = options.ttl || strategy.ttl;

    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl
    };

    try {
      const result = await this.redisService.set(cacheKey, cacheData, type, { ttl });

      // Store tags if provided
      if (options.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          const tagKey = `tag:${tag}`;
          const keys = await this.redisService.get<string[]>(tagKey, 'cache') || [];
          if (!keys.includes(cacheKey)) {
            keys.push(cacheKey);
                  await this.redisService.set(tagKey, keys, 'cache', { ttl: ttl * 2 }); // Tags expire later
          }
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Smart cache set error for key ${cacheKey}:`, error);
      return false;
    }
  }

  /**
   * Invalidation par patterns
   */
  async invalidate(pattern: string, type: string): Promise<number> {
    try {
      const cacheKey = `${type}:${pattern}`;
      return await this.redisService.invalidateByTags([cacheKey]);
    } catch (error) {
      this.logger.error(`Smart cache invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidation par tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      return await this.redisService.invalidateByTags(tags);
    } catch (error) {
      this.logger.error(`Smart cache invalidation error for tags ${tags.join(', ')}:`, error);
      return 0;
    }
  }

  /**
   * Pré-chargement intelligent
   */
  async preload<T>(
    keys: string[],
    type: string,
    fetchFn: (key: string) => Promise<T>,
    options: { ttl?: number; tags?: string[] } = {}
  ): Promise<void> {
    const _strategy = this.strategies[type] || this.defaultStrategy;
    
    try {
      const promises = keys.map(async (key) => {
        const cacheKey = `${type}:${key}`;
        
        // Vérifier si déjà en cache
        const existing = await this.redisService.get(cacheKey, type);
        if (existing) return;

        // Pré-charger
        try {
          const data = await fetchFn(key);
          await this.set(key, type, data, options);
        } catch (error) {
          this.logger.warn(`Preload failed for key ${key}:`, error);
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.error('Smart cache preload error:', error);
    }
  }

  /**
   * Cache warming pour les données critiques
   */
  async warmup(): Promise<void> {
    this.logger.log('Starting cache warmup...');
    
    try {
      // Récupérer les brands les plus actives
      const activeBrands = await this.prismaService.brand.findMany({
        select: { id: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Pré-charger les données pour chaque brand
      for (const brand of activeBrands) {
        await Promise.allSettled([
          this.preload(
            [brand.id],
            'brand',
            async (id) => this.prismaService.brand.findUnique({ where: { id } })
          ),
          this.preload(
            [brand.id],
            'analytics',
            async (id) => this.prismaService.getDashboardMetrics(id)
          )
        ]);
      }

      this.logger.log('Cache warmup completed');
    } catch (error) {
      this.logger.error('Cache warmup failed:', error);
    }
  }

  /**
   * Méthode simple get pour compatibilité
   */
  async getSimple<T = unknown>(key: string): Promise<T | null> {
    try {
      const cached = await this.redisService.get<{ data: T; timestamp: number; ttl: number }>(key, 'default');
      return cached?.data || null;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  /**
   * Méthode simple set pour compatibilité
   */
  async setSimple<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl: ttl || 3600
      };
      return await this.redisService.set(key, cacheData, 'default', { ttl: ttl || 3600 });
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Méthode simple del pour compatibilité
   */
  async delSimple(key: string): Promise<boolean> {
    try {
      return await this.redisService.del(key, 'default');
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
      return false;
    }
  }

  /**
   * Méthode getOrSet pour compatibilité
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    const cached = await this.getSimple<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetchFn();
    await this.setSimple<T>(key, data, ttl);
    return data;
  }

  /**
   * Statistiques de cache
   */
  async getCacheStats(): Promise<{
    hitRate: number;
    memoryUsage: Record<string, unknown>;
    keyCounts: Record<string, number>;
  }> {
    try {
      const stats = await this.redisService.getStats();
      
      // Calculer le hit rate (approximatif)
      const statsStr = (stats.stats as string) ?? '';
      const totalCommands = parseInt(statsStr.match(/keyspace_hits:(\d+)/)?.[1] || '0') + 
                           parseInt(statsStr.match(/keyspace_misses:(\d+)/)?.[1] || '0');
      const hits = parseInt(statsStr.match(/keyspace_hits:(\d+)/)?.[1] || '0');
      const hitRate = totalCommands > 0 ? (hits / totalCommands) * 100 : 0;

      return {
        hitRate: Math.round(hitRate * 100) / 100,
        memoryUsage: (stats.memory || {}) as Record<string, unknown>,
        keyCounts: this.extractKeyCounts((stats.keyspace as string) ?? '')
      };
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error);
      return { hitRate: 0, memoryUsage: {}, keyCounts: {} };
    }
  }

  /**
   * Refresh en arrière-plan
   */
  private async refreshInBackground<T>(
    cacheKey: string,
    type: string,
    fetchFn: () => Promise<T>,
    options: { ttl?: number; tags?: string[] },
    _strategy: CacheStrategy
  ): Promise<void> {
    try {
      const data = await fetchFn();
      await this.set(cacheKey.replace(`${type}:`, ''), type, data, options);
      this.logger.debug(`Background refresh completed for key ${cacheKey}`);
    } catch (error) {
      this.logger.warn(`Background refresh failed for key ${cacheKey}:`, error);
    }
  }

  /**
   * Fetch et cache avec retry
   */
  private async fetchAndCache<T>(
    cacheKey: string,
    type: string,
    fetchFn: () => Promise<T>,
    options: { ttl?: number; tags?: string[] },
    strategy: CacheStrategy
  ): Promise<T | null> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= strategy.maxRetries; attempt++) {
      try {
        const data = await fetchFn();
        
        // Mettre en cache
        await this.set(cacheKey.replace(`${type}:`, ''), type, data, options);
        
        return data;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Fetch attempt ${attempt} failed for key ${cacheKey}:`, error);
        
        if (attempt < strategy.maxRetries) {
          // Attendre avant de réessayer (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Invalider les caches liés
   */
  private async invalidateRelatedCaches(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        await this.redisService.invalidateByTags([tag]);
      }
    } catch (error) {
      this.logger.error('Failed to invalidate related caches:', error);
    }
  }

  /**
   * Extraire les compteurs de clés
   */
  private extractKeyCounts(keyspace: string): Record<string, number> {
    const counts: Record<string, number> = {};
    const matches = keyspace.match(/db\d+:keys=(\d+)/g);
    
    if (matches) {
      matches.forEach(match => {
        const [db, count] = match.split('=');
        counts[db] = parseInt(count);
      });
    }
    
    return counts;
  }
}
