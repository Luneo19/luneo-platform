/**
 * ★★★ TRPC ROUTER - LIBRARY TEMPLATES ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../server';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';

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
        const response = await api.get<{
          templates?: any[];
          data?: any[];
          pagination?: { total: number; totalPages: number };
          total?: number;
        }>('/api/v1/marketplace/templates', {
          params: {
            page: input.page,
            limit: input.limit,
            category: input.category !== 'all' ? input.category : undefined,
            search: input.search,
            sortBy: input.sortBy,
          },
        });

        const templates = response.templates ?? response.data ?? [];
        const total = response.pagination?.total ?? response.total ?? templates.length;
        const skip = (input.page - 1) * input.limit;

        const formattedTemplates = (Array.isArray(templates) ? templates : []).map((template: any) => ({
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
        const template = await api.get<any>(`/api/v1/marketplace/templates/${input.id}`).catch(() => null);

        if (!template) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Template introuvable',
          });
        }

        const createdAt = template.createdAt instanceof Date
          ? template.createdAt.toISOString()
          : (typeof template.createdAt === 'string' ? template.createdAt : new Date().toISOString());

        return {
          id: template.id,
          name: template.name,
          description: template.description,
          category: template.category || 'other',
          thumbnail: template.thumbnailUrl || template.previewUrl || template.thumbnail || '/placeholder-template.jpg',
          isPremium: template.isPremium || false,
          downloads: template.usesCount ?? template.downloads ?? 0,
          views: template.viewsCount ?? template.views ?? 0,
          tags: Array.isArray(template.tags) ? template.tags : [],
          createdAt,
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

