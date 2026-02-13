import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache';
export const CACHE_TTL_KEY = 'cache_ttl';
export const CACHE_TAGS_KEY = 'cache_tags';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  key?: string; // Custom cache key
}

/**
 * Cache decorator for methods
 * Inspired by Next.js caching and Vercel Edge Cache
 * 
 * Usage:
 * @Cache({ ttl: 300, tags: ['products'] })
 * async getProduct(id: string) { ... }
 */
export const Cache = (options: CacheOptions = {}) => {
  return (target: object, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY, true)(target, propertyKey, descriptor);
    if (options.ttl) {
      SetMetadata(CACHE_TTL_KEY, options.ttl)(target, propertyKey, descriptor);
    }
    if (options.tags) {
      SetMetadata(CACHE_TAGS_KEY, options.tags)(target, propertyKey, descriptor);
    }
    if (options.key) {
      SetMetadata('cache_key', options.key)(target, propertyKey, descriptor);
    }
    return descriptor;
  };
};

/**
 * Invalidate cache by tags
 * Usage:
 * @InvalidateCache(['products', 'product:123'])
 * async updateProduct(id: string) { ... }
 */
export const InvalidateCache = (tags: string[]) => {
  return SetMetadata('invalidate_cache', tags);
};
