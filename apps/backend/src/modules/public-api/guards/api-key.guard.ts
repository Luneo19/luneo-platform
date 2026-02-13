import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ApiKeysService } from '../api-keys/api-keys.service';

/**
 * SEC-09: API Key Guard avec désactivation des query params en production
 * 
 * Les clés API dans les URLs sont un risque de sécurité:
 * - Peuvent être loguées dans les access logs
 * - Peuvent être exposées via le header Referer
 * - Peuvent être mises en cache par des proxies
 * - Visibles dans l'historique du navigateur
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);
  
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      const validatedKey = await this.apiKeysService.validateApiKey(apiKey);
      
      // API-04: Store brand context in request object
      // Use @BrandId() decorator or request['brandId'] to access
      request.brandId = validatedKey.brandId;
      (request as { apiKey?: unknown }).apiKey = validatedKey as unknown as { id: string; brandId: string; [key: string]: unknown };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid API key');
    }
  }

  private extractApiKey(request: Request): string | null {
    // Try to extract from Authorization header (Bearer token style)
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try to extract from X-API-Key header
    const apiKeyHeader = request.headers['x-api-key'] as string;
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    // SEC-09: Query parameter API keys - désactivé en production
    // Les clés API dans les URLs sont un risque de sécurité
    const apiKeyQuery = request.query.apiKey as string;
    if (apiKeyQuery) {
      const isProduction = this.configService.get('app.nodeEnv') === 'production';
      const allowQueryParams = this.configService.get('api.allowApiKeyInQuery') === 'true';
      
      if (isProduction && !allowQueryParams) {
        // En production, rejeter les API keys en query params par défaut
        this.logger.warn(
          'API key in query parameter rejected in production. ' +
          'Use Authorization header or X-API-Key header instead.'
        );
        return null;
      }
      
      // En dev ou si explicitement autorisé, log un warning mais accepter
      this.logger.warn(
        'API key provided via query parameter is deprecated and insecure. ' +
        'Please use Authorization header or X-API-Key header instead.'
      );
      return apiKeyQuery;
    }

    return null;
  }
}


