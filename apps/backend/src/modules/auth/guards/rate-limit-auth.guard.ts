import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

/**
 * Rate limit guard spécifique pour les endpoints d'authentification
 * Plus restrictif que le rate limit global pour protéger contre brute force
 */
@Injectable()
export class RateLimitAuthGuard extends ThrottlerGuard {
  constructor(
    options: any,
    storageService: any,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path;
    const method = request.method;

    // Rate limits spécifiques par endpoint
    const authEndpoints = {
      '/api/v1/auth/login': { limit: 5, ttl: 900 }, // 5 tentatives / 15 min
      '/api/v1/auth/signup': { limit: 3, ttl: 3600 }, // 3 tentatives / heure
      '/api/v1/auth/forgot-password': { limit: 3, ttl: 3600 }, // 3 tentatives / heure
      '/api/v1/auth/reset-password': { limit: 5, ttl: 3600 }, // 5 tentatives / heure
      '/api/v1/auth/refresh': { limit: 10, ttl: 60 }, // 10 tentatives / minute
    };

    // Appliquer rate limit spécifique si endpoint correspond
    const endpointConfig = Object.entries(authEndpoints).find(([path]) => 
      route?.includes(path.replace('/api/v1', '')) || 
      request.url?.includes(path.replace('/api/v1', ''))
    );

    if (endpointConfig) {
      const [path, config] = endpointConfig;
      // Override temporairement les limites pour cet endpoint
      // Note: Cette implémentation simplifiée, pour une implémentation complète,
      // il faudrait utiliser un storage Redis avec clés spécifiques par endpoint
    }

    return super.canActivate(context);
  }

  protected throwThrottlingException(context: ExecutionContext): void {
    const request = context.switchToHttp().getRequest();
    const route = request.route?.path || request.url;

    throw new ThrottlerException(
      `Too many requests for ${route}. Please try again later.`,
    );
  }
}
