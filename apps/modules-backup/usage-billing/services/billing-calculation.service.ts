import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UsageMeteringService } from './usage-metering.service';
import { QuotasService } from './quotas.service';
import { UsageMetricType } from '../interfaces/usage.interface';

/**
 * Service de calcul de facturation
 * Calcule les coûts basés sur l'usage et les quotas
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
   * Calculer la facture du mois en cours
   */
  async calculateCurrentBill(brandId: string): Promise<{
    period: { start: Date; end: Date };
    basePrice: number;
    usageCosts: Record<UsageMetricType, number>;
    totalUsageCost: number;
    overageCosts: Record<UsageMetricType, number>;
    totalOverageCost: number;
    subtotal: number;
    tax: number;
    total: number;
    breakdown: Array<{
      metric: UsageMetricType;
      quantity: number;
      limit: number;
      overage: number;
      unitPrice: number;
      cost: number;
    }>;
  }> {
    try {
      // Récupérer le plan du brand
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { plan: true, country: true },
      });

      if (!brand) {
        throw new Error('Brand not found');
      }

      const planLimits = this.quotasService.getPlanLimits(brand.plan || 'starter');

      // Période de facturation
      const now = new Date();
      const startOfMonth = new Date(now);
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(now);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Récupérer l'usage actuel
      const currentUsage = await this.meteringService.getCurrentUsage(brandId);

      // Calculer les coûts par métrique
      const usageCosts: Record<string, number> = {};
      const overageCosts: Record<string, number> = {};
      const breakdown: Array<any> = [];

      let totalUsageCost = 0;
      let totalOverageCost = 0;

      for (const quota of planLimits.quotas) {
        const quantity = currentUsage[quota.metric] || 0;
        const overage = Math.max(0, quantity - quota.limit);
        const unitPrice = quota.overageRate || 0;

        let cost = 0;
        if (overage > 0 && quota.overage === 'charge') {
          cost = overage * unitPrice;
          overageCosts[quota.metric] = cost;
          totalOverageCost += cost;
        }

        breakdown.push({
          metric: quota.metric,
          quantity,
          limit: quota.limit,
          overage,
          unitPrice,
          cost,
        });
      }

      // Calcul de la taxe (TVA 20% pour la France)
      const subtotal = planLimits.basePrice + totalUsageCost + totalOverageCost;
      const taxRate = this.getTaxRate(brand.country || 'FR');
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
   * Calculer le coût estimé d'une action
   */
  async estimateActionCost(
    brandId: string,
    metric: UsageMetricType,
    quantity: number = 1,
  ): Promise<{
    metric: UsageMetricType;
    quantity: number;
    currentUsage: number;
    limit: number;
    willExceed: boolean;
    overageAmount: number;
    unitPrice: number;
    estimatedCost: number;
    totalAfter: number;
  }> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { plan: true },
      });

      if (!brand) {
        throw new Error('Brand not found');
      }

      const planLimits = this.quotasService.getPlanLimits(brand.plan || 'starter');
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
   * Calculer les projections de coût
   */
  async projectCosts(
    brandId: string,
    days: number = 30,
  ): Promise<{
    currentDaily: number;
    projectedMonthly: number;
    projectedOverage: number;
    recommendations: string[];
  }> {
    try {
      // Récupérer l'usage des 7 derniers jours
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentUsage = await this.prisma.usageMetric.findMany({
        where: {
          brandId,
          createdAt: {
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
        select: { plan: true },
      });

      const planLimits = this.quotasService.getPlanLimits(brand?.plan || 'starter');

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
   * Comparer les coûts entre différents plans
   */
  async comparePlans(brandId: string): Promise<
    Array<{
      plan: string;
      basePrice: number;
      estimatedOverage: number;
      total: number;
      savings: number;
      recommendation: string;
    }>
  > {
    try {
      const currentUsage = await this.meteringService.getCurrentUsage(brandId);
      const allPlans = this.quotasService.getAllPlans();

      const comparisons = [];

      for (const planLimits of allPlans) {
        let overageCost = 0;

        for (const quota of planLimits.quotas) {
          const used = currentUsage[quota.metric] || 0;
          const overage = Math.max(0, used - quota.limit);

          if (overage > 0 && quota.overage === 'charge') {
            overageCost += overage * (quota.overageRate || 0);
          }
        }

        const total = planLimits.basePrice + overageCost;

        comparisons.push({
          plan: planLimits.plan,
          basePrice: planLimits.basePrice,
          estimatedOverage: overageCost,
          total,
        });
      }

      // Trier par total
      comparisons.sort((a, b) => a.total - b.total);

      // Ajouter les recommandations et savings
      const cheapest = comparisons[0];
      return comparisons.map((comp) => ({
        ...comp,
        savings: comp.total - cheapest.total,
        recommendation:
          comp === cheapest
            ? '✅ Best value for your usage'
            : comp.savings > 5000
              ? '⚠️  Significantly more expensive'
              : '💰 Acceptable alternative',
      }));
    } catch (error) {
      this.logger.error(
        `Failed to compare plans: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
