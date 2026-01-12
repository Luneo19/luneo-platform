import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

export interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
}

export interface FunnelAnalysis {
  id: string;
  name: string;
  steps: FunnelStep[];
  totalConversions: number;
  conversionRate: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface CohortData {
  cohort: string; // Format: YYYY-MM
  users: number;
  retention: {
    week1: number;
    week2: number;
    week4: number;
    week8: number;
    week12: number;
  };
  revenue: number;
  orders: number;
}

@Injectable()
export class AdvancedAnalyticsService {
  private readonly logger = new Logger(AdvancedAnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisOptimizedService,
  ) {}

  /**
   * Analyse un funnel de conversion
   */
  async analyzeFunnel(
    brandId: string,
    steps: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<FunnelAnalysis> {
    const cacheKey = `funnel:${brandId}:${steps.join('-')}:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    const cached = await this.cache.get<FunnelAnalysis>(cacheKey, 'analytics');
    if (cached) {
      return cached;
    }

    const stepCounts: FunnelStep[] = [];
    let previousCount = 0;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      let count = 0;

      // Mapper les étapes aux tables de données
      switch (step.toLowerCase()) {
        case 'visit':
        case 'view':
          count = await this.prisma.usageMetric.count({
            where: {
              brandId,
              metric: 'PAGE_VIEW',
              timestamp: { gte: startDate, lte: endDate },
            },
          });
          break;

        case 'customize':
        case 'create':
          count = await this.prisma.customization.count({
            where: {
              brandId,
              createdAt: { gte: startDate, lte: endDate },
            },
          });
          break;

        case 'add_to_cart':
          count = await this.prisma.order.count({
            where: {
              brandId,
              status: { in: ['CREATED', 'PENDING_PAYMENT'] },
              createdAt: { gte: startDate, lte: endDate },
            },
          });
          break;

        case 'checkout':
          count = await this.prisma.order.count({
            where: {
              brandId,
              status: { in: ['PENDING_PAYMENT', 'PAID'] },
              createdAt: { gte: startDate, lte: endDate },
            },
          });
          break;

        case 'purchase':
        case 'order':
          count = await this.prisma.order.count({
            where: {
              brandId,
              status: 'PAID',
              createdAt: { gte: startDate, lte: endDate },
            },
          });
          break;

        default:
          this.logger.warn(`Unknown funnel step: ${step}`);
      }

      const percentage = previousCount > 0 ? (count / previousCount) * 100 : 100;
      const dropoff = previousCount > 0 ? ((previousCount - count) / previousCount) * 100 : 0;

      stepCounts.push({
        name: step,
        count,
        percentage: Math.round(percentage * 100) / 100,
        dropoff: Math.round(dropoff * 100) / 100,
      });

      previousCount = count;
    }

    const totalConversions = stepCounts[stepCounts.length - 1]?.count || 0;
    const conversionRate =
      stepCounts.length > 0 && stepCounts[0].count > 0
        ? (totalConversions / stepCounts[0].count) * 100
        : 0;

    const analysis: FunnelAnalysis = {
      id: `funnel-${Date.now()}`,
      name: `Funnel: ${steps.join(' → ')}`,
      steps: stepCounts,
      totalConversions,
      conversionRate: Math.round(conversionRate * 100) / 100,
      period: { start: startDate, end: endDate },
    };

    // Cache pour 5 minutes
    await this.cache.set(cacheKey, analysis, 'analytics', { ttl: 300 });

    return analysis;
  }

  /**
   * Analyse de cohorte
   */
  async analyzeCohort(
    brandId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CohortData[]> {
    const cacheKey = `cohort:${brandId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    
    const cached = await this.cache.get<CohortData[]>(cacheKey, 'analytics');
    if (cached) {
      return cached;
    }

    // Récupérer tous les utilisateurs avec leur première commande
    const users = await this.prisma.user.findMany({
      where: {
        brandId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        orders: {
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    // Grouper par cohorte (mois de première commande)
    const cohortsMap = new Map<string, CohortData>();

    for (const user of users) {
      const firstOrder = user.orders[0];
      if (!firstOrder) continue;

      const cohortMonth = firstOrder.createdAt.toISOString().substring(0, 7); // YYYY-MM

      if (!cohortsMap.has(cohortMonth)) {
        cohortsMap.set(cohortMonth, {
          cohort: cohortMonth,
          users: 0,
          retention: {
            week1: 0,
            week2: 0,
            week4: 0,
            week8: 0,
            week12: 0,
          },
          revenue: 0,
          orders: 0,
        });
      }

      const cohort = cohortsMap.get(cohortMonth)!;
      cohort.users++;

      // Calculer la rétention
      const userOrders = await this.prisma.order.findMany({
        where: {
          userId: user.id,
          brandId,
          status: 'PAID',
        },
        orderBy: { createdAt: 'asc' },
      });

      if (userOrders.length > 0) {
        const firstOrderDate = userOrders[0].createdAt;
        const weeks = [1, 2, 4, 8, 12];

        for (const week of weeks) {
          const weekDate = new Date(firstOrderDate);
          weekDate.setDate(weekDate.getDate() + week * 7);

          const hasOrderInWeek = userOrders.some(
            (order) => order.createdAt >= firstOrderDate && order.createdAt <= weekDate,
          );

          if (hasOrderInWeek) {
            cohort.retention[`week${week}` as keyof typeof cohort.retention]++;
          }
        }

        // Revenus et commandes (convertir totalCents en euros)
        cohort.revenue += userOrders.reduce((sum, order) => sum + (order.totalCents / 100 || 0), 0);
        cohort.orders += userOrders.length;
      }
    }

    // Calculer les pourcentages de rétention
    const cohorts = Array.from(cohortsMap.values()).map((cohort) => ({
      ...cohort,
      retention: {
        week1: cohort.users > 0 ? (cohort.retention.week1 / cohort.users) * 100 : 0,
        week2: cohort.users > 0 ? (cohort.retention.week2 / cohort.users) * 100 : 0,
        week4: cohort.users > 0 ? (cohort.retention.week4 / cohort.users) * 100 : 0,
        week8: cohort.users > 0 ? (cohort.retention.week8 / cohort.users) * 100 : 0,
        week12: cohort.users > 0 ? (cohort.retention.week12 / cohort.users) * 100 : 0,
      },
    }));

    // Cache pour 10 minutes
    await this.cache.set(cacheKey, cohorts, 'analytics', { ttl: 600 });

    return cohorts;
  }
}
