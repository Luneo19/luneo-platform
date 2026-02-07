/**
 * ★★★ TRPC ROUTER - AB TESTING ★★★
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { logger } from '@/lib/logger';
import { TRPCError } from '@trpc/server';
import { api, endpoints } from '@/lib/api/client';

const ExperimentStatusSchema = z.enum(['draft', 'running', 'paused', 'completed']);

const MIN_VISITORS_FOR_WINNER = 100;
const MIN_CONFIDENCE_FOR_WINNER = 95;

type VariantStat = {
  visitors: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
};

/**
 * Z-test for proportions: returns approximate confidence level (0–99) that the
 * difference between two conversion rates is statistically significant.
 */
function calculateConfidence(
  conversionsA: number,
  visitorsA: number,
  conversionsB: number,
  visitorsB: number
): number {
  if (visitorsA === 0 || visitorsB === 0) return 0;

  const pA = conversionsA / visitorsA;
  const pB = conversionsB / visitorsB;
  const pPool = (conversionsA + conversionsB) / (visitorsA + visitorsB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / visitorsA + 1 / visitorsB));

  if (se === 0) return 0;

  const z = Math.abs(pA - pB) / se;

  if (z >= 2.576) return 99;
  if (z >= 1.96) return 95;
  if (z >= 1.645) return 90;
  if (z >= 1.282) return 80;
  return Math.min(Math.round(z * 40), 79);
}

/**
 * Fetch per-variant stats (visitors, conversions, revenue, conversionRate) for an experiment.
 */
async function getVariantStats(
  experimentId: string,
  variantIds: string[]
): Promise<Map<string, VariantStat>> {
  const result = new Map<string, VariantStat>();

  if (variantIds.length === 0) return result;

  const statsRes = await api.get<{ variants?: Record<string, { visitors: number; conversions: number; revenue: number }> }>(
    `/api/v1/analytics/experiments/${experimentId}/variant-stats`,
    { params: { variantIds: variantIds.join(',') } }
  ).catch(() => ({}));

  const variantsData = (statsRes as any).variants ?? (statsRes as any).data ?? {};

  for (const variantId of variantIds) {
    const v = variantsData[variantId] ?? {};
    const visitors = v.visitors ?? 0;
    const conversions = v.conversions ?? 0;
    const revenue = v.revenue ?? 0;
    const conversionRate = visitors === 0 ? 0 : conversions / visitors;
    result.set(variantId, { visitors, conversions, revenue, conversionRate });
  }

  return result;
}

/**
 * Determine winner: variant with highest conversion rate, confidence >= 95%, and at least 100 visitors per variant.
 */
function getWinner(
  variants: Array<{ id: string; name: string; traffic: number; isControl: boolean }>,
  stats: Map<string, VariantStat>
): { winnerId: string | null; confidence: number } {
  if (variants.length === 0) return { winnerId: null, confidence: 0 };
  if (variants.length === 1) return { winnerId: null, confidence: 0 };

  const withStats = variants
    .map((v) => ({ variant: v, stat: stats.get(v.id) }))
    .filter((x): x is { variant: (typeof variants)[0]; stat: VariantStat } => Boolean(x.stat));

  if (withStats.length < 2) return { winnerId: null, confidence: 0 };

  const sorted = [...withStats].sort((a, b) => b.stat.conversionRate - a.stat.conversionRate);
  const best = sorted[0];
  const control = withStats.find((x) => x.variant.isControl);
  const baseline = control ?? sorted[1];
  const confidence = calculateConfidence(
    best.stat.conversions,
    best.stat.visitors,
    baseline.stat.conversions,
    baseline.stat.visitors
  );

  const allVariantsHaveEnough = withStats.every((x) => x.stat.visitors >= MIN_VISITORS_FOR_WINNER);
  const isWinner =
    allVariantsHaveEnough && confidence >= MIN_CONFIDENCE_FOR_WINNER;
  return {
    winnerId: isWinner ? best.variant.id : null,
    confidence,
  };
}

/**
 * Experiment metric: prefer stored value or fallback to 'conversions'.
 */
function getExperimentMetric(experiment: { type?: string; variants?: unknown }): 'conversions' | 'revenue' | 'engagement' | 'clicks' {
  const exp = experiment as { type?: string; metric?: string };
  if (exp.metric && ['conversions', 'revenue', 'engagement', 'clicks'].includes(exp.metric)) {
    return exp.metric as 'conversions' | 'revenue' | 'engagement' | 'clicks';
  }
  return 'conversions';
}

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

        const listRes = await api.get<any>('/api/v1/analytics/experiments', {
          params: { brandId: user.brandId, status: input.status, offset: input.offset, limit: input.limit },
        }).catch(() => ({ experiments: [], total: 0 }));
        const experiments = (listRes as any).experiments ?? (listRes as any).data ?? [];
        const total = (listRes as any).total ?? (listRes as any).pagination?.total ?? experiments.length;

        // Transformer en format attendu avec stats réelles
        const experimentsWithStats = await Promise.all(
          experiments.map(async (exp: any) => {
            const variants = (exp.variants as Array<{ id: string; name: string; traffic: number; isControl: boolean }>) || [];
            const variantIds = variants.map((v) => v.id);
            const stats = await getVariantStats(exp.id, variantIds);
            const { winnerId, confidence } = getWinner(variants, stats);

            const variantsWithStats = variants.map((variant) => {
              const stat = stats.get(variant.id) ?? {
                visitors: 0,
                conversions: 0,
                revenue: 0,
                conversionRate: 0,
              };
              return {
                id: variant.id,
                name: variant.name,
                traffic: variant.traffic,
                conversions: stat.conversions,
                visitors: stat.visitors,
                revenue: stat.revenue,
                isControl: variant.isControl || false,
                isWinner: winnerId === variant.id,
              };
            });

            return {
              id: exp.id,
              name: exp.name,
              description: exp.description || '',
              status: exp.status as 'draft' | 'running' | 'paused' | 'completed',
              metric: getExperimentMetric(exp),
              confidence,
              startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
              endDate: exp.endDate ? new Date(exp.endDate) : undefined,
              variants: variantsWithStats,
            };
          })
        );

        return {
          experiments: experimentsWithStats,
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
        const experiment = await api.post<any>('/api/v1/analytics/experiments', {
          name: input.name,
          description: input.description || '',
          type: 'variants',
          variants: input.variants.map((v, i) => ({
            id: `v${i + 1}`,
            name: v.name,
            traffic: v.traffic,
            isControl: v.isControl,
          })),
          status: 'draft',
          targetAudience: { brands: [user.brandId] },
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
        const experiment = await api.get<any>(`/api/v1/analytics/experiments/${input.id}`).catch(() => null);

        if (!experiment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Test AB introuvable',
          });
        }

        const updateData: Record<string, unknown> = {};
        if (input.status) {
          updateData.status = input.status;
        }
        if (input.variants) {
          const currentVariants = (experiment as any).variants ?? [];
          updateData.variants = currentVariants.map((v: any) => {
            const update = input.variants?.find((u) => u.id === v.id);
            return update ? { ...v } : v;
          });
        }

        const updated = await api.put<any>(`/api/v1/analytics/experiments/${input.id}`, updateData);

        logger.info('AB test updated', { experimentId: input.id, userId: user.id });

        // Transformer en format attendu avec stats réelles
        const variants = (updated.variants as Array<{ id: string; name: string; traffic: number; isControl: boolean }>) || [];
        const variantIds = variants.map((v) => v.id);
        const stats = await getVariantStats(updated.id, variantIds);
        const { winnerId, confidence } = getWinner(variants, stats);

        return {
          id: updated.id,
          name: updated.name,
          description: updated.description || '',
          status: updated.status as 'draft' | 'running' | 'paused' | 'completed',
          metric: getExperimentMetric(updated),
          confidence,
          startDate: updated.startDate ? new Date(updated.startDate) : new Date(),
          endDate: updated.endDate ? new Date(updated.endDate) : undefined,
          variants: variants.map((v) => {
            const stat = stats.get(v.id) ?? { visitors: 0, conversions: 0, revenue: 0, conversionRate: 0 };
            return {
              id: v.id,
              name: v.name,
              traffic: v.traffic,
              conversions: stat.conversions,
              visitors: stat.visitors,
              revenue: stat.revenue,
              isControl: v.isControl || false,
              isWinner: winnerId === v.id,
            };
          }),
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

