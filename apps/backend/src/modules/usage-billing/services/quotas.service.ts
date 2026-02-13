import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { UsageMeteringService } from './usage-metering.service';
import { PLAN_CONFIGS, normalizePlanTier, PlanTier } from '@/libs/plans';
import {
  PlanLimits,
  UsageMetricType,
  UsageSummary,
} from '../interfaces/usage.interface';

/**
 * Service de gestion des quotas
 * Vérifie les limites par plan et gère les overages
 *
 * Les données de quotas proviennent de @/libs/plans (SINGLE SOURCE OF TRUTH).
 */
@Injectable()
export class QuotasService {
  private readonly logger = new Logger(QuotasService.name);

  /**
   * Plan limits derived from centralized config.
   * Source: @/libs/plans/plan-config.ts (SINGLE SOURCE OF TRUTH)
   */
  private readonly planLimits: Record<string, PlanLimits> = (() => {
    const result: Record<string, PlanLimits> = {};
    for (const tier of [PlanTier.FREE, PlanTier.STARTER, PlanTier.PROFESSIONAL, PlanTier.BUSINESS, PlanTier.ENTERPRISE]) {
      const config = PLAN_CONFIGS[tier];
      result[tier] = {
        plan: tier as PlanLimits['plan'],
        basePrice: config.pricing.basePriceCents,
        quotas: config.quotas.map((q) => ({
          metric: q.metric as UsageMetricType,
          limit: q.limit,
          period: q.period as 'month' | 'day',
          overage: q.overage,
          overageRate: q.overageRate,
        })),
        features: config.info.features,
      };
    }
    return result;
  })();

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly meteringService: UsageMeteringService,
  ) {}

  /**
   * Vérifier si un brand peut utiliser une métrique
   */
  async checkQuota(
    brandId: string,
    metric: UsageMetricType,
    requestedAmount: number = 1,
  ): Promise<{
    allowed: boolean;
    remaining: number;
    limit: number;
    overage: number;
    willCharge: boolean;
    estimatedCost: number;
  }> {
    try {
      // Récupérer le plan du brand
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { plan: true },
      });

      if (!brand) {
        throw new BadRequestException('Brand not found');
      }

      const planLimits = this.planLimits[brand.plan || 'starter'];
      const quota = planLimits.quotas.find((q) => q.metric === metric);

      if (!quota) {
        // Pas de quota défini pour cette métrique = illimité
        return {
          allowed: true,
          remaining: 999999,
          limit: 999999,
          overage: 0,
          willCharge: false,
          estimatedCost: 0,
        };
      }

      // Récupérer l'usage actuel
      const currentUsage = await this.meteringService.getCurrentUsage(brandId);
      const used = currentUsage[metric] || 0;

      const remaining = Math.max(0, quota.limit - used);
      const overage = Math.max(0, used + requestedAmount - quota.limit);

      // Vérifier si l'action est autorisée
      let allowed = true;
      let estimatedCost = 0;

      if (overage > 0) {
        if (quota.overage === 'block') {
          allowed = false;
        } else if (quota.overage === 'charge') {
          allowed = true;
          estimatedCost = overage * (quota.overageRate || 0);
        }
      }

      return {
        allowed,
        remaining,
        limit: quota.limit,
        overage,
        willCharge: quota.overage === 'charge' && overage > 0,
        estimatedCost,
      };
    } catch (error) {
      this.logger.error(`Failed to check quota: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Vérifier et appliquer le quota (throw si dépassé et bloqué)
   */
  async enforceQuota(
    brandId: string,
    metric: UsageMetricType,
    amount: number = 1,
  ): Promise<void> {
    const check = await this.checkQuota(brandId, metric, amount);

    if (!check.allowed) {
      throw new BadRequestException(
        `Quota exceeded for ${metric}. Limit: ${check.limit}, Used: ${check.limit - check.remaining}. Please upgrade your plan.`,
      );
    }

    if (check.willCharge && check.estimatedCost > 0) {
      this.logger.warn(
        `Brand ${brandId} will be charged ${check.estimatedCost} cents for ${metric} overage`,
      );
    }
  }

  /**
   * Récupérer le résumé d'usage complet
   */
  async getUsageSummary(brandId: string): Promise<UsageSummary> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { plan: true },
      });

      if (!brand) {
        throw new BadRequestException('Brand not found');
      }

      const planLimits = this.planLimits[brand.plan || 'starter'];
      const currentUsage = await this.meteringService.getCurrentUsage(brandId);

      // Calculer les métriques avec pourcentages
      const metrics = planLimits.quotas.map((quota) => {
        const current = currentUsage[quota.metric] || 0;
        const percentage = (current / quota.limit) * 100;
        const overage = Math.max(0, current - quota.limit);

        return {
          type: quota.metric,
          current,
          limit: quota.limit,
          percentage: Math.min(100, percentage),
          overage,
        };
      });

      // Calculer les coûts estimés
      let usageCost = 0;
      let overageCost = 0;

      for (const metric of metrics) {
        const quota = planLimits.quotas.find((q) => q.metric === metric.type);
        if (quota && metric.overage > 0 && quota.overageRate) {
          overageCost += metric.overage * quota.overageRate;
        }
      }

      const estimatedCost = {
        base: planLimits.basePrice,
        usage: usageCost,
        overage: overageCost,
        total: planLimits.basePrice + usageCost + overageCost,
      };

      // Générer des alertes
      // ✅ FIX: Alertes à 75%, 80% et 90% (ajout du seuil 80%)
      const alerts = [];
      for (const metric of metrics) {
        if (metric.percentage >= 100) {
          alerts.push({
            severity: 'critical' as const,
            message: `${metric.type} has exceeded quota (${metric.percentage.toFixed(0)}%)`,
            metric: metric.type,
            threshold: 100,
          });
        } else if (metric.percentage >= 90) {
          alerts.push({
            severity: 'critical' as const,
            message: `${metric.type} at ${metric.percentage.toFixed(0)}% of quota`,
            metric: metric.type,
            threshold: 90,
          });
        } else if (metric.percentage >= 80) {
          alerts.push({
            severity: 'warning' as const,
            message: `${metric.type} at ${metric.percentage.toFixed(0)}% of quota - consider upgrading`,
            metric: metric.type,
            threshold: 80,
          });
        } else if (metric.percentage >= 75) {
          alerts.push({
            severity: 'info' as const,
            message: `${metric.type} at ${metric.percentage.toFixed(0)}% of quota`,
            metric: metric.type,
            threshold: 75,
          });
        }
      }

      // Période de facturation
      const now = new Date();
      const startOfMonth = new Date(now);
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(now);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      return {
        brandId,
        period: {
          start: startOfMonth,
          end: endOfMonth,
          status: 'active',
        },
        metrics,
        estimatedCost,
        alerts,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get usage summary: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Récupérer les limites d'un plan
   */
  getPlanLimits(plan: string): PlanLimits {
    const tier = normalizePlanTier(plan);
    return this.planLimits[tier] || this.planLimits[PlanTier.FREE] || this.planLimits.starter;
  }

  /**
   * Lister tous les plans disponibles
   */
  getAllPlans(): PlanLimits[] {
    return Object.values(this.planLimits);
  }
}
