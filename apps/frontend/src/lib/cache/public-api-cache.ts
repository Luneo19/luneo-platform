/**
 * Cache Redis pour les APIs Publiques
 * 
 * Fonctionnalités:
 * - Stale-while-revalidate pattern
 * - Cache tags pour invalidation groupée
 * - Fallback automatique si Redis indisponible
 * - Métriques de performance
 * - Compression pour grandes valeurs
 */

import { Redis, type Redis as RedisType } from '@upstash/redis';
import { logger } from '@/lib/logger';

// ============================================
// REDIS SINGLETON
// ============================================

let redisInstance: RedisType | null | undefined = undefined;

function getRedis(): RedisType | null {
  if (redisInstance !== undefined) {
    return redisInstance;
  }

  const hasRedisConfig =
    Boolean(process.env.UPSTASH_REDIS_REST_URL) && 
    Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (!hasRedisConfig) {
    redisInstance = null;
    logger.warn('Redis not configured - public API caching disabled');
    return null;
  }

  try {
    const instance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!.trim(),
      token: process.env.UPSTASH_REDIS_REST_TOKEN!.trim(),
    });
    redisInstance = instance;
    logger.info('Redis connected for public API caching');
    return instance;
  } catch (error) {
    logger.error('Failed to initialize Redis', error as Error);
    redisInstance = null;
    return null;
  }
}

// ============================================
// TYPES
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleAt: number;
  tags?: string[];
}

interface CacheOptions {
  /** TTL en secondes (default: 3600) */
  ttl?: number;
  /** Durée pendant laquelle les données stale sont acceptables (default: ttl * 2) */
  staleWhileRevalidate?: number;
  /** Tags pour invalidation groupée */
  tags?: string[];
  /** Forcer le refresh (ignorer le cache) */
  forceRefresh?: boolean;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  staleHits: number;
  errors: number;
  sets: number;
  invalidations: number;
}

// ============================================
// CONFIGURATION
// ============================================

/**
 * TTL par défaut pour chaque type de données publiques (en secondes)
 */
export const PUBLIC_CACHE_TTL = {
  // Marketing
  MARKETING_DATA: 3600,        // 1 heure
  TESTIMONIALS: 7200,          // 2 heures
  CASE_STUDIES: 7200,          // 2 heures
  CLIENT_LOGOS: 86400,         // 24 heures
  
  // Solutions & Industries
  SOLUTIONS: 3600,             // 1 heure
  INDUSTRIES: 3600,            // 1 heure
  
  // Pricing & Plans
  PRICING_PLANS: 1800,         // 30 minutes
  FEATURES_COMPARISON: 1800,   // 30 minutes
  
  // Integrations
  INTEGRATIONS: 3600,          // 1 heure
  
  // Templates & Assets
  TEMPLATES_PUBLIC: 7200,      // 2 heures
  CLIPARTS: 86400,             // 24 heures
  
  // Blog
  BLOG_POSTS: 1800,            // 30 minutes
  BLOG_POST_SINGLE: 900,       // 15 minutes
  
  // Static content
  STATIC_PAGES: 3600,          // 1 heure
  FAQS: 7200,                  // 2 heures
  
  // Short-lived
  STATS: 300,                  // 5 minutes
} as const;

/**
 * Préfixes de clés cache
 */
export const CACHE_PREFIX = {
  PUBLIC_API: 'public:api:',
  MARKETING: 'public:marketing:',
  PRICING: 'public:pricing:',
  SOLUTIONS: 'public:solutions:',
  INDUSTRIES: 'public:industries:',
  INTEGRATIONS: 'public:integrations:',
  TEMPLATES: 'public:templates:',
  BLOG: 'public:blog:',
} as const;

// ============================================
// CACHE SERVICE
// ============================================

class PublicApiCacheService {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    staleHits: 0,
    errors: 0,
    sets: 0,
    invalidations: 0,
  };
  
  private inFlightRequests = new Map<string, Promise<unknown>>();

  /**
   * Récupérer une valeur du cache avec SWR
   */
  async get<T>(
    key: string,
    _options: Pick<CacheOptions, 'staleWhileRevalidate'> = {}
  ): Promise<{ data: T | null; isStale: boolean }> {
    const redis = getRedis();
    if (!redis) {
      this.metrics.misses++;
      return { data: null, isStale: false };
    }

    try {
      const entry = await redis.get<CacheEntry<T>>(key);
      
      if (!entry) {
        this.metrics.misses++;
        return { data: null, isStale: false };
      }

      const now = Date.now();
      const isStale = now > entry.staleAt;
      
      if (isStale) {
        this.metrics.staleHits++;
        logger.debug('Cache stale hit', { key, age: now - entry.timestamp });
      } else {
        this.metrics.hits++;
        logger.debug('Cache hit', { key, age: now - entry.timestamp });
      }

      return { data: entry.data, isStale };
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache get error', error as Error, { key });
      return { data: null, isStale: false };
    }
  }

  /**
   * Stocker une valeur dans le cache
   */
  async set<T>(
    key: string,
    data: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    const redis = getRedis();
    if (!redis) {
      return false;
    }

    try {
      const { ttl = PUBLIC_CACHE_TTL.MARKETING_DATA, staleWhileRevalidate, tags } = options;
      const now = Date.now();
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: now,
        staleAt: now + (ttl * 1000),
        tags,
      };

      // TTL total inclut la période stale
      const totalTtl = staleWhileRevalidate 
        ? ttl + staleWhileRevalidate 
        : ttl * 2;

      await redis.setex(key, totalTtl, entry);
      
      // Enregistrer les tags pour invalidation
      if (tags && tags.length > 0) {
        await this.registerTags(key, tags);
      }

      this.metrics.sets++;
      logger.debug('Cache set', { key, ttl, tags });
      return true;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache set error', error as Error, { key });
      return false;
    }
  }

  /**
   * Pattern Stale-While-Revalidate
   * Retourne immédiatement les données en cache (même stale) et revalide en background
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { forceRefresh = false, ttl: _ttl = PUBLIC_CACHE_TTL.MARKETING_DATA } = options;

    // Forcer le refresh - ignorer le cache
    if (forceRefresh) {
      const data = await fetcher();
      await this.set(key, data, options);
      return data;
    }

    // Vérifier le cache
    const { data: cached, isStale } = await this.get<T>(key);

    if (cached !== null) {
      // Si les données sont stale, revalider en background
      if (isStale) {
        this.revalidateInBackground(key, fetcher, options);
      }
      return cached;
    }

    // Cache miss - éviter les requêtes parallèles (thundering herd)
    return this.deduplicatedFetch(key, fetcher, options);
  }

  /**
   * Revalider en background (fire and forget)
   */
  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<void> {
    // Ne pas attendre - exécuter en background
    setImmediate(async () => {
      try {
        const freshData = await fetcher();
        await this.set(key, freshData, options);
        logger.debug('Cache revalidated in background', { key });
      } catch (error) {
        logger.error('Background revalidation failed', error as Error, { key });
      }
    });
  }

  /**
   * Éviter les requêtes parallèles pour la même clé
   */
  private async deduplicatedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions
  ): Promise<T> {
    // Vérifier s'il y a déjà une requête en cours pour cette clé
    const inFlight = this.inFlightRequests.get(key);
    if (inFlight) {
      logger.debug('Deduplicating request', { key });
      return inFlight as Promise<T>;
    }

    // Créer la promise et l'enregistrer
    const fetchPromise = (async () => {
      try {
        const data = await fetcher();
        await this.set(key, data, options);
        return data;
      } finally {
        this.inFlightRequests.delete(key);
      }
    })();

    this.inFlightRequests.set(key, fetchPromise);
    return fetchPromise;
  }

  /**
   * Enregistrer les tags pour une clé
   */
  private async registerTags(key: string, tags: string[]): Promise<void> {
    const redis = getRedis();
    if (!redis) return;

    try {
      for (const tag of tags) {
        await redis.sadd(`tag:${tag}`, key);
      }
    } catch (error) {
      logger.error('Failed to register cache tags', error as Error, { key, tags });
    }
  }

  /**
   * Invalider par tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    const redis = getRedis();
    if (!redis) return 0;

    try {
      const keys = await redis.smembers(`tag:${tag}`);
      
      if (keys.length === 0) return 0;

      await redis.del(...keys);
      await redis.del(`tag:${tag}`);
      
      this.metrics.invalidations += keys.length;
      logger.info('Cache invalidated by tag', { tag, count: keys.length });
      return keys.length;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache invalidation by tag failed', error as Error, { tag });
      return 0;
    }
  }

  /**
   * Invalider plusieurs tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let total = 0;
    for (const tag of tags) {
      total += await this.invalidateByTag(tag);
    }
    return total;
  }

  /**
   * Supprimer une clé spécifique
   */
  async delete(key: string): Promise<boolean> {
    const redis = getRedis();
    if (!redis) return false;

    try {
      await redis.del(key);
      this.metrics.invalidations++;
      logger.debug('Cache key deleted', { key });
      return true;
    } catch (error) {
      this.metrics.errors++;
      logger.error('Cache delete error', error as Error, { key });
      return false;
    }
  }

  /**
   * Obtenir les métriques
   */
  getMetrics(): CacheMetrics & { hitRate: number } {
    const total = this.metrics.hits + this.metrics.staleHits + this.metrics.misses;
    const hitRate = total > 0 
      ? ((this.metrics.hits + this.metrics.staleHits) / total) * 100 
      : 0;
    
    return {
      ...this.metrics,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Réinitialiser les métriques
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      staleHits: 0,
      errors: 0,
      sets: 0,
      invalidations: 0,
    };
  }

  /**
   * Vérifier si Redis est configuré
   */
  isAvailable(): boolean {
    return getRedis() !== null;
  }
}

// Export singleton
export const publicApiCache = new PublicApiCacheService();

// ============================================
// HELPERS POUR APIS PUBLIQUES
// ============================================

/**
 * Générer une clé de cache pour le marketing
 */
export function marketingCacheKey(resource: string, locale = 'fr'): string {
  return `${CACHE_PREFIX.MARKETING}${resource}:${locale}`;
}

/**
 * Générer une clé de cache pour les solutions
 */
export function solutionCacheKey(slug: string, locale = 'fr'): string {
  return `${CACHE_PREFIX.SOLUTIONS}${slug}:${locale}`;
}

/**
 * Générer une clé de cache pour les industries
 */
export function industryCacheKey(slug: string, locale = 'fr'): string {
  return `${CACHE_PREFIX.INDUSTRIES}${slug}:${locale}`;
}

/**
 * Générer une clé de cache pour les intégrations
 */
export function integrationCacheKey(slug: string, locale = 'fr'): string {
  return `${CACHE_PREFIX.INTEGRATIONS}${slug}:${locale}`;
}

/**
 * Générer une clé de cache pour le pricing
 */
export function pricingCacheKey(locale = 'fr'): string {
  return `${CACHE_PREFIX.PRICING}plans:${locale}`;
}

/**
 * Générer une clé de cache pour le blog
 */
export function blogCacheKey(resource: string, locale = 'fr'): string {
  return `${CACHE_PREFIX.BLOG}${resource}:${locale}`;
}

// ============================================
// DÉCORATEUR POUR API ROUTES (Usage optionnel)
// ============================================

/**
 * Wrapper pour ajouter du caching aux API routes
 * 
 * Usage:
 * export const GET = withPublicApiCache(
 *   async (req) => fetchData(),
 *   { key: 'my-key', ttl: 3600 }
 * );
 */
export function withPublicApiCache<T>(
  handler: (req: Request) => Promise<T>,
  config: {
    key: string | ((req: Request) => string);
    ttl?: number;
    tags?: string[];
    revalidateOnError?: boolean;
  }
) {
  return async (req: Request): Promise<T> => {
    const key = typeof config.key === 'function' 
      ? config.key(req) 
      : config.key;
    
    try {
      return await publicApiCache.getOrSet(key, () => handler(req), {
        ttl: config.ttl,
        tags: config.tags,
      });
    } catch (error) {
      // En cas d'erreur, essayer de retourner les données stale
      if (config.revalidateOnError !== false) {
        const { data: stale } = await publicApiCache.get<T>(key);
        if (stale) {
          logger.warn('Returning stale data due to error', { key, error });
          return stale;
        }
      }
      throw error;
    }
  };
}

