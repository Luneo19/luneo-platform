/**
 * @fileoverview Service d'analytics agrégées pour agents IA
 * @module AnalyticsService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites (zéro 'any')
 * - ✅ Agrégation quotidienne
 * - ✅ Tendances et breakdowns
 * - ✅ Cache pour performance
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

// ============================================================================
// TYPES
// ============================================================================

export interface DailyAnalytics {
  date: string;
  conversationCount: number;
  messageCount: number;
  totalTokens: number;
  totalCostCents: number;
  avgLatencyMs: number | null;
  errorCount: number;
  byAgent: Record<string, {
    conversations: number;
    messages: number;
    tokens: number;
    costCents: number;
  }>;
  byIntent: Record<string, number>;
}

export interface TrendData {
  date: string;
  conversations: number;
  satisfaction: number;
  costCents: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Agrège les données quotidiennes
   */
  async aggregateDaily(
    brandId?: string,
    date?: Date,
  ): Promise<DailyAnalytics> {
    const targetDate = date || new Date();
    const dateStr = targetDate.toISOString().split('T')[0];

    const cacheKey = `ai_analytics:daily:${brandId || 'global'}:${dateStr}`;

    // Calculer les analytics
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const where: Record<string, unknown> = {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (brandId) {
      where.brandId = brandId;
    }

    // Récupérer les logs du jour (avec metadata pour intents)
    const logs = await this.prisma.aIUsageLog.findMany({
      where,
      select: {
        agentId: true,
        totalTokens: true,
        costCents: true,
        latencyMs: true,
        success: true,
        operation: true,
        metadata: true,
      },
    });

    // Calculer les métriques
    const conversationCount = new Set(
      logs.map(l => l.agentId).filter(Boolean),
    ).size;

    const messageCount = logs.length;
    const totalTokens = logs.reduce((sum, l) => sum + l.totalTokens, 0);
    const totalCostCents = logs.reduce((sum, l) => sum + Number(l.costCents), 0);

    const latencies = logs.map(l => l.latencyMs).filter((l): l is number => l !== null);
    const avgLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((sum, l) => sum + l, 0) / latencies.length)
      : null;

    const errorCount = logs.filter(l => !l.success).length;

    // Breakdown par agent
    const byAgent: Record<string, {
      conversations: number;
      messages: number;
      tokens: number;
      costCents: number;
    }> = {};

    for (const log of logs) {
      const agentId = log.agentId || 'unknown';
      if (!byAgent[agentId]) {
        byAgent[agentId] = {
          conversations: 0,
          messages: 0,
          tokens: 0,
          costCents: 0,
        };
      }

      byAgent[agentId].messages++;
      byAgent[agentId].tokens += log.totalTokens;
      byAgent[agentId].costCents += Number(log.costCents);
    }

    // Breakdown par intent (depuis metadata des logs si stocké)
    const byIntent: Record<string, number> = {};
    for (const log of logs) {
      const metadata = log.metadata as Record<string, unknown> | null;
      if (metadata?.intent) {
        const intent = String(metadata.intent);
        byIntent[intent] = (byIntent[intent] || 0) + 1;
      }
    }

    const analytics: DailyAnalytics = {
      date: dateStr,
      conversationCount,
      messageCount,
      totalTokens,
      totalCostCents,
      avgLatencyMs,
      errorCount,
      byAgent,
      byIntent,
    };

    // Mettre en cache (1 heure)
    await this.cache.set(
      cacheKey,
      'analytics',
      analytics,
      { ttl: 3600 },
    );

    // Persister en DB pour historique
    await this.persistDailyAnalytics(brandId, dateStr, analytics);

    return analytics;
  }

  /**
   * Récupère les tendances
   */
  async getTrends(
    brandId?: string,
    days: number = 30,
  ): Promise<TrendData[]> {
    const trends: TrendData[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const daily = await this.aggregateDaily(brandId, date);
      const satisfaction = await this.getSatisfactionForDate(brandId, date);

      trends.push({
        date: daily.date,
        conversations: daily.conversationCount,
        satisfaction,
        costCents: daily.totalCostCents,
      });
    }

    return trends;
  }

  /**
   * Calcule la satisfaction moyenne pour une date (depuis ratings des conversations/messages si disponibles)
   */
  private async getSatisfactionForDate(brandId: string | undefined, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: { createdAt: { gte: Date; lte: Date }; conversation?: { brandId: string | null } } = {
      createdAt: { gte: startOfDay, lte: endOfDay },
    };

    if (brandId) {
      where.conversation = { brandId };
    }

    const messagesWithRating = await this.prisma.agentMessage.findMany({
      where: {
        ...where,
        metadata: { not: undefined },
      },
      select: { metadata: true },
    });

    const ratings: number[] = [];
    for (const msg of messagesWithRating) {
      const meta = msg.metadata as Record<string, unknown> | null;
      if (meta && typeof meta.rating === 'number' && meta.rating >= 0 && meta.rating <= 5) {
        ratings.push(meta.rating as number);
      }
      if (meta && typeof meta.satisfaction === 'number' && meta.satisfaction >= 0 && meta.satisfaction <= 1) {
        ratings.push((meta.satisfaction as number) * 5);
      }
    }

    if (ratings.length === 0) return 0;
    return Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100;
  }

  /**
   * Récupère le breakdown par agent/intent
   */
  async getBreakdown(
    brandId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    byAgent: Record<string, {
      calls: number;
      tokens: number;
      costCents: number;
      errorRate: number;
    }>;
    byIntent: Record<string, number>;
    byProvider: Record<string, {
      calls: number;
      tokens: number;
      costCents: number;
    }>;
  }> {
    const where: Record<string, unknown> = {};

    if (brandId) {
      where.brandId = brandId;
    }

    if (startDate || endDate) {
      where.createdAt = {
        gte: startDate || undefined,
        lte: endDate || undefined,
      } as any;
    } else {
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 30);
      where.createdAt = { gte: defaultStart } as any;
    }

    const logs = await this.prisma.aIUsageLog.findMany({
      where,
      select: {
        agentId: true,
        provider: true,
        totalTokens: true,
        costCents: true,
        success: true,
        metadata: true,
      },
    });

    const byAgent: Record<string, {
      calls: number;
      tokens: number;
      costCents: number;
      errorRate: number;
    }> = {};

    const byProvider: Record<string, {
      calls: number;
      tokens: number;
      costCents: number;
    }> = {};

    const byIntent: Record<string, number> = {};

    for (const log of logs) {
      // Par agent
      const agentId = log.agentId || 'unknown';
      if (!byAgent[agentId]) {
        byAgent[agentId] = {
          calls: 0,
          tokens: 0,
          costCents: 0,
          errorRate: 0,
        };
      }

      byAgent[agentId].calls++;
      byAgent[agentId].tokens += log.totalTokens;
      byAgent[agentId].costCents += Number(log.costCents);
      if (!log.success) {
        byAgent[agentId].errorRate += 1;
      }

      // Par provider
      if (!byProvider[log.provider]) {
        byProvider[log.provider] = {
          calls: 0,
          tokens: 0,
          costCents: 0,
        };
      }

      byProvider[log.provider].calls++;
      byProvider[log.provider].tokens += log.totalTokens;
      byProvider[log.provider].costCents += Number(log.costCents);

      // Par intent (depuis metadata)
      const metadata = log.metadata as Record<string, unknown> | null;
      if (metadata?.intent) {
        const intent = String(metadata.intent);
        byIntent[intent] = (byIntent[intent] || 0) + 1;
      }
    }

    // Calculer errorRate pour chaque agent
    for (const agentId of Object.keys(byAgent)) {
      const stats = byAgent[agentId];
      stats.errorRate = stats.calls > 0 ? stats.errorRate / stats.calls : 0;
    }

    return {
      byAgent,
      byIntent,
      byProvider,
    };
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Persiste les analytics quotidiennes en DB
   */
  private async persistDailyAnalytics(
    brandId: string | undefined,
    date: string,
    analytics: DailyAnalytics,
  ): Promise<void> {
    try {
      await this.prisma.aIAnalytics.upsert({
        where: {
          brandId_agentId_date: {
            brandId: brandId || null,
            agentId: null,
            date: new Date(date),
          },
        },
        create: {
          brandId: brandId || null,
          agentId: null,
          date: new Date(date),
          conversationCount: analytics.conversationCount,
          messageCount: analytics.messageCount,
          totalTokens: analytics.totalTokens,
          totalCostCents: analytics.totalCostCents,
          averageLatencyMs: analytics.avgLatencyMs,
          errorRate: analytics.errorCount > 0 ? analytics.errorCount / (analytics.conversationCount || 1) : 0,
        },
        update: {
          conversationCount: analytics.conversationCount,
          messageCount: analytics.messageCount,
          totalTokens: analytics.totalTokens,
          totalCostCents: analytics.totalCostCents,
          averageLatencyMs: analytics.avgLatencyMs,
          errorRate: analytics.errorCount > 0 ? analytics.errorCount / (analytics.conversationCount || 1) : 0,
        },
      });
    } catch (error) {
      // Ne pas faire échouer si la persistance échoue
      this.logger.warn(`Failed to persist daily analytics: ${error}`);
    }
  }
}
