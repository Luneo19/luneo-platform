import { Injectable, Logger } from '@nestjs/common';
import { UsageMetric as PrismaUsageMetric } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UsageMeteringService } from './usage-metering.service';
import {
  BillingCalculationService,
  CalculatedBill,
  CostProjection,
} from './billing-calculation.service';
import { UsageMetricType } from '../interfaces/usage.interface';

type DailyBreakdown = Record<string, Partial<Record<UsageMetricType, number>>>;
type MetricTotals = Partial<Record<UsageMetricType, number>>;

interface UsageStats {
  totalRecords: number;
  daysActive: number;
  metricsUsed: number;
  averageDaily: number;
}

export interface MonthlyReport {
  period: {
    year: number;
    month: number;
    startDate: Date;
    endDate: Date;
  };
  dailyBreakdown: DailyBreakdown;
  metricTotals: MetricTotals;
  bill: CalculatedBill;
  stats: UsageStats;
}

interface TopMetric {
  metric: string;
  value: number;
}

export interface ExecutiveSummary {
  brand: {
    name: string;
    plan: string | null;
    memberSince: Date;
  };
  currentPeriod: {
    usage: Record<UsageMetricType, number>;
    bill: CalculatedBill;
  };
  projections: CostProjection;
  topMetrics: TopMetric[];
  trends: Record<UsageMetricType, number>;
  insights: string[];
}

interface MetricDailyData {
  count: number;
  total: number;
}

export interface MetricDetail {
  metric: UsageMetricType;
  period: { startDate: Date; endDate: Date };
  stats: {
    total: number;
    average: number;
    max: number;
    min: number;
    count: number;
  };
  dailyData: Record<string, MetricDailyData>;
  hourlyPattern: Record<number, number>;
  rawRecords: PrismaUsageMetric[];
}

/**
 * Service de reporting d'usage
 * Génère des rapports et exports pour les clients
 */
@Injectable()
export class UsageReportingService {
  private readonly logger = new Logger(UsageReportingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meteringService: UsageMeteringService,
    private readonly calculationService: BillingCalculationService,
  ) {}

  private formatError(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  /**
   * Générer un rapport mensuel complet
   */
  async generateMonthlyReport(brandId: string, year: number, month: number): Promise<MonthlyReport> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Récupérer tous les enregistrements d'usage
      const usageRecords = await this.prisma.usageMetric.findMany({
        where: {
          brandId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      // Agréger par métrique et par jour
      const dailyBreakdown: DailyBreakdown = {};
      const metricTotals: MetricTotals = {};

      for (const record of usageRecords) {
        const day = record.timestamp.toISOString().split('T')[0];
        const metric = record.metric as UsageMetricType;

        const dayUsage = dailyBreakdown[day] ?? {};
        dayUsage[metric] = (dayUsage[metric] ?? 0) + record.value;
        dailyBreakdown[day] = dayUsage;

        metricTotals[metric] = (metricTotals[metric] ?? 0) + record.value;
      }

      // Calculer la facture
      const bill = await this.calculationService.calculateCurrentBill(brandId);

      // Statistiques
      const daysCount = Object.keys(dailyBreakdown).length || 1;
      const stats: UsageStats = {
        totalRecords: usageRecords.length,
        daysActive: Object.keys(dailyBreakdown).length,
        metricsUsed: Object.keys(metricTotals).length,
        averageDaily: usageRecords.length / daysCount,
      };

      return {
        period: {
          year,
          month,
          startDate,
          endDate,
        },
        dailyBreakdown,
        metricTotals,
        bill,
        stats,
      };
    } catch (error) {
      this.logger.error(`Failed to generate monthly report: ${this.formatError(error)}`);
      throw error instanceof Error ? error : new Error(this.formatError(error));
    }
  }

  /**
   * Exporter l'usage en CSV
   */
  async exportToCSV(brandId: string, startDate: Date, endDate: Date): Promise<string> {
    try {
      const records = await this.prisma.usageMetric.findMany({
        where: {
          brandId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      // Header CSV
      let csv = 'Date,Time,Metric,Value,Unit,Metadata\n';

      // Lignes
      for (const record of records) {
        const date = record.timestamp.toISOString().split('T')[0];
        const time = record.timestamp.toISOString().split('T')[1].split('.')[0];
        const metadata = JSON.stringify(record.metadata || {});

        csv += `${date},${time},${record.metric},${record.value},${this.getUnitForMetric(record.metric as UsageMetricType)},${metadata}\n`;
      }

      return csv;
    } catch (error) {
      this.logger.error(`Failed to export to CSV: ${this.formatError(error)}`);
      throw error instanceof Error ? error : new Error(this.formatError(error));
    }
  }

  /**
   * Générer un résumé exécutif
   */
  async generateExecutiveSummary(brandId: string): Promise<ExecutiveSummary> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { name: true, plan: true, createdAt: true },
      });

      if (!brand) {
        throw new Error('Brand not found');
      }

      // Usage actuel
      const currentUsage = await this.meteringService.getCurrentUsage(brandId);

      // Facture actuelle
      const currentBill = await this.calculationService.calculateCurrentBill(brandId);

      // Projections
      const projections = await this.calculationService.projectCosts(brandId, 30);

      // Top métriques
      const topMetrics: TopMetric[] = Object.entries(currentUsage)
        .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
        .slice(0, 5)
        .map(([metric, value]) => ({
          metric,
          value,
        }));

      // Tendances (comparaison avec le mois dernier)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthReport = await this.generateMonthlyReport(
        brandId,
        lastMonth.getFullYear(),
        lastMonth.getMonth() + 1,
      );

      const trends: Record<UsageMetricType, number> = {} as Record<UsageMetricType, number>;
      for (const [metricKey, currentValue] of Object.entries(currentUsage) as Array<
        [UsageMetricType, number]
      >) {
        const lastValue = lastMonthReport.metricTotals[metricKey] ?? 0;
        if (lastValue > 0) {
          trends[metricKey] = ((currentValue - lastValue) / lastValue) * 100;
        }
      }

      return {
        brand: {
          name: brand.name,
          plan: brand.plan,
          memberSince: brand.createdAt,
        },
        currentPeriod: {
          usage: currentUsage,
          bill: currentBill,
        },
        projections,
        topMetrics,
        trends,
        insights: this.generateInsights(currentUsage, trends, projections),
      };
    } catch (error) {
      this.logger.error(`Failed to generate executive summary: ${this.formatError(error)}`);
      throw error instanceof Error ? error : new Error(this.formatError(error));
    }
  }

  /**
   * Générer des insights automatiques
   */
  private generateInsights(
    usage: Record<UsageMetricType, number>,
    trends: Record<UsageMetricType, number>,
    projections: CostProjection,
  ): string[] {
    const insights: string[] = [];

    // Insight sur les tendances
    for (const [metric, trend] of Object.entries(trends) as Array<[UsageMetricType, number]>) {
      if (trend > 50) {
        insights.push(
          `📈 ${metric} has increased by ${trend.toFixed(0)}% compared to last month`,
        );
      } else if (trend < -30) {
        insights.push(
          `📉 ${metric} has decreased by ${Math.abs(trend).toFixed(0)}% compared to last month`,
        );
      }
    }

    // Insight sur les projections
    if (projections.projectedOverage > 5000) {
      insights.push(
        `⚠️  Projected overage costs: €${(projections.projectedOverage / 100).toFixed(2)}. Consider upgrading your plan.`,
      );
    }

    // Insight sur l'utilisation
    const totalUsage = Object.values(usage).reduce((a: number, b: number) => a + b, 0);
    if (totalUsage === 0) {
      insights.push('💡 You haven\'t used any resources this month. Start creating!');
    } else if (totalUsage > 1000) {
      insights.push('🚀 High activity detected! Your platform is thriving.');
    }

    // Recommendations
    if (projections.recommendations?.length) {
      insights.push(...projections.recommendations);
    }

    return insights;
  }

  /**
   * Générer un rapport détaillé par métrique
   */
  async getMetricDetail(
    brandId: string,
    metric: UsageMetricType,
    startDate: Date,
    endDate: Date,
  ): Promise<MetricDetail> {
    try {
      const records = await this.prisma.usageMetric.findMany({
        where: {
          brandId,
          metric,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      // Statistiques
      const values = records.map((r) => r.value);
      const total = values.reduce((a, b) => a + b, 0);
      const count = values.length;
      const average = count > 0 ? total / count : 0;
      const max = count > 0 ? Math.max(...values) : 0;
      const min = count > 0 ? Math.min(...values) : 0;

      // Grouper par jour
      const dailyData: Record<string, MetricDailyData> = {};
      for (const record of records) {
        const day = record.timestamp.toISOString().split('T')[0];
        if (!dailyData[day]) {
          dailyData[day] = { count: 0, total: 0 };
        }
        dailyData[day].count++;
        dailyData[day].total += record.value;
      }

      // Grouper par heure de la journée (pattern)
      const hourlyPattern: Record<number, number> = {};
      for (const record of records) {
        const hour = record.timestamp.getHours();
        hourlyPattern[hour] = (hourlyPattern[hour] || 0) + record.value;
      }

      return {
        metric,
        period: { startDate, endDate },
        stats: {
          total,
          average,
          max,
          min,
          count,
        },
        dailyData,
        hourlyPattern,
        rawRecords: records.slice(0, 100),
      };
    } catch (error) {
      this.logger.error(`Failed to get metric detail: ${this.formatError(error)}`);
      throw error instanceof Error ? error : new Error(this.formatError(error));
    }
  }

  /**
   * Obtenir l'unité pour une métrique
   */
  private getUnitForMetric(metric: UsageMetricType): string {
    const units: Record<UsageMetricType, string> = {
      designs_created: 'designs',
      renders_2d: 'renders',
      renders_3d: 'renders',
      exports_gltf: 'exports',
      exports_usdz: 'exports',
      ai_generations: 'generations',
      storage_gb: 'GB',
      bandwidth_gb: 'GB',
      api_calls: 'calls',
      webhook_deliveries: 'webhooks',
      custom_domains: 'domains',
      team_members: 'members',
    };

    return units[metric] || 'units';
  }
}
