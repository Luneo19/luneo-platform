import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { PlatformRole } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import {
  Role,
  Permission,
  ROLE_PERMISSIONS,
  AuthorizationContext,
  AccessRule,
} from '../interfaces/rbac.interface';

const PLATFORM_ROLE_TO_RBAC: Record<string, Role> = {
  ADMIN: Role.SUPER_ADMIN,
  USER: Role.VIEWER,
};

function mapPlatformRoleToRbac(prismaRole: string | PlatformRole): Role {
  return PLATFORM_ROLE_TO_RBAC[prismaRole] ?? Role.VIEWER;
}

@Injectable()
export class RBACService {
  private readonly logger = new Logger(RBACService.name);
  private customRules: AccessRule[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  roleHasPermission(role: Role, permission: Permission): boolean {
    const permissions = this.getRolePermissions(role);
    return permissions.includes(permission);
  }

  async userHasPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      const cacheKey = `rbac:user:${userId}:${permission}`;
      const cached = await this.cache.get<string | null>(cacheKey, 'rbac', async () => null);
      if (cached !== null) {
        return cached === 'true';
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        return false;
      }

      const rbacRole = mapPlatformRoleToRbac(user.role);
      const hasPermission = this.roleHasPermission(rbacRole, permission);

      await this.cache.set(cacheKey, hasPermission ? 'true' : 'false', 300);

      return hasPermission;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to check user permission: ${msg}`, stack);
      return false;
    }
  }

  async authorize(context: AuthorizationContext): Promise<boolean> {
    try {
      const hasPermission = context.user.permissions.includes(context.action);
      if (!hasPermission) {
        this.logger.warn(
          `User ${context.user.id} denied: missing permission ${context.action}`,
        );
        return false;
      }

      for (const rule of this.customRules) {
        if (!rule.condition(context)) {
          this.logger.warn(
            `User ${context.user.id} denied by custom rule: ${rule.resource}`,
          );
          return false;
        }
      }

      if (context.resource && context.resource.organizationId && context.user.organizationId) {
        if (context.resource.organizationId !== context.user.organizationId) {
          if (context.user.role !== Role.SUPER_ADMIN) {
            this.logger.warn(
              `User ${context.user.id} denied: cross-organization access attempt`,
            );
            return false;
          }
        }
      }

      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Authorization error: ${msg}`, stack);
      return false;
    }
  }

  async enforce(context: AuthorizationContext): Promise<void> {
    const authorized = await this.authorize(context);
    if (!authorized) {
      throw new ForbiddenException(
        `You don't have permission to perform this action`,
      );
    }
  }

  addAccessRule(rule: AccessRule): void {
    this.customRules.push(rule);
    this.logger.log(`Custom access rule added for resource: ${rule.resource}`);
  }

  async assignRole(userId: string, role: Role): Promise<void> {
    try {
      const prismaRoleMap: Record<Role, PlatformRole> = {
        [Role.SUPER_ADMIN]: PlatformRole.ADMIN,
        [Role.ADMIN]: PlatformRole.ADMIN,
        [Role.MANAGER]: PlatformRole.USER,
        [Role.DESIGNER]: PlatformRole.USER,
        [Role.VIEWER]: PlatformRole.USER,
      };
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: prismaRoleMap[role] },
      });

      await this.invalidateUserCache(userId);

      this.logger.log(`Role ${role} assigned to user ${userId}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to assign role: ${msg}`, stack);
      throw error;
    }
  }

  async getUserRole(userId: string): Promise<Role> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      return user ? mapPlatformRoleToRbac(user.role) : Role.VIEWER;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get user role: ${msg}`, stack);
      return Role.VIEWER;
    }
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const role = await this.getUserRole(userId);
      return this.getRolePermissions(role);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get user permissions: ${msg}`, stack);
      return [];
    }
  }

  async isAdmin(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    return role === Role.ADMIN || role === Role.SUPER_ADMIN;
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    return role === Role.SUPER_ADMIN;
  }

  async getUsersByRole(role: Role, organizationId?: string): Promise<{ id: string; email: string; name: string | null; role: PlatformRole; createdAt: Date }[]> {
    try {
      const prismaRoleMap: Record<Role, PlatformRole> = {
        [Role.SUPER_ADMIN]: PlatformRole.ADMIN,
        [Role.ADMIN]: PlatformRole.ADMIN,
        [Role.MANAGER]: PlatformRole.USER,
        [Role.DESIGNER]: PlatformRole.USER,
        [Role.VIEWER]: PlatformRole.USER,
      };
      const where: Prisma.UserWhereInput = { role: prismaRoleMap[role] };
      if (organizationId) {
        where.memberships = { some: { organizationId } };
      }

      const users = await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });
      return users.map((u) => ({
        ...u,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || null,
      }));
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get users by role: ${msg}`, stack);
      return [];
    }
  }

  async getRoleStats(organizationId?: string): Promise<Record<Role, number>> {
    try {
      const where: Prisma.UserWhereInput = {};
      if (organizationId) {
        where.memberships = { some: { organizationId } };
      }

      const users = await this.prisma.user.groupBy({
        by: ['role'],
        where,
        _count: true,
      });

      const stats: Record<string, number> = {};
      for (const r of Object.values(Role)) {
        stats[r] = 0;
      }

      for (const group of users) {
        const rbacRole = mapPlatformRoleToRbac(group.role);
        stats[rbacRole] = (stats[rbacRole] || 0) + group._count;
      }

      return stats as Record<Role, number>;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to get role stats: ${msg}`, stack);
      return {} as Record<Role, number>;
    }
  }

  private async invalidateUserCache(userId: string): Promise<void> {
    const permissions = Object.values(Permission);
    const promises = permissions.map((perm) =>
      this.cache.delSimple(`rbac:user:${userId}:${perm}`),
    );
    await Promise.all(promises);
  }

  compareRoles(role1: Role, role2: Role): number {
    const hierarchy = {
      [Role.SUPER_ADMIN]: 5,
      [Role.ADMIN]: 4,
      [Role.MANAGER]: 3,
      [Role.DESIGNER]: 2,
      [Role.VIEWER]: 1,
    };

    return hierarchy[role1] - hierarchy[role2];
  }

  isRoleHigher(role1: Role, role2: Role): boolean {
    return this.compareRoles(role1, role2) > 0;
  }
}
