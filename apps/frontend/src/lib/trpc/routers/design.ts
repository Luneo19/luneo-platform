/**
 * ★★★ TRPC ROUTER - DESIGNS & VERSIONS ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';

// db importé depuis @/lib/db

export const designRouter = router({
  listVersions: protectedProcedure
    .input(z.object({ designId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      // Vérifier que le design appartient à l'utilisateur
      const design = await db.design.findUnique({
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
        const versions = await db.design.findMany({
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

        return {
          versions: versions.map((v, index) => ({
            id: v.id,
            version: index + 1,
            name: v.name || `Version ${index + 1}`,
            thumbnail: v.previewUrl || v.renderUrl || '/placeholder-design.jpg',
            createdAt: v.createdAt.toISOString(),
            updatedAt: v.updatedAt.toISOString(),
            metadata: v.metadata as any,
          })),
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

      const design = await db.design.findUnique({
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
        const version = await db.design.create({
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

