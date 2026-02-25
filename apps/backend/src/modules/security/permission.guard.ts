import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { Permission, hasPermission } from './permissions.config';
import type { OrgRole } from '@prisma/client';

const ORG_PERMISSION_KEY = 'org_permission';

/**
 * Decorator to require an org-level permission on a route handler.
 *
 * @example
 * \@RequirePermission(Permission.AGENTS_CREATE)
 * \@UseGuards(JwtAuthGuard, OrgPermissionGuard)
 * async createAgent() { ... }
 */
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(ORG_PERMISSION_KEY, permissions);

/**
 * Guard that resolves the caller's OrgRole within the target organization
 * and checks whether that role carries the required permission(s).
 *
 * Organization resolution order:
 *  1. Route param  :organizationId
 *  2. request.user.organizationId  (default org from JWT)
 *  3. Query param  ?organizationId=
 *  4. Body field   organizationId
 */
@Injectable()
export class OrgPermissionGuard implements CanActivate {
  private readonly logger = new Logger(OrgPermissionGuard.name);
  private static readonly CACHE_TTL = 300; // 5 min

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      ORG_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Authentication required');
    }

    const organizationId = this.resolveOrganizationId(request);

    if (!organizationId) {
      throw new ForbiddenException(
        'Organization context required for this action',
      );
    }

    const role = await this.getMemberRole(user.id, organizationId);

    if (!role) {
      throw new ForbiddenException(
        'You are not a member of this organization',
      );
    }

    for (const permission of requiredPermissions) {
      if (!hasPermission(role, permission)) {
        this.logger.warn(
          `User ${user.id} denied permission ${permission} (role=${role}, org=${organizationId})`,
        );
        throw new ForbiddenException(
          `Insufficient permission: ${permission}`,
        );
      }
    }

    request.orgRole = role;
    request.resolvedOrganizationId = organizationId;

    return true;
  }

  private resolveOrganizationId(request: any): string | null {
    return (
      request.params?.organizationId ??
      request.user?.organizationId ??
      request.query?.organizationId ??
      request.body?.organizationId ??
      null
    );
  }

  private async getMemberRole(
    userId: string,
    organizationId: string,
  ): Promise<OrgRole | null> {
    const cacheKey = `org_role:${userId}:${organizationId}`;

    try {
      const cached = await this.cache.get<string | null>(
        cacheKey,
        'org_rbac',
        async () => null,
      );
      if (cached) {
        return cached as OrgRole;
      }
    } catch {
      // Cache miss or error — proceed to DB
    }

    try {
      const member = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: { organizationId, userId },
        },
        select: { role: true, isActive: true },
      });

      if (!member || !member.isActive) {
        return null;
      }

      await this.cache
        .set(cacheKey, member.role, OrgPermissionGuard.CACHE_TTL)
        .catch(() => {});

      return member.role;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to resolve org role for user=${userId} org=${organizationId}: ${msg}`,
      );
      return null;
    }
  }
}
