import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { Request } from 'express';

/**
 * Global Rate Limit Guard
 * Applied globally via APP_GUARD provider
 * Inspired by Stripe and GitHub API rate limiting
 */
@Injectable()
export class GlobalRateLimitGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    // Use user ID if authenticated, otherwise use IP
    const userId = (req as any).user?.id;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    
    return userId ? `user:${userId}` : `ip:${ip}`;
  }

  protected async getLimit(context: ExecutionContext): Promise<ThrottlerOptions> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();
    const controller = context.getClass();

    // Get custom rate limit from metadata
    const customLimit = this.reflector.get<ThrottlerOptions>(
      'rateLimit',
      handler,
    ) || this.reflector.get<ThrottlerOptions>('rateLimit', controller);

    if (customLimit) {
      return customLimit;
    }

    // Default rate limits based on endpoint
    const path = request.path;
    const method = request.method;

    // Auth endpoints - stricter limits
    if (path.includes('/auth/')) {
      if (path.includes('/login') || path.includes('/signup')) {
        return { limit: 5, ttl: 60000 }; // 5 requests per minute
      }
      if (path.includes('/forgot-password') || path.includes('/reset-password')) {
        return { limit: 3, ttl: 3600000 }; // 3 requests per hour
      }
      return { limit: 10, ttl: 60000 }; // 10 requests per minute
    }

    // API endpoints - moderate limits
    if (path.startsWith('/api/')) {
      if (method === 'GET') {
        return { limit: 100, ttl: 60000 }; // 100 requests per minute
      }
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        return { limit: 30, ttl: 60000 }; // 30 requests per minute
      }
      if (method === 'DELETE') {
        return { limit: 10, ttl: 60000 }; // 10 requests per minute
      }
    }

    // Default limit
    return { limit: 60, ttl: 60000 }; // 60 requests per minute
  }
}
