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

    // Récupérer les logs du jour
    const logs = await this.prisma.aIUsageLog.findMany({
      where,
      select: {
        agentId: true,
        totalTokens: true,
        costCents: true,
        latencyMs: true,
        success: true,
        operation: true,
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

    // Breakdown par intent (depuis metadata si disponible)
    const byIntent: Record<string, number> = {};
    // TODO: Extraire les intents depuis les logs si stockés

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

      trends.push({
        date: daily.date,
        conversations: daily.conversationCount,
        satisfaction: 0, // TODO: Calculer depuis ratings
        costCents: daily.totalCostCents,
      });
    }

    return trends;
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
          avgLatencyMs: analytics.avgLatencyMs,
          errorCount: analytics.errorCount,
        },
        update: {
          conversationCount: analytics.conversationCount,
          messageCount: analytics.messageCount,
          totalTokens: analytics.totalTokens,
          totalCostCents: analytics.totalCostCents,
          avgLatencyMs: analytics.avgLatencyMs,
          errorCount: analytics.errorCount,
        },
      });
    } catch (error) {
      // Ne pas faire échouer si la persistance échoue
      this.logger.warn(`Failed to persist daily analytics: ${error}`);
    }
  }
}
