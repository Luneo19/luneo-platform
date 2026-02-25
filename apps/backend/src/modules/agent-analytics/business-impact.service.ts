import { Injectable, Logger } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

export interface BusinessImpactResult {
  totalConversations: number;
  resolvedWithoutHuman: number;
  resolutionRate: number;
  leadsCaptured: number;
  estimatedRevenue: number;
  avgResponseTime: number;
  avgSatisfaction: number;
  costSavings: number;
  topAgents: TopAgentItem[];
  conversationTrend: ConversationTrendPoint[];
}

export interface TopAgentItem {
  agentId: string;
  agentName: string;
  conversations: number;
  resolutionRate: number;
  satisfaction: number;
}

export interface ConversationTrendPoint {
  date: string;
  count: number;
}

export interface ConversionFunnelResult {
  visitors: number;
  engaged: number;
  qualified: number;
  converted: number;
}

const AVG_HUMAN_AGENT_COST_PER_CONVERSATION = 8.0;

@Injectable()
export class BusinessImpactService {
  private readonly logger = new Logger(BusinessImpactService.name);

  constructor(private readonly prisma: PrismaOptimizedService) {}

  async getBusinessImpact(
    organizationId: string,
    dateRange: { from: Date; to: Date },
  ): Promise<BusinessImpactResult> {
    this.logger.log(
      `Calcul business impact pour org ${organizationId}`,
    );

    const dateFilter = {
      organizationId,
      createdAt: { gte: dateRange.from, lte: dateRange.to },
      deletedAt: null,
    };

    const [
      conversationAgg,
      resolvedWithoutHuman,
      leadsCaptured,
      conversionRevenue,
      topAgents,
      dailyAnalytics,
    ] = await Promise.all([
      this.prisma.conversation.aggregate({
        where: dateFilter,
        _count: { id: true },
        _avg: {
          avgResponseMs: true,
          satisfactionRating: true,
          totalCostUsd: true,
        },
        _sum: { totalCostUsd: true },
      }),

      this.prisma.conversation.count({
        where: {
          ...dateFilter,
          status: 'RESOLVED',
          resolvedBy: 'AGENT',
        },
      }),

      this.prisma.conversation.count({
        where: {
          ...dateFilter,
          OR: [
            { visitorEmail: { not: null } },
            { visitorPhone: { not: null } },
          ],
        },
      }),

      this.getEstimatedRevenue(organizationId, dateRange),

      this.getTopAgents(organizationId, dateRange),

      this.prisma.agentDailyAnalytics.findMany({
        where: {
          agent: { organizationId },
          date: { gte: dateRange.from, lte: dateRange.to },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    const totalConversations = conversationAgg._count.id;
    const resolutionRate =
      totalConversations > 0
        ? Math.round((resolvedWithoutHuman / totalConversations) * 1000) / 10
        : 0;

    const costSavings =
      resolvedWithoutHuman * AVG_HUMAN_AGENT_COST_PER_CONVERSATION -
      (conversationAgg._sum.totalCostUsd ?? 0);

    const trendMap = new Map<string, number>();
    for (const row of dailyAnalytics) {
      const dateKey =
        row.date instanceof Date
          ? row.date.toISOString().split('T')[0]
          : String(row.date).split('T')[0];
      trendMap.set(dateKey, (trendMap.get(dateKey) ?? 0) + row.conversations);
    }

    const conversationTrend: ConversationTrendPoint[] = Array.from(
      trendMap.entries(),
    ).map(([date, count]) => ({ date, count }));

    return {
      totalConversations,
      resolvedWithoutHuman,
      resolutionRate,
      leadsCaptured,
      estimatedRevenue: conversionRevenue,
      avgResponseTime: conversationAgg._avg.avgResponseMs ?? 0,
      avgSatisfaction:
        Math.round((conversationAgg._avg.satisfactionRating ?? 0) * 100) / 100,
      costSavings: Math.round(Math.max(costSavings, 0) * 100) / 100,
      topAgents,
      conversationTrend,
    };
  }

  async getConversionFunnel(
    organizationId: string,
  ): Promise<ConversionFunnelResult> {
    this.logger.log(
      `Calcul conversion funnel pour org ${organizationId}`,
    );

    const [visitors, engaged, qualified, converted] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: {
          organizationId,
          eventType: 'widget_load',
        },
      }),

      this.prisma.conversation.count({
        where: {
          organizationId,
          messageCount: { gte: 1 },
          deletedAt: null,
        },
      }),

      this.prisma.conversation.count({
        where: {
          organizationId,
          deletedAt: null,
          OR: [
            { visitorEmail: { not: null } },
            { visitorPhone: { not: null } },
          ],
        },
      }),

      this.prisma.analyticsEvent.count({
        where: {
          organizationId,
          eventType: 'goal_completed',
        },
      }),
    ]);

    return { visitors, engaged, qualified, converted };
  }

  private async getEstimatedRevenue(
    organizationId: string,
    dateRange: { from: Date; to: Date },
  ): Promise<number> {
    const conversionEvents = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: 'conversion',
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      select: { properties: true },
    });

    let totalRevenue = 0;
    for (const event of conversionEvents) {
      const props = event.properties as Record<string, unknown> | null;
      if (props && typeof props.value === 'number') {
        totalRevenue += props.value;
      }
    }

    return Math.round(totalRevenue * 100) / 100;
  }

  private async getTopAgents(
    organizationId: string,
    dateRange: { from: Date; to: Date },
    limit = 5,
  ): Promise<TopAgentItem[]> {
    const agents = await this.prisma.agent.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        totalConversations: true,
        avgSatisfaction: true,
        resolutionRate: true,
        analytics: {
          where: {
            date: { gte: dateRange.from, lte: dateRange.to },
          },
          select: { conversations: true },
        },
      },
      orderBy: { totalConversations: 'desc' },
      take: limit,
    });

    return agents.map((agent) => {
      const periodConversations = agent.analytics.reduce(
        (sum, a) => sum + a.conversations,
        0,
      );

      return {
        agentId: agent.id,
        agentName: agent.name,
        conversations: periodConversations || agent.totalConversations,
        resolutionRate:
          Math.round((agent.resolutionRate ?? 0) * 1000) / 10,
        satisfaction: agent.avgSatisfaction ?? 0,
      };
    });
  }
}
