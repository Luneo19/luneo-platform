/**
 * Configurator 3D - Analytics Aggregation Worker
 * BullMQ worker for daily aggregation of 3D configurator analytics
 */

import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  Configurator3DSessionStatus,
  ConversionType,
  InteractionType,
} from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface AggregateDailyJobData {
  configurationId?: string;
  date: string;
}

@Processor('configurator-3d-analytics')
export class AnalyticsAggregationWorker {
  private readonly logger = new Logger(AnalyticsAggregationWorker.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('aggregate-daily')
  async handleAggregateDaily(job: Job<AggregateDailyJobData>): Promise<void> {
    const dateStr = job.data.date ?? this.getYesterdayDate();
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    this.logger.log(
      `Running daily analytics aggregation for ${dateStr}${job.data.configurationId ? ` (config: ${job.data.configurationId})` : ''}`,
    );

    try {
      const configurationIds = job.data.configurationId
        ? [job.data.configurationId]
        : await this.prisma.configurator3DConfiguration.findMany({
            where: { deletedAt: null },
            select: { id: true },
          }).then((rows) => rows.map((r) => r.id));

      for (const configurationId of configurationIds) {
        await this.aggregateConfiguration(configurationId, date, dayEnd);
        await this.aggregateOptionAnalytics(configurationId, date, dayEnd);
      }

      this.logger.log(
        `Daily aggregation complete for ${configurationIds.length} configuration(s)`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Analytics aggregation failed: ${errorMsg}`);
      throw error;
    }
  }

  private async aggregateConfiguration(
    configurationId: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<void> {
    const sessions = await this.prisma.configurator3DSession.findMany({
      where: {
        configurationId,
        startedAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        interactions: true,
      },
    });

    const uniqueVisitorIds = new Set(
      sessions
        .map((s) => s.visitorId ?? s.userId ?? s.anonymousId)
        .filter(Boolean),
    );

    const completedSessions = sessions.filter(
      (s) =>
        s.status === Configurator3DSessionStatus.COMPLETED ||
        s.status === Configurator3DSessionStatus.CONVERTED ||
        s.status === Configurator3DSessionStatus.SAVED,
    );

    const totalDuration = sessions.reduce((sum, s) => {
      if (s.startedAt && s.lastActivityAt) {
        return sum + (s.lastActivityAt.getTime() - s.startedAt.getTime());
      }
      return sum;
    }, 0);
    const avgSessionDuration =
      sessions.length > 0 ? Math.round(totalDuration / sessions.length / 1000) : 0;

    const interactionsByType: Record<string, number> = {};
    for (const session of sessions) {
      for (const i of session.interactions) {
        const key = i.type;
        interactionsByType[key] = (interactionsByType[key] ?? 0) + 1;
      }
    }

    const optionChanges =
      interactionsByType[InteractionType.OPTION_CHANGE] ??
      interactionsByType[InteractionType.OPTION_SELECT] ??
      0;
    const screenshots =
      interactionsByType[InteractionType.SCREENSHOT_CAPTURE] ?? 0;
    const arLaunches = interactionsByType[InteractionType.AR_LAUNCH] ?? 0;

    const addToCarts = sessions.filter(
      (s) => s.conversionType === ConversionType.ADD_TO_CART,
    ).length;
    const purchases = sessions.filter(
      (s) => s.conversionType === ConversionType.PURCHASE,
    ).length;
    const quoteRequests = sessions.filter(
      (s) => s.conversionType === ConversionType.QUOTE_REQUEST,
    ).length;
    const savedDesigns = sessions.filter(
      (s) => s.conversionType === ConversionType.SAVE_DESIGN,
    ).length;
    const shares = sessions.filter(
      (s) => s.conversionType === ConversionType.SHARE,
    ).length;

    const revenue = sessions
      .filter((s) => s.conversionType === ConversionType.PURCHASE)
      .reduce((sum, s) => sum + (s.conversionValue ?? 0), 0);
    const avgOrderValue = purchases > 0 ? revenue / purchases : 0;

    const totalInteractions = sessions.reduce(
      (sum, s) => sum + s.interactions.length,
      0,
    );

    const views = sessions.length;

    await this.prisma.configurator3DAnalytics.upsert({
      where: {
        configurationId_date: { configurationId, date: dayStart },
      },
      update: {
        views,
        uniqueViews: uniqueVisitorIds.size,
        sessions: sessions.length,
        completedSessions: completedSessions.length,
        avgSessionDuration,
        totalInteractions,
        optionChanges,
        screenshots,
        arLaunches,
        addToCarts,
        purchases,
        quoteRequests,
        savedDesigns,
        shares,
        revenue,
        avgOrderValue,
      },
      create: {
        configurationId,
        date: dayStart,
        views,
        uniqueViews: uniqueVisitorIds.size,
        sessions: sessions.length,
        completedSessions: completedSessions.length,
        avgSessionDuration,
        totalInteractions,
        optionChanges,
        screenshots,
        arLaunches,
        addToCarts,
        purchases,
        quoteRequests,
        savedDesigns,
        shares,
        revenue,
        avgOrderValue,
      },
    });
  }

  private async aggregateOptionAnalytics(
    configurationId: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<void> {
    const sessions = await this.prisma.configurator3DSession.findMany({
      where: {
        configurationId,
        startedAt: { gte: dayStart, lte: dayEnd },
      },
      select: {
        id: true,
        selections: true,
        conversionType: true,
        conversionValue: true,
      },
    });

    const optionStats: Record<
      string,
      { componentId: string; selections: number; addToCarts: number; purchases: number; revenue: number }
    > = {};

    for (const session of sessions) {
      const selections = (session.selections as Record<string, string>) ?? {};
      const _uniqueSelectors = new Set(Object.values(selections));

      for (const [componentId, optionId] of Object.entries(selections)) {
        if (!optionId) continue;

        const key = optionId;
        if (!optionStats[key]) {
          optionStats[key] = {
            componentId,
            selections: 0,
            addToCarts: 0,
            purchases: 0,
            revenue: 0,
          };
        }

        optionStats[key].selections += 1;

        if (session.conversionType === ConversionType.ADD_TO_CART) {
          optionStats[key].addToCarts += 1;
        }
        if (session.conversionType === ConversionType.PURCHASE) {
          optionStats[key].purchases += 1;
          optionStats[key].revenue += session.conversionValue ?? 0;
        }
      }
    }

    for (const [optionId, stats] of Object.entries(optionStats)) {
      const option = await this.prisma.configurator3DOption.findUnique({
        where: { id: optionId },
        select: { componentId: true },
      });

      const componentId = stats.componentId ?? option?.componentId;
      if (!componentId) continue;

      await this.prisma.configurator3DOptionAnalytics.upsert({
        where: {
          optionId_date: { optionId, date: dayStart },
        },
        update: {
          selections: stats.selections,
          uniqueSelections: stats.selections,
          addToCarts: stats.addToCarts,
          purchases: stats.purchases,
          revenue: stats.revenue,
        },
        create: {
          configurationId,
          componentId,
          optionId,
          date: dayStart,
          selections: stats.selections,
          uniqueSelections: stats.selections,
          addToCarts: stats.addToCarts,
          purchases: stats.purchases,
          revenue: stats.revenue,
        },
      });
    }
  }

  private getYesterdayDate(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Analytics aggregation job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }
}
