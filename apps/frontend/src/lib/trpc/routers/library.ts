/**
 * ★★★ TRPC ROUTER - LIBRARY TEMPLATES ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../server';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';

export const libraryRouter = router({
  listTemplates: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(12),
        category: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(['recent', 'popular', 'name']).default('recent'),
      })
    )
    .query(async ({ input }) => {
      try {
        const skip = (input.page - 1) * input.limit;
        const where: any = {};

        if (input.category && input.category !== 'all') {
          where.category = input.category;
        }

        if (input.search) {
          where.OR = [
            { name: { contains: input.search, mode: 'insensitive' } },
            { description: { contains: input.search, mode: 'insensitive' } },
            { tags: { hasSome: [input.search] } },
          ];
        }

        const orderBy: any = {};
        if (input.sortBy === 'recent') {
          orderBy.createdAt = 'desc';
        } else if (input.sortBy === 'popular') {
          orderBy.viewsCount = 'desc';
        } else {
          orderBy.name = 'asc';
        }

        const [templates, total] = await Promise.all([
          db.template.findMany({
            where,
            skip,
            take: input.limit,
            orderBy,
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              thumbnailUrl: true,
              previewUrl: true,
              isPremium: true,
              viewsCount: true,
              usesCount: true,
              tags: true,
              createdAt: true,
            },
          }),
          db.template.count({ where }),
        ]);

        const formattedTemplates = templates.map((template: any) => ({
          id: template.id,
          name: template.name,
          category: template.category || 'other',
          thumbnail: template.thumbnailUrl || template.previewUrl || '/placeholder-template.jpg',
          isPremium: template.isPremium || false,
          isFavorite: false,
          downloads: template.usesCount || 0,
          views: template.viewsCount || 0,
          rating: 0,
          createdAt: template.createdAt.toISOString(),
          tags: Array.isArray(template.tags) ? template.tags : [],
        }));

        return {
          templates: formattedTemplates,
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
        logger.error('Error listing templates', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des templates',
        });
      }
    }),

  getTemplate: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      try {
        const template = await db.template.findUnique({
          where: { id: input.id },
        });

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template introuvable',
          });
        }

        return {
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category || 'other',
          thumbnail: template.thumbnailUrl || template.previewUrl || '/placeholder-template.jpg',
          isPremium: template.isPremium || false,
          downloads: template.usesCount || 0,
          views: template.viewsCount || 0,
          tags: Array.isArray(template.tags) ? template.tags : [],
          createdAt: template.createdAt.toISOString(),
          fileUrl: template.fileUrl,
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        logger.error('Error getting template', { error, input });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération du template',
        });
      }
    }),
});

