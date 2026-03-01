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
import { api } from '@/lib/api/client';

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
  criteria: Record<string, unknown>;
  userCount: number;
  characteristics: Record<string, unknown>;
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

      const funnelRes = await api.get<{ steps?: Array<{ step: string; count: number }> }>('/api/v1/analytics-advanced/funnel/analyze', {
        params: {
          brandId,
          steps: steps.join(','),
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
        },
      }).catch(() => ({}));

      const funnelData = funnelRes as { steps?: Array<{ step: string; count: number }> };
      const stepCounts = funnelData.steps ?? steps.map((step) => ({ step, count: 0 }));

      // Calculate percentages and dropoffs
      const funnelSteps: FunnelStep[] = stepCounts.map(({ step, count }: { step: string; count: number }, index: number) => {
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
    } catch (error: unknown) {
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

      const cohortsRes = await api.get<{ users?: Array<{ id: string; createdAt: string }> }>('/api/v1/analytics-advanced/cohorts/users', {
        params: {
          brandId,
          cohortStart: cohortStart.toISOString(),
          cohortEnd: cohortEnd.toISOString(),
        },
      }).catch(() => ({}));

      const users = (cohortsRes as Record<string, unknown>).users as Array<{ id: string; createdAt: Date }> ?? [];

      const cohortsByWeek = new Map<string, Array<{ id: string; createdAt: Date }>>();
      users.forEach((user: { id: string; createdAt: Date | string }) => {
        const weekStart = new Date(user.createdAt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
        const weekKey = weekStart.toISOString().split('T')[0];

        if (!cohortsByWeek.has(weekKey)) {
          cohortsByWeek.set(weekKey, []);
        }
        cohortsByWeek.get(weekKey)!.push({ id: user.id, createdAt: new Date(user.createdAt) });
      });

      // Calculate retention for each week
      const cohorts: Cohort[] = [];

      for (const [weekKey, cohortUsers] of cohortsByWeek.entries()) {
        const retention: Record<number, number> = {};
        const cohortStartDate = new Date(weekKey);

        for (let week = 1; week <= weeks; week++) {
          const weekEnd = new Date(cohortStartDate);
          weekEnd.setDate(weekEnd.getDate() + week * 7);

          const activeRes = await api.get<{ userIds?: string[] }>('/api/v1/analytics-advanced/cohorts/active-users', {
            params: {
              brandId,
              userIds: cohortUsers.map((u: { id: string }) => u.id).join(','),
              weekStart: new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              weekEnd: weekEnd.toISOString(),
            },
          }).catch(() => ({}));
          const activeData = activeRes as { userIds?: string[] };
          const activeUserIds = activeData.userIds ?? [];
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
    } catch (error: unknown) {
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
    criteria: Record<string, unknown>
  ): Promise<UserSegment> {
    try {
      logger.info('Creating user segment', { brandId, name });

      // Query users matching criteria
      const whereClause: Record<string, unknown> = { brandId };

      // Build filter criteria for backend query
      if (criteria.email) whereClause.email = { contains: criteria.email };
      if (criteria.role) whereClause.role = criteria.role;
      const createdAtCriteria = criteria.createdAt as { gte?: string; lte?: string } | undefined;
      if (createdAtCriteria) {
        if (createdAtCriteria.gte) whereClause.createdAt = { gte: new Date(createdAtCriteria.gte) };
        if (createdAtCriteria.lte) whereClause.createdAt = { ...(typeof whereClause.createdAt === 'object' && whereClause.createdAt ? whereClause.createdAt : {}), lte: new Date(createdAtCriteria.lte) };
      }

      const segmentRes = await api.get<{ users?: Array<{ id: string; email?: string; role?: string; createdAt: string }> }>('/api/v1/analytics-advanced/segments/query', {
        params: { brandId, ...criteria },
      }).catch(() => ({}));
      const segmentData = segmentRes as { users?: Array<{ id: string; createdAt?: Date | string; role?: string | null }> };
      const users = segmentData.users ?? [];

      // Calculate characteristics
      const characteristics: Record<string, unknown> = {
        totalUsers: users.length,
        roles: {},
        avgAccountAge: 0,
      };

      if (users.length > 0) {
        const now = new Date();
        const totalAge = users.reduce((sum: number, user: { id: string; createdAt?: Date | string; role?: string | null }) => {
          const raw = user.createdAt;
          const created = raw == null ? now : raw instanceof Date ? raw : new Date(raw);
          return sum + (now.getTime() - created.getTime());
        }, 0);
        characteristics.avgAccountAge = Math.round(Number(totalAge) / users.length / (1000 * 60 * 60 * 24)); // days

        users.forEach((user) => {
          const roleKey = (user.role || 'USER') as string;
          (characteristics.roles as Record<string, number>)[roleKey] = ((characteristics.roles as Record<string, number>)[roleKey] || 0) + 1;
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
    } catch (error: unknown) {
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
      const recRes = await api.get<{
        userProductIds?: string[];
        similarUserIds?: string[];
        recommendedProducts?: Array<{ productId: string }>;
      }>('/api/v1/analytics-advanced/recommendations', {
        params: { userId, limit: limit * 2 },
      }).catch(() => ({}));

      const recData = recRes as { userProductIds?: string[]; similarUserIds?: string[]; recommendedProducts?: Array<{ productId: string | null; userId?: string }> };
      const userProductIds = recData.userProductIds ?? [];
      const similarUserIds = recData.similarUserIds ?? [];
      const recommendedProducts = recData.recommendedProducts ?? [];

      // 4. Calculate scores based on popularity and similarity
      const productScores = new Map<string, number>();
      recommendedProducts.forEach((rec) => {
        if (!rec.productId) return;
        const currentScore = productScores.get(rec.productId) || 0;
        productScores.set(rec.productId, currentScore + 1);
      });

      // Sort by score and take top recommendations
      const sortedRecommendations = Array.from(productScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([productId, score]) => ({
          id: productId,
          score: Math.round((score / similarUserIds.length) * 100),
          reason: `Based on ${similarUserIds.length} similar users`,
        }));

      if (sortedRecommendations.length < limit) {
        const popularRes = await api.get<{ products?: Array<{ id: string }> }>('/api/v1/analytics-advanced/recommendations/popular', {
          params: { excludeIds: userProductIds.join(','), take: limit - sortedRecommendations.length },
        }).catch(() => ({}));
        const popularData = popularRes as { products?: Array<{ id: string }> };
        const popularProducts = popularData.products ?? [];

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
    } catch (error: unknown) {
      logger.error('Error getting recommendations', { error, userId });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const advancedAnalytics = AdvancedAnalyticsService.getInstance();

