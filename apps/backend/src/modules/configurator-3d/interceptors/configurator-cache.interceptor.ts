import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, from, of } from 'rxjs';
import { tap, switchMap, catchError } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { CurrentUser } from '@/common/types/user.types';

const CACHE_TYPE = 'configurator-3d';
const TTL_LIST = 300;
const TTL_SINGLE = 600;

@Injectable()
export class ConfiguratorCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ConfiguratorCacheInterceptor.name);

  constructor(private readonly cache: SmartCacheService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, query } = request;

    if (request.headers?.['x-no-cache']?.toLowerCase() === 'true') {
      return next.handle();
    }

    const user = request.user as CurrentUser | undefined;
    const brandId = user?.brandId ?? 'anonymous';

    if (method !== 'GET') {
      return next.handle().pipe(
        tap({
          next: () => {
            Promise.resolve()
              .then(() =>
                this.cache.invalidateByTags([
                  'configurator-3d',
                  `brand:${brandId}`,
                ]),
              )
              .catch((err) =>
                this.logger.warn('Cache invalidation failed', err),
              );
          },
        }),
      );
    }

    const cacheKey = this.buildCacheKey(url, query, brandId);
    const isListEndpoint = this.isListEndpoint(url);
    const ttl = isListEndpoint ? TTL_LIST : TTL_SINGLE;
    const tags = ['configurator-3d', `brand:${brandId}`];

    return from(
      this.cache.get(
        cacheKey,
        CACHE_TYPE,
        () => lastValueFrom(next.handle()),
        { ttl, tags },
      ),
    ).pipe(
      switchMap((data) => {
        if (data !== null) {
          return of(data);
        }
        return next.handle();
      }),
      catchError((err) => {
        this.logger.warn(`Cache get failed for ${cacheKey}`, err);
        return next.handle();
      }),
    );
  }

  private buildCacheKey(
    url: string,
    query: Record<string, unknown>,
    brandId: string,
  ): string {
    const queryStr = Object.keys(query || {})
      .sort()
      .map((k) => `${k}=${String(query[k])}`)
      .join('&');
    return `${url}${queryStr ? `?${queryStr}` : ''}:${brandId}`;
  }

  private isListEndpoint(url: string): boolean {
    const isConfigurationsList =
      url.includes('/configurator-3d/configurations') &&
      !/\/configurator-3d\/configurations\/[^/]+(\/|$)/.test(url) &&
      !url.includes('/options');
    const isAnalytics = url.includes('/configurator-3d/analytics');
    return isConfigurationsList || isAnalytics;
  }
}
