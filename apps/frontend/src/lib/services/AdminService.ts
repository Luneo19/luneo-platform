/**
 * ★★★ SERVICE - ADMINISTRATION ★★★
 * Service professionnel pour l'administration
 * - Gestion utilisateurs
 * - Gestion marques/tenants
 * - Gestion système
 * - Monitoring
 */

import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/cache/CacheService';
import { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';
// @ts-ignore - bcryptjs types not available
import bcrypt from 'bcryptjs';

// ========================================
// TYPES
// ========================================

export interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  brandId?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  stripeCustomerId?: string;
  createdAt: Date;
}

export interface SystemStats {
  totalUsers: number;
  totalBrands: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  newUsersToday: number;
  newBrandsToday: number;
}

export interface CreateUserRequest {
  email: string;
  name?: string;
  role: string;
  brandId?: string;
  password?: string;
}

export interface UpdateUserRequest {
  id: string;
  name?: string;
  role?: string;
  brandId?: string;
  isActive?: boolean;
}

export interface CreateBrandRequest {
  name: string;
  slug: string;
  userId: string;
}

export interface UpdateBrandRequest {
  id: string;
  name?: string;
  status?: string;
  plan?: string;
}

// ========================================
// SERVICE
// ========================================

export class AdminService {
  private static instance: AdminService;

  private constructor() {}

  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  // ========================================
  // USERS
  // ========================================

  /**
   * Liste les utilisateurs
   */
  async listUsers(options?: {
    role?: string;
    brandId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number; hasMore: boolean }> {
    try {
      const where: any = {};
      if (options?.role) where.role = options.role;
      if (options?.brandId) where.brandId = options.brandId;
      if (options?.isActive !== undefined) where.isActive = options.isActive;

      const limit = options?.limit || 20;
      const offset = options?.offset || 0;

      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            role: true,
            brandId: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
            createdAt: true,
          },
        }),
        db.user.count({ where }),
      ]);

      // Convert to User type
      const userList: User[] = users.map((user: {
        id: string;
        email: string;
        name: string | null;
        firstName: string | null;
        lastName: string | null;
        role: string;
        brandId: string | null;
        isActive: boolean;
        emailVerified: Date | null;
        lastLoginAt: Date | null;
        createdAt: Date;
      }) => ({
        id: user.id,
        email: user.email,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        role: user.role,
        brandId: user.brandId || undefined,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt || undefined,
        createdAt: user.createdAt,
      }));

      return {
        users: userList,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error: any) {
      logger.error('Error listing users', { error, options });
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par ID
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          role: true,
          brandId: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        role: user.role,
        brandId: user.brandId || undefined,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt || undefined,
        createdAt: user.createdAt,
      };
    } catch (error: any) {
      logger.error('Error fetching user', { error, userId });
      throw error;
    }
  }

  /**
   * Crée un utilisateur
   */
  async createUser(request: CreateUserRequest): Promise<User> {
    try {
      logger.info('Creating user', { email: request.email, role: request.role });

      // Hash password if provided
      let hashedPassword: string | undefined;
      if (request.password) {
        hashedPassword = await bcrypt.hash(request.password, 10);
      }

      // Create user
      const user = await db.user.create({
        data: {
          email: request.email,
          name: request.name,
          firstName: request.name?.split(' ')[0],
          lastName: request.name?.split(' ').slice(1).join(' '),
          role: request.role as any,
          brandId: request.brandId,
          password: hashedPassword,
          isActive: true,
          emailVerified: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          role: true,
          brandId: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      // Invalidate cache
      cacheService.clear();

      logger.info('User created', { userId: user.id, email: user.email });

      return {
        id: user.id,
        email: user.email,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        role: user.role,
        brandId: user.brandId || undefined,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt || undefined,
        createdAt: user.createdAt,
      };
    } catch (error: any) {
      logger.error('Error creating user', { error, request });
      throw error;
    }
  }

  /**
   * Met à jour un utilisateur
   */
  async updateUser(request: UpdateUserRequest): Promise<User> {
    try {
      logger.info('Updating user', { userId: request.id });

      // Prepare update data
      const updateData: any = {};
      if (request.name !== undefined) {
        const nameParts = request.name.split(' ');
        updateData.name = request.name;
        updateData.firstName = nameParts[0];
        updateData.lastName = nameParts.slice(1).join(' ');
      }
      if (request.role !== undefined) updateData.role = request.role as any;
      if (request.brandId !== undefined) updateData.brandId = request.brandId;
      if (request.isActive !== undefined) updateData.isActive = request.isActive;

      // Update user
      const user = await db.user.update({
        where: { id: request.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          firstName: true,
          lastName: true,
          role: true,
          brandId: true,
          isActive: true,
          emailVerified: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });

      // Invalidate cache
      cacheService.clear();

      logger.info('User updated', { userId: user.id });

      return {
        id: user.id,
        email: user.email,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined,
        role: user.role,
        brandId: user.brandId || undefined,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt || undefined,
        createdAt: user.createdAt,
      };
    } catch (error: any) {
      logger.error('Error updating user', { error, request });
      throw error;
    }
  }

  /**
   * Suspend un utilisateur
   */
  async suspendUser(userId: string): Promise<User> {
    try {
      logger.info('Suspending user', { userId });

      return await this.updateUser({ id: userId, isActive: false });
    } catch (error: any) {
      logger.error('Error suspending user', { error, userId });
      throw error;
    }
  }

  /**
   * Réactive un utilisateur
   */
  async activateUser(userId: string): Promise<User> {
    try {
      logger.info('Activating user', { userId });

      return await this.updateUser({ id: userId, isActive: true });
    } catch (error: any) {
      logger.error('Error activating user', { error, userId });
      throw error;
    }
  }

  // ========================================
  // BRANDS
  // ========================================

  /**
   * Liste les marques
   */
  async listBrands(options?: {
    status?: string;
    plan?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ brands: Brand[]; total: number; hasMore: boolean }> {
    try {
      const where: any = {};
      if (options?.status) where.status = options.status;
      if (options?.plan) where.plan = options.plan;

      const limit = options?.limit || 20;
      const offset = options?.offset || 0;

      const [brands, total] = await Promise.all([
        db.brand.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            plan: true,
            stripeCustomerId: true,
            createdAt: true,
          },
        }),
        db.brand.count({ where }),
      ]);

      const brandList: Brand[] = brands.map((brand: { id: string; name: string; slug: string; status: string; plan: string; stripeCustomerId?: string | null; createdAt: Date }) => ({
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        status: brand.status,
        plan: brand.plan,
        stripeCustomerId: brand.stripeCustomerId || undefined,
        createdAt: brand.createdAt,
      }));

      return {
        brands: brandList,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error: any) {
      logger.error('Error listing brands', { error, options });
      throw error;
    }
  }

  /**
   * Récupère une marque par ID
   */
  async getBrandById(brandId: string): Promise<Brand> {
    try {
      const brand = await db.brand.findUnique({
        where: { id: brandId },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          plan: true,
          stripeCustomerId: true,
          createdAt: true,
        },
      });

      if (!brand) {
        throw new Error('Brand not found');
      }

      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        status: brand.status,
        plan: brand.plan,
        stripeCustomerId: brand.stripeCustomerId || undefined,
        createdAt: brand.createdAt,
      };
    } catch (error: any) {
      logger.error('Error fetching brand', { error, brandId });
      throw error;
    }
  }

  /**
   * Crée une marque
   */
  async createBrand(request: CreateBrandRequest): Promise<Brand> {
    try {
      logger.info('Creating brand', { name: request.name, slug: request.slug });

      const brand = await db.brand.create({
        data: {
          name: request.name,
          slug: request.slug,
          status: 'PENDING_VERIFICATION',
          plan: 'starter',
        },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          plan: true,
          stripeCustomerId: true,
          createdAt: true,
        },
      });

      await db.user.update({
        where: { id: request.userId },
        data: { brandId: brand.id },
      });

      cacheService.clear();

      logger.info('Brand created', { brandId: brand.id });

      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        status: brand.status,
        plan: brand.plan,
        stripeCustomerId: brand.stripeCustomerId || undefined,
        createdAt: brand.createdAt,
      };
    } catch (error: any) {
      logger.error('Error creating brand', { error, request });
      throw error;
    }
  }

  /**
   * Met à jour une marque
   */
  async updateBrand(request: UpdateBrandRequest): Promise<Brand> {
    try {
      logger.info('Updating brand', { brandId: request.id });

      const updateData: any = {};
      if (request.name !== undefined) updateData.name = request.name;
      if (request.status !== undefined) updateData.status = request.status as any;
      if (request.plan !== undefined) updateData.plan = request.plan;

      const brand = await db.brand.update({
        where: { id: request.id },
        data: updateData,
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          plan: true,
          stripeCustomerId: true,
          createdAt: true,
        },
      });

      cacheService.clear();

      logger.info('Brand updated', { brandId: brand.id });

      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        status: brand.status,
        plan: brand.plan,
        stripeCustomerId: brand.stripeCustomerId || undefined,
        createdAt: brand.createdAt,
      };
    } catch (error: any) {
      logger.error('Error updating brand', { error, request });
      throw error;
    }
  }

  /**
   * Suspend une marque
   */
  async suspendBrand(brandId: string): Promise<Brand> {
    try {
      logger.info('Suspending brand', { brandId });

      return await this.updateBrand({ id: brandId, status: 'SUSPENDED' });
    } catch (error: any) {
      logger.error('Error suspending brand', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // SYSTEM STATS
  // ========================================

  /**
   * Récupère les statistiques système
   */
  async getSystemStats(useCache: boolean = true): Promise<SystemStats> {
    try {
      const cacheKey = 'admin:system:stats';

      // Check cache
      if (useCache) {
        const cached = cacheService.get<SystemStats>(cacheKey);
        if (cached) {
          logger.info('Cache hit for system stats');
          return cached;
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalUsers,
        totalBrands,
        totalProducts,
        totalOrders,
        activeUsers,
        newUsersToday,
        newBrandsToday,
        allOrders,
      ] = await Promise.all([
        db.user.count(),
        db.brand.count(),
        db.product.count(),
        db.order.count(),
        db.user.count({ where: { isActive: true } }),
        db.user.count({ where: { createdAt: { gte: today } } }),
        db.brand.count({ where: { createdAt: { gte: today } } }),
        db.order.findMany({ select: { totalCents: true } }),
      ]);

      const totalRevenue = allOrders.reduce((sum: number, order: { totalCents: number | null }) => {
        return sum + Number(order.totalCents || 0) / 100;
      }, 0);

      const stats: SystemStats = {
        totalUsers,
        totalBrands,
        totalProducts,
        totalOrders,
        totalRevenue,
        activeUsers,
        newUsersToday,
        newBrandsToday,
      };

      // Cache for 5 minutes
      cacheService.set(cacheKey, stats, 300);

      return stats;
    } catch (error: any) {
      logger.error('Error fetching system stats', { error });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const adminService = AdminService.getInstance();

