import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@ApiTags('Analytics')
@Controller('analytics-clean')
@Public()
export class AnalyticsCleanController {
  private readonly logger = new Logger(AnalyticsCleanController.name);
  constructor(private readonly prisma: PrismaService) {}

  @Post('events')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Track analytics event' })
  async trackEvent(@Body() body: Record<string, unknown>) {
    const eventTypeRaw =
      (typeof body?.event === 'string' && body.event.trim()) ||
      (typeof body?.eventType === 'string' && body.eventType.trim()) ||
      'unknown';
    const eventType = eventTypeRaw.toLowerCase();

    await this.prisma.analyticsEvent.create({
      data: {
        eventType,
        userId: typeof body?.userId === 'string' ? body.userId : undefined,
        sessionId:
          typeof body?.sessionId === 'string' ? body.sessionId : undefined,
        page: typeof body?.page === 'string' ? body.page : undefined,
        referrer:
          typeof body?.referrer === 'string' ? body.referrer : undefined,
        userAgent:
          typeof body?.userAgent === 'string' ? body.userAgent : undefined,
        ipAddress:
          typeof body?.ipAddress === 'string' ? body.ipAddress : undefined,
        country: typeof body?.country === 'string' ? body.country : undefined,
        device: typeof body?.device === 'string' ? body.device : undefined,
        properties: body as Prisma.InputJsonValue,
      },
    });

    this.logger.debug(`Analytics event stored: ${eventType}`);
    return { success: true, eventType };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get analytics metrics' })
  async getMetrics(@Query('period') period?: string) {
    const to = new Date();
    const from = this.resolvePeriodStart(period, to);
    const previousFrom = new Date(from.getTime() - (to.getTime() - from.getTime()));
    const previousTo = from;

    const [totalEvents, pageViews, conversions, totalUsers, currentRows, previousRows] =
      await Promise.all([
        this.prisma.analyticsEvent.count({
          where: { createdAt: { gte: from, lte: to } },
        }),
        this.prisma.analyticsEvent.count({
          where: {
            createdAt: { gte: from, lte: to },
            eventType: { in: ['page_view', 'view'] },
          },
        }),
        this.prisma.analyticsEvent.count({
          where: {
            createdAt: { gte: from, lte: to },
            eventType: { in: ['conversion', 'purchase', 'checkout_completed'] },
          },
        }),
        this.prisma.analyticsEvent.findMany({
          where: { createdAt: { gte: from, lte: to } },
          select: { userId: true, sessionId: true },
          distinct: ['userId', 'sessionId'],
        }),
        this.prisma.analyticsEvent.findMany({
          where: { createdAt: { gte: from, lte: to } },
          select: { eventType: true, properties: true },
        }),
        this.prisma.analyticsEvent.findMany({
          where: { createdAt: { gte: previousFrom, lte: previousTo } },
          select: { eventType: true, properties: true },
        }),
      ]);

    const currentRevenue = this.sumRevenue(currentRows);
    const previousRevenue = this.sumRevenue(previousRows);
    const currentUsers = totalUsers.length;
    const previousUsers = this.countUsers(previousRows as Array<{ eventType: string; properties: unknown }>);
    const currentViews = pageViews;
    const previousViews = this.countByEvent(previousRows, ['page_view', 'view']);
    const currentConversionRate = pageViews > 0 ? (conversions / pageViews) * 100 : 0;
    const previousConversions = this.countByEvent(previousRows, [
      'conversion',
      'purchase',
      'checkout_completed',
    ]);
    const previousConversionRate =
      previousViews > 0 ? (previousConversions / previousViews) * 100 : 0;
    const avgSessionDuration = this.averageSessionDuration(currentRows);
    const bounceRate = this.computeBounceRate(currentRows);

    return {
      totalViews: pageViews,
      totalUsers: currentUsers,
      totalRevenue: Math.round(currentRevenue * 100) / 100,
      totalEvents,
      pageViews,
      conversions,
      conversionRate: Math.round(currentConversionRate * 100) / 100,
      avgSessionDuration: Math.round(avgSessionDuration * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
      trends: {
        views: this.computeTrend(currentViews, previousViews),
        users: this.computeTrend(currentUsers, previousUsers),
        revenue: this.computeTrend(currentRevenue, previousRevenue),
        conversion: this.computeTrend(currentConversionRate, previousConversionRate),
      },
    };
  }

  @Get('time-series')
  @ApiOperation({ summary: 'Get analytics time series' })
  async getTimeSeries(@Query('period') period?: string) {
    const to = new Date();
    const from = this.resolvePeriodStart(period, to);
    const rows = await this.prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: from, lte: to } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = new Map<string, number>();
    for (const row of rows) {
      const key = row.createdAt.toISOString().split('T')[0];
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries()).map(([date, events]) => ({ date, events }));
  }

  @Get('top-events')
  @ApiOperation({ summary: 'Get top events' })
  async getTopEvents(@Query('period') period?: string) {
    const to = new Date();
    const from = this.resolvePeriodStart(period, to);
    const grouped = await this.prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: { createdAt: { gte: from, lte: to } },
      _count: { eventType: true },
      orderBy: { _count: { eventType: 'desc' } },
      take: 10,
    });

    return grouped.map((item) => ({
      eventType: item.eventType,
      count: item._count.eventType,
    }));
  }

  private resolvePeriodStart(period: string | undefined, to: Date): Date {
    const normalized = (period ?? '30d').toLowerCase().trim();
    const map: Record<string, number> = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
    };
    const days = map[normalized] ?? 30;
    return new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private sumRevenue(
    rows: Array<{ properties: unknown }>,
  ): number {
    return rows.reduce((acc, row) => {
      if (!row.properties || typeof row.properties !== 'object' || Array.isArray(row.properties)) {
        return acc;
      }
      const revenue = (row.properties as Record<string, unknown>).revenue;
      return acc + (typeof revenue === 'number' ? revenue : 0);
    }, 0);
  }

  private countUsers(rows: Array<{ properties: unknown }>): number {
    const userSet = new Set<string>();
    for (const row of rows) {
      if (!row.properties || typeof row.properties !== 'object' || Array.isArray(row.properties)) {
        continue;
      }
      const p = row.properties as Record<string, unknown>;
      const userId = typeof p.userId === 'string' ? p.userId : undefined;
      const sessionId = typeof p.sessionId === 'string' ? p.sessionId : undefined;
      if (userId) userSet.add(`u:${userId}`);
      else if (sessionId) userSet.add(`s:${sessionId}`);
    }
    return userSet.size;
  }

  private countByEvent(
    rows: Array<{ eventType: string }>,
    eventTypes: string[],
  ): number {
    const set = new Set(eventTypes);
    return rows.reduce((acc, row) => (set.has(row.eventType) ? acc + 1 : acc), 0);
  }

  private averageSessionDuration(
    rows: Array<{ properties: unknown }>,
  ): number {
    let sum = 0;
    let count = 0;
    for (const row of rows) {
      if (!row.properties || typeof row.properties !== 'object' || Array.isArray(row.properties)) {
        continue;
      }
      const duration = (row.properties as Record<string, unknown>).sessionDuration;
      if (typeof duration === 'number') {
        sum += duration;
        count += 1;
      }
    }
    return count > 0 ? sum / count : 0;
  }

  private computeBounceRate(rows: Array<{ eventType: string }>): number {
    const sessions = rows.filter((row) => row.eventType === 'session_start').length;
    const bounces = rows.filter((row) => row.eventType === 'session_bounce').length;
    if (sessions === 0) {
      return 0;
    }
    return (bounces / sessions) * 100;
  }

  private computeTrend(current: number, previous: number): number {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }
}
