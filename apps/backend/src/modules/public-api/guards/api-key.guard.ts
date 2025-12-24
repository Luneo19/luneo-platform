import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from '../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      const validatedKey = await this.apiKeysService.validateApiKey(apiKey);
      
      // Set brand context in global scope for service access
      (global as any).currentBrandId = validatedKey.brandId;
      (global as any).currentApiKey = validatedKey;

      // Add to request for easy access
      request['brandId'] = validatedKey.brandId;
      request['apiKey'] = validatedKey;

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

    // Try to extract from query parameter (less secure, not recommended for production)
    const apiKeyQuery = request.query.apiKey as string;
    if (apiKeyQuery) {
      return apiKeyQuery;
    }

    return null;
  }
}


