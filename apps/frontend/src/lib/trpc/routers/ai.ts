/**
 * ★★★ TRPC ROUTER - AI STUDIO ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';
import { db as prismaDb } from '@/lib/db';

const GenerateImageSchema = z.object({
  prompt: z.string().min(1).max(1000),
  style: z.enum(['photorealistic', 'artistic', 'minimalist', 'vintage']).default('photorealistic'),
  productId: z.string().cuid().optional(),
  width: z.number().int().positive().max(2048).default(1024),
  height: z.number().int().positive().max(2048).default(1024),
});

export const aiRouter = router({
  /**
   * Génère une image avec l'IA
   */
  generate: protectedProcedure
    .input(GenerateImageSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      try {
        logger.info('AI image generation requested', {
          userId: user.id,
          prompt: input.prompt,
          style: input.style,
        });

        // Appel à l'AI Engine (FastAPI)
        const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';
        const response = await fetch(`${aiEngineUrl}/api/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.AI_ENGINE_API_KEY || ''}`,
          },
          body: JSON.stringify({
            prompt: input.prompt,
            style: input.style,
            width: input.width,
            height: input.height,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: errorData.message || 'Erreur lors de la génération IA',
          });
        }

        const result = await response.json();
        const imageUrl = result.image_url || result.url || result.data?.url;

        if (!imageUrl) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Aucune image générée',
          });
        }

        // Créer un design si productId fourni
        let designId: string | undefined;
        if (input.productId) {
          const product = await prismaDb.product.findUnique({
            where: { id: input.productId },
            select: { brandId: true },
          });

          if (product && product.brandId === user.brandId) {
            const design = await prismaDb.design.create({
              data: {
                name: `AI Generated: ${input.prompt.substring(0, 50)}`,
                userId: user.id,
                productId: input.productId,
                brandId: product.brandId,
                previewUrl: imageUrl,
                renderUrl: imageUrl,
                metadata: {
                  aiGenerated: true,
                  prompt: input.prompt,
                  style: input.style,
                  generatedAt: new Date().toISOString(),
                } as any,
              },
            });
            designId = design.id;
          }
        }

        logger.info('AI image generated successfully', {
          userId: user.id,
          designId,
          imageUrl,
        });

        return {
          id: designId || `ai-${Date.now()}`,
          image_url: imageUrl,
          prompt: input.prompt,
          style: input.style,
          createdAt: new Date().toISOString(),
        };
      } catch (error: any) {
        if (error instanceof TRPCError) throw error;
        logger.error('Error generating AI image', { error, input, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la génération IA',
        });
      }
    }),

  /**
   * Liste les designs générés par IA
   */
  listGenerated: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(50).default(20),
        productId: z.string().cuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      try {
        const skip = (input.page - 1) * input.limit;
        const where: any = {
          userId: user.id,
          metadata: {
            path: ['aiGenerated'],
            equals: true,
          },
        };

        if (input.productId) {
          where.productId = input.productId;
        }

        const [designs, total] = await Promise.all([
          prismaDb.design.findMany({
            where,
            skip,
            take: input.limit,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              previewUrl: true,
              renderUrl: true,
              createdAt: true,
              metadata: true,
            },
          }),
          prismaDb.design.count({ where }),
        ]);

        return {
          designs: designs.map((d: any) => ({
            id: d.id,
            name: d.name,
            url: d.previewUrl || d.renderUrl || `https://picsum.photos/seed/${d.id}/800/600`,
            prompt: (d.metadata as any)?.prompt || '',
            style: (d.metadata as any)?.style || 'photorealistic',
            createdAt: d.createdAt.toISOString(),
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
        logger.error('Error listing AI generated designs', { error, input, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des designs IA',
        });
      }
    }),
});

