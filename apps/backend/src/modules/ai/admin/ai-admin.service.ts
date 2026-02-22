// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface AIKPIs {
  totalGenerations: number;
  generationsToday: number;
  generationsThisMonth: number;
  totalCostCents: number;
  costToday: number;
  costThisMonth: number;
  avgGenerationTimeMs: number;
  errorRate: number;
  activeUsers: number;
  topProviders: Array<{ provider: string; count: number; costCents: number }>;
  generationsByType: Record<string, number>;
  revenueVsCost: { revenueCents: number; costCents: number; marginPercent: number };
}

export interface ProviderStats {
  name: string;
  status: string;
  totalGenerations: number;
  totalCostCents: number;
  avgLatencyMs: number;
  errorRate: number;
  lastUsed: Date | null;
}

@Injectable()
export class AIAdminService {
  private readonly logger = new Logger(AIAdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardKPIs(): Promise<AIKPIs> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalGenerations, generationsToday, generationsThisMonth] = await Promise.all([
      this.prisma.aIGeneration.count(),
      this.prisma.aIGeneration.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.aIGeneration.count({ where: { createdAt: { gte: monthStart } } }),
    ]);

    const costAggregations = await this.prisma.aIGeneration.aggregate({
      _sum: { costCents: true },
      _avg: { duration: true },
    });

    const costToday = await this.prisma.aIGeneration.aggregate({
      where: { createdAt: { gte: todayStart } },
      _sum: { costCents: true },
    });

    const costThisMonth = await this.prisma.aIGeneration.aggregate({
      where: { createdAt: { gte: monthStart } },
      _sum: { costCents: true },
    });

    const failedCount = await this.prisma.aIGeneration.count({
      where: { status: 'FAILED', createdAt: { gte: monthStart } },
    });

    const activeUsers = await this.prisma.aIGeneration.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: monthStart } },
    });

    // Provider breakdown
    const providerGroups = await this.prisma.aIGeneration.groupBy({
      by: ['provider'],
      _count: true,
      _sum: { costCents: true },
      orderBy: { _count: { provider: 'desc' } },
      take: 10,
    });

    // Type breakdown
    const typeGroups = await this.prisma.aIGeneration.groupBy({
      by: ['type'],
      _count: true,
    });

    const generationsByType: Record<string, number> = {};
    typeGroups.forEach((g) => {
      generationsByType[g.type] = g._count;
    });

    // Revenue estimation (credits * credit value)
    const totalCreditsUsed = await this.prisma.aIGeneration.aggregate({
      _sum: { credits: true },
    });
    const revenueCents = (totalCreditsUsed._sum.credits || 0) * 1.9; // 1.9 cents per credit (PRO tier)
    const totalCost = costAggregations._sum.costCents || 0;
    const marginPercent = totalCost > 0 ? ((revenueCents - totalCost) / totalCost) * 100 : 0;

    return {
      totalGenerations,
      generationsToday,
      generationsThisMonth,
      totalCostCents: totalCost,
      costToday: costToday._sum.costCents || 0,
      costThisMonth: costThisMonth._sum.costCents || 0,
      avgGenerationTimeMs: (costAggregations._avg.duration || 0) * 1000,
      errorRate: generationsThisMonth > 0 ? (failedCount / generationsThisMonth) * 100 : 0,
      activeUsers: activeUsers.length,
      topProviders: providerGroups.map((g) => ({
        provider: g.provider,
        count: g._count,
        costCents: g._sum.costCents || 0,
      })),
      generationsByType,
      revenueVsCost: {
        revenueCents: Math.round(revenueCents),
        costCents: totalCost,
        marginPercent: Math.round(marginPercent),
      },
    };
  }

  async getProviderStats(): Promise<ProviderStats[]> {
    const providers = ['openai', 'stability', 'replicate', 'meshy', 'runway'];
    const stats: ProviderStats[] = [];

    for (const provider of providers) {
      const [totalGen, costAgg, failedCount, lastGen] = await Promise.all([
        this.prisma.aIGeneration.count({ where: { provider } }),
        this.prisma.aIGeneration.aggregate({
          where: { provider },
          _sum: { costCents: true },
          _avg: { duration: true },
        }),
        this.prisma.aIGeneration.count({ where: { provider, status: 'FAILED' } }),
        this.prisma.aIGeneration.findFirst({
          where: { provider },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

      stats.push({
        name: provider,
        status: totalGen > 0 ? 'active' : 'inactive',
        totalGenerations: totalGen,
        totalCostCents: costAgg._sum.costCents || 0,
        avgLatencyMs: (costAgg._avg.duration || 0) * 1000,
        errorRate: totalGen > 0 ? (failedCount / totalGen) * 100 : 0,
        lastUsed: lastGen?.createdAt || null,
      });
    }

    return stats;
  }

  async getCostDetails(params: {
    period?: string;
    provider?: string;
    from?: Date;
    to?: Date;
  }) {
    const where: {
      provider?: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};
    if (params.provider) where.provider = params.provider;
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = params.from;
      if (params.to) where.createdAt.lte = params.to;
    }

    const costs = await this.prisma.aIGeneration.groupBy({
      by: ['provider', 'type'],
      where,
      _count: true,
      _sum: { costCents: true, credits: true },
      orderBy: { _sum: { costCents: 'desc' } },
    });

    return costs.map((c) => ({
      provider: c.provider,
      type: c.type,
      count: c._count,
      totalCostCents: c._sum.costCents || 0,
      totalCredits: c._sum.credits || 0,
    }));
  }

  async getUserUsage(userId: string) {
    const generations = await this.prisma.aIGeneration.groupBy({
      by: ['type', 'provider'],
      where: { userId },
      _count: true,
      _sum: { costCents: true, credits: true },
    });

    const total = await this.prisma.aIGeneration.aggregate({
      where: { userId },
      _count: true,
      _sum: { costCents: true, credits: true },
    });

    return {
      userId,
      totalGenerations: total._count || 0,
      totalCostCents: total._sum.costCents || 0,
      totalCredits: total._sum.credits || 0,
      breakdown: generations.map((g) => ({
        type: g.type,
        provider: g.provider,
        count: g._count,
        costCents: g._sum.costCents || 0,
        credits: g._sum.credits || 0,
      })),
    };
  }
}
