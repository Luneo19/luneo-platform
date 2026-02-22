/**
 * ★★★ ROUTER TRPC - CUSTOMIZER ASSETS ★★★
 * Gestion complète des assets (images, cliparts, polices)
 * - Liste des assets
 * - Gestion cliparts
 * - Gestion polices
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { TRPCError } from '@trpc/server';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

// ========================================
// SCHEMAS ZOD
// ========================================

const AssetTypeSchema = z.enum(['IMAGE', 'CLIPART', 'FONT', 'PATTERN', 'TEXTURE']);

// ========================================
// ROUTER
// ========================================

export const customizerAssetsRouter = router({
  /**
   * Lister les assets
   */
  list: protectedProcedure
    .input(
      z
        .object({
          type: AssetTypeSchema.optional(),
          category: z.string().optional(),
          page: z.number().int().positive().default(1),
          limit: z.number().int().positive().max(100).default(20),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        const params = {
          type: input?.type,
          category: input?.category,
          page: input?.page ?? 1,
          limit: input?.limit ?? 20,
        };

        const result = await api.get<{
          data?: unknown[];
          assets?: unknown[];
          pagination?: { total: number; page: number; limit: number };
          total?: number;
        }>('/api/v1/visual-customizer/assets', { params });

        const res = result as {
          data?: unknown[];
          assets?: unknown[];
          pagination?: { total?: number; page?: number; limit?: number };
          total?: number;
        };
        const items = res.data ?? res.assets ?? [];
        const total = res.pagination?.total ?? res.total ?? (Array.isArray(items) ? items.length : 0);

        return {
          assets: Array.isArray(items) ? items : [],
          total,
          page: params.page,
          limit: params.limit,
          hasMore: params.page * params.limit < total,
        };
      } catch (error) {
        logger.error('Error listing assets', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des assets',
        });
      }
    }),

  /**
   * Récupérer un asset par ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      try {
        const asset = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/assets/${input.id}`).catch(() => null);

        if (!asset) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Asset introuvable',
          });
        }

        return asset;
      } catch (error) {
        logger.error('Error fetching asset', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération de l\'asset',
        });
      }
    }),

  /**
   * Supprimer un asset
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const asset = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/assets/${input.id}`).catch(() => null);

        if (!asset) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Asset introuvable',
          });
        }

        await api.delete(`/api/v1/visual-customizer/assets/${input.id}`);

        logger.info('Asset deleted', { assetId: input.id });

        return { success: true };
      } catch (error) {
        logger.error('Error deleting asset', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la suppression de l\'asset',
        });
      }
    }),

  /**
   * Récupérer les catégories de cliparts
   */
  getClipartCategories: protectedProcedure.query(async ({ ctx }) => {
    try {
      const categories = await api.get<unknown[]>(`/api/v1/visual-customizer/assets/cliparts/categories`).catch(() => []);

      return Array.isArray(categories) ? categories : [];
    } catch (error) {
      logger.error('Error fetching clipart categories', { error });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la récupération des catégories de cliparts',
      });
    }
  }),

  /**
   * Récupérer les cliparts par catégorie
   */
  getClipartByCategory: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().min(1),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const params = {
          page: input.page,
          limit: input.limit,
        };

        const result = await api.get<{
          data?: unknown[];
          cliparts?: unknown[];
          pagination?: { total: number; page: number; limit: number };
          total?: number;
        }>(`/api/v1/visual-customizer/assets/cliparts/categories/${input.categoryId}`, { params });

        const res = result as {
          data?: unknown[];
          cliparts?: unknown[];
          pagination?: { total?: number; page?: number; limit?: number };
          total?: number;
        };
        const items = res.data ?? res.cliparts ?? [];
        const total = res.pagination?.total ?? res.total ?? (Array.isArray(items) ? items.length : 0);

        return {
          cliparts: Array.isArray(items) ? items : [],
          total,
          page: input.page,
          limit: input.limit,
          hasMore: input.page * input.limit < total,
        };
      } catch (error) {
        logger.error('Error fetching cliparts by category', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des cliparts',
        });
      }
    }),

  /**
   * Récupérer les polices disponibles
   */
  getFonts: protectedProcedure.query(async ({ ctx }) => {
    try {
      const fonts = await api.get<unknown[]>(`/api/v1/visual-customizer/assets/fonts`).catch(() => []);

      return Array.isArray(fonts) ? fonts : [];
    } catch (error) {
      logger.error('Error fetching fonts', { error });
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la récupération des polices',
      });
    }
  }),
});
