import { Injectable, Logger } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

export interface AgentROI {
  agentId: string;
  agentName: string;
  conversations: number;
  resolvedWithoutHuman: number;
  aiCost: number;
  humanCostSaved: number;
  revenueAttributed: number;
  roi: number;
}

export interface ROIData {
  aiCost: number;
  humanCostSaved: number;
  revenueAttributed: number;
  roi: number;
  breakdownByAgent: AgentROI[];
  projectedMonthlySavings: number;
}

interface DateRange {
  from: Date;
  to: Date;
}

const AVG_HUMAN_COST_PER_CONVERSATION = 8.0;

@Injectable()
export class RoiCalculatorService {
  private readonly logger = new Logger(RoiCalculatorService.name);

  constructor(private readonly prisma: PrismaOptimizedService) {}

  async calculateROI(organizationId: string, dateRange: DateRange): Promise<ROIData> {
    this.logger.log(`Calcul ROI pour org ${organizationId}`);

    const periodMs = dateRange.to.getTime() - dateRange.from.getTime();
    const periodDays = Math.max(periodMs / (1000 * 60 * 60 * 24), 1);

    const [agentBreakdown, revenueAttributed] = await Promise.all([
      this.getAgentBreakdown(organizationId, dateRange),
      this.getRevenueAttributed(organizationId, dateRange),
    ]);

    let totalAiCost = 0;
    let totalHumanCostSaved = 0;

    for (const agent of agentBreakdown) {
      totalAiCost += agent.aiCost;
      totalHumanCostSaved += agent.humanCostSaved;
    }

    totalAiCost = round(totalAiCost);
    totalHumanCostSaved = round(totalHumanCostSaved);

    const roi = totalAiCost > 0
      ? round(((revenueAttributed + totalHumanCostSaved - totalAiCost) / totalAiCost) * 100)
      : 0;

    const dailySavings = (totalHumanCostSaved - totalAiCost + revenueAttributed) / periodDays;
    const projectedMonthlySavings = round(Math.max(dailySavings * 30, 0));

    return {
      aiCost: totalAiCost,
      humanCostSaved: totalHumanCostSaved,
      revenueAttributed: round(revenueAttributed),
      roi,
      breakdownByAgent: agentBreakdown,
      projectedMonthlySavings,
    };
  }

  private async getAgentBreakdown(
    organizationId: string,
    dateRange: DateRange,
  ): Promise<AgentROI[]> {
    const agents = await this.prisma.agent.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true },
    });

    const results: AgentROI[] = [];

    for (const agent of agents) {
      const dateFilter = {
        agentId: agent.id,
        createdAt: { gte: dateRange.from, lte: dateRange.to },
        deletedAt: null,
      };

      const [costAgg, totalConversations, resolvedByAgent] = await Promise.all([
        this.prisma.conversation.aggregate({
          where: dateFilter,
          _sum: { totalCostUsd: true },
        }),

        this.prisma.conversation.count({
          where: dateFilter,
        }),

        this.prisma.conversation.count({
          where: {
            ...dateFilter,
            status: 'RESOLVED',
            resolvedBy: 'AGENT',
          },
        }),
      ]);

      const aiCost = round(costAgg._sum.totalCostUsd ?? 0);
      const humanCostSaved = round(resolvedByAgent * AVG_HUMAN_COST_PER_CONVERSATION);

      const agentRevenue = await this.getRevenueForAgent(agent.id, dateRange);

      const agentRoi = aiCost > 0
        ? round(((agentRevenue + humanCostSaved - aiCost) / aiCost) * 100)
        : 0;

      results.push({
        agentId: agent.id,
        agentName: agent.name,
        conversations: totalConversations,
        resolvedWithoutHuman: resolvedByAgent,
        aiCost,
        humanCostSaved,
        revenueAttributed: round(agentRevenue),
        roi: agentRoi,
      });
    }

    results.sort((a, b) => b.roi - a.roi);

    return results;
  }

  private async getRevenueAttributed(
    organizationId: string,
    dateRange: DateRange,
  ): Promise<number> {
    const conversionEvents = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: 'conversion',
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      select: { properties: true },
    });

    let total = 0;
    for (const event of conversionEvents) {
      const props = event.properties as Record<string, unknown> | null;
      if (props && typeof props.value === 'number') {
        total += props.value;
      }
    }

    return total;
  }

  private async getRevenueForAgent(
    agentId: string,
    dateRange: DateRange,
  ): Promise<number> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        agentId,
        createdAt: { gte: dateRange.from, lte: dateRange.to },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (conversations.length === 0) return 0;

    const conversationIds = conversations.map((c) => c.id);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        eventType: 'conversion',
        sessionId: { in: conversationIds },
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      select: { properties: true },
    });

    let total = 0;
    for (const event of events) {
      const props = event.properties as Record<string, unknown> | null;
      if (props && typeof props.value === 'number') {
        total += props.value;
      }
    }

    return total;
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
