/**
 * Cache Decorator for NestJS Services
 * Automatically caches method results using Redis
 * 
 * Usage:
 * @Cacheable({ type: 'product', ttl: 3600 })
 * async findOne(id: string) { ... }
 */

import { SetMetadata } from '@nestjs/common';
import { SmartCacheService } from './smart-cache.service';

export const CACHEABLE_METADATA = 'cacheable';
export const CACHE_INVALIDATE_METADATA = 'cache_invalidate';

export interface CacheableOptions {
  /**
   * Cache type (user, brand, product, design, analytics, etc.)
   * Determines TTL and strategy
   */
  type?: string;
  
  /**
   * Time to live in seconds
   * Overrides default TTL for the cache type
   */
  ttl?: number;
  
  /**
   * Cache key generator function
   * Default: uses method name + serialized arguments
   */
  keyGenerator?: (args: unknown[], target: object, methodName: string) => string;
  
  /**
   * Tags for cache invalidation
   * Can be static or dynamic based on method arguments
   */
  tags?: string[] | ((args: unknown[], target: object, methodName: string) => string[]);
  
  /**
   * Whether to skip caching if result is null/undefined
   */
  skipIfNull?: boolean;
  
  /**
   * Whether to cache errors (not recommended)
   */
  cacheErrors?: boolean;
}

export interface CacheInvalidateOptions {
  /**
   * Cache type
   */
  type?: string;
  
  /**
   * Pattern or key generator for invalidation
   */
  pattern?: string | ((args: unknown[], target: object, methodName: string) => string);
  
  /**
   * Tags to invalidate
   */
  tags?: string[] | ((args: unknown[], target: object, methodName: string) => string[]);
}

/**
 * Decorator to cache method results automatically
 * 
 * @example
 * ```typescript
 * @Cacheable({ type: 'product', ttl: 3600 })
 * async findOne(id: string) {
 *   return this.prisma.product.findUnique({ where: { id } });
 * }
 * ```
 */
export function Cacheable(options: CacheableOptions = {}) {
  return SetMetadata(CACHEABLE_METADATA, {
    type: options.type || 'api',
    ttl: options.ttl,
    keyGenerator: options.keyGenerator,
    tags: options.tags,
    skipIfNull: options.skipIfNull ?? true,
    cacheErrors: options.cacheErrors ?? false,
  });
}

/**
 * Decorator to invalidate cache when method is called
 * 
 * @example
 * ```typescript
 * @CacheInvalidate({ type: 'product', pattern: 'product:*' })
 * async update(id: string, data: unknown) {
 *   return this.prisma.product.update({ where: { id }, data });
 * }
 * ```
 */
export function CacheInvalidate(options: CacheInvalidateOptions = {}) {
  return SetMetadata(CACHE_INVALIDATE_METADATA, {
    type: options.type || 'api',
    pattern: options.pattern,
    tags: options.tags,
  });
}

/**
 * Default key generator: methodName:arg1:arg2:...
 */
export function defaultKeyGenerator(
  args: unknown[],
  target: object,
  methodName: string
): string {
  const className = target.constructor.name;
  const serializedArgs = args
    .map(arg => {
      if (arg === null || arg === undefined) return 'null';
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    })
    .join(':');
  
  return `${className}:${methodName}:${serializedArgs}`;
}

/**
 * Helper to generate cache key from method arguments
 */
export function generateCacheKey(
  args: unknown[],
  target: object,
  methodName: string,
  customGenerator?: (args: unknown[], target: object, methodName: string) => string
): string {
  if (customGenerator) {
    return customGenerator(args, target, methodName);
  }
  return defaultKeyGenerator(args, target, methodName);
}

