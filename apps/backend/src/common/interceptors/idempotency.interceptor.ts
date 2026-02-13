import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private redis: RedisOptimizedService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.idempotencyKey;
    const cachedResponse = request.idempotencyCachedResponse;

    // Si réponse en cache, la retourner directement
    if (cachedResponse) {
      return of(cachedResponse);
    }

    // Sinon, exécuter la requête et mettre en cache
    return next.handle().pipe(
      tap(async (response) => {
        if (idempotencyKey && response) {
          try {
            // Mettre en cache pour 24h
            await this.redis.set(
              `idempotency:${idempotencyKey}`,
              response,
              'api',
              { ttl: 86400 }, // 24h TTL
            );
          } catch (error) {
            // Si Redis n'est pas disponible, ignorer (mode dégradé)
          }
        }
      }),
    );
  }
}

