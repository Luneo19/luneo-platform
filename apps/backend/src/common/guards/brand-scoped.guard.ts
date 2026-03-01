/**
 * OrgScopedGuard (formerly BrandScopedGuard) - Multi-tenant isolation
 *
 * Ensures data isolation by enforcing organizationId scoping on all
 * authenticated routes. Registered as a global guard in CommonModule.
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformRole } from '@prisma/client';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CurrentUser } from '../types/user.types';

export const SKIP_BRAND_SCOPING_KEY = 'skipBrandScoping';

@Injectable()
export class BrandScopedGuard implements CanActivate {
  private readonly logger = new Logger(BrandScopedGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const skipScoping = this.reflector.getAllAndOverride<boolean>(SKIP_BRAND_SCOPING_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipScoping) return true;

    const request = context.switchToHttp().getRequest();
    const user: CurrentUser | undefined = request.user;

    if (!user) return true;

    if (user.role === PlatformRole.ADMIN) {
      const pathOrgId = request.params?.organizationId ?? request.params?.brandId;
      if (pathOrgId) {
        request.organizationId = pathOrgId;
        request.brandId = pathOrgId;
      }
      return true;
    }

    const orgId = user.organizationId ?? user.brandId;
    if (!orgId) {
      this.logger.debug(`User ${user.id} has no organizationId – allowing through (onboarding)`);
      return true;
    }

    request.organizationId = orgId;
    request.brandId = orgId;

    const pathOrgId = request.params?.organizationId ?? request.params?.brandId;
    if (pathOrgId && pathOrgId !== orgId) {
      this.logger.warn(`IDOR attempt: User ${user.id} (org: ${orgId}) tried to access org ${pathOrgId}`);
      throw new ForbiddenException('You do not have access to this organization\'s resources.');
    }

    return true;
  }
}
