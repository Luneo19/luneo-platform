import { Injectable, Logger } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

export interface FunnelStage {
  name: string;
  count: number;
  conversionRate: number;
}

export interface FunnelData {
  stages: FunnelStage[];
}

export interface HeatmapCell {
  hour: number;
  dayOfWeek: number;
  count: number;
}

export interface HeatmapData {
  data: HeatmapCell[];
}

interface DateRange {
  from: Date;
  to: Date;
}

@Injectable()
export class ConversionFunnelService {
  private readonly logger = new Logger(ConversionFunnelService.name);

  constructor(private readonly prisma: PrismaOptimizedService) {}

  async getFunnel(organizationId: string, dateRange: DateRange): Promise<FunnelData> {
    this.logger.log(`Calcul conversion funnel pour org ${organizationId}`);

    const dateFilter = {
      createdAt: { gte: dateRange.from, lte: dateRange.to },
    };

    const [
      widgetLoads,
      conversationsStarted,
      engagedConversations,
      leadsCaptures,
      goalsCompleted,
    ] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: {
          organizationId,
          eventType: 'widget_load',
          ...dateFilter,
        },
      }),

      this.prisma.conversation.count({
        where: {
          organizationId,
          deletedAt: null,
          ...dateFilter,
        },
      }),

      this.prisma.conversation.count({
        where: {
          organizationId,
          deletedAt: null,
          messageCount: { gte: 3 },
          ...dateFilter,
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
          ...dateFilter,
        },
      }),

      this.prisma.analyticsEvent.count({
        where: {
          organizationId,
          eventType: 'goal_completed',
          ...dateFilter,
        },
      }),
    ]);

    const topOfFunnel = Math.max(widgetLoads, conversationsStarted, 1);

    const stages: FunnelStage[] = [
      {
        name: 'Visiteurs (widget chargé)',
        count: widgetLoads,
        conversionRate: 100,
      },
      {
        name: 'Conversations démarrées',
        count: conversationsStarted,
        conversionRate: this.rate(conversationsStarted, topOfFunnel),
      },
      {
        name: 'Engagés (3+ messages)',
        count: engagedConversations,
        conversionRate: this.rate(engagedConversations, topOfFunnel),
      },
      {
        name: 'Leads capturés',
        count: leadsCaptures,
        conversionRate: this.rate(leadsCaptures, topOfFunnel),
      },
      {
        name: 'Objectifs complétés',
        count: goalsCompleted,
        conversionRate: this.rate(goalsCompleted, topOfFunnel),
      },
    ];

    return { stages };
  }

  async trackConversion(
    organizationId: string,
    conversationId: string,
    goalType: string,
    value?: number,
  ): Promise<void> {
    this.logger.log(
      `Tracking conversion: org=${organizationId} conv=${conversationId} goal=${goalType}`,
    );

    await this.prisma.analyticsEvent.create({
      data: {
        eventType: 'goal_completed',
        organizationId,
        sessionId: conversationId,
        properties: {
          goalType,
          conversationId,
          ...(value !== undefined && { value }),
        },
      },
    });

    if (value !== undefined && value > 0) {
      await this.prisma.analyticsEvent.create({
        data: {
          eventType: 'conversion',
          organizationId,
          sessionId: conversationId,
          properties: {
            goalType,
            conversationId,
            value,
          },
        },
      });
    }
  }

  async getHeatmap(organizationId: string, dateRange: DateRange): Promise<HeatmapData> {
    this.logger.log(`Calcul heatmap d'engagement pour org ${organizationId}`);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        organizationId,
        deletedAt: null,
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      select: { createdAt: true },
    });

    const grid = new Map<string, number>();

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        grid.set(`${day}-${hour}`, 0);
      }
    }

    for (const conv of conversations) {
      const date = new Date(conv.createdAt);
      const dayOfWeek = date.getUTCDay();
      const hour = date.getUTCHours();
      const key = `${dayOfWeek}-${hour}`;
      grid.set(key, (grid.get(key) ?? 0) + 1);
    }

    const data: HeatmapCell[] = [];
    for (const [key, count] of grid.entries()) {
      const [dayStr, hourStr] = key.split('-');
      data.push({
        dayOfWeek: parseInt(dayStr, 10),
        hour: parseInt(hourStr, 10),
        count,
      });
    }

    data.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.hour - b.hour);

    return { data };
  }

  private rate(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 1000) / 10;
  }
}
