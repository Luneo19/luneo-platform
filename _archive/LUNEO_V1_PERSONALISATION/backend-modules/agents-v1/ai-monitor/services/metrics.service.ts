/**
 * @fileoverview Service de métriques de performance IA
 * @module MetricsService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites (zéro 'any')
 * - ✅ Métriques agrégées
 * - ✅ Stats de latence (p50, p95, p99)
 * - ✅ Taux d'erreur par provider
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  errorRate: number;
  totalTokens: number;
  totalCostCents: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  byProvider: Record<string, {
    calls: number;
    errors: number;
    tokens: number;
    costCents: number;
    avgLatencyMs: number;
  }>;
  byAgent: Record<string, {
    calls: number;
    errors: number;
    tokens: number;
    costCents: number;
  }>;
}

export interface LatencyStats {
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Récupère les métriques agrégées
   */
  async getMetrics(
    brandId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PerformanceMetrics> {
    const where: Record<string, unknown> = {};

    if (brandId) {
      where.brandId = brandId;
    }

    if (startDate || endDate) {
      where.createdAt = {
        gte: startDate || undefined,
        lte: endDate || undefined,
      } as {
        gte?: Date;
        lte?: Date;
      };
    } else {
      // Par défaut, 30 derniers jours
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 30);
      where.createdAt = { gte: defaultStart } as { gte: Date };
    }

    // Récupérer les logs
    const logs = await this.prisma.aIUsageLog.findMany({
      where,
      select: {
        provider: true,
        agentId: true,
        totalTokens: true,
        costCents: true,
        latencyMs: true,
        success: true,
      },
    });

    // Calculer les métriques
    const totalCalls = logs.length;
    const successfulCalls = logs.filter(l => l.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const errorRate = totalCalls > 0 ? failedCalls / totalCalls : 0;

    const totalTokens = logs.reduce((sum, l) => sum + l.totalTokens, 0);
    const totalCostCents = logs.reduce((sum, l) => sum + Number(l.costCents), 0);

    const latencies = logs.map(l => l.latencyMs || 0).filter(l => l > 0);
    const latencyStats = this.calculateLatencyStats(latencies);

    // Breakdown par provider
    const byProvider: Record<string, {
      calls: number;
      errors: number;
      tokens: number;
      costCents: number;
      avgLatencyMs: number;
    }> = {};

    for (const log of logs) {
      const providerKey = log.provider ?? 'unknown';
      if (!byProvider[providerKey]) {
        byProvider[providerKey] = {
          calls: 0,
          errors: 0,
          tokens: 0,
          costCents: 0,
          avgLatencyMs: 0,
        };
      }

      byProvider[providerKey].calls++;
      if (!log.success) {
        byProvider[providerKey].errors++;
      }
      byProvider[providerKey].tokens += log.totalTokens;
      byProvider[providerKey].costCents += Number(log.costCents);
    }

    // Calculer avgLatency par provider
    for (const provider of Object.keys(byProvider)) {
      const providerLogs = logs.filter(l => (l.provider ?? 'unknown') === provider && l.latencyMs);
      if (providerLogs.length > 0) {
        byProvider[provider].avgLatencyMs = Math.round(
          providerLogs.reduce((sum, l) => sum + (l.latencyMs || 0), 0) / providerLogs.length
        );
      }
    }

    // Breakdown par agent
    const byAgent: Record<string, {
      calls: number;
      errors: number;
      tokens: number;
      costCents: number;
    }> = {};

    for (const log of logs) {
      const agentId = log.agentId || 'unknown';
      if (!byAgent[agentId]) {
        byAgent[agentId] = {
          calls: 0,
          errors: 0,
          tokens: 0,
          costCents: 0,
        };
      }

      byAgent[agentId].calls++;
      if (!log.success) {
        byAgent[agentId].errors++;
      }
      byAgent[agentId].tokens += log.totalTokens;
      byAgent[agentId].costCents += Number(log.costCents);
    }

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      errorRate,
      totalTokens,
      totalCostCents,
      avgLatencyMs: latencyStats.avg,
      p50LatencyMs: latencyStats.p50,
      p95LatencyMs: latencyStats.p95,
      p99LatencyMs: latencyStats.p99,
      byProvider,
      byAgent,
    };
  }

  /**
   * Récupère les stats de latence
   */
  async getLatencyStats(
    brandId?: string,
    provider?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<LatencyStats> {
    const where: Record<string, unknown> = {
      success: true,
      latencyMs: { not: null },
    };

    if (brandId) {
      where.brandId = brandId;
    }

    if (provider) {
      where.provider = provider;
    }

    if (startDate || endDate) {
      where.createdAt = {
        gte: startDate || undefined,
        lte: endDate || undefined,
      } as {
        gte?: Date;
        lte?: Date;
      };
    } else {
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 7);
      where.createdAt = { gte: defaultStart } as {
        gte?: Date;
      };
    }

    const logs = await this.prisma.aIUsageLog.findMany({
      where,
      select: { latencyMs: true },
    });

    const latencies = logs.map(l => l.latencyMs || 0).filter(l => l > 0);

    return this.calculateLatencyStats(latencies);
  }

  /**
   * Récupère le taux d'erreur par provider
   */
  async getErrorRate(
    brandId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Record<string, number>> {
    const where: Record<string, unknown> = {};

    if (brandId) {
      where.brandId = brandId;
    }

    if (startDate || endDate) {
      where.createdAt = {
        gte: startDate || undefined,
        lte: endDate || undefined,
      } as {
        gte?: Date;
        lte?: Date;
      };
    } else {
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 7);
      where.createdAt = { gte: defaultStart } as {
        gte?: Date;
      };
    }

    const logs = await this.prisma.aIUsageLog.findMany({
      where,
      select: {
        provider: true,
        success: true,
      },
    });

    const byProvider: Record<string, { total: number; errors: number }> = {};

    for (const log of logs) {
      const providerKey = log.provider ?? 'unknown';
      if (!byProvider[providerKey]) {
        byProvider[providerKey] = { total: 0, errors: 0 };
      }

      byProvider[providerKey].total++;
      if (!log.success) {
        byProvider[providerKey].errors++;
      }
    }

    const errorRates: Record<string, number> = {};

    for (const [provider, stats] of Object.entries(byProvider)) {
      errorRates[provider] = stats.total > 0 ? stats.errors / stats.total : 0;
    }

    return errorRates;
  }

  /**
   * Récupère les stats de coûts
   */
  async getCostStats(
    brandId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalCents: number;
    byProvider: Record<string, number>;
    byAgent: Record<string, number>;
    daily: Array<{ date: string; costCents: number }>;
  }> {
    const where: Record<string, unknown> = {};

    if (brandId) {
      where.brandId = brandId;
    }

    if (startDate || endDate) {
      where.createdAt = {
        gte: startDate || undefined,
        lte: endDate || undefined,
      } as {
        gte?: Date;
        lte?: Date;
      };
    } else {
      const defaultStart = new Date();
      defaultStart.setDate(defaultStart.getDate() - 30);
      where.createdAt = { gte: defaultStart } as {
        gte?: Date;
      };
    }

    const logs = await this.prisma.aIUsageLog.findMany({
      where,
      select: {
        provider: true,
        agentId: true,
        costCents: true,
        createdAt: true,
      },
    });

    const totalCents = logs.reduce((sum, l) => sum + Number(l.costCents), 0);

    const byProvider: Record<string, number> = {};
    const byAgent: Record<string, number> = {};
    const daily: Record<string, number> = {};

    for (const log of logs) {
      // Par provider
      const providerKey = log.provider ?? 'unknown';
      byProvider[providerKey] = (byProvider[providerKey] || 0) + Number(log.costCents);

      // Par agent
      const agentId = log.agentId ?? 'unknown';
      byAgent[agentId] = (byAgent[agentId] || 0) + Number(log.costCents);

      // Par jour
      const date = log.createdAt.toISOString().split('T')[0];
      daily[date] = (daily[date] || 0) + Number(log.costCents);
    }

    return {
      totalCents,
      byProvider,
      byAgent,
      daily: Object.entries(daily)
        .map(([date, costCents]) => ({ date, costCents }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Calcule les statistiques de latence (percentiles)
   */
  private calculateLatencyStats(latencies: number[]): LatencyStats {
    if (latencies.length === 0) {
      return {
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      };
    }

    const sorted = [...latencies].sort((a, b) => a - b);

    const avg = sorted.reduce((sum, l) => sum + l, 0) / sorted.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      avg: Math.round(avg),
      min,
      max,
      p50,
      p95,
      p99,
    };
  }
}
