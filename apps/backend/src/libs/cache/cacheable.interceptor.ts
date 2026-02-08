/**
 * Cache Interceptor for NestJS
 * Automatically intercepts methods decorated with @Cacheable
 * and caches their results
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SmartCacheService } from './smart-cache.service';
import {
  CACHEABLE_METADATA,
  CACHE_INVALIDATE_METADATA,
  CacheableOptions,
  CacheInvalidateOptions,
  generateCacheKey,
} from './cacheable.decorator';

@Injectable()
export class CacheableInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheableInterceptor.name);

  constructor(
    private readonly cache: SmartCacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const handler = context.getHandler();
    const target = context.getClass();
    const args = context.getArgs();

    // Check for @Cacheable decorator
    const cacheableOptions = this.reflector.get<CacheableOptions>(
      CACHEABLE_METADATA,
      handler,
    );

    // Check for @CacheInvalidate decorator
    const invalidateOptions = this.reflector.get<CacheInvalidateOptions>(
      CACHE_INVALIDATE_METADATA,
      handler,
    );

    // Handle cache invalidation first
    if (invalidateOptions) {
      await this.handleInvalidation(invalidateOptions, args, target, handler.name);
    }

    // Handle caching
    if (cacheableOptions) {
      return this.handleCache(cacheableOptions, args, target, handler.name, next);
    }

    // No caching, proceed normally
    return next.handle();
  }

  private async handleInvalidation(
    options: CacheInvalidateOptions,
    args: any[],
    target: any,
    methodName: string,
  ): Promise<void> {
    try {
      const cacheType = options.type || 'api';

      // Invalidate by pattern
      if (options.pattern) {
        const pattern =
          typeof options.pattern === 'function'
            ? options.pattern(args, target, methodName)
            : options.pattern;

        await this.cache.invalidate(pattern, cacheType);
        this.logger.debug(`Cache invalidated: ${pattern}`);
      }

      // Invalidate by tags
      if (options.tags) {
        const tags =
          typeof options.tags === 'function'
            ? options.tags(args, target, methodName)
            : options.tags;

        // Use invalidateByTags if available, otherwise fallback to invalidate
        const cacheWithTags = this.cache as SmartCacheService & { invalidateByTags?: (tags: string[]) => Promise<void> };
        if (typeof cacheWithTags.invalidateByTags === 'function') {
          await cacheWithTags.invalidateByTags(tags);
        } else {
          for (const tag of tags) {
            await this.cache.invalidate(tag, cacheType);
          }
        }
        this.logger.debug(`Cache invalidated by tags: ${tags.join(', ')}`);
      }
    } catch (error) {
      this.logger.error('Cache invalidation error:', error);
      // Don't throw, continue execution
    }
  }

  private handleCache(
    options: CacheableOptions,
    args: any[],
    target: any,
    methodName: string,
    next: CallHandler,
  ): Observable<any> {
    const cacheType = options.type || 'api';
    const cacheKey = generateCacheKey(args, target, methodName, options.keyGenerator);

    // Try to get from cache
    return new Observable((observer) => {
      this.cache
        .get(
          cacheKey,
          cacheType,
          async () => {
            // Cache miss, execute method
            return new Promise((resolve, reject) => {
              next
                .handle()
                .pipe(
                  tap({
                    next: (data) => {
                      // Skip caching if null/undefined and option is set
                      if (options.skipIfNull && (data === null || data === undefined)) {
                        resolve(data);
                        return;
                      }

                      // Determine tags
                      let tags: string[] = [];
                      if (options.tags) {
                        tags =
                          typeof options.tags === 'function'
                            ? options.tags(args, target, methodName)
                            : options.tags;
                      }

                      // Cache the result
                      this.cache
                        .set(cacheKey, cacheType, data, {
                          ttl: options.ttl,
                          tags,
                        })
                        .then(() => {
                          this.logger.debug(`Cached: ${cacheKey}`);
                          resolve(data);
                        })
                        .catch((error) => {
                          this.logger.warn(`Cache set error for ${cacheKey}:`, error);
                          resolve(data); // Return data even if cache fails
                        });
                    },
                    error: (error) => {
                      if (options.cacheErrors) {
                        // Cache the error (not recommended)
                        this.cache
                          .set(cacheKey, cacheType, { error: error.message }, {
                            ttl: options.ttl || 60,
                          })
                          .catch(() => {});
                      }
                      reject(error);
                    },
                  }),
                )
                .subscribe({
                  next: () => {},
                  error: (error) => reject(error),
                });
            });
          },
          {
            ttl: options.ttl,
            tags:
              typeof options.tags === 'function'
                ? options.tags(args, target, methodName)
                : options.tags,
          },
        )
        .then((data) => {
          if (data !== null) {
            observer.next(data);
            observer.complete();
          } else {
            // Cache miss, execute method
            next.handle().subscribe({
              next: (value) => observer.next(value),
              error: (error) => observer.error(error),
              complete: () => observer.complete(),
            });
          }
        })
        .catch((error) => {
          this.logger.error(`Cache error for ${cacheKey}:`, error);
          // Fallback to executing method
          next.handle().subscribe({
            next: (value) => observer.next(value),
            error: (error) => observer.error(error),
            complete: () => observer.complete(),
          });
        });
    });
  }
}

