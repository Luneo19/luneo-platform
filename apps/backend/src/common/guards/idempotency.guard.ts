import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IDEMPOTENCY_KEY } from '../decorators/idempotency-key.decorator';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redis: RedisOptimizedService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isIdempotent = this.reflector.getAllAndOverride<boolean>(IDEMPOTENCY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isIdempotent) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const idempotencyKey = 
      request.headers['idempotency-key'] || 
      request.headers['x-idempotency-key'];

    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header required');
    }

    // Vérifier si la requête a déjà été traitée
    try {
      const cachedResponse = await this.redis.get(`idempotency:${idempotencyKey}`) as string | null;
      if (cachedResponse) {
        // Retourner la réponse mise en cache
        request.idempotencyKey = idempotencyKey;
        request.idempotencyCachedResponse = JSON.parse(cachedResponse);
        return true; // Laisser l'interceptor gérer la réponse
      }
    } catch (error) {
      // Si Redis n'est pas disponible, continuer sans idempotency
      // (mode dégradé)
    }

    // Stocker l'idempotency key pour l'interceptor
    request.idempotencyKey = idempotencyKey;
    request.idempotencyStartTime = Date.now();

    return true;
  }
}

