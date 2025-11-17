import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import {
  Role,
  Permission,
  ROLE_PERMISSIONS,
  RequestUser,
  AuthorizationContext,
  AccessRule,
} from '../interfaces/rbac.interface';

/**
 * Service RBAC (Role-Based Access Control)
 * Gère les rôles, permissions et autorisations
 */
@Injectable()
export class RBACService {
  private readonly logger = new Logger(RBACService.name);
  private customRules: AccessRule[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Récupérer les permissions d'un rôle
   */
  getRolePermissions(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Vérifier si un rôle a une permission
   */
  roleHasPermission(role: Role, permission: Permission): boolean {
    const permissions = this.getRolePermissions(role);
    return permissions.includes(permission);
  }

  /**
   * Vérifier si un utilisateur a une permission
   */
  async userHasPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      // Check cache
      const cacheKey = `rbac:user:${userId}:${permission}`;
      const cached = await this.cache.get(cacheKey, null, null);
      if (cached !== null) {
        return cached === 'true';
      }

      // Récupérer l'utilisateur avec son rôle
      // @ts-ignore - user exists in schema but Prisma client may need regeneration
      const user = await (this.prisma as any).user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        return false;
      }

      const hasPermission = this.roleHasPermission(user.role as Role, permission);

      // Cache pour 5 minutes
      await this.cache.set(cacheKey, hasPermission ? 'true' : 'false', 300);

      return hasPermission;
    } catch (error) {
      this.logger.error(
        `Failed to check user permission: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Vérifier si un utilisateur peut accéder à une ressource
   */
  async authorize(context: AuthorizationContext): Promise<boolean> {
    try {
      // 1. Vérifier la permission de base
      const hasPermission = context.user.permissions.includes(context.action);
      if (!hasPermission) {
        this.logger.warn(
          `User ${context.user.id} denied: missing permission ${context.action}`,
        );
        return false;
      }

      // 2. Vérifier les règles personnalisées
      for (const rule of this.customRules) {
        if (!rule.condition(context)) {
          this.logger.warn(
            `User ${context.user.id} denied by custom rule: ${rule.resource}`,
          );
          return false;
        }
      }

      // 3. Vérifier l'isolation par brand (si applicable)
      if (context.resource && context.resource.brandId && context.user.brandId) {
        if (context.resource.brandId !== context.user.brandId) {
          // Super admin peut accéder à tout
          if (context.user.role !== Role.SUPER_ADMIN) {
            this.logger.warn(
              `User ${context.user.id} denied: cross-brand access attempt`,
            );
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Authorization error: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Appliquer l'autorisation (throw si refusé)
   */
  async enforce(context: AuthorizationContext): Promise<void> {
    const authorized = await this.authorize(context);
    if (!authorized) {
      throw new ForbiddenException(
        `You don't have permission to perform this action`,
      );
    }
  }

  /**
   * Ajouter une règle d'accès personnalisée
   */
  addAccessRule(rule: AccessRule): void {
    this.customRules.push(rule);
    this.logger.log(`Custom access rule added for resource: ${rule.resource}`);
  }

  /**
   * Assigner un rôle à un utilisateur
   */
  async assignRole(userId: string, role: Role): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: role as any },
      });

      // Invalider le cache
      await this.invalidateUserCache(userId);

      this.logger.log(`Role ${role} assigned to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to assign role: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupérer le rôle d'un utilisateur
   */
  async getUserRole(userId: string): Promise<Role> {
    try {
      // @ts-ignore - user exists in schema but Prisma client may need regeneration
      const user = await (this.prisma as any).user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      return (user?.role as Role) || Role.VIEWER;
    } catch (error) {
      this.logger.error(`Failed to get user role: ${error.message}`, error.stack);
      return Role.VIEWER;
    }
  }

  /**
   * Récupérer toutes les permissions d'un utilisateur
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const role = await this.getUserRole(userId);
      return this.getRolePermissions(role);
    } catch (error) {
      this.logger.error(
        `Failed to get user permissions: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Vérifier si un utilisateur est admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    return role === Role.ADMIN || role === Role.SUPER_ADMIN;
  }

  /**
   * Vérifier si un utilisateur est super admin
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    const role = await this.getUserRole(userId);
    return role === Role.SUPER_ADMIN;
  }

  /**
   * Lister les utilisateurs par rôle
   */
  async getUsersByRole(role: Role, brandId?: string): Promise<any[]> {
    try {
      const where: any = { role };
      if (brandId) {
        where.brandId = brandId;
      }

      return await this.prisma.user.findMany({
        where,
          select: {
            id: true,
            email: true,
            // @ts-ignore - name exists in schema but Prisma client may need regeneration
            name: true,
            role: true,
            brandId: true,
            createdAt: true,
          } as any,
      });
    } catch (error) {
      this.logger.error(
        `Failed to get users by role: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  /**
   * Statistiques des rôles
   */
  async getRoleStats(brandId?: string): Promise<Record<Role, number>> {
    try {
      const where: any = {};
      if (brandId) {
        where.brandId = brandId;
      }

      const users = await this.prisma.user.groupBy({
        by: ['role'],
        where,
        _count: true,
      });

      const stats: Record<string, number> = {};
      for (const role of Object.values(Role)) {
        stats[role] = 0;
      }

      for (const group of users) {
        stats[group.role] = group._count;
      }

      return stats as Record<Role, number>;
    } catch (error) {
      this.logger.error(`Failed to get role stats: ${error.message}`, error.stack);
      return {} as Record<Role, number>;
    }
  }

  /**
   * Invalider le cache d'un utilisateur
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    const permissions = Object.values(Permission);
    const promises = permissions.map((perm) =>
      this.cache.delSimple(`rbac:user:${userId}:${perm}`),
    );
    await Promise.all(promises);
  }

  /**
   * Comparer deux rôles (pour déterminer la hiérarchie)
   */
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

  /**
   * Vérifier si un rôle est supérieur à un autre
   */
  isRoleHigher(role1: Role, role2: Role): boolean {
    return this.compareRoles(role1, role2) > 0;
  }
}

