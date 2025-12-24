/**
 * ★★★ ROUTER TRPC - PRODUITS COMPLET ★★★
 * Gestion complète des produits
 * - CRUD produits
 * - Upload modèles 3D
 * - Gestion zones
 * - Analytics
 * - Intégrations e-commerce
 */

import { db } from '@/lib/db';
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
  list: protectedProcedure
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
        const where: any = { brandId: user.brandId };

        if (input.search) {
          where.OR = [
            { name: { contains: input.search, mode: 'insensitive' } },
            { description: { contains: input.search, mode: 'insensitive' } },
          ];
        }

        if (input.category && input.category !== 'all') {
          where.category = input.category;
        }

        const orderBy: any = {};
        if (input.sortBy === 'recent') {
          orderBy.createdAt = 'desc';
        } else if (input.sortBy === 'name') {
          orderBy.name = 'asc';
        } else {
          orderBy.viewsCount = 'desc';
        }

        const [products, total] = await Promise.all([
          db.product.findMany({
            where,
            skip,
            take: input.limit,
            orderBy,
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              imageUrl: true,
              price: true,
              baseCostCents: true,
              createdAt: true,
              updatedAt: true,
              viewsCount: true,
            },
          }),
          db.product.count({ where }),
        ]);

        return {
          products: products.map((p) => ({
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
      } catch (error: any) {
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

        // Crée le produit
        const product = await db.product.create({
          data: {
            ...input,
            brandId: ctx.user.brandId,
            createdBy: ctx.user.id,
          },
          include: {
            brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        logger.info('Product created', { productId: product.id });

        return product;
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

        // Vérifie que le produit existe
        const product = await db.product.findUnique({
          where: { id },
          include: { brand: true },
        });

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        // Vérifie permissions
        if (
          ctx.user?.role !== 'PLATFORM_ADMIN' &&
          ctx.user?.brandId !== product.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de modifier ce produit',
          });
        }

        // Met à jour
        const updated = await db.product.update({
          where: { id },
          data,
          include: {
            brand: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        logger.info('Product updated', { productId: id });

        return updated;
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
        const product = await db.product.findUnique({
          where: { id: input.id },
          include: { brand: true },
        });

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        // Vérifie permissions
        if (
          ctx.user?.role !== 'PLATFORM_ADMIN' &&
          ctx.user?.brandId !== product.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de supprimer ce produit',
          });
        }

        // Supprime (cascade supprimera zones et customizations)
        await db.product.delete({
          where: { id: input.id },
        });

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
        const product = await db.product.findUnique({
          where: { id: input.id },
          include: {
            brand: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            zones: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
            },
            _count: {
              select: {
                customizations: true,
                designs: true,
              },
            },
          },
        });

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        // Vérifie si le produit est actif ou si l'utilisateur a les permissions
        if (!product.isActive && ctx.user?.brandId !== product.brandId) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        return product;
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
        const where: any = {};

        // Filtre par marque
        if (input?.brandId) {
          where.brandId = input.brandId;
        } else if (ctx.user?.brandId && ctx.user.role !== 'PLATFORM_ADMIN') {
          // Utilisateur voit seulement ses produits
          where.brandId = ctx.user.brandId;
        }

        // Filtres optionnels
        if (input?.category) {
          where.category = input.category;
        }

        if (input?.isActive !== undefined) {
          where.isActive = input.isActive;
        }

        // Recherche
        if (input?.search) {
          where.OR = [
            { name: { contains: input.search, mode: 'insensitive' } },
            { description: { contains: input.search, mode: 'insensitive' } },
          ];
        }

        const [products, total] = await Promise.all([
          db.product.findMany({
            where,
            include: {
              brand: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                },
              },
              zones: {
                where: { isActive: true },
                select: { id: true },
              },
              _count: {
                select: {
                  customizations: true,
                  designs: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: input?.limit || 20,
            skip: input?.offset || 0,
          }),
          db.product.count({ where }),
        ]);

        return {
          products,
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
        // Vérifie que le produit existe et appartient à la marque
        const product = await db.product.findUnique({
          where: { id: input.productId },
        });

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        // Vérifie permissions
        if (
          ctx.user?.role !== 'PLATFORM_ADMIN' &&
          ctx.user?.brandId !== product.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas la permission de modifier ce produit',
          });
        }

        // Met à jour le produit avec l'URL du modèle
        const updated = await db.product.update({
          where: { id: input.productId },
          data: {
            model3dUrl: input.fileUrl,
            metadata: {
              ...((product.metadata as any) || {}),
              modelUpload: {
                fileName: input.fileName,
                fileSize: input.fileSize,
                fileType: input.fileType,
                uploadedAt: new Date().toISOString(),
              },
            },
          },
        });

        logger.info('Model uploaded', { productId: input.productId });

        return updated;
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
        const product = await db.product.findUnique({
          where: { id: input.productId },
        });

        if (!product) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Produit introuvable',
          });
        }

        // Vérifie permissions
        if (
          ctx.user?.role !== 'PLATFORM_ADMIN' &&
          ctx.user?.brandId !== product.brandId
        ) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous n\'avez pas accès aux analytics de ce produit',
          });
        }

        const where: any = {
          productId: input.productId,
        };

        if (input.startDate || input.endDate) {
          where.createdAt = {};
          if (input.startDate) {
            where.createdAt.gte = input.startDate;
          }
          if (input.endDate) {
            where.createdAt.lte = input.endDate;
          }
        }

        // Stats customizations
        const [totalCustomizations, completedCustomizations, failedCustomizations] =
          await Promise.all([
            db.customization.count({ where }),
            db.customization.count({
              where: { ...where, status: 'COMPLETED' },
            }),
            db.customization.count({
              where: { ...where, status: 'FAILED' },
            }),
          ]);

        // Stats zones
        const zonesCount = await db.zone.count({
          where: { productId: input.productId, isActive: true },
        });

        // Stats designs
        const designsCount = await db.design.count({
          where: { productId: input.productId },
        });

        return {
          totalCustomizations,
          completedCustomizations,
          failedCustomizations,
          successRate:
            totalCustomizations > 0
              ? (completedCustomizations / totalCustomizations) * 100
              : 0,
          zonesCount,
          designsCount,
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

