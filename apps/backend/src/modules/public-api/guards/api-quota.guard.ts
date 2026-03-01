import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';
import { PublicApiAuthContext } from '../types/public-api-auth.type';

interface PublicApiRequest {
  publicApiAuth?: PublicApiAuthContext;
}

@Injectable()
export class ApiQuotaGuard implements CanActivate {
  private readonly logger = new Logger(ApiQuotaGuard.name);

  constructor(private readonly redis: RedisOptimizedService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<PublicApiRequest>();
    const auth = request.publicApiAuth;
    if (!auth) return true;

    const client = this.redis.client;
    if (!client) return true;

    const limit = Math.max(10, auth.rateLimit || 1000);
    const bucket = Math.floor(Date.now() / 60000);
    const key = `public_api_quota:${auth.keyId}:${bucket}`;

    try {
      const usage = await client.incr(key);
      if (usage === 1) {
        await client.expire(key, 70);
      }

      if (usage > limit) {
        throw new HttpException(
          `API key quota exceeded (${limit}/minute)`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      // Fail-open on Redis errors to preserve API availability.
      this.logger.warn(
        `Quota backend unavailable for api key ${auth.keyId}, skipping quota check`,
      );
    }

    return true;
  }
}
