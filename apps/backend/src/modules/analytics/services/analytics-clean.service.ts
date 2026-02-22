import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { Cacheable } from '@/libs/cache/cacheable.decorator';
import { TrackEventDto, EventType } from '../dto/track-event.dto';
import { AnalyticsQueryDto, TimeRange } from '../dto/analytics-query.dto';

/**
 * Clean Analytics Service - Minimaliste et performant
 * Focus sur l'essentiel : tracking d'événements, métriques de base, export
 */
@Injectable()
export class AnalyticsCleanService {
  private readonly logger = new Logger(AnalyticsCleanService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Track an event
   */
  async trackEvent(
    brandId: string,
    userId: string | null,
    dto: TrackEventDto,
  ): Promise<void> {
    try {
      // Skip anonymous events that have no valid brandId (FK constraint would fail)
      if (!brandId || brandId === 'anonymous') {
        this.logger.debug('Skipping anonymous analytics event', {
          eventType: dto.eventType,
          sessionId: dto.sessionId,
        });
        return;
      }

      await this.prisma.analyticsEvent.create({
        data: {
          eventType: dto.eventType as string,
          userId: userId || null,
          sessionId: dto.sessionId || null,
          properties: (dto.properties || {}) as import('@prisma/client/runtime/library').InputJsonValue,
          brandId,
        },
      });

      // Cache invalidation handled by decorator
    } catch (error) {
      this.logger.error('Failed to track event', { error, brandId, dto });
      // Don't throw on tracking failures - they should be non-blocking
    }
  }

  /**
   * Get basic metrics
   */
  @Cacheable({ type: 'analytics', ttl: 300 }) // 5 minutes cache
  async getMetrics(brandId: string, query: AnalyticsQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const [totalEvents, pageViews, conversions, uniqueUsers, uniqueSessions] =
      await Promise.all([
        this.getTotalEvents(brandId, startDate, endDate, query.eventTypes),
        this.getEventCount(brandId, EventType.PAGE_VIEW, startDate, endDate),
        this.getEventCount(brandId, EventType.CONVERSION, startDate, endDate),
        this.getUniqueUsers(brandId, startDate, endDate),
        this.getUniqueSessions(brandId, startDate, endDate),
      ]);

    const conversionRate =
      pageViews > 0 ? (conversions / pageViews) * 100 : 0;

    return {
      totalEvents,
      pageViews,
      conversions,
      uniqueUsers,
      uniqueSessions,
      conversionRate: Number(conversionRate.toFixed(2)),
      period: {
        startDate,
        endDate,
      },
    };
  }

  /**
   * Get time series data
   */
  @Cacheable({ type: 'analytics', ttl: 300 })
  async getTimeSeries(brandId: string, query: AnalyticsQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    // Use Prisma to get events, then group in memory (simpler approach)
    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        brandId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(query.eventTypes?.length && {
          eventType: { in: query.eventTypes },
        }),
      },
      select: {
        createdAt: true,
      },
    });

    // Group by day
    const grouped = events.reduce((acc, event) => {
      const date = event.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get top events
   */
  @Cacheable({ type: 'analytics', ttl: 300 })
  async getTopEvents(brandId: string, query: AnalyticsQueryDto, limit = 10) {
    const { startDate, endDate } = this.getDateRange(query);

    const events = await this.prisma.$queryRaw<
      Array<{ eventType: string; count: bigint }>
    >`
      SELECT 
        "eventType",
        COUNT(*)::bigint as count
      FROM "analytics_events"
      WHERE "brandId" = ${brandId}
        AND "createdAt" >= ${startDate}::timestamp
        AND "createdAt" <= ${endDate}::timestamp
      GROUP BY "eventType"
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    return events.map((e) => ({
      eventType: e.eventType,
      count: Number(e.count),
    }));
  }

  /**
   * Export events to CSV
   */
  async exportEvents(
    brandId: string,
    query: AnalyticsQueryDto,
  ): Promise<string> {
    const { startDate, endDate } = this.getDateRange(query);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        brandId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(query.eventTypes?.length && {
          eventType: { in: query.eventTypes },
        }),
      },
      select: {
        id: true,
        eventType: true,
        userId: true,
        sessionId: true,
        createdAt: true,
        properties: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit for performance
    });

    // Convert to CSV
    const headers = ['id', 'eventType', 'userId', 'sessionId', 'createdAt', 'properties'];
    const rows = events.map((e) => [
      e.id,
      e.eventType,
      e.userId || '',
      e.sessionId || '',
      e.createdAt.toISOString(),
      JSON.stringify(e.properties),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  // Private helpers

  private getDateRange(query: AnalyticsQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    const endDate = query.endDate
      ? new Date(query.endDate)
      : new Date();

    let startDate: Date;
    if (query.startDate) {
      startDate = new Date(query.startDate);
    } else {
      const days = this.getDaysFromTimeRange(query.timeRange || TimeRange.LAST_30_DAYS);
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);
    }

    return { startDate, endDate };
  }

  private getDaysFromTimeRange(timeRange: TimeRange): number {
    switch (timeRange) {
      case TimeRange.LAST_7_DAYS:
        return 7;
      case TimeRange.LAST_30_DAYS:
        return 30;
      case TimeRange.LAST_90_DAYS:
        return 90;
      case TimeRange.LAST_YEAR:
        return 365;
      default:
        return 30;
    }
  }

  private async getTotalEvents(
    brandId: string,
    startDate: Date,
    endDate: Date,
    eventTypes?: string[],
  ): Promise<number> {
    const result = await this.prisma.analyticsEvent.count({
      where: {
        brandId,
        createdAt: { gte: startDate, lte: endDate },
        ...(eventTypes?.length && { eventType: { in: eventTypes } }),
      },
    });
    return result;
  }

  private async getEventCount(
    brandId: string,
    eventType: EventType,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.analyticsEvent.count({
      where: {
        brandId,
        eventType,
        createdAt: { gte: startDate, lte: endDate },
      },
    });
    return result;
  }

  private async getUniqueUsers(
    brandId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT "userId")::bigint as count
      FROM "analytics_events"
      WHERE "brandId" = ${brandId}
        AND "createdAt" >= ${startDate}::timestamp
        AND "createdAt" <= ${endDate}::timestamp
        AND "userId" IS NOT NULL
    `;
    return Number(result[0]?.count || 0);
  }

  private async getUniqueSessions(
    brandId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT "sessionId")::bigint as count
      FROM "analytics_events"
      WHERE "brandId" = ${brandId}
        AND "createdAt" >= ${startDate}::timestamp
        AND "createdAt" <= ${endDate}::timestamp
        AND "sessionId" IS NOT NULL
    `;
    return Number(result[0]?.count || 0);
  }
}
