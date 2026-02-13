import { Injectable, NestInterceptor, ExecutionContext, CallHandler, SetMetadata } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Reflector } from '@nestjs/core';

export const CACHE_TTL_KEY = 'cache_ttl';
export const CacheTTL = (seconds: number) => SetMetadata(CACHE_TTL_KEY, seconds);

@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler());
    if (!ttl) return next.handle();

    const response = context.switchToHttp().getResponse();
    return next.handle().pipe(
      tap(() => {
        response.setHeader(
          'Cache-Control',
          `public, max-age=${ttl}, stale-while-revalidate=${ttl * 2}`,
        );
      }),
    );
  }
}
