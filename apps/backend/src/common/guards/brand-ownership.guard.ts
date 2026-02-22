import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from '@prisma/client';
import { CurrentUser } from '../types/user.types';

/**
 * Guard that ensures the authenticated user can only access resources
 * belonging to their own organization. Platform ADMIN bypasses.
 *
 * It looks for an organizationId in (priority order):
 *   1. request.organizationId (injected by OrgScopedGuard)
 *   2. Route params (`:organizationId`)
 *   3. Query params (`?organizationId=...`)
 *   4. Request body (`body.organizationId`)
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, BrandOwnershipGuard)
 */
@Injectable()
export class BrandOwnershipGuard implements CanActivate {
  private readonly logger = new Logger(BrandOwnershipGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUser;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    if (user.role === PlatformRole.ADMIN) {
      return true;
    }

    if (user.role === PlatformRole.USER && !user.organizationId) {
      throw new ForbiddenException('Aucune organisation associée à votre compte');
    }

    const organizationId =
      request.organizationId ||
      request.params?.organizationId ||
      request.query?.organizationId ||
      request.body?.organizationId;

    if (!organizationId) {
      if (user.role === PlatformRole.USER) {
        return true;
      }
      return true;
    }

    if (user.organizationId && user.organizationId !== organizationId) {
      this.logger.warn(`Organization ownership violation: user ${user.id} (org ${user.organizationId}) tried to access org ${organizationId}`);
      throw new ForbiddenException('Accès non autorisé à cette ressource');
    }

    return true;
  }
}
