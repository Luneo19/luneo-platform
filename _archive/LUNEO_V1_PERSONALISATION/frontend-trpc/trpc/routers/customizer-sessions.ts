/**
 * ★★★ ROUTER TRPC - CUSTOMIZER SESSIONS ★★★
 * Gestion complète des sessions et designs
 * - Sessions de customisation
 * - Sauvegarde de designs
 * - Partage de designs
 * - Ajout au panier
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../server';
import { TRPCError } from '@trpc/server';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

// ========================================
// SCHEMAS ZOD
// ========================================

const CanvasDataSchema = z.record(z.unknown());

const StartSessionSchema = z.object({
  customizerId: z.string().min(1),
  source: z.string().optional(),
  referrer: z.string().optional(),
});

const UpdateSessionSchema = z.object({
  id: z.string().min(1),
  canvasData: CanvasDataSchema,
});

const RecordInteractionSchema = z.object({
  sessionId: z.string().min(1),
  type: z.string().min(1),
  data: z.record(z.unknown()).optional(),
});

const SaveDesignSchema = z.object({
  sessionId: z.string().min(1),
  name: z.string().min(1).max(200),
  canvasData: CanvasDataSchema,
  thumbnailDataUrl: z.string().optional(),
});

const UpdateDesignSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  canvasData: CanvasDataSchema.optional(),
  thumbnailDataUrl: z.string().optional(),
});

const ShareDesignSchema = z.object({
  id: z.string().min(1),
  expiresInDays: z.number().int().positive().max(365).optional(),
});

const AddToCartSchema = z.object({
  sessionId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
});

// ========================================
// ROUTER
// ========================================

export const customizerSessionsRouter = router({
  /**
   * Démarrer une session de customisation
   */
  startSession: protectedProcedure
    .input(StartSessionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Starting customizer session', { customizerId: input.customizerId });

        const session = await api.post<{ id: string } & Record<string, unknown>>('/api/v1/visual-customizer/sessions', {
          customizerId: input.customizerId,
          source: input.source,
          referrer: input.referrer,
        });

        logger.info('Session started', { sessionId: session.id });

        return session;
      } catch (error) {
        logger.error('Error starting session', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors du démarrage de la session',
        });
      }
    }),

  /**
   * Récupérer une session
   */
  getSession: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      try {
        const session = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/sessions/${input.id}`).catch(() => null);

        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session introuvable',
          });
        }

        return session;
      } catch (error) {
        logger.error('Error fetching session', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération de la session',
        });
      }
    }),

  /**
   * Mettre à jour une session
   */
  updateSession: protectedProcedure
    .input(UpdateSessionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...data } = input;

        const session = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/sessions/${id}`).catch(() => null);

        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session introuvable',
          });
        }

        const updated = await api.put<Record<string, unknown>>(`/api/v1/visual-customizer/sessions/${id}`, data);

        logger.info('Session updated', { sessionId: id });

        return updated;
      } catch (error) {
        logger.error('Error updating session', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la mise à jour de la session',
        });
      }
    }),

  /**
   * Enregistrer une interaction
   */
  recordInteraction: protectedProcedure
    .input(RecordInteractionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const session = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/sessions/${input.sessionId}`).catch(() => null);

        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session introuvable',
          });
        }

        await api.post(`/api/v1/visual-customizer/sessions/${input.sessionId}/interactions`, {
          type: input.type,
          data: input.data,
        });

        logger.info('Interaction recorded', { sessionId: input.sessionId, type: input.type });

        return { success: true };
      } catch (error) {
        logger.error('Error recording interaction', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de l\'enregistrement de l\'interaction',
        });
      }
    }),

  /**
   * Sauvegarder un design
   */
  saveDesign: protectedProcedure
    .input(SaveDesignSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const session = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/sessions/${input.sessionId}`).catch(() => null);

        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session introuvable',
          });
        }

        const design = await api.post<{ id: string } & Record<string, unknown>>(`/api/v1/visual-customizer/sessions/${input.sessionId}/designs`, {
          name: input.name,
          canvasData: input.canvasData,
          thumbnailDataUrl: input.thumbnailDataUrl,
        });

        logger.info('Design saved', { designId: design.id });

        return design;
      } catch (error) {
        logger.error('Error saving design', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la sauvegarde du design',
        });
      }
    }),

  /**
   * Lister les sessions d'un customizer (placeholder - backend n'a pas d'endpoint dédié)
   */
  list: protectedProcedure
    .input(
      z.object({
        customizerId: z.string().min(1),
        limit: z.number().int().positive().max(100).default(5),
      })
    )
    .query(async ({ input }) => {
      try {
        const result = await api.get<{ sessions?: unknown[]; data?: unknown[] }>(
          `/api/v1/visual-customizer/${input.customizerId}/sessions`,
          { params: { limit: input.limit } }
        ).catch(() => ({ sessions: [], data: [] }));
        const items = (result as { sessions?: unknown[]; data?: unknown[] }).sessions ?? (result as { sessions?: unknown[]; data?: unknown[] }).data ?? [];
        return { sessions: Array.isArray(items) ? items : [] };
      } catch {
        return { sessions: [] };
      }
    }),

  /**
   * Lister les designs
   */
  listDesigns: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().positive().default(1),
          limit: z.number().int().positive().max(100).default(20),
        })
        .optional()
    )
    .query(async ({ input, ctx }) => {
      try {
        const params = {
          page: input?.page ?? 1,
          limit: input?.limit ?? 20,
        };

        const result = await api.get<{
          data?: unknown[];
          designs?: unknown[];
          pagination?: { total: number; page: number; limit: number };
          total?: number;
        }>('/api/v1/visual-customizer/designs', { params });

        const res = result as {
          data?: unknown[];
          designs?: unknown[];
          pagination?: { total?: number; page?: number; limit?: number };
          total?: number;
        };
        const items = res.data ?? res.designs ?? [];
        const total = res.pagination?.total ?? res.total ?? (Array.isArray(items) ? items.length : 0);

        return {
          designs: Array.isArray(items) ? items : [],
          total,
          page: params.page,
          limit: params.limit,
          hasMore: params.page * params.limit < total,
        };
      } catch (error) {
        logger.error('Error listing designs', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des designs',
        });
      }
    }),

  /**
   * Récupérer un design par ID
   */
  getDesign: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      try {
        const design = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/designs/${input.id}`).catch(() => null);

        if (!design) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Design introuvable',
          });
        }

        return design;
      } catch (error) {
        logger.error('Error fetching design', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération du design',
        });
      }
    }),

  /**
   * Récupérer un design partagé (public)
   */
  getSharedDesign: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      try {
        const design = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/designs/shared/${input.token}`).catch(() => null);

        if (!design) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Design partagé introuvable ou expiré',
          });
        }

        return design;
      } catch (error) {
        logger.error('Error fetching shared design', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération du design partagé',
        });
      }
    }),

  /**
   * Mettre à jour un design
   */
  updateDesign: protectedProcedure
    .input(UpdateDesignSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...data } = input;

        const design = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/designs/${id}`).catch(() => null);

        if (!design) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Design introuvable',
          });
        }

        const updated = await api.put<Record<string, unknown>>(`/api/v1/visual-customizer/designs/${id}`, data);

        logger.info('Design updated', { designId: id });

        return updated;
      } catch (error) {
        logger.error('Error updating design', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la mise à jour du design',
        });
      }
    }),

  /**
   * Supprimer un design
   */
  deleteDesign: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      try {
        const design = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/designs/${input.id}`).catch(() => null);

        if (!design) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Design introuvable',
          });
        }

        await api.delete(`/api/v1/visual-customizer/designs/${input.id}`);

        logger.info('Design deleted', { designId: input.id });

        return { success: true };
      } catch (error) {
        logger.error('Error deleting design', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la suppression du design',
        });
      }
    }),

  /**
   * Partager un design
   */
  shareDesign: protectedProcedure
    .input(ShareDesignSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const design = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/designs/${input.id}`).catch(() => null);

        if (!design) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Design introuvable',
          });
        }

        const shareResult = await api.post<{ token: string; shareUrl: string; expiresAt?: string }>(
          `/api/v1/visual-customizer/designs/${input.id}/share`,
          {
            expiresInDays: input.expiresInDays,
          }
        );

        logger.info('Design shared', { designId: input.id });

        return shareResult;
      } catch (error) {
        logger.error('Error sharing design', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors du partage du design',
        });
      }
    }),

  /**
   * Ajouter au panier
   */
  addToCart: protectedProcedure
    .input(AddToCartSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const session = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/sessions/${input.sessionId}`).catch(() => null);

        if (!session) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Session introuvable',
          });
        }

        const cartItem = await api.post<{ id: string } & Record<string, unknown>>(`/api/v1/visual-customizer/sessions/${input.sessionId}/cart`, {
          quantity: input.quantity,
        });

        logger.info('Item added to cart', { sessionId: input.sessionId });

        return cartItem;
      } catch (error) {
        logger.error('Error adding to cart', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de l\'ajout au panier',
        });
      }
    }),
});
