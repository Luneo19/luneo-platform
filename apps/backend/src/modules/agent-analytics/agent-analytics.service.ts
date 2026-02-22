import { Injectable, Logger } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

export interface DateRangeQuery {
  startDate: Date;
  endDate: Date;
}

export interface DailyAnalytics {
  date: string;
  totalConversations: number;
  totalMessages: number;
  avgResponseTimeMs: number;
  satisfactionScore: number;
}

export interface AgentAnalyticsSummary {
  totalConversations: number;
  totalMessages: number;
  avgResponseTimeMs: number;
  avgSatisfactionScore: number;
  topTopics: { topic: string; count: number }[];
  resolutionRate: number;
}

export interface OverviewResult {
  totalConversations: number;
  totalMessages: number;
  avgSatisfaction: number;
  resolutionRate: number;
  avgResponseTimeMs: number;
  totalCostUsd: number;
  estimatedHoursSaved: number;
  activeAgents: number;
}

export interface TimeseriesPoint {
  date: string;
  value: number;
}

export interface AgentComparisonItem {
  agentId: string;
  agentName: string;
  conversations: number;
  satisfaction: number;
  resolutionRate: number;
  costUsd: number;
}

export interface TopTopicItem {
  topic: string;
  count: number;
  sentiment: string;
}

@Injectable()
export class AgentAnalyticsService {
  private readonly logger = new Logger(AgentAnalyticsService.name);

  constructor(private readonly prisma: PrismaOptimizedService) {}

  /**
   * Vue d'ensemble des analytics au niveau organisation
   */
  async getOverview(
    organizationId: string,
    dateRange: { from: Date; to: Date },
  ): Promise<OverviewResult> {
    this.logger.log(`Récupération overview analytics pour org ${organizationId}`);

    const [conversations, resolved, activeAgents] = await Promise.all([
      this.prisma.conversation.aggregate({
        where: {
          organizationId,
          createdAt: { gte: dateRange.from, lte: dateRange.to },
          deletedAt: null,
        },
        _count: { id: true },
        _avg: { satisfactionRating: true, avgResponseMs: true },
        _sum: { totalCostUsd: true, messageCount: true },
      }),
      this.prisma.conversation.count({
        where: {
          organizationId,
          createdAt: { gte: dateRange.from, lte: dateRange.to },
          status: 'RESOLVED',
          resolvedBy: 'AGENT',
          deletedAt: null,
        },
      }),
      this.prisma.agent.count({
        where: { organizationId, status: 'ACTIVE', deletedAt: null },
      }),
    ]);

    const totalConv = conversations._count.id;
    const resolutionRate =
      totalConv > 0 ? (resolved / totalConv) * 100 : 0;
    const estimatedHoursSaved = totalConv * 0.15; // ~9 min par conversation économisée

    return {
      totalConversations: totalConv,
      totalMessages: conversations._sum.messageCount ?? 0,
      avgSatisfaction: conversations._avg.satisfactionRating ?? 0,
      resolutionRate: Math.round(resolutionRate * 10) / 10,
      avgResponseTimeMs: conversations._avg.avgResponseMs ?? 0,
      totalCostUsd: conversations._sum.totalCostUsd ?? 0,
      estimatedHoursSaved: Math.round(estimatedHoursSaved * 10) / 10,
      activeAgents,
    };
  }

  /**
   * Série temporelle pour un métrique donné
   */
  async getTimeseries(
    organizationId: string,
    metric: string,
    dateRange: { from: Date; to: Date },
    granularity: 'day' | 'week' | 'month',
  ): Promise<TimeseriesPoint[]> {
    this.logger.log(
      `Récupération timeseries ${metric} pour org ${organizationId}`,
    );

    const analytics = await this.prisma.agentDailyAnalytics.findMany({
      where: {
        agent: { organizationId },
        date: { gte: dateRange.from, lte: dateRange.to },
      },
      orderBy: { date: 'asc' },
    });

    const grouped = new Map<
      string,
      { sum: number; weight: number; lastSatisfaction?: number }
    >();

    for (const row of analytics) {
      const dateKey = row.date instanceof Date
        ? row.date.toISOString().split('T')[0]
        : String(row.date).split('T')[0];
      const current = grouped.get(dateKey) || {
        sum: 0,
        weight: 0,
        lastSatisfaction: undefined,
      };

      switch (metric) {
        case 'conversations':
          grouped.set(dateKey, {
            ...current,
            sum: current.sum + row.conversations,
          });
          break;
        case 'messages':
          grouped.set(dateKey, {
            ...current,
            sum: current.sum + row.messages,
          });
          break;
        case 'satisfaction': {
          const sat = row.avgSatisfaction ?? 0;
          const weight = row.conversations || 1;
          grouped.set(dateKey, {
            sum: current.sum + sat * weight,
            weight: current.weight + weight,
          });
          break;
        }
        case 'cost':
          grouped.set(dateKey, {
            ...current,
            sum: current.sum + (row.totalCostUsd ?? 0),
          });
          break;
        case 'escalated':
          grouped.set(dateKey, {
            ...current,
            sum: current.sum + row.escalated,
          });
          break;
        default:
          grouped.set(dateKey, {
            ...current,
            sum: current.sum + row.conversations,
          });
      }
    }

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      value:
        metric === 'satisfaction' && data.weight > 0
          ? Math.round((data.sum / data.weight) * 100) / 100
          : Math.round(data.sum * 100) / 100,
    }));
  }

  /**
   * Comparaison des agents de l'organisation
   */
  async getAgentComparison(
    organizationId: string,
    dateRange: { from: Date; to: Date },
  ): Promise<AgentComparisonItem[]> {
    this.logger.log(
      `Récupération comparaison agents pour org ${organizationId}`,
    );

    const agents = await this.prisma.agent.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        totalConversations: true,
        avgSatisfaction: true,
        resolutionRate: true,
        currentMonthSpend: true,
      },
    });

    return agents.map((a) => ({
      agentId: a.id,
      agentName: a.name,
      conversations: a.totalConversations ?? 0,
      satisfaction: a.avgSatisfaction ?? 0,
      resolutionRate: ((a.resolutionRate ?? 0) * 100),
      costUsd: a.currentMonthSpend ?? 0,
    }));
  }

  /**
   * Top topics par fréquence
   */
  async getTopTopics(
    organizationId: string,
    dateRange: { from: Date; to: Date },
    limit = 10,
  ): Promise<TopTopicItem[]> {
    this.logger.log(`Récupération top topics pour org ${organizationId}`);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        organizationId,
        createdAt: { gte: dateRange.from, lte: dateRange.to },
        deletedAt: null,
      },
      select: { topics: true, sentiment: true },
    });

    const topicMap = new Map<
      string,
      { count: number; sentiments: string[] }
    >();

    for (const conv of conversations) {
      const topics = conv.topics ?? [];
      for (const topic of topics) {
        const existing = topicMap.get(topic) || {
          count: 0,
          sentiments: [] as string[],
        };
        existing.count++;
        if (conv.sentiment) {
          existing.sentiments.push(conv.sentiment);
        }
        topicMap.set(topic, existing);
      }
    }

    return Array.from(topicMap.entries())
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        sentiment: this.dominantSentiment(data.sentiments),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private dominantSentiment(sentiments: string[]): string {
    if (sentiments.length === 0) return 'neutral';
    const counts = sentiments.reduce(
      (acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? 'neutral';
  }

  // --- Méthodes existantes (agent-level) conservées pour compatibilité ---

  async getDailyAnalytics(
    agentId: string,
    range: DateRangeQuery,
  ): Promise<DailyAnalytics[]> {
    this.logger.log(
      `Récupération analytics journalières pour agent ${agentId}`,
    );

    const conversations = await this.prisma.conversation.findMany({
      where: {
        agentId,
        createdAt: { gte: range.startDate, lte: range.endDate },
      },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, DailyAnalytics>();

    for (const conv of conversations) {
      const dateKey = conv.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || {
        date: dateKey,
        totalConversations: 0,
        totalMessages: 0,
        avgResponseTimeMs: 0,
        satisfactionScore: 0,
      };

      existing.totalConversations += 1;
      existing.totalMessages += conv._count.messages;
      dailyMap.set(dateKey, existing);
    }

    return Array.from(dailyMap.values());
  }

  async getSummary(
    agentId: string,
    range: DateRangeQuery,
  ): Promise<AgentAnalyticsSummary> {
    this.logger.log(`Récupération résumé analytics pour agent ${agentId}`);

    const [conversationCount, messageCount] = await Promise.all([
      this.prisma.conversation.count({
        where: {
          agentId,
          createdAt: { gte: range.startDate, lte: range.endDate },
        },
      }),
      this.prisma.message.count({
        where: {
          conversation: {
            agentId,
            createdAt: { gte: range.startDate, lte: range.endDate },
          },
        },
      }),
    ]);

    const topTopics = await this.getTopTopicsForAgent(agentId, range);
    const satisfactionTrend = await this.getSatisfactionTrend(agentId, range);

    return {
      totalConversations: conversationCount,
      totalMessages: messageCount,
      avgResponseTimeMs: 0,
      avgSatisfactionScore: satisfactionTrend,
      topTopics,
      resolutionRate: 0,
    };
  }

  private async getTopTopicsForAgent(
    agentId: string,
    range: DateRangeQuery,
  ): Promise<{ topic: string; count: number }[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        agentId,
        createdAt: { gte: range.startDate, lte: range.endDate },
      },
      select: { topics: true },
    });

    const topicMap = new Map<string, number>();
    for (const conv of conversations) {
      for (const topic of conv.topics ?? []) {
        topicMap.set(topic, (topicMap.get(topic) ?? 0) + 1);
      }
    }

    return Array.from(topicMap.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  async getSatisfactionTrend(
    agentId: string,
    range: DateRangeQuery,
  ): Promise<number> {
    const agg = await this.prisma.conversation.aggregate({
      where: {
        agentId,
        createdAt: { gte: range.startDate, lte: range.endDate },
        satisfactionRating: { not: null },
      },
      _avg: { satisfactionRating: true },
    });
    return agg._avg.satisfactionRating ?? 0;
  }
}
