import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisOptimizedService } from '../redis/redis-optimized.service';
import { CACHE_KEY, CACHE_TTL_KEY, CACHE_TAGS_KEY } from './cache.decorator';

/**
 * Enhanced Cacheable Interceptor
 * Extends the existing cacheable interceptor with:
 * - Tag-based cache invalidation
 * - Custom TTL per method
 * - Automatic cache key generation
 * - Cache invalidation on mutations
 * 
 * Inspired by Next.js caching and Vercel Edge Cache
 */
@Injectable()
export class EnhancedCacheableInterceptor implements NestInterceptor {
  private readonly logger = new Logger(EnhancedCacheableInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(RedisOptimizedService)
    private readonly redisService: RedisOptimizedService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Check if caching is enabled for this method
    const isCacheable = this.reflector.get<boolean>(CACHE_KEY, handler) ||
      this.reflector.get<boolean>(CACHE_KEY, controller);

    if (!isCacheable) {
      return next.handle();
    }

    // Get cache options
    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, handler) ||
      this.reflector.get<number>(CACHE_TTL_KEY, controller) ||
      300; // Default 5 minutes

    const tags = this.reflector.get<string[]>(CACHE_TAGS_KEY, handler) ||
      this.reflector.get<string[]>(CACHE_TAGS_KEY, controller) ||
      [];

    // Generate cache key
    const cacheKey = this.generateCacheKey(request, handler, controller);

    // Try to get from cache
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        return of(cached);
      }
    } catch (error) {
      // If cache fails, continue without cache
      this.logger.error('Cache read error', error instanceof Error ? error.stack : String(error));
    }

    // Execute handler and cache result
    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.redisService.set(cacheKey, data, 'api', { ttl });
          
          // Store tags for invalidation
          if (tags.length > 0) {
            await this.storeCacheTags(cacheKey, tags);
          }
        } catch (error) {
          this.logger.error('Cache write error', error instanceof Error ? error.stack : String(error));
        }
      }),
    );
  }

  private generateCacheKey(
    request: any,
    handler: Function,
    controller: Function,
  ): string {
    const method = request.method;
    const path = request.path;
    const query = JSON.stringify(request.query || {});
    const params = JSON.stringify(request.params || {});
    const userId = request.user?.id || 'anonymous';
    const brandId = request.user?.brandId || 'no-brand';

    // Custom key from metadata
    const customKey = this.reflector.get<string>('cache_key', handler);
    if (customKey) {
      return `cache:${customKey}:${userId}:${brandId}`;
    }

    // Generate key from request
    const key = `${method}:${path}:${query}:${params}:${userId}:${brandId}`;
    return `cache:${this.hashKey(key)}`;
  }

  private hashKey(key: string): string {
    // Simple hash function (can be improved)
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private async storeCacheTags(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      await this.redisService.client.sadd(`cache:tag:${tag}`, key);
      await this.redisService.client.expire(`cache:tag:${tag}`, 86400); // 24 hours
    }
  }
}
