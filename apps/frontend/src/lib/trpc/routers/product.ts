/**
 * ★★★ ROUTER TRPC - PRODUITS COMPLET ★★★
 * Gestion complète des produits
 * - CRUD produits
 * - Upload modèles 3D
 * - Gestion zones
 * - Analytics
 * - Intégrations e-commerce
 */

import { api, endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../server';

// ========================================
// SCHEMAS ZOD
// ========================================

const ProductCategorySchema = z.enum([
  'JEWELRY',
  'WATCHES',
  'GLASSES',
  'ACCESSORIES',
  'HOME',
  'TECH',
  'OTHER',
]);

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: ProductCategorySchema,
  model3dUrl: z.string().url().optional(),
  baseAssetUrl: z.string().url().optional(),
  images: z.array(z.string().url()).optional(),
  price: z.number().positive().optional(),
  currency: z.string().length(3).default('EUR'),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

const UpdateProductSchema = CreateProductSchema.partial().extend({
  id: z.string().min(1),
});

/** Product from API with brandId for ownership checks */
interface ProductWithBrandId {
  id: string;
  brandId?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Products list API response shape */
interface ProductsListResponse {
  products?: ProductWithBrandId[];
  data?: ProductWithBrandId[];
  pagination?: { total: number };
}

const UploadModelSchema = z.object({
  productId: z.string().min(1),
  fileUrl: z.string().url(),
  fileName: z.string(),
  fileSize: z.number().positive(),
  fileType: z.string(),
});

// ========================================
// ROUTER
// ========================================

export const productRouter = router({
  /**
   * Liste tous les produits de l'utilisateur/brand
   */
  listAll: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
        search: z.string().optional(),
        category: z.string().optional(),
        sortBy: z.enum(['recent', 'name', 'popular']).default('recent'),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      if (!user?.brandId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User must be associated with a brand',
        });
      }

      try {
        const skip = (input.page - 1) * input.limit;
        const result = await endpoints.products.list({
          page: input.page,
          limit: input.limit,
          search: input.search,
        });

        const data = result as ProductsListResponse;
        const products = data.products ?? data.data ?? [];
        const total = data.pagination?.total ?? (Array.isArray(products) ? products.length : 0);

        return {
          products: (Array.isArray(products) ? products : []).map((p: ProductWithBrandId) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            category: p.category || 'other',
            image_url: p.imageUrl || `https://picsum.photos/seed/${p.id}/400/400`,
            price: p.price || 0,
            baseCostCents: p.baseCostCents || 0,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
            viewsCount: p.viewsCount || 0,
          })),
          pagination: {
            page: input.page,
            limit: input.limit,
            total,
            totalPages: Math.ceil(total / input.limit),
            hasNext: skip + input.limit < total,
            hasPrev: input.page > 1,
          },
        };
      } catch (error: unknown) {
        logger.error('Error listing products', { error, input, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des produits',
        });
      }
    }),

  // ========================================
  // CRUD PRODUITS
  // ========================================

  /**
   * Créer un produit
   */
  create: protectedProcedure
    .input(CreateProductSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Creating product', { name: input.name, userId: ctx.user?.id });

        // Vérifie que l'utilisateur a une marque
        if (!ctx.user?.brandId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous devez avoir une marque pour créer un produit',
          });
        }

        const product = await endpoints.products.create({
          ...input,
          brandId: ctx.user.brandId,
          createdBy: ctx.user.id,
        });

        logger.info('Product created', { productId: (product as { id?: string }).id });

        return product as Record<string, unknown>;
      } catch (error) {
        logger.error('Error creating product', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la création du produit',
        });
      }
    }),

  /**
   * Mettre à jour un produit
   */
  update: protectedProcedure
    .input(UpdateProductSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...data } = input;

        const product = await endpoints.products.get(id).catch(() => null);
        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        const p = product as ProductWithBrandId;
        if (
          ctx.user?.role !== 'PLATFORM_ADMIN' &&
          ctx.user?.brandId !== p.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de modifier ce produit',
          });
        }

        const updated = await endpoints.products.update(id, data);

        logger.info('Product updated', { productId: id });

        return updated as Record<string, unknown>;
      } catch (error) {
        logger.error('Error updating product', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la mise à jour du produit',
        });
      }
    }),

  /**
   * Supprimer un produit
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const product = await endpoints.products.get(input.id).catch(() => null);
        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        const p = product as ProductWithBrandId;
        if (
          ctx.user?.role !== 'PLATFORM_ADMIN' &&
          ctx.user?.brandId !== p.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de supprimer ce produit',
          });
        }

        await endpoints.products.delete(input.id);

        logger.info('Product deleted', { productId: input.id });

        return { success: true };
      } catch (error) {
        logger.error('Error deleting product', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la suppression du produit',
        });
      }
    }),

  /**
   * Récupérer un produit par ID
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      try {
        const product = await endpoints.products.get(input.id);

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        const p = product as ProductWithBrandId;
        if (!p.isActive && ctx.user?.brandId !== p.brandId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        return product as Record<string, unknown>;
      } catch (error) {
        logger.error('Error fetching product', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération du produit',
        });
      }
    }),

  /**
   * Lister les produits
   */
  list: protectedProcedure
    .input(
      z
        .object({
          brandId: z.string().optional(),
          category: ProductCategorySchema.optional(),
          isActive: z.boolean().optional(),
          search: z.string().optional(),
          limit: z.number().int().positive().max(100).default(20),
          offset: z.number().int().nonnegative().default(0),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        const page = Math.floor((input?.offset ?? 0) / (input?.limit ?? 20)) + 1;
        const result = await endpoints.products.list({
          page,
          limit: input?.limit ?? 20,
          search: input?.search,
        });

        const data = result as ProductsListResponse;
        const products = data.products ?? data.data ?? [];
        const total = data.pagination?.total ?? (Array.isArray(products) ? products.length : 0);

        return {
          products: Array.isArray(products) ? products : [],
          total,
          hasMore: (input?.offset || 0) + (input?.limit || 20) < total,
        };
      } catch (error) {
        logger.error('Error listing products', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des produits',
        });
      }
    }),

  // ========================================
  // UPLOAD & ASSETS
  // ========================================

  /**
   * Upload modèle 3D
   */
  uploadModel: protectedProcedure
    .input(UploadModelSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const product = await endpoints.products.get(input.productId).catch(() => null);
        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        const p = product as ProductWithBrandId;
        if (
          ctx.user?.role !== 'PLATFORM_ADMIN' &&
          ctx.user?.brandId !== p.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de modifier ce produit',
          });
        }

        const updated = await endpoints.products.update(input.productId, {
          model3dUrl: input.fileUrl,
          metadata: {
            ...(typeof p.metadata === 'object' && p.metadata !== null ? p.metadata : {}),
            modelUpload: {
              fileName: input.fileName,
              fileSize: input.fileSize,
              fileType: input.fileType,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        logger.info('Model uploaded', { productId: input.productId });

        return updated as Record<string, unknown>;
      } catch (error) {
        logger.error('Error uploading model', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de l\'upload du modèle',
        });
      }
    }),

  // ========================================
  // ANALYTICS
  // ========================================

  /**
   * Analytics d'un produit
   */
  getAnalytics: protectedProcedure
    .input(
      z.object({
        productId: z.string().min(1),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const product = await endpoints.products.get(input.productId).catch(() => null);
        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        const p = product as ProductWithBrandId;
        if (
          ctx.user?.role !== 'PLATFORM_ADMIN' &&
          ctx.user?.brandId !== p.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas accès aux analytics de ce produit',
          });
        }

        const params: Record<string, string> = {};
        if (input.startDate) params.startDate = input.startDate.toISOString().split('T')[0];
        if (input.endDate) params.endDate = input.endDate.toISOString().split('T')[0];

        const stats = await api.get<{
          totalCustomizations?: number;
          completedCustomizations?: number;
          failedCustomizations?: number;
          zonesCount?: number;
          designsCount?: number;
        }>(`/api/v1/products/${input.productId}/stats`, { params }).catch(() => ({}));

        const statsData = stats as Record<string, number | undefined>;
        const totalCustomizations = statsData.totalCustomizations ?? 0;
        const completedCustomizations = statsData.completedCustomizations ?? 0;

        return {
          totalCustomizations,
          completedCustomizations,
          failedCustomizations: statsData.failedCustomizations ?? 0,
          successRate:
            totalCustomizations > 0 ? (completedCustomizations / totalCustomizations) * 100 : 0,
          zonesCount: statsData.zonesCount ?? 0,
          designsCount: statsData.designsCount ?? 0,
        };
      } catch (error) {
        logger.error('Error fetching analytics', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des analytics',
        });
      }
    }),
});

