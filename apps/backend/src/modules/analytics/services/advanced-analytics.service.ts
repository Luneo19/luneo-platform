// @ts-nocheck
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

    const countPromises = steps.map((step) => {
      switch (step.toLowerCase()) {
        case 'visit':
        case 'view':
          return this.prisma.usageMetric.count({
            where: {
              brandId,
              metric: 'PAGE_VIEW',
              timestamp: { gte: startDate, lte: endDate },
            },
          });
        case 'customize':
        case 'create':
          return this.prisma.customization.count({
            where: {
              brandId,
              createdAt: { gte: startDate, lte: endDate },
            },
          });
        case 'add_to_cart':
          return this.prisma.order.count({
            where: {
              brandId,
              status: { in: ['CREATED', 'PENDING_PAYMENT'] },
              createdAt: { gte: startDate, lte: endDate },
            },
          });
        case 'checkout':
          return this.prisma.order.count({
            where: {
              brandId,
              status: { in: ['PENDING_PAYMENT', 'PAID'] },
              createdAt: { gte: startDate, lte: endDate },
            },
          });
        case 'purchase':
        case 'order':
          return this.prisma.order.count({
            where: {
              brandId,
              status: 'PAID',
              createdAt: { gte: startDate, lte: endDate },
            },
          });
        default:
          this.logger.warn(`Unknown funnel step: ${step}`);
          return Promise.resolve(0);
      }
    });

    const counts = await Promise.all(countPromises);
    const stepCounts: FunnelStep[] = [];
    let previousCount = 0;
    for (let i = 0; i < steps.length; i++) {
      const count = counts[i];
      const percentage = previousCount > 0 ? (count / previousCount) * 100 : 100;
      const dropoff = previousCount > 0 ? ((previousCount - count) / previousCount) * 100 : 0;
      stepCounts.push({
        name: steps[i],
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

    const users = await this.prisma.user.findMany({
      where: {
        brandId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    if (userIds.length === 0) {
      await this.cache.set(cacheKey, [], 'analytics', { ttl: 600 });
      return [];
    }

    const userOrders = await this.prisma.order.findMany({
      where: {
        userId: { in: userIds },
        brandId,
        status: 'PAID',
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, userId: true, createdAt: true, totalCents: true },
    });

    const ordersByUser = new Map<string, typeof userOrders>();
    for (const order of userOrders) {
      const uid = order.userId;
      if (uid == null) continue;
      const list = ordersByUser.get(uid) ?? [];
      list.push(order);
      ordersByUser.set(uid, list);
    }

    const firstOrderByUser = new Map<string, (typeof userOrders)[0]>();
    for (const [uid, orders] of ordersByUser) {
      if (orders.length > 0) firstOrderByUser.set(uid, orders[0]);
    }

    const cohortsMap = new Map<string, CohortData>();

    for (const user of users) {
      const firstOrder = firstOrderByUser.get(user.id);
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

      const userOrderList = ordersByUser.get(user.id) ?? [];
      if (userOrderList.length > 0) {
        const firstOrderDate = userOrderList[0].createdAt;
        const weeks = [1, 2, 4, 8, 12];

        for (const week of weeks) {
          const weekDate = new Date(firstOrderDate);
          weekDate.setDate(weekDate.getDate() + week * 7);

          const hasOrderInWeek = userOrderList.some(
            (order) => order.createdAt >= firstOrderDate && order.createdAt <= weekDate,
          );

          if (hasOrderInWeek) {
            cohort.retention[`week${week}` as keyof typeof cohort.retention]++;
          }
        }

        cohort.revenue += userOrderList.reduce((sum, order) => sum + (order.totalCents / 100 || 0), 0);
        cohort.orders += userOrderList.length;
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
