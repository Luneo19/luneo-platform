import { Injectable } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

export type AttributionTouchModel = 'first_touch' | 'last_touch' | 'linear';

export interface AttributionEventInput {
  organizationId: string;
  conversationId: string;
  goalType: string;
  value: number;
  model?: AttributionTouchModel;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface AttributionSummary {
  totalAttributedRevenue: number;
  attributedConversions: number;
  avgConfidence: number;
  byGoal: Array<{ goalType: string; revenue: number; conversions: number }>;
  byAgent: Array<{
    agentId: string;
    agentName: string;
    revenue: number;
    conversions: number;
  }>;
}

@Injectable()
export class AttributionV1Service {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async trackConversion(input: AttributionEventInput): Promise<{ eventId: string }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: input.conversationId },
      select: { id: true, agentId: true, organizationId: true },
    });

    if (!conversation || conversation.organizationId !== input.organizationId) {
      throw new Error('Conversation introuvable pour cette organisation');
    }

    const confidence = Math.max(0.1, Math.min(1, input.confidence ?? 0.75));
    const event = await this.prisma.analyticsEvent.create({
      data: {
        organizationId: input.organizationId,
        eventType: 'conversion',
        sessionId: input.conversationId,
        properties: {
          goalType: input.goalType,
          value: input.value,
          model: input.model ?? 'last_touch',
          confidence,
          attributedAgentId: conversation.agentId,
          ...input.metadata,
        },
      },
      select: { id: true },
    });

    return { eventId: event.id };
  }

  async getAttributionSummary(
    organizationId: string,
    dateRange: { from: Date; to: Date },
  ): Promise<AttributionSummary> {
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        organizationId,
        eventType: 'conversion',
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      select: {
        properties: true,
        sessionId: true,
      },
    });

    const byGoal = new Map<string, { revenue: number; conversions: number }>();
    const convToValue = new Map<string, { value: number; confidence: number }>();
    let totalRevenue = 0;
    let confidenceWeighted = 0;

    for (const event of events) {
      const props = (event.properties ?? {}) as Record<string, unknown>;
      const value = typeof props.value === 'number' ? props.value : 0;
      const goalType = typeof props.goalType === 'string' ? props.goalType : 'unknown';
      const confidence = typeof props.confidence === 'number' ? props.confidence : 0.75;

      totalRevenue += value;
      confidenceWeighted += confidence;
      convToValue.set(event.sessionId ?? '', { value, confidence });

      const current = byGoal.get(goalType) ?? { revenue: 0, conversions: 0 };
      current.revenue += value;
      current.conversions += 1;
      byGoal.set(goalType, current);
    }

    const conversationIds = [...convToValue.keys()].filter(Boolean);
    const conversations = conversationIds.length
      ? await this.prisma.conversation.findMany({
          where: { id: { in: conversationIds } },
          select: { id: true, agentId: true, agent: { select: { name: true } } },
        })
      : [];

    const byAgentMap = new Map<string, { agentName: string; revenue: number; conversions: number }>();
    for (const conv of conversations) {
      const val = convToValue.get(conv.id);
      if (!val) continue;
      const current = byAgentMap.get(conv.agentId) ?? {
        agentName: conv.agent.name,
        revenue: 0,
        conversions: 0,
      };
      current.revenue += val.value;
      current.conversions += 1;
      byAgentMap.set(conv.agentId, current);
    }

    return {
      totalAttributedRevenue: Math.round(totalRevenue * 100) / 100,
      attributedConversions: events.length,
      avgConfidence: events.length
        ? Math.round((confidenceWeighted / events.length) * 100) / 100
        : 0,
      byGoal: [...byGoal.entries()].map(([goalType, data]) => ({
        goalType,
        revenue: Math.round(data.revenue * 100) / 100,
        conversions: data.conversions,
      })),
      byAgent: [...byAgentMap.entries()].map(([agentId, data]) => ({
        agentId,
        agentName: data.agentName,
        revenue: Math.round(data.revenue * 100) / 100,
        conversions: data.conversions,
      })),
    };
  }
}

