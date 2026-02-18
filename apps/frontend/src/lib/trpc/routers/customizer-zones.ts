/**
 * ★★★ ROUTER TRPC - CUSTOMIZER ZONES ★★★
 * Gestion complète des zones de customizer
 * - CRUD zones
 * - Réorganisation
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { TRPCError } from '@trpc/server';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';

// ========================================
// SCHEMAS ZOD
// ========================================

const CreateZoneSchema = z.object({
  customizerId: z.string().min(1),
  name: z.string().min(1).max(200),
  type: z.string().min(1),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  settings: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const UpdateZoneSchema = z.object({
  customizerId: z.string().min(1),
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  type: z.string().min(1).optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  settings: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ========================================
// ROUTER
// ========================================

export const customizerZonesRouter = router({
  /**
   * Lister les zones d'un customizer
   */
  list: protectedProcedure
    .input(z.object({ customizerId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      try {
        const zones = await api.get<unknown[]>(`/api/v1/visual-customizer/${input.customizerId}/zones`).catch(() => []);

        return Array.isArray(zones) ? zones : [];
      } catch (error) {
        logger.error('Error listing zones', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des zones',
        });
      }
    }),

  /**
   * Récupérer une zone par ID
   */
  getById: protectedProcedure
    .input(
      z.object({
        customizerId: z.string().min(1),
        id: z.string().min(1),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const zone = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/${input.customizerId}/zones/${input.id}`).catch(() => null);

        if (!zone) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Zone introuvable',
          });
        }

        return zone;
      } catch (error) {
        logger.error('Error fetching zone', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération de la zone',
        });
      }
    }),

  /**
   * Créer une zone
   */
  create: protectedProcedure
    .input(CreateZoneSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { customizerId, ...data } = input;

        logger.info('Creating zone', { customizerId, name: input.name });

        const zone = await api.post<{ id: string } & Record<string, unknown>>(`/api/v1/visual-customizer/${customizerId}/zones`, data);

        logger.info('Zone created', { zoneId: zone.id });

        return zone;
      } catch (error) {
        logger.error('Error creating zone', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la création de la zone',
        });
      }
    }),

  /**
   * Mettre à jour une zone
   */
  update: protectedProcedure
    .input(UpdateZoneSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { customizerId, id, ...data } = input;

        const zone = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/${customizerId}/zones/${id}`).catch(() => null);

        if (!zone) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Zone introuvable',
          });
        }

        const updated = await api.put<Record<string, unknown>>(`/api/v1/visual-customizer/${customizerId}/zones/${id}`, data);

        logger.info('Zone updated', { zoneId: id });

        return updated;
      } catch (error) {
        logger.error('Error updating zone', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la mise à jour de la zone',
        });
      }
    }),

  /**
   * Supprimer une zone
   */
  delete: protectedProcedure
    .input(
      z.object({
        customizerId: z.string().min(1),
        id: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const zone = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/${input.customizerId}/zones/${input.id}`).catch(() => null);

        if (!zone) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Zone introuvable',
          });
        }

        await api.delete(`/api/v1/visual-customizer/${input.customizerId}/zones/${input.id}`);

        logger.info('Zone deleted', { zoneId: input.id });

        return { success: true };
      } catch (error) {
        logger.error('Error deleting zone', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la suppression de la zone',
        });
      }
    }),

  /**
   * Réorganiser les zones
   */
  reorder: protectedProcedure
    .input(
      z.object({
        customizerId: z.string().min(1),
        zoneIds: z.array(z.string().min(1)).min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const customizer = await api.get<Record<string, unknown>>(`/api/v1/visual-customizer/${input.customizerId}`).catch(() => null);

        if (!customizer) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Customizer introuvable',
          });
        }

        const updated = await api.post<Record<string, unknown>>(`/api/v1/visual-customizer/${input.customizerId}/zones/reorder`, {
          zoneIds: input.zoneIds,
        });

        logger.info('Zones reordered', { customizerId: input.customizerId });

        return updated;
      } catch (error) {
        logger.error('Error reordering zones', { error, input });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la réorganisation des zones',
        });
      }
    }),
});
