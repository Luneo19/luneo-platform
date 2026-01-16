/**
 * ★★★ TRPC ROUTER - DESIGNS & VERSIONS ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';

import { db as prismaDb } from '@/lib/db';

export const designRouter = router({
  listVersions: protectedProcedure
    .input(z.object({ designId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      // Vérifier que le design appartient à l'utilisateur
      const design = await prismaDb.design.findUnique({
        where: { id: input.designId },
        select: { userId: true },
      });

      if (!design) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Design introuvable',
        });
      }

      if (design.userId !== user.id && user.role !== 'PLATFORM_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous n\'avez pas accès à ce design',
        });
      }

      try {
        // Récupérer les versions depuis les designs liés (via parentId ou versioning)
        const versions = await prismaDb.design.findMany({
          where: {
            OR: [
              { id: input.designId },
              { parentId: input.designId },
            ],
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            previewUrl: true,
            renderUrl: true,
            highResUrl: true,
            createdAt: true,
            updatedAt: true,
            metadata: true,
          },
        });

        const formattedVersions = versions.map((version: any, index: number) => ({
          id: version.id,
          version: index + 1,
          name: version.name || `Version ${index + 1}`,
          thumbnail: version.previewUrl || version.renderUrl || '/placeholder-design.jpg',
          createdAt: version.createdAt.toISOString(),
          updatedAt: version.updatedAt.toISOString(),
          metadata: version.metadata as any,
        }));

        return {
          versions: formattedVersions,
        };
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

      const design = await prismaDb.design.findUnique({
        where: { id: input.designId },
        select: { userId: true, productId: true, brandId: true },
      });

      if (!design) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Design introuvable',
        });
      }

      if (design.userId !== user.id && user.role !== 'PLATFORM_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous n\'avez pas accès à ce design',
        });
      }

      try {
        const version = await prismaDb.design.create({
          data: {
            name: input.name || `Version ${new Date().toISOString()}`,
            userId: user.id,
            productId: design.productId,
            brandId: design.brandId,
            parentId: input.designId,
            metadata: input.metadata as any,
          },
        });

        logger.info('Design version created', { versionId: version.id, designId: input.designId });
        return {
          id: version.id,
          name: version.name,
          createdAt: version.createdAt.toISOString(),
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

