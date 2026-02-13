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
import { api, endpoints } from '@/lib/api/client';

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

/** Raw API shape for user list/item (backend may return various shapes) */
type RawUserRecord = Record<string, unknown>;
/** Raw API shape for brand list/item */
type RawBrandRecord = Record<string, unknown>;
/** Raw API shape for admin metrics response */
type RawMetricsRecord = Record<string, unknown>;

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

  private mapUser(raw: RawUserRecord): User {
    const firstName = raw.firstName as string | undefined;
    const lastName = raw.lastName as string | undefined;
    const namePart = [firstName, lastName].filter(Boolean).join(' ').trim() || undefined;
    return {
      id: String(raw.id),
      email: String(raw.email),
      name: (raw.name as string | undefined) ?? namePart,
      role: String(raw.role),
      brandId: raw.brandId != null ? String(raw.brandId) : undefined,
      isActive: raw.isActive !== false,
      emailVerified: Boolean(raw.emailVerified),
      lastLoginAt: raw.lastLoginAt != null ? new Date(raw.lastLoginAt as string | number) : undefined,
      createdAt: new Date(raw.createdAt as string | number),
    };
  }

  /**
   * Liste les utilisateurs (via backend API)
   */
  async listUsers(options?: {
    role?: string;
    brandId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number; hasMore: boolean }> {
    try {
      type ListUsersResponse = { data?: RawUserRecord[]; customers?: RawUserRecord[]; users?: RawUserRecord[]; total?: number; pagination?: { total?: number } };
      const res = await api.get<ListUsersResponse>('/api/v1/admin/customers', {
        params: {
          page: options?.offset != null ? Math.floor(options.offset / (options?.limit ?? 20)) + 1 : 1,
          limit: options?.limit ?? 20,
          role: options?.role,
          search: options?.brandId,
        },
      });
      const list = (res?.data ?? res?.customers ?? res?.users ?? []) as RawUserRecord[];
      const total = Number(res?.total ?? res?.pagination?.total ?? list.length);
      const users = list.map((u) => this.mapUser(u));
      return {
        users,
        total,
        hasMore: (options?.offset ?? 0) + (options?.limit ?? 20) < total,
      };
    } catch (error: unknown) {
      logger.error('Error listing users', { error, options });
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par ID (via backend API)
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const raw = await api.get<RawUserRecord>(`/api/v1/admin/customers/${userId}`);
      if (!raw) throw new Error('User not found');
      return this.mapUser(raw as RawUserRecord);
    } catch (error: unknown) {
      logger.error('Error fetching user', { error, userId });
      throw error;
    }
  }

  /**
   * Crée un utilisateur (via backend API)
   */
  async createUser(request: CreateUserRequest): Promise<User> {
    try {
      logger.info('Creating user', { email: request.email, role: request.role });
      const raw = await api.post<RawUserRecord>('/api/v1/admin/customers', {
        email: request.email,
        name: request.name,
        role: request.role,
        brandId: request.brandId,
        password: request.password,
      });
      cacheService.clear();
      logger.info('User created', { userId: raw?.id, email: request.email });
      return this.mapUser(raw as RawUserRecord);
    } catch (error: unknown) {
      logger.error('Error creating user', { error, request });
      throw error;
    }
  }

  /**
   * Met à jour un utilisateur (via backend API)
   */
  async updateUser(request: UpdateUserRequest): Promise<User> {
    try {
      logger.info('Updating user', { userId: request.id });
      const raw = await api.patch<RawUserRecord>(`/api/v1/admin/customers/${request.id}`, {
        name: request.name,
        role: request.role,
        brandId: request.brandId,
        isActive: request.isActive,
      });
      cacheService.clear();
      logger.info('User updated', { userId: request.id });
      return this.mapUser(raw as RawUserRecord);
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      logger.error('Error activating user', { error, userId });
      throw error;
    }
  }

  // ========================================
  // BRANDS
  // ========================================

  private mapBrand(raw: RawBrandRecord): Brand {
    return {
      id: String(raw.id),
      name: String(raw.name),
      slug: String(raw.slug),
      status: (raw.status as string) ?? 'active',
      plan: (raw.plan as string) ?? 'free',
      stripeCustomerId: raw.stripeCustomerId != null ? String(raw.stripeCustomerId) : undefined,
      createdAt: new Date(raw.createdAt as string | number),
    };
  }

  /**
   * Liste les marques (via backend API)
   */
  async listBrands(options?: {
    status?: string;
    plan?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ brands: Brand[]; total: number; hasMore: boolean }> {
    try {
      const res = await api.get<{ brands?: RawBrandRecord[]; data?: RawBrandRecord[]; total?: number }>('/api/v1/admin/tenants', {
        params: { limit: options?.limit ?? 20, offset: options?.offset ?? 0, status: options?.status, plan: options?.plan },
      });
      const list = (res?.brands ?? res?.data ?? []) as RawBrandRecord[];
      const total = res?.total ?? list.length;
      const brands = list.map((b) => this.mapBrand(b));
      return { brands, total, hasMore: (options?.offset ?? 0) + (options?.limit ?? 20) < total };
    } catch (error: unknown) {
      logger.error('Error listing brands', { error, options });
      throw error;
    }
  }

  /**
   * Récupère une marque par ID (via backend API)
   */
  async getBrandById(brandId: string): Promise<Brand> {
    try {
      const raw = await api.get<RawBrandRecord>(`/api/v1/admin/brands/${brandId}`);
      if (!raw) throw new Error('Brand not found');
      return this.mapBrand(raw as RawBrandRecord);
    } catch (error: unknown) {
      logger.error('Error fetching brand', { error, brandId });
      throw error;
    }
  }

  /**
   * Crée une marque (via backend API)
   */
  async createBrand(request: CreateBrandRequest): Promise<Brand> {
    try {
      logger.info('Creating brand', { name: request.name, slug: request.slug });
      const raw = await api.post<RawBrandRecord>('/api/v1/admin/brands', {
        name: request.name,
        slug: request.slug,
        userId: request.userId,
      });
      cacheService.clear();
      logger.info('Brand created', { brandId: raw?.id });
      return this.mapBrand(raw as RawBrandRecord);
    } catch (error: unknown) {
      logger.error('Error creating brand', { error, request });
      throw error;
    }
  }

  /**
   * Met à jour une marque (via backend API)
   */
  async updateBrand(request: UpdateBrandRequest): Promise<Brand> {
    try {
      logger.info('Updating brand', { brandId: request.id });
      const raw = await api.patch<RawBrandRecord>(`/api/v1/admin/brands/${request.id}`, {
        name: request.name,
        status: request.status,
        plan: request.plan,
      });
      cacheService.clear();
      logger.info('Brand updated', { brandId: request.id });
      return this.mapBrand(raw as RawBrandRecord);
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      logger.error('Error suspending brand', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // SYSTEM STATS
  // ========================================

  /**
   * Récupère les statistiques système (via backend API)
   */
  async getSystemStats(useCache: boolean = true): Promise<SystemStats> {
    try {
      const cacheKey = 'admin:system:stats';
      if (useCache) {
        const cached = cacheService.get<SystemStats>(cacheKey);
        if (cached) {
          logger.info('Cache hit for system stats');
          return cached;
        }
      }
      const data = await endpoints.admin.metrics();
      type MetricsShape = { totalUsers?: number; totalCustomers?: number; totalBrands?: number; totalProducts?: number; totalOrders?: number; totalRevenue?: number; activeUsers?: number; newUsersToday?: number; newBrandsToday?: number };
      const m: MetricsShape = (data as MetricsShape | null | undefined) ?? {};
      const stats: SystemStats = {
        totalUsers: Number(m.totalUsers ?? m.totalCustomers ?? 0),
        totalBrands: Number(m.totalBrands ?? 0),
        totalProducts: Number(m.totalProducts ?? 0),
        totalOrders: Number(m.totalOrders ?? 0),
        totalRevenue: Number(m.totalRevenue ?? 0),
        activeUsers: Number(m.activeUsers ?? 0),
        newUsersToday: Number(m.newUsersToday ?? 0),
        newBrandsToday: Number(m.newBrandsToday ?? 0),
      };
      cacheService.set(cacheKey, stats, { ttl: 300 * 1000 });
      return stats;
    } catch (error: unknown) {
      logger.error('Error fetching system stats', { error });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const adminService = AdminService.getInstance();

