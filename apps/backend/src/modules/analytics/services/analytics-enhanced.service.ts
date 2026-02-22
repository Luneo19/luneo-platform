// @ts-nocheck
/**
 * Module 11 - Analytics improvements.
 * Custom dashboard builder, scheduled reports, conversion funnel, metric alerts.
 */
import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AlertSeverity, Prisma } from '@prisma/client';

export interface DashboardWidgetConfig {
  id: string;
  type: string;
  title: string;
  config?: Record<string, unknown>;
}

export interface DashboardConfig {
  widgets: DashboardWidgetConfig[];
  layout?: Record<string, unknown>;
}

export interface BuiltDashboard {
  brandId: string;
  widgets: Array<{
    id: string;
    type: string;
    title: string;
    data?: unknown;
  }>;
  layout?: Record<string, unknown>;
}

export interface ScheduleReportConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  reportType: string;
  recipients?: string[];
  options?: Record<string, unknown>;
}

export interface FunnelStep {
  name: string;
  eventType: string;
  order: number;
}

@Injectable()
export class AnalyticsEnhancedService {
  private readonly logger = new Logger(AnalyticsEnhancedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Builds a custom dashboard from configurable widgets for the brand.
   */
  async buildDashboard(
    brandId: string,
    config: DashboardConfig,
  ): Promise<BuiltDashboard> {
    if (!brandId?.trim()) {
      throw new BadRequestException('brandId is required');
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
    if (!brand) {
      throw new NotFoundException(`Brand not found: ${brandId}`);
    }

    return {
      brandId,
      widgets: await Promise.all(
        (config.widgets ?? []).map(async (w) => ({
          id: w.id,
          type: w.type,
          title: w.title,
          data: await this.resolveWidgetData(brandId, w.type, w.config),
        })),
      ),
      layout: config.layout ?? {},
    };
  }

  /**
   * Schedules periodic reports (daily/weekly/monthly) for the brand.
   */
  async scheduleReport(
    brandId: string,
    config: ScheduleReportConfig,
  ): Promise<{ scheduleId: string; nextRunAt: string }> {
    if (!brandId?.trim()) {
      throw new BadRequestException('brandId is required');
    }
    if (!['daily', 'weekly', 'monthly'].includes(config.frequency)) {
      throw new BadRequestException('frequency must be daily, weekly, or monthly');
    }

    const brand = await this.prisma.brand.findFirst({
      where: { id: brandId },
      select: { id: true, settings: true },
    });
    if (!brand) throw new NotFoundException(`Brand not found: ${brandId}`);

    const settings = (brand.settings ?? {}) as Record<string, unknown>;
    const reportSchedules = (settings.reportSchedules ?? []) as Array<Record<string, unknown>>;
    const scheduleId = `sched_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const nextRunAt = this.computeNextRun(config.frequency);

    reportSchedules.push({
      scheduleId,
      frequency: config.frequency,
      reportType: config.reportType,
      recipients: config.recipients ?? [],
      options: config.options ?? {},
      nextRunAt: nextRunAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

    await this.prisma.brand.update({
      where: { id: brandId },
      data: { settings: { ...settings, reportSchedules } as unknown as Prisma.InputJsonValue },
    });

    this.logger.log(`Report scheduled for brand ${brandId}: ${config.frequency} ${config.reportType}`);

    return {
      scheduleId,
      nextRunAt: nextRunAt.toISOString(),
    };
  }

  /**
   * Builds a custom conversion funnel for the brand with the given steps.
   */
  async buildFunnel(
    brandId: string,
    steps: FunnelStep[],
    options?: { name?: string; description?: string },
  ): Promise<{ id: string; name: string; steps: FunnelStep[] }> {
    if (!brandId?.trim()) {
      throw new BadRequestException('brandId is required');
    }
    if (!steps?.length) {
      throw new BadRequestException('At least one funnel step is required');
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
    if (!brand) throw new NotFoundException(`Brand not found: ${brandId}`);

    const name = options?.name ?? `Funnel ${new Date().toISOString().slice(0, 10)}`;
    const stepsJson = steps.map((s) => ({ name: s.name, eventType: s.eventType, order: s.order }));

    const funnel = await this.prisma.analyticsFunnel.create({
      data: {
        brandId,
        name,
        description: options?.description ?? null,
        steps: stepsJson,
        isActive: true,
      },
    });

    this.logger.log(`Funnel created for brand ${brandId}: ${funnel.id}`);

    return {
      id: funnel.id,
      name: funnel.name,
      steps: stepsJson as FunnelStep[],
    };
  }

  /**
   * Creates a metric alert for the brand with threshold and notification channel.
   */
  async createAlert(
    brandId: string,
    metric: string,
    threshold: number,
    operator: string,
    notificationChannel: string,
  ): Promise<{ id: string; name: string }> {
    if (!brandId?.trim()) {
      throw new BadRequestException('brandId is required');
    }
    const validOps = ['gt', 'lt', 'eq', 'gte', 'lte'];
    if (!validOps.includes(operator)) {
      throw new BadRequestException(`operator must be one of: ${validOps.join(', ')}`);
    }

    const name = `Alert ${metric} ${operator} ${threshold} (${brandId.slice(0, 8)})`;

    const rule = await this.prisma.alertRule.create({
      data: {
        name,
        description: `Brand ${brandId} metric alert`,
        service: 'analytics',
        metric,
        condition: operator,
        threshold,
        severity: AlertSeverity.WARNING,
        enabled: true,
        metadata: {
          brandId,
          notificationChannel,
          createdAt: new Date().toISOString(),
        },
      },
    });

    this.logger.log(`Alert rule created: ${rule.id} for metric ${metric}`);

    return { id: rule.id, name: rule.name };
  }

  private async resolveWidgetData(
    brandId: string,
    type: string,
    _config?: Record<string, unknown>,
  ): Promise<unknown> {
    switch (type) {
      case 'orders':
        const orderCount = await this.prisma.order.count({
          where: { brandId, deletedAt: null },
        });
        return { total: orderCount };
      case 'designs':
        const designCount = await this.prisma.design.count({
          where: { brandId, deletedAt: null },
        });
        return { total: designCount };
      case 'revenue':
        const orders = await this.prisma.order.aggregate({
          where: {
            brandId,
            paymentStatus: 'SUCCEEDED',
            deletedAt: null,
          },
          _sum: { totalCents: true },
        });
        return {
          totalCents: orders._sum.totalCents ?? 0,
        };
      default:
        return {};
    }
  }

  private computeNextRun(frequency: string): Date {
    const now = new Date();
    switch (frequency) {
      case 'daily': {
        const next = new Date(now);
        next.setDate(next.getDate() + 1);
        next.setHours(8, 0, 0, 0);
        return next;
      }
      case 'weekly': {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(8, 0, 0, 0);
        return nextWeek;
      }
      case 'monthly': {
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(8, 0, 0, 0);
        return nextMonth;
      }
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}
