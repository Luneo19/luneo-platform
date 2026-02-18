/**
 * ★★★ ROUTER TRPC - VISUAL CUSTOMIZER ★★★
 * Gestion complète des customizers
 * - CRUD customizers
 * - Publication
 * - Clonage
 * - Code embed
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../server';
import { TRPCError } from '@trpc/server';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

// ========================================
// SCHEMAS ZOD
// ========================================

const CustomizerTypeSchema = z.enum(['PRODUCT', 'TEMPLATE', 'CANVAS']);
const CustomizerStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);

const CreateCustomizerSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: CustomizerTypeSchema,
  productId: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const UpdateCustomizerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: CustomizerStatusSchema.optional(),
  settings: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ========================================
// ROUTER
// ========================================

export const customizerRouter = router({
  /**
   * Lister les customizers
   */
  list: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().positive().default(1),
          limit: z.number().int().positive().max(100).default(20),
          search: z.string().optional(),
          type: CustomizerTypeSchema.optional(),
          status: CustomizerStatusSchema.optional(),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        const params = {
          page: input?.page ?? 1,
          limit: input?.limit ?? 20,
          search: input?.search,
          type: input?.type,
          status: input?.status,
        };

        const result = await api.get<{
          data?: unknown[];
          customizers?: unknown[];
          pagination?: { total: number; page: number; limit: number };
          total?: number;
        }>('/api/v1/visual-customizer', { params });

        const res = result as {
          data?: unknown[];
          customizers?: unknown[];
          pagination?: { total?: number; page?: number; limit?: number };
          total?: number;
        };
        const items = res.data ?? res.customizers ?? [];
        const total = res.pagination?.total ?? res.total ?? (Array.isArray(items) ? items.length : 0);

        return {
          customizers: Array.isArray(items) ? items : [],
          total,
          page: params.page,
          limit: params.limit,
          hasMore: params.page * params.limit < total,
        };
      } catch (error) {
        logger.error('Error listing customizers', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des customizers',
        });
      }
    }),

  /**
   * Récupérer un customizer par ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      try {
        const customizer = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/${input.id}`).catch(() => null);

        if (!customizer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customizer introuvable',
          });
        }

        return customizer;
      } catch (error) {
        logger.error('Error fetching customizer', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération du customizer',
        });
      }
    }),

  /**
   * Créer un customizer
   */
  create: protectedProcedure
    .input(CreateCustomizerSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Creating customizer', { name: input.name, type: input.type });

        const customizer = await api.post<{ id: string } & Record<string, unknown>>('/api/v1/visual-customizer', input);

        logger.info('Customizer created', { customizerId: customizer.id });

        return customizer;
      } catch (error) {
        logger.error('Error creating customizer', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la création du customizer',
        });
      }
    }),

  /**
   * Mettre à jour un customizer
   */
  update: protectedProcedure
    .input(UpdateCustomizerSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...data } = input;

        const customizer = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/${id}`).catch(() => null);

        if (!customizer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customizer introuvable',
          });
        }

        const updated = await api.put<Record<string, unknown>>(`/api/v1/visual-customizer/${id}`, data);

        logger.info('Customizer updated', { customizerId: id });

        return updated;
      } catch (error) {
        logger.error('Error updating customizer', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la mise à jour du customizer',
        });
      }
    }),

  /**
   * Supprimer un customizer
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const customizer = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/${input.id}`).catch(() => null);

        if (!customizer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customizer introuvable',
          });
        }

        await api.delete(`/api/v1/visual-customizer/${input.id}`);

        logger.info('Customizer deleted', { customizerId: input.id });

        return { success: true };
      } catch (error) {
        logger.error('Error deleting customizer', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la suppression du customizer',
        });
      }
    }),

  /**
   * Publier un customizer
   */
  publish: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const customizer = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/${input.id}`).catch(() => null);

        if (!customizer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customizer introuvable',
          });
        }

        const updated = await api.post<Record<string, unknown>>(`/api/v1/visual-customizer/${input.id}/publish`, {});

        logger.info('Customizer published', { customizerId: input.id });

        return updated;
      } catch (error) {
        logger.error('Error publishing customizer', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la publication du customizer',
        });
      }
    }),

  /**
   * Cloner un customizer
   */
  clone: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1).max(200).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const customizer = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/${input.id}`).catch(() => null);

        if (!customizer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customizer introuvable',
          });
        }

        const cloned = await api.post<{ id: string } & Record<string, unknown>>(`/api/v1/visual-customizer/${input.id}/clone`, {
          name: input.name,
        });

        logger.info('Customizer cloned', { customizerId: input.id, clonedId: cloned.id });

        return cloned;
      } catch (error) {
        logger.error('Error cloning customizer', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors du clonage du customizer',
        });
      }
    }),

  /**
   * Récupérer le code embed d'un customizer
   */
  getEmbedCode: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const customizer = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/${input.id}`).catch(() => null);

        if (!customizer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customizer introuvable',
          });
        }

        const params: Record<string, unknown> = {};
        if (input.width) params.width = input.width;
        if (input.height) params.height = input.height;

        const embedCode = await api.get<{ embedCode: string; scriptUrl: string }>(`/api/v1/visual-customizer/${input.id}/embed-code`, {
          params,
        });

        return embedCode;
      } catch (error) {
        logger.error('Error fetching embed code', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération du code embed',
        });
      }
    }),
});
