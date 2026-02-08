/**
 * ★★★ TRPC ROUTER - ADMINISTRATION ★★★
 * Router tRPC complet pour l'administration
 * - Gestion utilisateurs
 * - Gestion marques
 * - Statistiques système
 */

import { z } from 'zod';
import { router, adminProcedure } from '../server';
import { logger } from '@/lib/logger';
import { adminService } from '@/lib/services/AdminService';

// ========================================
// SCHEMAS
// ========================================

const UserRoleSchema = z.enum([
  'CONSUMER',
  'BRAND_USER',
  'BRAND_ADMIN',
  'PLATFORM_ADMIN',
  'FABRICATOR',
]);

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: UserRoleSchema,
  brandId: z.string().cuid().optional(),
  password: z.string().min(8).optional(),
});

const UpdateUserSchema = z.object({
  id: z.string().cuid(),
  name: z.string().optional(),
  role: UserRoleSchema.optional(),
  brandId: z.string().cuid().optional(),
  isActive: z.boolean().optional(),
});

const BrandStatusSchema = z.enum([
  'ACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION',
  'VERIFIED',
]);

const CreateBrandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  userId: z.string().cuid(),
});

const UpdateBrandSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).optional(),
  status: BrandStatusSchema.optional(),
  plan: z.string().optional(),
});

// ========================================
// ROUTER
// ========================================

export const adminRouter = router({
  // ========================================
  // USERS
  // ========================================

  listUsers: adminProcedure
    .input(
      z.object({
        role: UserRoleSchema.optional(),
        brandId: z.string().cuid().optional(),
        isActive: z.boolean().optional(),
        limit: z.number().int().positive().max(100).default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return await adminService.listUsers(input);
    }),

  getUserById: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return await adminService.getUserById(input.id);
    }),

  createUser: adminProcedure
    .input(CreateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await adminService.createUser(input);

      logger.info('User created by admin', {
        userId: user.id,
        email: input.email,
        role: input.role,
      });

      return user;
    }),

  updateUser: adminProcedure
    .input(UpdateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await adminService.updateUser(input);

      logger.info('User updated by admin', {
        userId: input.id,
        updates: input,
      });

      return user;
    }),

  suspendUser: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await adminService.suspendUser(input.id);

      logger.info('User suspended by admin', { userId: input.id });

      return user;
    }),

  activateUser: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const user = await adminService.activateUser(input.id);

      logger.info('User activated by admin', { userId: input.id });

      return user;
    }),

  // ========================================
  // BRANDS
  // ========================================

  listBrands: adminProcedure
    .input(
      z.object({
        status: BrandStatusSchema.optional(),
        plan: z.string().optional(),
        limit: z.number().int().positive().max(100).default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return await adminService.listBrands(input);
    }),

  getBrandById: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return await adminService.getBrandById(input.id);
    }),

  createBrand: adminProcedure
    .input(CreateBrandSchema)
    .mutation(async ({ ctx, input }) => {
      const brand = await adminService.createBrand(input);

      logger.info('Brand created by admin', {
        brandId: brand.id,
        name: input.name,
        slug: input.slug,
      });

      return brand;
    }),

  updateBrand: adminProcedure
    .input(UpdateBrandSchema)
    .mutation(async ({ ctx, input }) => {
      const brand = await adminService.updateBrand(input);

      logger.info('Brand updated by admin', {
        brandId: input.id,
        updates: input,
      });

      return brand;
    }),

  suspendBrand: adminProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const brand = await adminService.suspendBrand(input.id);

      logger.info('Brand suspended by admin', { brandId: input.id });

      return brand;
    }),

  // ========================================
  // SYSTEM STATS
  // ========================================

  getSystemStats: adminProcedure.query(async ({ ctx }) => {
    return await adminService.getSystemStats();
  }),
});

