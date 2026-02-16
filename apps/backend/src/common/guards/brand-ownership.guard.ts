import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CurrentUser } from '../types/user.types';

/**
 * Guard that ensures the authenticated user can only access resources
 * belonging to their own brand. SUPER_ADMIN and PLATFORM_ADMIN bypass.
 *
 * It looks for a brandId in (priority order):
 *   1. Route params (`:brandId`)
 *   2. Query params (`?brandId=...`)
 *   3. Request body (`body.brandId`)
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, BrandOwnershipGuard)
 */
@Injectable()
export class BrandOwnershipGuard implements CanActivate {
  private readonly logger = new Logger(BrandOwnershipGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUser;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Platform admins can access any brand
    if (user.role === 'PLATFORM_ADMIN') {
      return true;
    }

    // Extract brandId from route params, query params, or body
    const brandId = request.params?.brandId || request.query?.brandId || request.body?.brandId;

    if (!brandId) {
      // No brandId in request — let the handler deal with it
      return true;
    }

    if (!user.brandId) {
      throw new ForbiddenException('Aucun brand associé à votre compte');
    }

    if (user.brandId !== brandId) {
      this.logger.warn(`Brand ownership violation: user ${user.id} (brand ${user.brandId}) tried to access brand ${brandId}`);
      throw new ForbiddenException('Accès non autorisé à cette ressource');
    }

    return true;
  }
}
