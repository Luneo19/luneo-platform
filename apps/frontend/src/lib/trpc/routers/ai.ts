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
        const aiEngineUrl = process.env.NEXT_PUBLIC_AI_ENGINE_URL || process.env.AI_ENGINE_URL || (
          process.env.NODE_ENV === 'production' ? 'https://ai.luneo.app' : 'http://localhost:8000'
        );
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
          const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
          const message = typeof errorData?.message === 'string' ? errorData.message : 'Erreur lors de la génération IA';
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message,
          });
        }

        const result = (await response.json()) as Record<string, unknown>;
        const imageUrl = (result.image_url as string) || (result.url as string) || (result.data && typeof result.data === 'object' && result.data !== null && 'url' in result.data ? String((result.data as { url?: unknown }).url) : undefined);

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
            } as Record<string, unknown>);
            designId = (design as { id?: string }).id;
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
      } catch (error: unknown) {
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

        interface DesignListItem {
          id: string;
          name?: string;
          productId?: string;
          previewUrl?: string;
          renderUrl?: string;
          createdAt?: Date | string;
          metadata?: Record<string, unknown>;
        }
        interface DesignsListResponse {
          designs?: DesignListItem[];
          data?: DesignListItem[];
          pagination?: { total: number; hasNext?: boolean };
        }
        const data = result as DesignsListResponse;
        const list = data.designs ?? data.data ?? [];
        const designs = Array.isArray(list) ? list : [];
        const total = data.pagination?.total ?? designs.length;
        const skip = (input.page - 1) * input.limit;

        const filtered = input.productId
          ? designs.filter((d) => d.productId === input.productId)
          : designs;

        return {
          designs: filtered.map((d) => ({
            id: d.id,
            name: d.name,
            url: d.previewUrl || d.renderUrl || '/placeholder-design.svg',
            prompt: (d.metadata && typeof d.metadata === 'object' && 'prompt' in d.metadata ? String(d.metadata.prompt) : '') || '',
            style: (d.metadata && typeof d.metadata === 'object' && 'style' in d.metadata ? String(d.metadata.style) : 'photorealistic') || 'photorealistic',
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
      } catch (error: unknown) {
        logger.error('Error listing AI generated designs', { error, input, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des designs IA',
        });
      }
    }),
});

