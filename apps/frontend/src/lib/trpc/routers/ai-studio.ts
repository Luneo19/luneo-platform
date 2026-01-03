/**
 * ★★★ TRPC ROUTER - AI STUDIO ★★★
 * Router tRPC pour AI Studio (générations, modèles, prompts, collections)
 * Respecte les patterns existants du projet
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from '../server';

// ========================================
// SCHEMAS
// ========================================

const AIGenerationTypeSchema = z.enum(['IMAGE_2D', 'MODEL_3D', 'ANIMATION', 'TEMPLATE']);

const AIGenerationParamsSchema = z.object({
  steps: z.number().optional(),
  guidance: z.number().optional(),
  seed: z.number().optional(),
  aspectRatio: z.string().optional(),
  quality: z.enum(['standard', 'high', 'ultra']).optional(),
  negativePrompt: z.string().optional(),
}).passthrough();

const GenerateSchema = z.object({
  type: AIGenerationTypeSchema,
  prompt: z.string(),
  model: z.string(),
  parameters: AIGenerationParamsSchema,
});

const GetGenerationsFiltersSchema = z.object({
  type: AIGenerationTypeSchema.optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).optional(),
  model: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

// ========================================
// ROUTER
// ========================================

export const aiStudioRouter = router({
  /**
   * Génère une création IA
   */
  generate: protectedProcedure
    .input(GenerateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await db.user.findUnique({
          where: { id: ctx.user.id },
          select: { brandId: true },
        });

        if (!user?.brandId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous devez avoir une marque pour générer des créations IA',
          });
        }

        // Calculer le coût estimé
        const estimatedCost = Math.round(
          (input.prompt.length * 0.01 + (input.parameters.quality === 'ultra' ? 0.05 : 0.02)) * 100
        );

        // Vérifier le budget (via API backend si disponible, sinon mock)
        // TODO: Appeler le service backend pour vérifier le budget
        // Pour l'instant, on crée directement

        // Créer la génération dans la base de données
        const generation = await db.aIGeneration.create({
          data: {
            type: input.type,
            prompt: input.prompt,
            negativePrompt: input.parameters.negativePrompt,
            model: input.model,
            provider: input.model.includes('dall-e') ? 'openai' : input.model.includes('stable-diffusion') ? 'stability' : 'custom',
            parameters: input.parameters as any,
            status: 'PENDING',
            credits: input.type === 'MODEL_3D' ? 4 : input.type === 'ANIMATION' ? 5 : 2,
            costCents: estimatedCost,
            userId: ctx.user.id,
            brandId: user.brandId,
          },
        });

        // Lancer la génération en background job
        // Note: Dans un vrai setup, on appellerait le service backend qui lance le job
        // Pour l'instant, on simule en mettant à jour le statut
        // TODO: Appeler AIStudioQueueService.queueGeneration() via API backend
        
        // Simulation: mettre à jour le statut après un court délai
        setTimeout(async () => {
          try {
            await db.aIGeneration.update({
              where: { id: generation.id },
              data: {
                status: 'PROCESSING',
              },
            });
            
            // Simuler la génération complète après quelques secondes
            setTimeout(async () => {
              await db.aIGeneration.update({
                where: { id: generation.id },
                data: {
                  status: 'COMPLETED',
                  resultUrl: `https://storage.example.com/generations/${generation.id}.png`,
                  thumbnailUrl: `https://storage.example.com/generations/${generation.id}_thumb.png`,
                  quality: 85 + Math.random() * 15,
                  duration: Math.floor(Math.random() * 10) + 3,
                  completedAt: new Date(),
                },
              });
            }, 3000 + Math.random() * 5000);
          } catch (error) {
            logger.error('Failed to update generation status', { error, generationId: generation.id });
          }
        }, 100);

        return {
          success: true,
          generation: {
            id: generation.id,
            type: generation.type,
            prompt: generation.prompt,
            negativePrompt: generation.negativePrompt,
            model: generation.model,
            provider: generation.provider,
            parameters: generation.parameters as any,
            status: generation.status,
            resultUrl: generation.resultUrl,
            thumbnailUrl: generation.thumbnailUrl,
            credits: generation.credits,
            costCents: generation.costCents,
            duration: generation.duration,
            quality: generation.quality,
            error: generation.error,
            userId: generation.userId,
            brandId: generation.brandId,
            parentGenerationId: generation.parentGenerationId,
            createdAt: generation.createdAt,
            completedAt: generation.completedAt,
            updatedAt: generation.updatedAt,
          },
        };
      } catch (error) {
        logger.error('Failed to generate', { error, userId: ctx.user.id });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la génération IA',
        });
      }
    }),

  /**
   * Récupère les générations d'un utilisateur
   */
  getGenerations: protectedProcedure
    .input(GetGenerationsFiltersSchema.optional())
    .query(async ({ input, ctx }) => {
      try {
        const user = await db.user.findUnique({
          where: { id: ctx.user.id },
          select: { brandId: true },
        });

        if (!user?.brandId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Vous devez avoir une marque pour générer des créations IA',
          });
        }

        // Récupérer les générations depuis la base de données
        const where: any = {
          userId: ctx.user.id,
          brandId: user.brandId,
        };

        if (input?.type) where.type = input.type;
        if (input?.status) where.status = input.status;
        if (input?.model) where.model = input.model;

        const [generations, total] = await Promise.all([
          db.aIGeneration.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: input?.limit || 50,
            skip: input?.offset || 0,
          }),
          db.aIGeneration.count({ where }),
        ]);

        return {
          success: true,
          generations: generations.map(gen => ({
            id: gen.id,
            type: gen.type,
            prompt: gen.prompt,
            negativePrompt: gen.negativePrompt,
            model: gen.model,
            provider: gen.provider,
            parameters: gen.parameters as any,
            status: gen.status,
            resultUrl: gen.resultUrl,
            thumbnailUrl: gen.thumbnailUrl,
            credits: gen.credits,
            costCents: gen.costCents,
            duration: gen.duration,
            quality: gen.quality,
            error: gen.error,
            userId: gen.userId,
            brandId: gen.brandId,
            parentGenerationId: gen.parentGenerationId,
            createdAt: gen.createdAt,
            completedAt: gen.completedAt,
            updatedAt: gen.updatedAt,
          })),
          total,
        };
      } catch (error) {
        logger.error('Failed to get generations', { error, userId: ctx.user.id });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des générations',
        });
      }
    }),

  /**
   * Récupère tous les modèles IA disponibles
   */
  getModels: protectedProcedure
    .input(z.object({ type: AIGenerationTypeSchema.optional() }).optional())
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Appeler le service backend
        return {
          success: true,
          models: [
            {
              id: 'model-1',
              name: 'Stable Diffusion XL',
              provider: 'stability',
              type: 'IMAGE_2D',
              costPerGeneration: 0.08,
              avgTime: 3.2,
              quality: 94.5,
              isActive: true,
            },
          ],
        };
      } catch (error) {
        logger.error('Failed to get models', { error, userId: ctx.user.id });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des modèles',
        });
      }
    }),

  /**
   * Optimise un prompt
   */
  optimizePrompt: protectedProcedure
    .input(z.object({ prompt: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // TODO: Appeler le service backend
        return {
          success: true,
          optimization: {
            original: input.prompt,
            optimized: `${input.prompt}, high quality, 8k resolution`,
            improvement: '+18.5% qualité',
            before: 78,
            after: 96,
          },
        };
      } catch (error) {
        logger.error('Failed to optimize prompt', { error, userId: ctx.user.id });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de l\'optimisation du prompt',
        });
      }
    }),

  /**
   * Récupère les collections
   */
  getCollections: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await db.user.findUnique({
        where: { id: ctx.user.id },
        select: { brandId: true },
      });

      if (!user?.brandId) {
        throw new Error('User must have a brandId');
      }

        // Récupérer les collections depuis la base de données
        const collections = await db.aICollection.findMany({
          where: {
            userId: ctx.user.id,
            brandId: user.brandId,
          },
          include: {
            generations: {
              select: { id: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        return {
          success: true,
          collections: collections.map(collection => ({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            isShared: collection.isShared,
            userId: collection.userId,
            brandId: collection.brandId,
            generationCount: collection.generations.length,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt,
          })),
        };
      } catch (error) {
        logger.error('Failed to get collections', { error, userId: ctx.user.id });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des collections',
        });
      }
  }),

  /**
   * Récupère les analytics de génération
   */
  getGenerationAnalytics: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await db.user.findUnique({
        where: { id: ctx.user.id },
        select: { brandId: true },
      });

      if (!user?.brandId) {
        throw new Error('User must have a brandId');
      }

        // Calculer les analytics depuis la base de données
        const [totalGenerations, completedGenerations, generations] = await Promise.all([
          db.aIGeneration.count({
            where: { brandId: user.brandId },
          }),
          db.aIGeneration.count({
            where: {
              brandId: user.brandId,
              status: 'COMPLETED',
            },
          }),
          db.aIGeneration.findMany({
            where: {
              brandId: user.brandId,
              status: 'COMPLETED',
            },
            select: {
              duration: true,
              costCents: true,
            },
          }),
        ]);

        const successRate = totalGenerations > 0 ? (completedGenerations / totalGenerations) * 100 : 0;
        const avgTime = generations.length > 0
          ? generations.reduce((sum, g) => sum + (g.duration || 0), 0) / generations.length
          : 0;
        const totalCost = generations.reduce((sum, g) => sum + g.costCents, 0);
        const avgCost = generations.length > 0 ? totalCost / generations.length / 100 : 0;

        // Calculer les tendances (comparaison avec période précédente)
        const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const previous30Days = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

        const [currentPeriod, previousPeriod] = await Promise.all([
          db.aIGeneration.count({
            where: {
              brandId: user.brandId,
              createdAt: { gte: last30Days },
            },
          }),
          db.aIGeneration.count({
            where: {
              brandId: user.brandId,
              createdAt: { gte: previous30Days, lt: last30Days },
            },
          }),
        ]);

        const generationsTrend = previousPeriod > 0
          ? `${((currentPeriod - previousPeriod) / previousPeriod * 100).toFixed(1)}%`
          : '+0%';

        return {
          success: true,
          analytics: {
            totalGenerations,
            successRate: Math.round(successRate * 100) / 100,
            avgTime: Math.round(avgTime * 100) / 100,
            avgCost: Math.round(avgCost * 100) / 100,
            totalCost: totalCost / 100,
            satisfaction: 4.7, // TODO: Calculer depuis feedback utilisateurs
            trends: {
              generations: generationsTrend,
              success: '+2.3%', // TODO: Calculer réellement
              cost: '+12%', // TODO: Calculer réellement
            },
          },
        };
      } catch (error) {
        logger.error('Failed to get generation analytics', { error, userId: ctx.user.id });
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des analytics de génération',
        });
      }
  }),
});

