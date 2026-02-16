import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { normalizePlanTier } from '@/libs/plans';
import { UsageMeteringService } from './usage-metering.service';
import { QuotasService } from './quotas.service';
import { UsageMetricType } from '../interfaces/usage.interface';

// ============================================================================
// TYPES STRICTS POUR BILLING CALCULATION
// ============================================================================

/**
 * Période de facturation
 */
interface BillingPeriod {
  start: Date;
  end: Date;
}

/**
 * Coûts par métrique
 */
interface MetricCosts {
  [key: string]: number;
}

/**
 * Détail de breakdown
 */
interface BreakdownItem {
  metric: UsageMetricType;
  quantity: number;
  limit: number;
  overage: number;
  unitPrice: number;
  cost: number;
}

/**
 * Résultat de calcul de facture
 */
export interface BillResult {
  period: BillingPeriod;
  basePrice: number;
  usageCosts: Record<UsageMetricType, number>;
  totalUsageCost: number;
  overageCosts: Record<UsageMetricType, number>;
  totalOverageCost: number;
  subtotal: number;
  tax: number;
  total: number;
  breakdown: BreakdownItem[];
}

/**
 * Résultat d'estimation de coût
 */
export interface CostEstimateResult {
  metric: UsageMetricType;
  quantity: number;
  currentUsage: number;
  limit: number;
  willExceed: boolean;
  overageAmount: number;
  unitPrice: number;
  estimatedCost: number;
  totalAfter: number;
}

/**
 * Projection de coûts
 */
export interface CostProjection {
  currentDaily: number;
  projectedMonthly: number;
  projectedOverage: number;
  recommendations: string[];
}

/**
 * Comparaison de plans
 */
export interface PlanComparison {
  plan: string;
  basePrice: number;
  estimatedOverage: number;
  total: number;
  savings: number;
  recommendation: string;
}

/**
 * Service de calcul de facturation avec typage strict et validation robuste
 * Conforme au plan PROJET 3 - Pricing & Rentability
 */
@Injectable()
export class BillingCalculationService {
  private readonly logger = new Logger(BillingCalculationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meteringService: UsageMeteringService,
    private readonly quotasService: QuotasService,
  ) {}

  /**
   * Calculer la facture du mois en cours avec typage strict et validation robuste
   */
  async calculateCurrentBill(brandId: string): Promise<BillResult> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to calculateCurrentBill');
      throw new BadRequestException('Brand ID is required');
    }

    try {
      // ✅ Récupérer le plan du brand avec gardes
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId.trim() },
        select: { subscriptionPlan: true, plan: true, country: true },
      });

      if (!brand) {
        this.logger.warn(`Brand not found: ${brandId}`);
        throw new NotFoundException('Brand not found');
      }

      const planTier = normalizePlanTier(brand.subscriptionPlan ?? brand.plan);
      const planLimits = this.quotasService.getPlanLimits(planTier);

      // ✅ Période de facturation avec validation
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // ✅ Récupérer l'usage actuel
      const currentUsage = await this.meteringService.getCurrentUsage(brandId.trim());

      // ✅ Calculer les coûts par métrique avec typage strict
      const usageCosts: MetricCosts = {};
      const overageCosts: MetricCosts = {};
      const breakdown: BreakdownItem[] = [];

      let totalUsageCost = 0;
      let totalOverageCost = 0;

      // ✅ Calculer les coûts avec gardes
      for (const quota of planLimits.quotas) {
        const quantity = typeof currentUsage[quota.metric] === 'number' ? currentUsage[quota.metric] : 0;
        const limit = typeof quota.limit === 'number' ? quota.limit : 0;
        const overage = Math.max(0, quantity - limit);
        const unitPrice = typeof quota.overageRate === 'number' && quota.overageRate >= 0 ? quota.overageRate : 0;

        let cost = 0;
        if (overage > 0 && quota.overage === 'charge') {
          cost = Math.round(overage * unitPrice);
          overageCosts[quota.metric] = cost;
          totalOverageCost += cost;
        }

        breakdown.push({
          metric: quota.metric,
          quantity,
          limit,
          overage,
          unitPrice,
          cost,
        });
      }

      // ✅ Calcul de la taxe avec validation
      const basePrice = typeof planLimits.basePrice === 'number' ? planLimits.basePrice : 0;
      const subtotal = basePrice + totalUsageCost + totalOverageCost;
      const country = brand.country && typeof brand.country === 'string' ? brand.country.trim() : 'FR';
      const taxRate = this.getTaxRate(country);
      const tax = Math.round(subtotal * taxRate);
      const total = subtotal + tax;

      return {
        period: {
          start: startOfMonth,
          end: endOfMonth,
        },
        basePrice: planLimits.basePrice,
        usageCosts: usageCosts as Record<UsageMetricType, number>,
        totalUsageCost,
        overageCosts: overageCosts as Record<UsageMetricType, number>,
        totalOverageCost,
        subtotal,
        tax,
        total,
        breakdown,
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate bill: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculer le coût estimé d'une action avec typage strict et validation
   */
  async estimateActionCost(
    brandId: string,
    metric: UsageMetricType,
    quantity: number = 1,
  ): Promise<CostEstimateResult> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to estimateActionCost');
      throw new BadRequestException('Brand ID is required');
    }

    if (typeof quantity !== 'number' || quantity < 0 || !Number.isFinite(quantity)) {
      this.logger.warn(`Invalid quantity provided: ${quantity}`);
      throw new BadRequestException('Quantity must be a positive number');
    }
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { subscriptionPlan: true, plan: true },
      });

      if (!brand) {
        throw new NotFoundException('Brand not found');
      }

      const planLimits = this.quotasService.getPlanLimits(brand.subscriptionPlan || brand.plan || 'starter');
      const quota = planLimits.quotas.find((q) => q.metric === metric);

      if (!quota) {
        return {
          metric,
          quantity,
          currentUsage: 0,
          limit: 999999,
          willExceed: false,
          overageAmount: 0,
          unitPrice: 0,
          estimatedCost: 0,
          totalAfter: 0,
        };
      }

      const currentUsage = await this.meteringService.getCurrentUsage(brandId);
      const used = currentUsage[metric] || 0;
      const afterUsage = used + quantity;
      const willExceed = afterUsage > quota.limit;
      const overageAmount = Math.max(0, afterUsage - quota.limit);
      const unitPrice = quota.overageRate || 0;
      const estimatedCost = willExceed ? overageAmount * unitPrice : 0;

      const currentBill = await this.calculateCurrentBill(brandId);
      const totalAfter = currentBill.total + estimatedCost;

      return {
        metric,
        quantity,
        currentUsage: used,
        limit: quota.limit,
        willExceed,
        overageAmount,
        unitPrice,
        estimatedCost,
        totalAfter,
      };
    } catch (error) {
      this.logger.error(
        `Failed to estimate cost: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculer les projections de coût avec typage strict et validation
   */
  async projectCosts(
    brandId: string,
    days: number = 30,
  ): Promise<CostProjection> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to projectCosts');
      throw new BadRequestException('Brand ID is required');
    }

    if (typeof days !== 'number' || days < 1 || days > 365 || !Number.isFinite(days)) {
      this.logger.warn(`Invalid days provided: ${days}, using default 30`);
      days = 30;
    }
    try {
      // Récupérer l'usage des 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentUsage = await this.prisma.usageMetric.findMany({
        where: {
          brandId,
          timestamp: {
            gte: sevenDaysAgo,
          },
        },
      });

      // Calculer l'usage moyen quotidien par métrique
      const dailyAverages: Record<string, number> = {};
      const metricCounts: Record<string, number> = {};

      for (const record of recentUsage) {
        if (!dailyAverages[record.metric]) {
          dailyAverages[record.metric] = 0;
          metricCounts[record.metric] = 0;
        }
        dailyAverages[record.metric] += record.value;
        metricCounts[record.metric]++;
      }

      // Moyenne sur 7 jours
      for (const metric in dailyAverages) {
        dailyAverages[metric] = dailyAverages[metric] / 7;
      }

      // Projeter sur le nombre de jours demandé
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { subscriptionPlan: true, plan: true },
      });

      const planLimits = this.quotasService.getPlanLimits(brand?.subscriptionPlan || brand?.plan || 'starter');

      let projectedOverage = 0;
      const recommendations: string[] = [];

      for (const quota of planLimits.quotas) {
        const dailyAvg = dailyAverages[quota.metric] || 0;
        const projected = dailyAvg * days;

        if (projected > quota.limit * 0.9) {
          // Va dépasser 90% du quota
          recommendations.push(
            `⚠️  ${quota.metric} will reach ${((projected / quota.limit) * 100).toFixed(0)}% of quota. Consider upgrading.`,
          );
        }

        if (projected > quota.limit && quota.overage === 'charge') {
          const overage = projected - quota.limit;
          const cost = overage * (quota.overageRate || 0);
          projectedOverage += cost;
        }
      }

      // Coût journalier moyen actuel
      const currentBill = await this.calculateCurrentBill(brandId);
      const daysInMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0,
      ).getDate();
      const currentDaily = currentBill.totalOverageCost / daysInMonth;

      const projectedMonthly = planLimits.basePrice + projectedOverage;

      return {
        currentDaily,
        projectedMonthly,
        projectedOverage,
        recommendations,
      };
    } catch (error) {
      this.logger.error(
        `Failed to project costs: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Récupérer le taux de taxe selon le pays
   */
  private getTaxRate(country: string): number {
    const taxRates: Record<string, number> = {
      FR: 0.2, // 20% TVA France
      BE: 0.21, // 21% TVA Belgique
      DE: 0.19, // 19% TVA Allemagne
      ES: 0.21, // 21% TVA Espagne
      IT: 0.22, // 22% TVA Italie
      UK: 0.2, // 20% VAT UK
      US: 0, // Pas de TVA fédérale
    };

    return taxRates[country] || 0.2; // Par défaut 20%
  }

  /**
   * Comparer les coûts entre différents plans avec typage strict et validation
   */
  async comparePlans(brandId: string): Promise<PlanComparison[]> {
    // ✅ Validation des entrées
    if (!brandId || typeof brandId !== 'string' || brandId.trim().length === 0) {
      this.logger.warn('Invalid brandId provided to comparePlans');
      throw new BadRequestException('Brand ID is required');
    }
    try {
      const currentUsage = await this.meteringService.getCurrentUsage(brandId);
      const allPlans = this.quotasService.getAllPlans();

      const comparisons: Omit<PlanComparison, 'savings' | 'recommendation'>[] = [];

      for (const planLimits of allPlans) {
        let overageCost = 0;

        for (const quota of planLimits.quotas) {
          const used = typeof currentUsage[quota.metric] === 'number' ? currentUsage[quota.metric] : 0;
          const limit = typeof quota.limit === 'number' ? quota.limit : 0;
          const overage = Math.max(0, used - limit);

          if (overage > 0 && quota.overage === 'charge') {
            const rate = typeof quota.overageRate === 'number' && quota.overageRate >= 0 ? quota.overageRate : 0;
            overageCost += Math.round(overage * rate);
          }
        }

        const basePrice = typeof planLimits.basePrice === 'number' ? planLimits.basePrice : 0;
        const total = basePrice + overageCost;

        comparisons.push({
          plan: planLimits.plan,
          basePrice,
          estimatedOverage: overageCost,
          total,
        });
      }

      // Trier par total
      comparisons.sort((a, b) => a.total - b.total);

      // ✅ Ajouter les recommandations et savings avec typage strict
      const cheapest = comparisons[0];
      return comparisons.map((comp) => {
        const savings = comp.total - cheapest.total;
        return {
          ...comp,
          savings,
          recommendation:
            comp === cheapest
              ? '✅ Best value for your usage'
              : savings > 5000
                ? '⚠️  Significantly more expensive'
                : '💰 Acceptable alternative',
        };
      });
    } catch (error) {
      this.logger.error(
        `Failed to compare plans: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
