/**
 * ★★★ TRPC ROUTER - DESIGNS & VERSIONS ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';
import { api, endpoints } from '@/lib/api/client';

export const designRouter = router({
  listVersions: protectedProcedure
    .input(z.object({ designId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      const design = await endpoints.designs.get(input.designId).catch(() => null);
      if (!design) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Design introuvable',
        });
      }

      const d = design as any;
      if (d.userId !== user.id && user.role !== 'PLATFORM_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous n\'avez pas accès à ce design',
        });
      }

      try {
        const versions = await api.get<any[]>(`/api/v1/designs/${input.designId}/versions`).catch(() => []);

        const formattedVersions = (Array.isArray(versions) ? versions : []).map((version: any, index: number) => ({
          id: version.id,
          version: index + 1,
          name: version.name || `Version ${index + 1}`,
          thumbnail: version.previewUrl || version.renderUrl || '/placeholder-design.jpg',
          createdAt: version.createdAt ? (version.createdAt instanceof Date ? version.createdAt.toISOString() : String(version.createdAt)) : '',
          updatedAt: version.updatedAt ? (version.updatedAt instanceof Date ? version.updatedAt.toISOString() : String(version.updatedAt)) : '',
          metadata: version.metadata ?? {},
        }));

        return { versions: formattedVersions };
      } catch (error: any) {
        logger.error('Error listing design versions', { error, input, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des versions',
        });
      }
    }),

  createVersion: protectedProcedure
    .input(
      z.object({
        designId: z.string().cuid(),
        name: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      const design = await endpoints.designs.get(input.designId).catch(() => null);
      if (!design) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Design introuvable',
        });
      }

      const d = design as any;
      if (d.userId !== user.id && user.role !== 'PLATFORM_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous n\'avez pas accès à ce design',
        });
      }

      try {
        const version = await api.post<any>(`/api/v1/designs/${input.designId}/versions`, {
          name: input.name || `Version ${new Date().toISOString()}`,
          metadata: input.metadata,
        });

        logger.info('Design version created', { versionId: version.id, designId: input.designId });
        return {
          id: version.id,
          name: version.name,
          createdAt: version.createdAt ? (version.createdAt instanceof Date ? version.createdAt.toISOString() : String(version.createdAt)) : new Date().toISOString(),
        };
      } catch (error: any) {
        logger.error('Error creating design version', { error, input, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la création de la version',
        });
      }
    }),
});

