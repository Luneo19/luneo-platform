/**
 * ★★★ TRPC ROUTER - AB TESTING ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';
import { db } from '@/lib/db';

const ExperimentStatusSchema = z.enum(['draft', 'running', 'paused', 'completed']);

const CreateExperimentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  metric: z.enum(['conversions', 'revenue', 'engagement', 'clicks']),
  variants: z.array(
    z.object({
      name: z.string().min(1),
      traffic: z.number().int().min(0).max(100),
      isControl: z.boolean(),
    })
  ).min(2),
});

export const abTestingRouter = router({
  /**
   * Liste tous les tests AB
   */
  list: protectedProcedure
    .input(
      z.object({
        status: ExperimentStatusSchema.optional(),
        limit: z.number().int().positive().max(100).default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User must be associated with a brand',
        });
      }

      try {
        // Récupérer les expériences depuis Prisma
        // Note: Experiment n'a pas de brandId direct, on filtre par targetAudience
        const where: Record<string, unknown> = {
          targetAudience: {
            path: ['brands'],
            array_contains: [user.brandId],
          },
        };

        if (input.status) {
          where.status = input.status;
        }

        const [experiments, total] = await Promise.all([
          db.experiment.findMany({
            where,
            skip: input.offset,
            take: input.limit,
            orderBy: { createdAt: 'desc' },
            include: {
              assignments: {
                select: { variantId: true },
              },
            },
          }),
          db.experiment.count({ where }),
        ]);

        // Transformer en format attendu
        return {
          experiments: experiments.map((exp: any) => {
            const variants = (exp.variants as Array<{ id: string; name: string; traffic: number; isControl: boolean }>) || [];
            
            // Calculer les stats par variant
            const variantsWithStats = variants.map((variant) => {
              const variantAssignments = exp.assignments.filter((a: { variantId: string }) => a.variantId === variant.id);
              return {
                id: variant.id,
                name: variant.name,
                traffic: variant.traffic,
                conversions: 0, // TODO: Calculer depuis Conversion
                visitors: variantAssignments.length,
                revenue: 0, // TODO: Calculer depuis Conversion
                isControl: variant.isControl || false,
                isWinner: false, // TODO: Calculer depuis résultats
              };
            });

            return {
              id: exp.id,
              name: exp.name,
              description: exp.description || '',
              status: exp.status as 'draft' | 'running' | 'paused' | 'completed',
              metric: 'conversions' as const, // TODO: Extraire depuis type
              confidence: 0, // TODO: Calculer depuis résultats
              startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
              endDate: exp.endDate ? new Date(exp.endDate) : undefined,
              variants: variantsWithStats,
            };
          }),
          total,
          hasMore: input.offset + input.limit < total,
        };
      } catch (error: unknown) {
        logger.error('Error listing AB tests', { error, input, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la récupération des tests AB',
        });
      }
    }),

  /**
   * Crée un nouveau test AB
   */
  create: protectedProcedure
    .input(CreateExperimentSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User must be associated with a brand',
        });
      }

      try {
        // Créer l'expérience dans Prisma
        // Note: Experiment n'a pas de brandId direct, utiliser targetAudience
        const experiment = await db.experiment.create({
          data: {
            name: input.name,
            description: input.description || '',
            type: 'variants', // Par défaut
            variants: input.variants.map((v, i) => ({
              id: `v${i + 1}`,
              name: v.name,
              traffic: v.traffic,
              isControl: v.isControl,
            })) as unknown,
            status: 'draft',
            targetAudience: {
              brands: [user.brandId],
            } as unknown,
          },
        });

        logger.info('AB test created', { experimentId: experiment.id, userId: user.id });

        // Transformer en format attendu
        const variants = (experiment.variants as Array<{ id: string; name: string; traffic: number; isControl: boolean }>) || [];
        return {
          id: experiment.id,
          name: experiment.name,
          description: experiment.description || '',
          status: experiment.status as 'draft' | 'running' | 'paused' | 'completed',
          metric: input.metric,
          confidence: 0,
          startDate: experiment.startDate ? new Date(experiment.startDate) : new Date(),
          endDate: experiment.endDate ? new Date(experiment.endDate) : undefined,
          variants: variants.map((v) => ({
            id: v.id,
            name: v.name,
            traffic: v.traffic,
            conversions: 0,
            visitors: 0,
            revenue: 0,
            isControl: v.isControl || false,
            isWinner: false,
          })),
        };
      } catch (error: unknown) {
        logger.error('Error creating AB test', { error, input, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la création du test AB',
        });
      }
    }),

  /**
   * Met à jour un test AB
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: ExperimentStatusSchema.optional(),
        variants: z.array(
          z.object({
            id: z.string(),
            conversions: z.number().int().nonnegative().optional(),
            visitors: z.number().int().nonnegative().optional(),
            revenue: z.number().nonnegative().optional(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User must be associated with a brand',
        });
      }

      try {
        // Récupérer l'expérience
        const experiment = await db.experiment.findUnique({
          where: { id: input.id },
        });

        if (!experiment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Test AB introuvable',
          });
        }

        // Mettre à jour l'expérience
        const updateData: Record<string, unknown> = {};
        if (input.status) {
          updateData.status = input.status;
        }

        if (input.variants) {
          // Mettre à jour les variants
          const currentVariants = (experiment.variants as Array<{ id: string; name: string; traffic: number; isControl: boolean }>) || [];
          const updatedVariants = currentVariants.map((v) => {
            const update = input.variants?.find((u) => u.id === v.id);
            if (update) {
              return {
                ...v,
                // Les conversions/visitors/revenue sont calculés depuis Conversion, pas stockés dans variants
              };
            }
            return v;
          });
          updateData.variants = updatedVariants;
        }

        const updated = await db.experiment.update({
          where: { id: input.id },
          data: updateData,
        });

        logger.info('AB test updated', { experimentId: input.id, userId: user.id });

        // Transformer en format attendu
        const variants = (updated.variants as Array<{ id: string; name: string; traffic: number; isControl: boolean }>) || [];
        return {
          id: updated.id,
          name: updated.name,
          description: updated.description || '',
          status: updated.status as 'draft' | 'running' | 'paused' | 'completed',
          metric: 'conversions' as const,
          confidence: 0, // TODO: Calculer depuis résultats
          startDate: updated.startDate ? new Date(updated.startDate) : new Date(),
          endDate: updated.endDate ? new Date(updated.endDate) : undefined,
          variants: variants.map((v) => ({
            id: v.id,
            name: v.name,
            traffic: v.traffic,
            conversions: 0, // TODO: Calculer depuis Conversion
            visitors: 0, // TODO: Calculer depuis ExperimentAssignment
            revenue: 0, // TODO: Calculer depuis Conversion
            isControl: v.isControl || false,
            isWinner: false, // TODO: Calculer depuis résultats
          })),
        };
      } catch (error: unknown) {
        if (error instanceof TRPCError) throw error;
        logger.error('Error updating AB test', { error, input, userId: user.id });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erreur lors de la mise à jour du test AB',
        });
      }
    }),
});

