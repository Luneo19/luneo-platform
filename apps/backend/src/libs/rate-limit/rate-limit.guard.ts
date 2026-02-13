/**
 * Rate Limit Guard
 * Implements sliding window rate limiting for all endpoints
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { SlidingWindowRateLimitService, RateLimitConfig, RateLimitResult } from './sliding-window.service';
import { RATE_LIMIT_METADATA, RATE_LIMIT_SKIP_METADATA } from './rate-limit.decorator';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  
  // Default rate limit configuration
  private readonly defaultConfig: RateLimitConfig = {
    limit: 100,
    window: 60, // 1 minute
  };

  constructor(
    private readonly rateLimitService: SlidingWindowRateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    // Skip rate limit for CORS preflight (avoids Redis round-trip and timeouts)
    if (request.method === 'OPTIONS') {
      return true;
    }

    // Check if rate limiting is skipped
    const skipRateLimit = this.reflector.getAllAndOverride<boolean>(
      RATE_LIMIT_SKIP_METADATA,
      [context.getHandler(), context.getClass()],
    );

    if (skipRateLimit) {
      return true;
    }

    // Get rate limit configuration
    const config = this.reflector.getAllAndOverride<RateLimitConfig>(
      RATE_LIMIT_METADATA,
      [context.getHandler(), context.getClass()],
    ) || this.defaultConfig;

    const response = context.switchToHttp().getResponse<Response>();

    // Generate identifier (IP, user ID, API key, etc.)
    const identifier = this.getIdentifier(request);

    // Check rate limit with timeout global de 3 secondes
    let result;
    try {
      result = await Promise.race([
        this.rateLimitService.checkRateLimit(identifier, {
          ...config,
          keyPrefix: `rl:${this.getKeyPrefix(request)}`,
        }),
        new Promise<RateLimitResult>((resolve) => setTimeout(() => {
          this.logger.debug(`Rate limit check timeout for ${identifier}, allowing request`);
          resolve({
            allowed: true,
            remaining: config.limit,
            limit: config.limit,
            resetTime: Date.now() + config.window * 1000,
          });
        }, 3000)),
      ]);
    } catch (error) {
      this.logger.debug(`Rate limit check error, allowing request`, error?.message || error);
      result = {
        allowed: true,
        remaining: config.limit,
        limit: config.limit,
        resetTime: Date.now() + config.window * 1000,
      } as RateLimitResult;
    }

    // Add rate limit headers
    this.addRateLimitHeaders(response, result);

    if (!result.allowed) {
      this.logger.warn(
        `Rate limit exceeded for ${identifier}: ${result.retryAfter}s`,
      );
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          retryAfter: result.retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  /**
   * Generate identifier for rate limiting
   * Priority: API Key > User ID > IP Address
   */
  private getIdentifier(request: Request): string {
    // Check for API key (set by ApiKeyGuard)
    const apiKey = (request as Request & { apiKey?: { id: string } }).apiKey;
    if (apiKey?.id) {
      return `api_key:${apiKey.id}`;
    }

    // Check for authenticated user
    const user = (request as Request & { user?: { id: string } }).user;
    if (user?.id) {
      return `user:${user.id}`;
    }

    // Fallback to IP address
    const ip = this.getClientIp(request);
    return `ip:${ip}`;
  }

  /**
   * Get client IP address
   */
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Get key prefix based on request context
   */
  private getKeyPrefix(request: Request): string {
    const route = request.route?.path || request.path;
    const method = request.method.toLowerCase();
    
    // Normalize route (remove params)
    const normalizedRoute = route
      .replace(/\/:[^/]+/g, '/:param')
      .replace(/\//g, ':')
      .replace(/^:/, '');
    
    return `${method}:${normalizedRoute}`;
  }

  /**
   * Add rate limit headers to response
   */
  private addRateLimitHeaders(response: Response, result: RateLimitResult): void {
    response.setHeader('X-RateLimit-Limit', result.limit);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', Math.floor(result.resetTime / 1000));
    
    if (result.retryAfter !== undefined) {
      response.setHeader('Retry-After', result.retryAfter);
    }
  }
}

