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

      // Calculer les dates pour la période actuelle et précédente
      const { startDate, endDate, previousStartDate, previousEndDate } = this.getPeriodDates(period);

      // Récupérer les données de la période actuelle
      const [
        totalDesigns,
        totalRenders,
        activeUsers,
        revenue,
        orders,
        designsOverTime,
        revenueOverTime,
        viewsOverTime,
      ] = await Promise.all([
        this.getTotalDesigns(startDate, endDate),
        this.getTotalRenders(startDate, endDate),
        this.getActiveUsers(startDate, endDate),
        this.getRevenue(startDate, endDate),
        this.getOrders(startDate, endDate),
        this.getDesignsOverTime(startDate, endDate),
        this.getRevenueOverTime(startDate, endDate),
        this.getViewsOverTime(startDate, endDate),
      ]);

      // Récupérer les données de la période précédente pour calculer conversionChange
      const previousOrders = await this.getOrders(previousStartDate, previousEndDate);
      const previousRenders = await this.getTotalRenders(previousStartDate, previousEndDate);

      // Calculer le taux de conversion actuel (orders / renders * 100)
      const currentConversionRate = totalRenders > 0 ? (orders / totalRenders) * 100 : 0;
      
      // Calculer le taux de conversion précédent
      const previousConversionRate = previousRenders > 0 ? (previousOrders / previousRenders) * 100 : 0;
      
      // Calculer le changement de conversion (différence en points de pourcentage)
      const conversionChange = currentConversionRate - previousConversionRate;

      const metrics: AnalyticsMetrics = {
        totalDesigns,
        totalRenders,
        activeUsers,
        revenue,
        conversionRate: Math.round(currentConversionRate * 100) / 100, // 2 décimales
        avgSessionDuration: '8m 30s' // TODO: Calculer depuis UsageMetric si disponible
      };

      const charts = {
        designsOverTime,
        revenueOverTime,
        viewsOverTime,
        conversionChange: Math.round(conversionChange * 100) / 100, // 2 décimales
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

  /**
   * Calculer les dates pour la période actuelle et précédente
   */
  private getPeriodDates(period: string): {
    startDate: Date;
    endDate: Date;
    previousStartDate: Date;
    previousEndDate: Date;
  } {
    const endDate = new Date();
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (period) {
      case 'last_7_days':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        previousStartDate = new Date(previousEndDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_30_days':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        previousStartDate = new Date(previousEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last_90_days':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        previousStartDate = new Date(previousEndDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        previousStartDate = new Date(previousEndDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { startDate, endDate, previousStartDate, previousEndDate };
  }

  /**
   * Récupérer le nombre total de designs créés dans la période
   */
  private async getTotalDesigns(startDate: Date, endDate: Date): Promise<number> {
    return this.prisma.design.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Récupérer le nombre total de renders dans la période
   */
  private async getTotalRenders(startDate: Date, endDate: Date): Promise<number> {
    // Utiliser UsageMetric si disponible, sinon compter les designs avec renderUrl
    const rendersFromMetrics = await this.prisma.usageMetric.count({
      where: {
        metric: 'renders_2d',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    if (rendersFromMetrics > 0) {
      return rendersFromMetrics;
    }

    // Fallback: compter les designs avec renderUrl
    return this.prisma.design.count({
      where: {
        renderUrl: { not: null },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Récupérer le nombre d'utilisateurs actifs dans la période
   */
  private async getActiveUsers(startDate: Date, endDate: Date): Promise<number> {
    const uniqueUsers = await this.prisma.design.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    return uniqueUsers.filter(u => u.userId).length;
  }

  /**
   * Récupérer le revenu total dans la période
   */
  private async getRevenue(startDate: Date, endDate: Date): Promise<number> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'COMPLETED', 'SHIPPED'] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalAmountCents: true,
      },
    });

    const totalCents = orders.reduce((sum, order) => sum + Number(order.totalAmountCents || 0), 0);
    return totalCents / 100; // Convertir en euros
  }

  /**
   * Récupérer le nombre de commandes dans la période
   */
  private async getOrders(startDate: Date, endDate: Date): Promise<number> {
    return this.prisma.order.count({
      where: {
        status: { in: ['PAID', 'COMPLETED', 'SHIPPED'] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  /**
   * Récupérer les designs créés au fil du temps (groupés par jour)
   */
  private async getDesignsOverTime(startDate: Date, endDate: Date): Promise<Array<{ date: string; count: number }>> {
    const designs = await this.prisma.design.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Grouper par jour
    const grouped = designs.reduce((acc, design) => {
      const date = design.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convertir en array et trier par date
    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Récupérer le revenu au fil du temps (groupé par jour)
   */
  private async getRevenueOverTime(startDate: Date, endDate: Date): Promise<Array<{ date: string; amount: number }>> {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: ['PAID', 'COMPLETED', 'SHIPPED'] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        totalAmountCents: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Grouper par jour
    const grouped = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      const amount = Number(order.totalAmountCents || 0) / 100; // Convertir en euros
      acc[date] = (acc[date] || 0) + amount;
      return acc;
    }, {} as Record<string, number>);

    // Convertir en array et trier par date
    return Object.entries(grouped)
      .map(([date, amount]) => ({ date, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Récupérer les vues au fil du temps (groupées par jour)
   */
  private async getViewsOverTime(startDate: Date, endDate: Date): Promise<Array<{ date: string; count: number }>> {
    // Utiliser UsageMetric si disponible
    const viewsMetrics = await this.prisma.usageMetric.findMany({
      where: {
        metric: 'views',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        timestamp: true,
        value: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (viewsMetrics.length > 0) {
      // Grouper par jour
      const grouped = viewsMetrics.reduce((acc, metric) => {
        const date = metric.timestamp.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + metric.value;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(grouped)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    // Fallback: utiliser les designs avec previewUrl comme proxy pour les vues
    const designs = await this.prisma.design.findMany({
      where: {
        previewUrl: { not: null },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const grouped = designs.reduce((acc, design) => {
      const date = design.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
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


