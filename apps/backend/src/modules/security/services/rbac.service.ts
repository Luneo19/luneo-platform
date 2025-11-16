import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { Prisma, UserRole as PrismaUserRole } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import {
  Role,
  Permission,
  ROLE_PERMISSIONS,
  AuthorizationContext,
  AccessRule,
  AuthorizationResource,
  UserSummary,
} from '../interfaces/rbac.interface';

/**
 * Service RBAC (Role-Based Access Control)
 * Gère les rôles, permissions et autorisations
 */
@Injectable()
export class RBACService {
  private readonly logger = new Logger(RBACService.name);
  private customRules: AccessRule[] = [];
  private readonly roleToPrismaMap: Record<Role, PrismaUserRole> = {
    [Role.SUPER_ADMIN]: PrismaUserRole.PLATFORM_ADMIN,
    [Role.ADMIN]: PrismaUserRole.BRAND_ADMIN,
    [Role.MANAGER]: PrismaUserRole.BRAND_USER,
    [Role.DESIGNER]: PrismaUserRole.FABRICATOR,
    [Role.VIEWER]: PrismaUserRole.CONSUMER,
  };

  private readonly prismaToRoleMap: Record<PrismaUserRole, Role> = {
    [PrismaUserRole.PLATFORM_ADMIN]: Role.SUPER_ADMIN,
    [PrismaUserRole.BRAND_ADMIN]: Role.ADMIN,
    [PrismaUserRole.BRAND_USER]: Role.MANAGER,
    [PrismaUserRole.FABRICATOR]: Role.DESIGNER,
    [PrismaUserRole.CONSUMER]: Role.VIEWER,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return typeof error === 'string' ? error : JSON.stringify(error);
  }

  private formatStack(error: unknown): string | undefined {
    return error instanceof Error ? error.stack : undefined;
  }

  private mapRoleToPrisma(role: Role): PrismaUserRole {
    return this.roleToPrismaMap[role] ?? PrismaUserRole.CONSUMER;
  }

  private mapPrismaRoleToRole(role: PrismaUserRole | null | undefined): Role {
    if (!role) {
      return Role.VIEWER;
    }
    return this.prismaToRoleMap[role] ?? Role.VIEWER;
  }

  private buildAuthorizationContext(context: AuthorizationContext): AuthorizationContext {
    if (!context.resource) {
      return context;
    }

    const resource: AuthorizationResource = {
      ...context.resource,
    };

    return {
      ...context,
      resource,
    };
  }

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
      const cached = (await this.cache.getSimple(cacheKey)) as boolean | null;
      if (typeof cached === 'boolean') {
        return cached;
      }

      // Récupérer l'utilisateur avec son rôle
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        return false;
      }

      const mappedRole = this.mapPrismaRoleToRole(user.role);
      const hasPermission = this.roleHasPermission(mappedRole, permission);

      // Cache pour 5 minutes
      await this.cache.setSimple(cacheKey, hasPermission, 300);

      return hasPermission;
    } catch (error) {
      this.logger.error(
        `Failed to check user permission: ${this.formatError(error)}`,
        this.formatStack(error),
      );
      return false;
    }
  }

  /**
   * Vérifier si un utilisateur peut accéder à une ressource
   */
  async authorize(context: AuthorizationContext): Promise<boolean> {
    try {
      const normalizedContext = this.buildAuthorizationContext(context);

      // 1. Vérifier la permission de base
      const hasPermission = normalizedContext.user.permissions.includes(
        normalizedContext.action,
      );
      if (!hasPermission) {
        this.logger.warn(
          `User ${normalizedContext.user.id} denied: missing permission ${normalizedContext.action}`,
        );
        return false;
      }

      // 2. Vérifier les règles personnalisées
      for (const rule of this.customRules) {
        if (!rule.condition(normalizedContext)) {
          this.logger.warn(
            `User ${normalizedContext.user.id} denied by custom rule: ${rule.resource}`,
          );
          return false;
        }
      }

      // 3. Vérifier l'isolation par brand (si applicable)
      if (
        normalizedContext.resource?.brandId &&
        normalizedContext.user.brandId &&
        normalizedContext.resource.brandId !== normalizedContext.user.brandId
      ) {
        // Super admin peut accéder à tout
        if (normalizedContext.user.role !== Role.SUPER_ADMIN) {
          this.logger.warn(
            `User ${normalizedContext.user.id} denied: cross-brand access attempt`,
          );
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Authorization error: ${this.formatError(error)}`,
        this.formatStack(error),
      );
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
        data: { role: this.mapRoleToPrisma(role) },
      });

      // Invalider le cache
      await this.invalidateUserCache(userId);

      this.logger.log(`Role ${role} assigned to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to assign role: ${this.formatError(error)}`,
        this.formatStack(error),
      );
      throw error instanceof Error ? error : new Error(this.formatError(error));
    }
  }

  /**
   * Récupérer le rôle d'un utilisateur
   */
  async getUserRole(userId: string): Promise<Role> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      return this.mapPrismaRoleToRole(user?.role);
    } catch (error) {
      this.logger.error(
        `Failed to get user role: ${this.formatError(error)}`,
        this.formatStack(error),
      );
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
        `Failed to get user permissions: ${this.formatError(error)}`,
        this.formatStack(error),
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
  async getUsersByRole(role: Role, brandId?: string): Promise<UserSummary[]> {
    try {
      const prismaRole = this.mapRoleToPrisma(role);
      const where: Prisma.UserWhereInput = { role: prismaRole };
      if (brandId) {
        where.brandId = brandId;
      }

      const users = await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          brandId: true,
          createdAt: true,
        },
      });

      return users.map<UserSummary>((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: this.mapPrismaRoleToRole(user.role),
        brandId: user.brandId ?? null,
        createdAt: user.createdAt,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get users by role: ${this.formatError(error)}`,
        this.formatStack(error),
      );
      return [];
    }
  }

  /**
   * Statistiques des rôles
   */
  async getRoleStats(brandId?: string): Promise<Record<Role, number>> {
    try {
      const where: Prisma.UserWhereInput = {};
      if (brandId) {
        where.brandId = brandId;
      }

      const users = await this.prisma.user.groupBy({
        by: ['role'],
        where,
        _count: true,
      });

      const stats = Object.values(Role).reduce<Record<Role, number>>((acc, currentRole) => {
        acc[currentRole] = 0;
        return acc;
      }, {} as Record<Role, number>);

      for (const group of users) {
        const mappedRole = this.mapPrismaRoleToRole(group.role);
        const count = typeof group._count === 'number' ? group._count : 0;
        stats[mappedRole] = (stats[mappedRole] ?? 0) + count;
      }

      return stats;
    } catch (error) {
      this.logger.error(
        `Failed to get role stats: ${this.formatError(error)}`,
        this.formatStack(error),
      );
      return Object.values(Role).reduce<Record<Role, number>>((acc, currentRole) => {
        acc[currentRole] = 0;
        return acc;
      }, {} as Record<Role, number>);
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

