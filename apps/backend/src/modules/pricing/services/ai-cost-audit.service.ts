/**
 * @fileoverview Service d'audit des coûts IA
 * @module AICostAuditService
 *
 * Conforme au plan PHASE 6 - Pricing & Rentabilité IA - Audit des coûts IA
 *
 * FONCTIONNALITÉS:
 * - Analyse des coûts IA par brand, modèle, période
 * - Calcul de la rentabilité par plan
 * - Détection des anomalies de coûts
 * - Projections et recommandations
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation robuste
 * - ✅ Logging structuré
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

// ============================================================================
// TYPES STRICTS
// ============================================================================

/**
 * Résultat d'audit des coûts IA
 */
export interface AICostAuditResult {
  brandId: string;
  period: {
    start: Date;
    end: Date;
  };
  totalCostCents: number;
  totalCostEur: number;
  breakdown: {
    byProvider: Record<string, { costCents: number; costEur: number; count: number }>;
    byModel: Record<string, { costCents: number; costEur: number; count: number }>;
    byDay: Array<{ date: string; costCents: number; costEur: number; count: number }>;
  };
  trends: {
    dailyAverage: number;
    weeklyAverage: number;
    monthlyProjection: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  anomalies: Array<{
    date: Date;
    costCents: number;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
}

/**
 * Analyse de rentabilité par plan
 */
export interface PlanProfitabilityAnalysis {
  planId: string;
  planName: string;
  monthlyRevenueCents: number;
  averageAICostCents: number;
  averageOtherCostsCents: number;
  profitMargin: number; // Pourcentage
  profitability: 'high' | 'medium' | 'low' | 'negative';
  recommendations: string[];
}

/**
 * Options d'audit
 */
export interface AuditOptions {
  brandId?: string;
  startDate?: Date;
  endDate?: Date;
  includeProjections?: boolean;
  includeAnomalies?: boolean;
  includeRecommendations?: boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class AICostAuditService {
  private readonly logger = new Logger(AICostAuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Effectue un audit complet des coûts IA
   * Conforme au plan PHASE 6 - Audit des coûts IA
   */
  async auditCosts(options: AuditOptions = {}): Promise<AICostAuditResult | AICostAuditResult[]> {
    // ✅ Validation des dates
    const endDate = options.endDate || new Date();
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 jours par défaut

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // ✅ Si brandId fourni, audit pour ce brand uniquement
    if (options.brandId) {
      return this.auditBrandCosts(options.brandId, startDate, endDate, options);
    }

    // ✅ Sinon, audit global (tous les brands)
    const brands = await this.prisma.brand.findMany({
      where: {
        deletedAt: null,
      },
      select: { id: true },
    });

    return Promise.all(
      brands.map((brand) => this.auditBrandCosts(brand.id, startDate, endDate, options)),
    );
  }

  /**
   * Audit des coûts pour un brand spécifique
   */
  private async auditBrandCosts(
    brandId: string,
    startDate: Date,
    endDate: Date,
    options: AuditOptions,
  ): Promise<AICostAuditResult> {
    // ✅ Validation
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      throw new BadRequestException('Brand ID is required');
    }

    try {
      // ✅ Récupérer tous les coûts IA pour la période
      const costs = await this.prisma.aICost.findMany({
        where: {
          brandId: brandId.trim(),
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      // ✅ Calculer le total
      const totalCostCents = costs.reduce((sum, cost) => sum + (cost.costCents || 0), 0);
      const totalCostEur = totalCostCents / 100;

      // ✅ Breakdown par provider
      const byProvider: Record<string, { costCents: number; costEur: number; count: number }> = {};
      for (const cost of costs) {
        const provider = cost.provider || 'unknown';
        if (!byProvider[provider]) {
          byProvider[provider] = { costCents: 0, costEur: 0, count: 0 };
        }
        byProvider[provider].costCents += cost.costCents || 0;
        byProvider[provider].costEur = byProvider[provider].costCents / 100;
        byProvider[provider].count += 1;
      }

      // ✅ Breakdown par modèle
      const byModel: Record<string, { costCents: number; costEur: number; count: number }> = {};
      for (const cost of costs) {
        const model = cost.model || 'unknown';
        if (!byModel[model]) {
          byModel[model] = { costCents: 0, costEur: 0, count: 0 };
        }
        byModel[model].costCents += cost.costCents || 0;
        byModel[model].costEur = byModel[model].costCents / 100;
        byModel[model].count += 1;
      }

      // ✅ Breakdown par jour
      const byDayMap = new Map<string, { costCents: number; count: number }>();
      for (const cost of costs) {
        const dateKey = cost.createdAt.toISOString().split('T')[0];
        if (!byDayMap.has(dateKey)) {
          byDayMap.set(dateKey, { costCents: 0, count: 0 });
        }
        const dayData = byDayMap.get(dateKey)!;
        dayData.costCents += cost.costCents || 0;
        dayData.count += 1;
      }

      const byDay = Array.from(byDayMap.entries())
        .map(([date, data]) => ({
          date,
          costCents: data.costCents,
          costEur: data.costCents / 100,
          count: data.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // ✅ Calculer les tendances
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailyAverage = totalCostCents / Math.max(daysDiff, 1);
      const weeklyAverage = dailyAverage * 7;
      const monthlyProjection = dailyAverage * 30;

      // ✅ Déterminer la tendance
      const firstHalf = byDay.slice(0, Math.floor(byDay.length / 2));
      const secondHalf = byDay.slice(Math.floor(byDay.length / 2));
      const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.costCents, 0) / Math.max(firstHalf.length, 1);
      const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.costCents, 0) / Math.max(secondHalf.length, 1);
      const trend =
        secondHalfAvg > firstHalfAvg * 1.1
          ? 'increasing'
          : secondHalfAvg < firstHalfAvg * 0.9
            ? 'decreasing'
            : 'stable';

      // ✅ Détecter les anomalies (si demandé)
      const anomalies: AICostAuditResult['anomalies'] = [];
      if (options.includeAnomalies !== false) {
        const avgDailyCost = dailyAverage;
        const threshold = avgDailyCost * 2; // 2x la moyenne = anomalie

        for (const day of byDay) {
          if (day.costCents > threshold) {
            const severity =
              day.costCents > threshold * 2 ? 'high' : day.costCents > threshold * 1.5 ? 'medium' : 'low';
            anomalies.push({
              date: new Date(day.date),
              costCents: day.costCents,
              reason: `Coût journalier anormalement élevé (${(day.costCents / 100).toFixed(2)}€ vs moyenne ${(avgDailyCost / 100).toFixed(2)}€)`,
              severity,
            });
          }
        }
      }

      // ✅ Générer des recommandations (si demandé)
      const recommendations: string[] = [];
      if (options.includeRecommendations !== false) {
        // Recommandation basée sur la tendance
        if (trend === 'increasing') {
          recommendations.push(
            `Les coûts IA augmentent. Considérez l'optimisation des prompts ou l'utilisation de modèles moins coûteux.`,
          );
        }

        // Recommandation basée sur le provider le plus coûteux
        const mostExpensiveProvider = Object.entries(byProvider).sort(
          (a, b) => b[1].costCents - a[1].costCents,
        )[0];
        if (mostExpensiveProvider && mostExpensiveProvider[1].costEur > totalCostEur * 0.5) {
          recommendations.push(
            `${mostExpensiveProvider[0]} représente ${((mostExpensiveProvider[1].costEur / totalCostEur) * 100).toFixed(1)}% des coûts. Évaluez des alternatives.`,
          );
        }

        // Recommandation basée sur les anomalies
        if (anomalies.length > 0) {
          const highSeverityAnomalies = anomalies.filter((a) => a.severity === 'high').length;
          if (highSeverityAnomalies > 0) {
            recommendations.push(
              `${highSeverityAnomalies} anomalie(s) de haute sévérité détectée(s). Vérifiez les logs pour identifier la cause.`,
            );
          }
        }

        // Recommandation basée sur la projection
        if (monthlyProjection > 10000) {
          // Plus de 100€/mois
          recommendations.push(
            `Projection mensuelle: ${(monthlyProjection / 100).toFixed(2)}€. Considérez un plan supérieur ou optimisez l'utilisation.`,
          );
        }
      }

      return {
        brandId: brandId.trim(),
        period: { start: startDate, end: endDate },
        totalCostCents,
        totalCostEur,
        breakdown: {
          byProvider,
          byModel,
          byDay,
        },
        trends: {
          dailyAverage,
          weeklyAverage,
          monthlyProjection,
          trend,
        },
        anomalies,
        recommendations,
      };
    } catch (error) {
      this.logger.error(
        `Failed to audit AI costs for brand ${brandId}: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Analyse la rentabilité par plan
   * Conforme au plan PHASE 6 - Analyse de rentabilité
   */
  async analyzePlanProfitability(
    planId: string,
    period: { start: Date; end: Date } = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date(),
    },
  ): Promise<PlanProfitabilityAnalysis> {
    // ✅ Validation
    if (!planId || typeof planId !== 'string' || planId.trim().length === 0) {
      throw new BadRequestException('Plan ID is required');
    }

    try {
      // ✅ Récupérer tous les brands avec ce plan
      const brands = await this.prisma.brand.findMany({
        where: {
          plan: planId.trim(),
          deletedAt: null,
        },
        select: { id: true },
      });

      if (brands.length === 0) {
        throw new BadRequestException(`No brands found with plan ${planId}`);
      }

      // ✅ Calculer le revenu mensuel moyen
      const planPricing = this.getPlanPricing(planId.trim());
      const monthlyRevenueCents = planPricing.monthlyPriceCents * brands.length;

      // ✅ Calculer les coûts IA moyens
      let totalAICostCents = 0;
      for (const brand of brands) {
        const audit = await this.auditBrandCosts(brand.id, period.start, period.end, {
          includeProjections: false,
          includeAnomalies: false,
          includeRecommendations: false,
        });
        totalAICostCents += audit.totalCostCents;
      }
      const averageAICostCents = totalAICostCents / brands.length;

      // ✅ Estimer les autres coûts (infrastructure, support, etc.)
      // Pour l'instant, estimation à 20% du revenu
      const averageOtherCostsCents = monthlyRevenueCents * 0.2;

      // ✅ Calculer la marge de profit
      const totalCostsCents = averageAICostCents + averageOtherCostsCents;
      const profitCents = planPricing.monthlyPriceCents - totalCostsCents;
      const profitMargin = planPricing.monthlyPriceCents > 0
        ? (profitCents / planPricing.monthlyPriceCents) * 100
        : 0;

      // ✅ Déterminer la rentabilité
      let profitability: PlanProfitabilityAnalysis['profitability'];
      if (profitMargin < 0) {
        profitability = 'negative';
      } else if (profitMargin < 20) {
        profitability = 'low';
      } else if (profitMargin < 50) {
        profitability = 'medium';
      } else {
        profitability = 'high';
      }

      // ✅ Générer des recommandations
      const recommendations: string[] = [];
      if (profitability === 'negative' || profitability === 'low') {
        recommendations.push('Augmentez le prix du plan ou réduisez les coûts IA');
        recommendations.push('Considérez des limites plus strictes sur les générations IA');
      }
      if (averageAICostCents > planPricing.monthlyPriceCents * 0.5) {
        recommendations.push('Les coûts IA représentent plus de 50% du revenu. Optimisez l\'utilisation.');
      }

      return {
        planId: planId.trim(),
        planName: planPricing.name,
        monthlyRevenueCents,
        averageAICostCents,
        averageOtherCostsCents,
        profitMargin,
        profitability,
        recommendations,
      };
    } catch (error) {
      this.logger.error(
        `Failed to analyze plan profitability: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Obtient le pricing d'un plan
   */
  private getPlanPricing(planId: string): { name: string; monthlyPriceCents: number } {
    const pricing: Record<string, { name: string; monthlyPriceCents: number }> = {
      starter: { name: 'Starter', monthlyPriceCents: 2900 }, // 29€
      professional: { name: 'Professional', monthlyPriceCents: 4900 }, // 49€
      business: { name: 'Business', monthlyPriceCents: 9900 }, // 99€
      enterprise: { name: 'Enterprise', monthlyPriceCents: 0 }, // Sur demande
    };

    return pricing[planId] || { name: planId, monthlyPriceCents: 0 };
  }
}
