import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AnalyticsDashboard, AnalyticsMetrics } from '../interfaces/analytics.interface';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(period: string = 'last_30_days'): Promise<AnalyticsDashboard> {
    try {
      this.logger.log(`Getting dashboard analytics for period: ${period}`);

      // Simulation des métriques
      const metrics: AnalyticsMetrics = {
        totalDesigns: 1250,
        totalRenders: 3400,
        activeUsers: 89,
        revenue: 15420.50,
        conversionRate: 12.5,
        avgSessionDuration: '8m 30s'
      };

      const charts = {
        designsOverTime: [
          { date: '2025-10-01', count: 45 },
          { date: '2025-10-02', count: 52 },
          { date: '2025-10-03', count: 38 },
          { date: '2025-10-04', count: 67 },
          { date: '2025-10-05', count: 71 }
        ],
        revenueOverTime: [
          { date: '2025-10-01', amount: 450.00 },
          { date: '2025-10-02', amount: 520.00 },
          { date: '2025-10-03', amount: 380.00 },
          { date: '2025-10-04', amount: 670.00 },
          { date: '2025-10-05', amount: 710.00 }
        ]
      };

      return {
        period,
        metrics,
        charts
      };
    } catch (error) {
      this.logger.error(`Failed to get dashboard analytics: ${error.message}`);
      throw error;
    }
  }

  async getUsage(brandId: string) {
    try {
      this.logger.log(`Getting usage analytics for brand: ${brandId}`);

      return {
        success: true,
        usage: {
          designs: { used: 45, limit: 100, unit: 'designs' },
          renders: { used: 120, limit: 500, unit: 'renders' },
          storage: { used: 2.5, limit: 10, unit: 'GB' },
          apiCalls: { used: 15000, limit: 100000, unit: 'calls' }
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get usage analytics: ${error.message}`);
      throw error;
    }
  }

  async getRevenue(period: string = 'last_30_days') {
    try {
      this.logger.log(`Getting revenue analytics for period: ${period}`);

      return {
        success: true,
        period,
        revenue: {
          total: 15420.50,
          currency: 'EUR',
          breakdown: {
            subscriptions: 12000.00,
            usage: 3420.50
          }
        }
      };
    } catch (error) {
      this.logger.error(`Failed to get revenue analytics: ${error.message}`);
      throw error;
    }
  }

  async recordWebVital(userId: string, brandId: string | null, data: {
    name: string;
    value: number;
    rating?: string;
    delta?: number;
    id: string;
    url?: string;
    timestamp: number;
  }) {
    try {
      this.logger.log(`Recording web vital: ${data.name} = ${data.value} for user: ${userId}`);

      // ✅ Implémenté : Sauvegarder dans la table WebVital
      await this.prisma.webVital.create({
        data: {
          userId: userId || undefined,
          sessionId: data.id, // Utiliser l'ID comme sessionId
          page: data.url || '/',
          metric: data.name.toUpperCase(), // LCP, FID, CLS, etc.
          value: data.value,
          rating: data.rating || this.calculateRating(data.name, data.value),
          timestamp: new Date(data.timestamp),
        },
      });

      return {
        success: true,
        message: 'Web vital recorded',
      };
    } catch (error) {
      this.logger.error(`Failed to record web vital: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate rating for web vital metric
   */
  private calculateRating(metric: string, value: number): string {
    // Thresholds basés sur Core Web Vitals standards
    const thresholds: Record<string, { good: number; poor: number }> = {
      LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
      FID: { good: 100, poor: 300 }, // First Input Delay (ms)
      CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
      FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
      TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
      INP: { good: 200, poor: 500 }, // Interaction to Next Paint (ms)
    };

    const threshold = thresholds[metric.toUpperCase()];
    if (!threshold) {
      return 'good'; // Default
    }

    if (value <= threshold.good) {
      return 'good';
    } else if (value <= threshold.poor) {
      return 'needs-improvement';
    } else {
      return 'poor';
    }
  }

  async getWebVitals(userId: string, options?: { name?: string; startDate?: string; endDate?: string }) {
    try {
      this.logger.log(`Getting web vitals for user: ${userId}`);

      // ✅ Implémenté : Récupérer depuis la table WebVital
      const startDate = options?.startDate ? new Date(options.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 jours par défaut
      const endDate = options?.endDate ? new Date(options.endDate) : new Date();

      const where: any = {
        userId: userId || undefined,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (options?.name) {
        where.metric = options.name.toUpperCase();
      }

      // Récupérer tous les web vitals
      const vitals = await this.prisma.webVital.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: 1000, // Limite pour performance
      });

      // Calculer les moyennes par métrique
      const summary: Record<string, { value: number; rating: string }> = {};
      const metrics = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'];

      for (const metric of metrics) {
        const metricVitals = vitals.filter(v => v.metric === metric);
        if (metricVitals.length > 0) {
          const avgValue = metricVitals.reduce((sum, v) => sum + v.value, 0) / metricVitals.length;
          const latestRating = metricVitals[0]?.rating || 'good';
          summary[metric] = {
            value: Math.round(avgValue * 100) / 100, // 2 décimales
            rating: latestRating,
          };
        } else {
          // Pas de données pour cette métrique
          summary[metric] = { value: 0, rating: 'good' };
        }
      }

      return {
        success: true,
        vitals: vitals.map(v => ({
          id: v.id,
          metric: v.metric,
          value: v.value,
          rating: v.rating,
          page: v.page,
          timestamp: v.timestamp,
        })),
        summary,
        period: {
          start: startDate,
          end: endDate,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get web vitals: ${error.message}`);
      throw error;
    }
  }
}


