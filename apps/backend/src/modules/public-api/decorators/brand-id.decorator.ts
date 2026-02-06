import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/**
 * Decorator pour extraire le brandId de la requête
 * API-04: Remplace l'utilisation de (global as any).currentBrandId
 * 
 * Usage:
 * @Get()
 * async getItems(@BrandId() brandId: string) {
 *   // brandId est extrait automatiquement de la requête
 * }
 */
export const BrandId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const brandId = request['brandId'];

    if (!brandId) {
      throw new UnauthorizedException('Brand context not found - ensure ApiKeyGuard is applied');
    }

    return brandId;
  },
);

/**
 * Decorator pour extraire l'API key validée de la requête
 */
export const ValidatedApiKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const apiKey = request['apiKey'];

    if (!apiKey) {
      throw new UnauthorizedException('API key context not found - ensure ApiKeyGuard is applied');
    }

    return apiKey;
  },
);
