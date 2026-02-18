import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerOptions } from '@nestjs/throttler';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_SKIP_METADATA } from '@/libs/rate-limit/rate-limit.decorator';
import { getPlanConfig, normalizePlanTier } from '@/libs/plans/plan-config';

/**
 * Global Rate Limit Guard
 * Applied globally via APP_GUARD provider
 * Inspired by Stripe and GitHub API rate limiting
 */
@Injectable()
export class GlobalRateLimitGuard extends ThrottlerGuard {
  constructor(
    options: import('@nestjs/throttler').ThrottlerModuleOptions,
    storageService: import('@nestjs/throttler').ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    // Skip rate limit for CORS preflight (OPTIONS never reach Nest if CORS handles them, but safe to skip)
    if (request.method === 'OPTIONS') {
      return true;
    }

    // Check if rate limiting is skipped
    const reflector = (this as unknown as { reflector: Reflector }).reflector;
    const skipRateLimit = reflector.getAllAndOverride<boolean>(
      RATE_LIMIT_SKIP_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (skipRateLimit) {
      return true;
    }

    // Skip for health check endpoints
    if (request.path.includes('/health')) {
      return true;
    }

    // RATE LIMIT FIX: Skip webhook endpoints - external providers (Stripe, WooCommerce, Shopify)
    // send many requests in bursts; rate limiting would cause 429s and failed deliveries (P3-12)
    const webhookPathSuffixes = [
      'billing/webhook',
      'ecommerce/woocommerce/webhook',
      'integrations/shopify/webhooks',
    ];
    if (webhookPathSuffixes.some((suffix) => request.path.includes(suffix))) {
      return true;
    }

    return super.canActivate(context);
  }

  protected async getTracker(req: Request): Promise<string> {
    // Use user ID if authenticated, otherwise use IP
    const userId = (req as Request & { user?: { id?: string } }).user?.id;
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

    // SECURITY FIX: Plan-based rate limiting for authenticated users
    const user = (request as Request & { user?: { brandPlan?: string; role?: string } }).user;
    if (user?.brandPlan) {
      try {
        const tier = normalizePlanTier(user.brandPlan);
        const planConfig = getPlanConfig(tier);
        if (planConfig.agentLimits?.rateLimit) {
          const planRate = planConfig.agentLimits.rateLimit;
          // Scale API rate limits based on plan tier
          const multiplier = method === 'GET' ? 3 : 1;
          return {
            limit: planRate.requests * multiplier,
            ttl: planRate.windowMs,
          };
        }
      } catch {
        // Fall through to default limits if plan parsing fails
      }
    }

    // API endpoints - default limits for unauthenticated or unknown plan
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
