/**
 * ★★★ CACHE SERVICE - GESTION CACHE AVANCÉE ★★★
 * Service de cache professionnel
 * - In-memory cache
 * - TTL management
 * - Cache invalidation
 * - Cache warming
 * - Statistics
 */

import { logger } from '@/lib/logger';

// ========================================
// TYPES
// ========================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  metadata?: Record<string, unknown>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  entries: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  metadata?: Record<string, unknown>;
}

// ========================================
// SERVICE
// ========================================

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
  };
  private maxSize: number = 1000;
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // ========================================
  // GET
  // ========================================

  /**
   * Récupère une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hits
    entry.hits++;
    this.stats.hits++;

    logger.debug('Cache hit', { key, hits: entry.hits });

    return entry.data as T;
  }

  // ========================================
  // SET
  // ========================================

  /**
   * Met une valeur en cache
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = this.defaultTTL, metadata } = options;

    // Check max size
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      metadata,
    };

    this.cache.set(key, entry);

    logger.debug('Cache set', { key, ttl });
  }

  // ========================================
  // DELETE
  // ========================================

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache deleted', { key });
    }
    return deleted;
  }

  /**
   * Vide le cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    logger.info('Cache cleared');
  }

  /**
   * Alias historique pour compatibilité rétro
   */
  invalidateCache(): void {
    this.clear();
  }

  /**
   * Supprime les entrées correspondant à un pattern
   */
  deletePattern(pattern: string | RegExp): number {
    let count = 0;
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    if (count > 0) {
      logger.info('Cache pattern deleted', { pattern, count });
    }

    return count;
  }

  // ========================================
  // INVALIDATION
  // ========================================

  /**
   * Invalide le cache pour un produit
   */
  invalidateProduct(productId: string): void {
    this.deletePattern(`product:${productId}`);
    this.deletePattern(`product:${productId}:*`);
    logger.info('Product cache invalidated', { productId });
  }

  /**
   * Invalide le cache pour une personnalisation
   */
  invalidateCustomization(customizationId: string): void {
    this.deletePattern(`customization:${customizationId}`);
    this.deletePattern(`customization:${customizationId}:*`);
    logger.info('Customization cache invalidated', { customizationId });
  }

  /**
   * Invalide le cache pour une zone
   */
  invalidateZone(zoneId: string): void {
    this.deletePattern(`zone:${zoneId}`);
    this.deletePattern(`zone:${zoneId}:*`);
    logger.info('Zone cache invalidated', { zoneId });
  }

  // ========================================
  // UTILITIES
  // ========================================

  /**
   * Vérifie si une clé existe dans le cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Récupère ou met en cache une valeur
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, options);
    return data;
  }

  /**
   * Nettoie les entrées expirées
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cache cleanup', { cleaned });
    }
  }

  /**
   * Évince l'entrée la moins récemment utilisée (LRU)
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruHits = Infinity;
    let lruTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Prefer entries with fewer hits
      if (entry.hits < lruHits || (entry.hits === lruHits && entry.timestamp < lruTimestamp)) {
        lruKey = key;
        lruHits = entry.hits;
        lruTimestamp = entry.timestamp;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      logger.debug('Cache evicted (LRU)', { key: lruKey });
    }
  }

  // ========================================
  // STATISTICS
  // ========================================

  /**
   * Récupère les statistiques du cache
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      entries: this.cache.size,
    };
  }

  /**
   * Réinitialise les statistiques
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 };
    logger.info('Cache stats reset');
  }

  // ========================================
  // CONFIGURATION
  // ========================================

  /**
   * Détruit l'instance et nettoie les intervalles
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    logger.info('CacheService destroyed');
  }

  /**
   * Configure le cache
   */
  configure(options: { maxSize?: number; defaultTTL?: number }): void {
    if (options.maxSize !== undefined) {
      this.maxSize = options.maxSize;
    }
    if (options.defaultTTL !== undefined) {
      this.defaultTTL = options.defaultTTL;
    }
    logger.info('Cache configured', options);
  }
}

// ========================================
// EXPORT
// ========================================

export const cacheService = CacheService.getInstance();
