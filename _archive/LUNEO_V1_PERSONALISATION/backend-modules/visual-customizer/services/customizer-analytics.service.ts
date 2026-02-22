import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

interface DateRange {
  from: Date;
  to: Date;
}

export interface OverviewStats {
  totalSessions: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  totalInteractions: number;
  designsSaved: number;
  exportsCreated: number;
  addToCarts: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
}

export interface ToolUsage {
  toolName: string;
  usageCount: number;
  uniqueUsers: number;
  avgTimeSpent: number;
}

export interface ConversionFunnel {
  sessions: number;
  activeSessions: number;
  designsSaved: number;
  exportsCreated: number;
  addToCarts: number;
  purchases: number;
}

@Injectable()
export class CustomizerAnalyticsService {
  private readonly logger = new Logger(CustomizerAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get overview analytics
   */
  async getOverview(
    customizerId: string,
    dateRange: DateRange,
  ): Promise<OverviewStats> {
    // Verify customizer exists
    const customizer = await this.prisma.visualCustomizer.findUnique({
      where: { id: customizerId },
      select: { id: true },
    });

    if (!customizer) {
      throw new NotFoundException(
        `Customizer with ID ${customizerId} not found`,
      );
    }

    // Get aggregated analytics
    const analytics = await this.prisma.customizerAnalytics.findMany({
      where: {
        customizerId,
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
    });

    // Aggregate data
    const stats: OverviewStats = {
      totalSessions: analytics.reduce((sum, a) => sum + a.sessions, 0),
      uniqueUsers: analytics.reduce((sum, a) => sum + a.uniqueUsers, 0),
      avgSessionDuration: this.calculateAverage(
        analytics.map((a) => a.avgSessionDuration),
      ),
      totalInteractions: analytics.reduce((sum, a) => sum + a.totalInteractions, 0),
      designsSaved: analytics.reduce((sum, a) => sum + a.designsSaved, 0),
      exportsCreated: analytics.reduce((sum, a) => sum + a.exportsCreated, 0),
      addToCarts: analytics.reduce((sum, a) => sum + a.addToCarts, 0),
      purchases: analytics.reduce((sum, a) => sum + a.purchases, 0),
      revenue: analytics.reduce((sum, a) => sum + Number(a.revenue), 0),
      conversionRate: 0,
    };

    // Calculate conversion rate
    if (stats.totalSessions > 0) {
      stats.conversionRate = (stats.purchases / stats.totalSessions) * 100;
    }

    return stats;
  }

  /**
   * Get sessions analytics
   */
  async getSessionsAnalytics(
    customizerId: string,
    dateRange: DateRange,
  ) {
    const analytics = await this.prisma.customizerAnalytics.findMany({
      where: {
        customizerId,
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
      orderBy: { date: 'asc' },
    });

    return {
      daily: analytics.map((a) => ({
        date: a.date,
        sessions: a.sessions,
        uniqueUsers: a.uniqueUsers,
        avgSessionDuration: a.avgSessionDuration,
      })),
      totals: {
        sessions: analytics.reduce((sum, a) => sum + a.sessions, 0),
        uniqueUsers: analytics.reduce((sum, a) => sum + a.uniqueUsers, 0),
        avgSessionDuration: this.calculateAverage(
          analytics.map((a) => a.avgSessionDuration),
        ),
      },
    };
  }

  /**
   * Get tool usage analytics
   */
  async getToolUsage(
    customizerId: string,
    dateRange: DateRange,
  ): Promise<ToolUsage[]> {
    const toolAnalytics = await this.prisma.customizerToolAnalytics.findMany({
      where: {
        customizerId,
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
    });

    // Group by tool name and aggregate
    const toolMap = new Map<string, ToolUsage>();

    toolAnalytics.forEach((ta) => {
      const existing = toolMap.get(ta.toolName);
      if (existing) {
        existing.usageCount += ta.usageCount;
        existing.uniqueUsers += ta.uniqueUsers;
        existing.avgTimeSpent = Math.round(
          (existing.avgTimeSpent + ta.avgTimeSpent) / 2,
        );
      } else {
        toolMap.set(ta.toolName, {
          toolName: ta.toolName,
          usageCount: ta.usageCount,
          uniqueUsers: ta.uniqueUsers,
          avgTimeSpent: ta.avgTimeSpent,
        });
      }
    });

    return Array.from(toolMap.values()).sort(
      (a, b) => b.usageCount - a.usageCount,
    );
  }

  /**
   * Get conversion funnel
   */
  async getConversionFunnel(
    customizerId: string,
    dateRange: DateRange,
  ): Promise<ConversionFunnel> {
    const analytics = await this.prisma.customizerAnalytics.findMany({
      where: {
        customizerId,
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      },
    });

    return {
      sessions: analytics.reduce((sum, a) => sum + a.sessions, 0),
      activeSessions: analytics.reduce(
        (sum, a) => sum + a.sessions - a.sessions, // Active = sessions with interactions
        0,
      ),
      designsSaved: analytics.reduce((sum, a) => sum + a.designsSaved, 0),
      exportsCreated: analytics.reduce((sum, a) => sum + a.exportsCreated, 0),
      addToCarts: analytics.reduce((sum, a) => sum + a.addToCarts, 0),
      purchases: analytics.reduce((sum, a) => sum + a.purchases, 0),
    };
  }

  /**
   * Aggregate daily analytics (called by worker)
   */
  async aggregateDaily(customizerId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get sessions for the day
    const sessions = await this.prisma.customizerSession.findMany({
      where: {
        customizerId,
        startedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        interactions: true,
      },
    });

    // Get interactions
    const interactions = await this.prisma.customizerInteraction.findMany({
      where: {
        session: {
          customizerId,
          startedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      },
    });

    // Get saved designs
    const savedDesigns = await this.prisma.customizerSavedDesign.count({
      where: {
        customizerId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Get exports
    const exports = await this.prisma.customizerExport.count({
      where: {
        session: {
          customizerId,
          startedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      },
    });

    // Calculate unique users
    const uniqueUserIds = new Set(
      sessions.filter((s) => s.userId).map((s) => s.userId!),
    );

    // Calculate average session duration
    const completedSessions = sessions.filter(
      (s) => s.completedAt && s.startedAt,
    );
    const avgDuration =
      completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => {
            const duration =
              s.completedAt!.getTime() - s.startedAt.getTime();
            return sum + duration;
          }, 0) / completedSessions.length
        : 0;

    // Count interactions by type
    const textEdits = interactions.filter((i) => i.type === 'TEXT_EDIT').length;
    const imageUploads = interactions.filter(
      (i) => i.type === 'IMAGE_UPLOAD',
    ).length;
    const clipartAdded = interactions.filter(
      (i) => i.type === 'CLIPART_ADD',
    ).length;
    const shapesAdded = interactions.filter((i) => i.type === 'SHAPE_ADD').length;
    const presetsApplied = interactions.filter(
      (i) => i.type === 'PRESET_APPLY',
    ).length;

    // Count conversions
    const addToCarts = sessions.filter(
      (s) => s.conversionType === 'ADD_TO_CART',
    ).length;
    const purchases = sessions.filter(
      (s) => s.conversionType === 'PURCHASE',
    ).length;
    const shares = interactions.filter((i) => i.type === 'SHARE_ACTION').length;

    // Calculate revenue
    const revenue = sessions
      .filter((s) => s.conversionValue)
      .reduce((sum, s) => sum + Number(s.conversionValue || 0), 0);

    // Upsert analytics record
    await this.prisma.customizerAnalytics.upsert({
      where: {
        customizerId_date: {
          customizerId,
          date: startOfDay,
        },
      },
      create: {
        customizerId,
        date: startOfDay,
        sessions: sessions.length,
        uniqueUsers: uniqueUserIds.size,
        avgSessionDuration: Math.round(avgDuration),
        totalInteractions: interactions.length,
        textEdits,
        imageUploads,
        clipartAdded,
        shapesAdded,
        presetsApplied,
        designsSaved: savedDesigns,
        exportsCreated: exports,
        addToCarts,
        purchases,
        shares,
        revenue,
        avgOrderValue: purchases > 0 ? revenue / purchases : 0,
      },
      update: {
        sessions: sessions.length,
        uniqueUsers: uniqueUserIds.size,
        avgSessionDuration: Math.round(avgDuration),
        totalInteractions: interactions.length,
        textEdits,
        imageUploads,
        clipartAdded,
        shapesAdded,
        presetsApplied,
        designsSaved: savedDesigns,
        exportsCreated: exports,
        addToCarts,
        purchases,
        shares,
        revenue,
        avgOrderValue: purchases > 0 ? revenue / purchases : 0,
      },
    });

    this.logger.log(
      `Analytics aggregated for customizer ${customizerId} on ${date.toISOString()}`,
    );
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(
    customizerId: string,
    dateRange: DateRange,
    format: 'csv' | 'json' = 'json',
  ): Promise<string | Record<string, unknown>> {
    const overview = await this.getOverview(customizerId, dateRange);
    const sessions = await this.getSessionsAnalytics(customizerId, dateRange);
    const tools = await this.getToolUsage(customizerId, dateRange);
    const funnel = await this.getConversionFunnel(customizerId, dateRange);

    const data = {
      customizerId,
      dateRange: {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      },
      overview,
      sessions,
      tools,
      funnel,
    };

    if (format === 'csv') {
      // Simple CSV export
      const rows: string[] = [];
      rows.push('Metric,Value');
      rows.push(`Total Sessions,${overview.totalSessions}`);
      rows.push(`Unique Users,${overview.uniqueUsers}`);
      rows.push(`Designs Saved,${overview.designsSaved}`);
      rows.push(`Exports Created,${overview.exportsCreated}`);
      rows.push(`Add to Carts,${overview.addToCarts}`);
      rows.push(`Purchases,${overview.purchases}`);
      rows.push(`Revenue,${overview.revenue}`);
      rows.push(`Conversion Rate,${overview.conversionRate}%`);
      return rows.join('\n');
    }

    return data;
  }

  /**
   * Calculate average from array of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const sum = numbers.reduce((a, b) => a + b, 0);
    return Math.round(sum / numbers.length);
  }
}
