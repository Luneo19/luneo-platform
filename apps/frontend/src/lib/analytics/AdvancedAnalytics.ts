/**
 * ★★★ SERVICE - ANALYTICS AVANCÉS ★★★
 * Service professionnel pour analytics avancés
 * - Funnel analysis
 * - Cohort analysis
 * - User segmentation
 * - Predictive analytics
 * - Recommendation engine
 */

import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/cache/CacheService';
import { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';

// ========================================
// TYPES
// ========================================

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
  totalUsers: number;
  conversionRate: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface Cohort {
  id: string;
  name: string;
  startDate: Date;
  users: number;
  retention: Record<number, number>; // week -> retention %
}

export interface UserSegment {
  id: string;
  name: string;
  criteria: Record<string, any>;
  userCount: number;
  characteristics: Record<string, any>;
}

// ========================================
// SERVICE
// ========================================

export class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService;

  private constructor() {}

  static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService();
    }
    return AdvancedAnalyticsService.instance;
  }

  // ========================================
  // FUNNEL ANALYSIS
  // ========================================

  /**
   * Analyse un funnel de conversion
   */
  async analyzeFunnel(
    brandId: string,
    steps: string[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<FunnelAnalysis> {
    try {
      logger.info('Analyzing funnel', { brandId, steps });

      // Query database for funnel data
      // Map steps to actual event types or use AuditLog/UsageMetric tables
      const stepCounts = await Promise.all(
        steps.map(async (step, index) => {
          // Try to find events in AuditLog or UsageMetric
          // For now, we'll use a combination of different tables based on step name
          let count = 0;

          if (step.toLowerCase().includes('view') || step.toLowerCase().includes('visit')) {
            // Count page views or product views
            count = await db.usageMetric.count({
              where: {
                brandId,
                metricType: 'PAGE_VIEW',
                timestamp: {
                  gte: periodStart,
                  lte: periodEnd,
                },
              },
            });
          } else if (step.toLowerCase().includes('customize') || step.toLowerCase().includes('create')) {
            // Count customizations created
            count = await db.customization.count({
              where: {
                product: {
                  brandId,
                },
                createdAt: {
                  gte: periodStart,
                  lte: periodEnd,
                },
              },
            });
          } else if (step.toLowerCase().includes('order') || step.toLowerCase().includes('purchase')) {
            // Count orders
            count = await db.order.count({
              where: {
                brandId,
                createdAt: {
                  gte: periodStart,
                  lte: periodEnd,
                },
              },
            });
          } else {
            // Generic event count from AuditLog
            count = await db.auditLog.count({
              where: {
                brandId,
                action: step.toUpperCase(),
                timestamp: {
                  gte: periodStart,
                  lte: periodEnd,
                },
              },
            });
          }

          return { step, count };
        })
      );

      // Calculate percentages and dropoffs
      const funnelSteps: FunnelStep[] = stepCounts.map(({ step, count }, index) => {
        const previousCount = index > 0 ? stepCounts[index - 1].count : count;
        const percentage = previousCount > 0 ? (count / previousCount) * 100 : 100;
        const dropoff = index > 0 ? 100 - percentage : 0;

        return {
          name: step,
          count,
          percentage,
          dropoff,
        };
      });

      const totalUsers = funnelSteps[0]?.count || 0;
      const conversionRate =
        funnelSteps.length > 0
          ? (funnelSteps[funnelSteps.length - 1].count / totalUsers) * 100
          : 0;

      const analysis: FunnelAnalysis = {
        id: `funnel-${Date.now()}`,
        name: 'Conversion Funnel',
        steps: funnelSteps,
        totalUsers,
        conversionRate,
        periodStart,
        periodEnd,
      };

      return analysis;
    } catch (error: any) {
      logger.error('Error analyzing funnel', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // COHORT ANALYSIS
  // ========================================

  /**
   * Analyse les cohortes d'utilisateurs
   */
  async analyzeCohorts(
    brandId: string,
    cohortStart: Date,
    cohortEnd: Date,
    weeks: number = 12
  ): Promise<Cohort[]> {
    try {
      logger.info('Analyzing cohorts', { brandId, weeks });

      // Query database for cohort data
      const users = await db.user.findMany({
        where: {
          brandId,
          createdAt: {
            gte: cohortStart,
            lte: cohortEnd,
          },
        },
        select: {
          id: true,
          createdAt: true,
        },
      });

      // Group users by week of signup
      const cohortsByWeek = new Map<string, typeof users>();
      users.forEach((user: { id: string; createdAt: Date }) => {
        const weekStart = new Date(user.createdAt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!cohortsByWeek.has(weekKey)) {
          cohortsByWeek.set(weekKey, []);
        }
        cohortsByWeek.get(weekKey)!.push(user);
      });

      // Calculate retention for each week
      const cohorts: Cohort[] = [];

      for (const [weekKey, cohortUsers] of cohortsByWeek.entries()) {
        const retention: Record<number, number> = {};
        const cohortStartDate = new Date(weekKey);

        for (let week = 1; week <= weeks; week++) {
          const weekEnd = new Date(cohortStartDate);
          weekEnd.setDate(weekEnd.getDate() + week * 7);

          // Count users who had activity in this week
          const activeUserIds = await db.auditLog.findMany({
            where: {
              userId: { in: cohortUsers.map((u: { id: string; createdAt: Date }) => u.id) },
              timestamp: {
                gte: new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000),
                lte: weekEnd,
              },
            },
            select: { userId: true },
            distinct: ['userId'],
          });

          const activeCount = activeUserIds.length;
          const retentionPercent = cohortUsers.length > 0 ? (activeCount / cohortUsers.length) * 100 : 0;
          retention[week] = Math.round(retentionPercent * 100) / 100;
        }

        cohorts.push({
          id: `cohort-${weekKey}`,
          name: `Cohort ${weekKey}`,
          startDate: cohortStartDate,
          users: cohortUsers.length,
          retention,
        });
      }

      return cohorts;
    } catch (error: any) {
      logger.error('Error analyzing cohorts', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // USER SEGMENTATION
  // ========================================

  /**
   * Crée un segment d'utilisateurs
   */
  async createSegment(
    brandId: string,
    name: string,
    criteria: Record<string, any>
  ): Promise<UserSegment> {
    try {
      logger.info('Creating user segment', { brandId, name });

      // Query users matching criteria
      const whereClause: any = { brandId };

      // Map criteria to Prisma where clause
      if (criteria.email) whereClause.email = { contains: criteria.email };
      if (criteria.role) whereClause.role = criteria.role;
      if (criteria.createdAt) {
        if (criteria.createdAt.gte) whereClause.createdAt = { gte: new Date(criteria.createdAt.gte) };
        if (criteria.createdAt.lte) whereClause.createdAt = { ...whereClause.createdAt, lte: new Date(criteria.createdAt.lte) };
      }

      const users = await db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      // Calculate characteristics
      const characteristics: Record<string, any> = {
        totalUsers: users.length,
        roles: {},
        avgAccountAge: 0,
      };

      if (users.length > 0) {
        const now = new Date();
        const totalAge = users.reduce((sum: number, user: { id: string; createdAt: Date; role?: string | null }) => {
          return sum + (now.getTime() - user.createdAt.getTime());
        }, 0);
        characteristics.avgAccountAge = Math.round(totalAge / users.length / (1000 * 60 * 60 * 24)); // days

        users.forEach((user: { id: string; createdAt: Date; role?: string | null }) => {
          characteristics.roles[user.role || 'USER'] = (characteristics.roles[user.role || 'USER'] || 0) + 1;
        });
      }

      const segment: UserSegment = {
        id: `segment-${Date.now()}`,
        name,
        criteria,
        userCount: users.length,
        characteristics,
      };

      return segment;
    } catch (error: any) {
      logger.error('Error creating segment', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // RECOMMENDATIONS
  // ========================================

  /**
   * Génère des recommandations pour un utilisateur
   */
  async getRecommendations(
    userId: string,
    type: 'products' | 'designs' | 'features',
    limit: number = 10
  ): Promise<Array<{ id: string; score: number; reason: string }>> {
    try {
      // ML-based recommendations using collaborative filtering
      // 1. Get user behavior (customizations, orders, views)
      const userCustomizations = await db.customization.findMany({
        where: { userId },
        select: { productId: true },
        distinct: ['productId'],
      });

      const userProductIds = userCustomizations.map((c: { productId: string | null }) => c.productId).filter((id: string | null): id is string => id !== null);

      // 2. Find similar users (users who customized similar products)
      const similarUsers = await db.customization.findMany({
        where: {
          productId: { in: userProductIds },
          userId: { not: userId },
        },
        select: { userId: true, productId: true },
        distinct: ['userId'],
      });

      const similarUserIds = [...new Set(similarUsers.map((s: { userId: string }) => s.userId))];

      // 3. Get products that similar users liked but current user hasn't seen
      const recommendedProducts = await db.customization.findMany({
        where: {
          userId: { in: similarUserIds },
          productId: { notIn: userProductIds },
        },
        select: {
          productId: true,
        },
        distinct: ['productId'],
        take: limit * 2, // Get more to filter
      });

      // 4. Calculate scores based on popularity and similarity
      const productScores = new Map<string, number>();
      recommendedProducts.forEach((rec: { productId: string | null; userId: string }) => {
        const currentScore = productScores.get(rec.productId) || 0;
        productScores.set(rec.productId, currentScore + 1);
      });

      // Sort by score and take top recommendations
      const sortedRecommendations = Array.from(productScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([productId, score]) => ({
          id: productId,
          score: Math.round((score / similarUsers.length) * 100),
          reason: `Based on ${score} similar users`,
        }));

      // If not enough recommendations, fill with popular products
      if (sortedRecommendations.length < limit) {
        const popularProducts = await db.product.findMany({
          where: {
            id: { notIn: userProductIds },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit - sortedRecommendations.length,
          select: { id: true },
        });

        popularProducts.forEach((product) => {
          sortedRecommendations.push({
            id: product.id,
            score: 50, // Default score for popular items
            reason: 'Popular product',
          });
        });
      }

      const recommendations = sortedRecommendations;

      return recommendations;
    } catch (error: any) {
      logger.error('Error getting recommendations', { error, userId });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const advancedAnalytics = AdvancedAnalyticsService.getInstance();

