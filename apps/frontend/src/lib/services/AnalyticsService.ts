/**
 * ★★★ SERVICE - ANALYTICS & REPORTING ★★★
 * Service professionnel pour les analytics
 * - Statistiques produits
 * - Statistiques personnalisations
 * - Statistiques commandes
 * - Revenus et conversion
 * - Rapports personnalisés
 */

import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/cache/CacheService';
import { PrismaClient } from '@prisma/client';
import { db } from '@/lib/db';

// ========================================
// TYPES
// ========================================

export interface ProductStats {
  productId: string;
  productName: string;
  views: number;
  customizations: number;
  orders: number;
  revenue: number;
  conversionRate: number;
}

export interface CustomizationStats {
  total: number;
  completed: number;
  failed: number;
  averageTime: number;
  byEffect: Record<string, number>;
  byZone: Record<string, number>;
}

export interface OrderStats {
  total: number;
  totalRevenue: number;
  averageOrderValue: number;
  byStatus: Record<string, number>;
  byProduct: Record<string, number>;
  trends: Array<{
    date: Date;
    count: number;
    revenue: number;
  }>;
}

export interface RevenueStats {
  total: number;
  periodStart: Date;
  periodEnd: Date;
  trends: Array<{
    date: Date;
    revenue: number;
    orders: number;
  }>;
  byProduct: Array<{
    productId: string;
    productName: string;
    revenue: number;
    orders: number;
  }>;
}

export interface ARStats {
  sessions: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  conversionRate: number;
  byDevice: Record<string, number>;
  byProduct: Record<string, number>;
}

export interface DashboardStats {
  products: ProductStats[];
  customizations: CustomizationStats;
  orders: OrderStats;
  revenue: RevenueStats;
  ar: ARStats;
  periodStart: Date;
  periodEnd: Date;
}

export interface ReportOptions {
  type: 'products' | 'customizations' | 'orders' | 'revenue' | 'ar' | 'full';
  periodStart: Date;
  periodEnd: Date;
  format: 'json' | 'csv' | 'pdf';
  includeCharts?: boolean;
}

// ========================================
// SERVICE
// ========================================

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // ========================================
  // DASHBOARD STATS
  // ========================================

  /**
   * Récupère toutes les statistiques du dashboard
   */
  async getDashboardStats(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date,
    useCache: boolean = true
  ): Promise<DashboardStats> {
    try {
      const cacheKey = `dashboard:${brandId}:${periodStart?.toISOString()}:${periodEnd?.toISOString()}`;

      // Check cache
      if (useCache) {
        const cached = cacheService.get<DashboardStats>(cacheKey);
        if (cached) {
          logger.info('Cache hit for dashboard stats', { brandId });
          return cached;
        }
      }

      // Default to current month
      const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = periodEnd || new Date();

      // Fetch from database - Aggregate data from multiple sources
      const [products, customizations, orders, revenue, ar] = await Promise.all([
        this.getProductStats(brandId, start, end),
        this.getCustomizationStats(brandId, start, end),
        this.getOrderStats(brandId, start, end),
        this.getRevenueStats(brandId, start, end),
        this.getARStats(brandId, start, end),
      ]);

      const stats: DashboardStats = {
        products,
        customizations,
        orders,
        revenue,
        ar,
        periodStart: start,
        periodEnd: end,
      };

      // Cache for 5 minutes
      cacheService.set(cacheKey, stats, { ttl: 300 * 1000 });

      return stats;
    } catch (error: any) {
      logger.error('Error fetching dashboard stats', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // PRODUCT STATS
  // ========================================

  /**
   * Récupère les statistiques par produit
   */
  async getProductStats(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<ProductStats[]> {
    try {
      const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = periodEnd || new Date();

      // Get all products for this brand
      const products = await db.product.findMany({
        where: {
          brandId,
        },
        include: {
          customizations: {
            where: {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          },
          orders: {
            where: {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          },
        },
      });

      // Aggregate stats per product
      const productStatsPromises = products.map(async (product: { id: string; name: string; customizations: Array<{ createdAt: Date | null; updatedAt: Date | null; status: string; config: unknown; zone: { name: string } | null }>; orders: Array<{ totalCents: number | null }> }) => {
        const customizations = product.customizations || [];
        const orders = product.orders || [];

        const totalRevenue = orders.reduce((sum: number, order: { totalCents: number | null }) => {
          return sum + Number(order.totalCents || 0) / 100;
        }, 0);

        // Get product views from UsageMetric
        const views = await db.usageMetric.count({
          where: {
            brandId,
            metricType: 'PRODUCT_VIEW',
            metadata: {
              path: ['productId'],
              equals: product.id,
            } as any,
            timestamp: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
        });
        const customizationsCount = customizations.length;
        const ordersCount = orders.length;
        const conversionRate =
          views > 0 ? (ordersCount / views) * 100 : 0;

        return {
          productId: product.id,
          productName: product.name,
          views,
          customizations: customizationsCount,
          orders: ordersCount,
          revenue: totalRevenue,
          conversionRate,
        };
      });

      const productStats = await Promise.all(productStatsPromises);
      return productStats;
    } catch (error: any) {
      logger.error('Error fetching product stats', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // CUSTOMIZATION STATS
  // ========================================

  /**
   * Récupère les statistiques de personnalisation
   */
  async getCustomizationStats(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<CustomizationStats> {
    try {
      const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = periodEnd || new Date();

      // Fetch customizations for this brand in the period
      const customizations = await db.customization.findMany({
        where: {
          product: {
            brandId,
          },
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          zone: true,
        },
      });

      // Aggregate stats
      const total = customizations.length;
      const completed = customizations.filter((c: any) => c.status === 'COMPLETED').length;
      const failed = customizations.filter((c: any) => c.status === 'FAILED').length;

      // Calculate average time (if we have timestamps)
      const completedCustomizations = customizations.filter((c: any) => c.status === 'COMPLETED');
      let averageTime = 0;
      if (completedCustomizations.length > 0) {
        const totalTime = completedCustomizations.reduce((sum: number, c: { createdAt: Date | null; updatedAt: Date | null }) => {
          if (c.createdAt && c.updatedAt) {
            return sum + (c.updatedAt.getTime() - c.createdAt.getTime());
          }
          return sum;
        }, 0);
        averageTime = totalTime / completedCustomizations.length / 1000; // Convert to seconds
      }

      // Group by effect
      const byEffect: Record<string, number> = {};
      customizations.forEach((c: any) => {
        const effect = (c.config as any)?.effect || 'NORMAL';
        byEffect[effect] = (byEffect[effect] || 0) + 1;
      });

      // Group by zone
      const byZone: Record<string, number> = {};
      customizations.forEach((c: any) => {
        const zoneName = c.zone?.name || 'unknown';
        byZone[zoneName] = (byZone[zoneName] || 0) + 1;
      });

      return {
        total,
        completed,
        failed,
        averageTime,
        byEffect,
        byZone,
      };
    } catch (error: any) {
      logger.error('Error fetching customization stats', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // ORDER STATS
  // ========================================

  /**
   * Récupère les statistiques de commandes
   */
  async getOrderStats(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<OrderStats> {
    try {
      const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = periodEnd || new Date();

      // Fetch orders for this brand in the period
      const orders = await db.order.findMany({
        where: {
          brandId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          items: true,
        },
      });

      // Aggregate stats
      const total = orders.length;
      const totalRevenue = orders.reduce((sum: number, order: { totalCents: number | null }) => {
        return sum + Number(order.totalCents || 0) / 100;
      }, 0);
      const averageOrderValue = total > 0 ? totalRevenue / total : 0;

      // Group by status
      const byStatus: Record<string, number> = {};
      orders.forEach((order) => {
        const status = order.status;
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      // Group by product
      const byProduct: Record<string, number> = {};
      orders.forEach((order) => {
        order.items.forEach((item) => {
          const productId = item.productId;
          byProduct[productId] = (byProduct[productId] || 0) + 1;
        });
      });

      // Calculate trends (daily)
      const trends: Array<{ date: Date; count: number; revenue: number }> = [];
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const dayOrders = orders.filter(
          (o) => o.createdAt >= dayStart && o.createdAt <= dayEnd
        );
        const dayRevenue = dayOrders.reduce((sum: number, o: { totalCents: number | null }) => {
          return sum + Number(o.totalCents || 0) / 100;
        }, 0);

        trends.push({
          date: dayStart,
          count: dayOrders.length,
          revenue: dayRevenue,
        });
      }

      return {
        total,
        totalRevenue,
        averageOrderValue,
        byStatus,
        byProduct,
        trends,
      };
    } catch (error: any) {
      logger.error('Error fetching order stats', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // REVENUE STATS
  // ========================================

  /**
   * Récupère les statistiques de revenus
   */
  async getRevenueStats(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<RevenueStats> {
    try {
      const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = periodEnd || new Date();

      // Fetch orders for this brand in the period
      const orders = await db.order.findMany({
        where: {
          brandId,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
        include: {
          items: true,
        },
      });

      // Calculate total revenue
      const total = orders.reduce((sum: number, order: { totalCents: number | null }) => {
        return sum + Number(order.totalCents || 0) / 100;
      }, 0);

      // Calculate trends (daily)
      const trends: Array<{ date: Date; revenue: number; orders: number }> = [];
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const dayOrders = orders.filter(
          (o) => o.createdAt >= dayStart && o.createdAt <= dayEnd
        );
        const dayRevenue = dayOrders.reduce((sum: number, o: { totalCents: number | null }) => {
          return sum + Number(o.totalCents || 0) / 100;
        }, 0);

        trends.push({
          date: dayStart,
          revenue: dayRevenue,
          orders: dayOrders.length,
        });
      }

      // Group by product
      const productRevenue: Record<string, { productId: string; productName: string; revenue: number; orders: number }> = {};
      orders.forEach((order) => {
        order.items.forEach((item) => {
          const productId = item.productId;
          const productName = item.productName || 'Unknown';
          if (!productRevenue[productId]) {
            productRevenue[productId] = {
              productId,
              productName,
              revenue: 0,
              orders: 0,
            };
          }
          productRevenue[productId].revenue += Number(item.totalPriceCents || 0) / 100;
          productRevenue[productId].orders += 1;
        });
      });

      const byProduct = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue);

      return {
        total,
        periodStart: start,
        periodEnd: end,
        trends,
        byProduct,
      };
    } catch (error: any) {
      logger.error('Error fetching revenue stats', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // AR STATS
  // ========================================

  /**
   * Récupère les statistiques AR
   */
  async getARStats(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<ARStats> {
    try {
      const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = periodEnd || new Date();

      // Use ARAnalyticsService for AR stats
      const { arAnalyticsService } = await import('@/lib/services/ARAnalyticsService');
      
      // Get all products for this brand
      const products = await db.product.findMany({
        where: { brandId },
        select: { id: true },
      });

      let totalSessions = 0;
      let totalUniqueUsers = 0;
      let totalDuration = 0;
      const byProduct: Record<string, number> = {};
      const byDevice: Record<string, number> = {};

      // Aggregate AR stats from all products
      for (const product of products) {
        const productAnalytics = await arAnalyticsService.getProductAnalytics(
          product.id,
          start,
          end
        );

        totalSessions += productAnalytics.totalSessions;
        totalUniqueUsers += productAnalytics.uniqueUsers;
        totalDuration += productAnalytics.averageSessionDuration * productAnalytics.totalSessions;
        byProduct[product.id] = productAnalytics.totalSessions;

        // Aggregate device stats
        Object.entries(productAnalytics.byDevice).forEach(([device, count]) => {
          byDevice[device] = (byDevice[device] || 0) + count;
        });
      }

      const averageSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

      // Calculate conversion rate (AR sessions -> orders)
      const arOrders = await db.order.count({
        where: {
          brandId,
          metadata: {
            path: ['arSessionId'],
            not: null,
          } as any,
          createdAt: {
            gte: start,
            lte: end,
          },
        },
      });

      const conversionRate = totalSessions > 0 ? (arOrders / totalSessions) * 100 : 0;

      return {
        sessions: totalSessions,
        uniqueUsers: totalUniqueUsers,
        averageSessionDuration,
        conversionRate,
        byDevice,
        byProduct,
      };
    } catch (error: any) {
      logger.error('Error fetching AR stats', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // REPORTS
  // ========================================

  /**
   * Génère un rapport personnalisé
   */
  async generateReport(
    brandId: string,
    options: ReportOptions
  ): Promise<{
    reportId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
  }> {
    try {
      logger.info('Generating report', { brandId, options });

      // Use ReportService for report generation
      const { reportService } = await import('./ReportService');
      return await reportService.generateReport(brandId, {
        type: options.type,
        periodStart: options.periodStart,
        periodEnd: options.periodEnd,
        format: options.format,
        includeCharts: options.includeCharts,
      });
    } catch (error: any) {
      logger.error('Error generating report', { error, brandId, options });
      throw error;
    }
  }

  /**
   * Vérifie le statut d'un rapport
   */
  async checkReportStatus(reportId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    error?: string;
  }> {
    try {
      // Use ReportService for status checking
      const { reportService } = await import('./ReportService');
      return await reportService.checkReportStatus(reportId);
    } catch (error: any) {
      logger.error('Error checking report status', { error, reportId });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const analyticsService = AnalyticsService.getInstance();

