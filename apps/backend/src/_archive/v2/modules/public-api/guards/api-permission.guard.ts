import { Injectable, CanActivate, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeysService } from '../api-keys/api-keys.service';

export const API_PERMISSION_KEY = 'api_permission';

/**
 * Decorator to specify required API key permission for an endpoint.
 * Use on Public API controller methods: @RequireApiPermission('products:read')
 */
export const RequireApiPermission = (permission: string) =>
  SetMetadata(API_PERMISSION_KEY, permission);

/**
 * FIX-1: Guard that enforces API key permissions/scopes.
 * Works with the @RequireApiPermission() decorator.
 * If no permission is specified on the route, access is allowed (read-only endpoints).
 */
@Injectable()
export class ApiPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      API_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.apiKey as { permissions: string[] } | undefined;

    if (!apiKey) {
      return true; // ApiKeyGuard handles auth; if no key, let it pass to throw there
    }

    // Throws ForbiddenException if permission is missing
    this.apiKeysService.assertPermission(apiKey, requiredPermission);
    return true;
  }
}
