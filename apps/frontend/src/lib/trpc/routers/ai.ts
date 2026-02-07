/**
 * ★★★ TRPC ROUTER - AI STUDIO ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';
import { endpoints } from '@/lib/api/client';

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

        let designId: string | undefined;
        if (input.productId) {
          const product = await endpoints.products.get(input.productId).catch(() => null) as { brandId?: string } | null;
          if (product && product.brandId === user.brandId) {
            const design = await endpoints.designs.create({
              name: `AI Generated: ${input.prompt.substring(0, 50)}`,
              productId: input.productId,
              previewUrl: imageUrl,
              renderUrl: imageUrl,
              metadata: {
                aiGenerated: true,
                prompt: input.prompt,
                style: input.style,
                generatedAt: new Date().toISOString(),
              },
            } as any);
            designId = (design as any).id;
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
        const result = await endpoints.designs.list({
          page: input.page,
          limit: input.limit,
          search: undefined,
        });

        const data = result as { designs?: any[]; data?: any[]; pagination?: { total: number; hasNext?: boolean } };
        const list = data.designs ?? data.data ?? [];
        const designs = Array.isArray(list) ? list : [];
        const total = (data.pagination as any)?.total ?? designs.length;
        const skip = (input.page - 1) * input.limit;

        const filtered = input.productId
          ? designs.filter((d: any) => d.productId === input.productId)
          : designs;

        return {
          designs: filtered.map((d: any) => ({
            id: d.id,
            name: d.name,
            url: d.previewUrl || d.renderUrl || `https://picsum.photos/seed/${d.id}/800/600`,
            prompt: (d.metadata as any)?.prompt || '',
            style: (d.metadata as any)?.style || 'photorealistic',
            createdAt: d.createdAt ? (d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt)) : '',
          })),
          pagination: {
            page: input.page,
            limit: input.limit,
            total: input.productId ? filtered.length : total,
            totalPages: Math.ceil((input.productId ? filtered.length : total) / input.limit),
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

