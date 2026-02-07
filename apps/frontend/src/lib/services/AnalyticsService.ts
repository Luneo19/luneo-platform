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
import { api, endpoints } from '@/lib/api/client';

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

  private periodToParam(periodStart?: Date, periodEnd?: Date): string {
    if (periodStart && periodEnd) {
      const days = Math.round((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 7) return 'last_7_days';
      if (days <= 30) return 'last_30_days';
      if (days <= 90) return 'last_90_days';
      return 'last_year';
    }
    return 'last_30_days';
  }

  /**
   * Récupère toutes les statistiques du dashboard (via backend API)
   */
  async getDashboardStats(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date,
    useCache: boolean = true
  ): Promise<DashboardStats> {
    try {
      const cacheKey = `dashboard:${brandId}:${periodStart?.toISOString()}:${periodEnd?.toISOString()}`;

      if (useCache) {
        const cached = cacheService.get<DashboardStats>(cacheKey);
        if (cached) {
          logger.info('Cache hit for dashboard stats', { brandId });
          return cached;
        }
      }

      const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = periodEnd || new Date();
      const period = this.periodToParam(start, end);

      const [dashboardRes, usageRes, revenueRes] = await Promise.all([
        api.get<any>('/api/v1/analytics/dashboard', { params: { period } }),
        api.get<any>('/api/v1/analytics/usage', { params: { brandId } }).catch(() => null),
        endpoints.analytics.revenue({ startDate: start.toISOString(), endDate: end.toISOString() }).catch(() => null),
      ]);

      const metrics = dashboardRes?.metrics ?? dashboardRes ?? {};
      const charts = dashboardRes?.charts ?? {};
      const products: ProductStats[] = Array.isArray(metrics.products) ? metrics.products : (charts.designsOverTime ? [] : []);
      const customizations: CustomizationStats = {
        total: metrics.totalDesigns ?? usageRes?.totalDesigns ?? 0,
        completed: metrics.totalRenders ?? usageRes?.totalRenders ?? 0,
        failed: 0,
        averageTime: 0,
        byEffect: {},
        byZone: {},
      };
      const orders: OrderStats = {
        total: metrics.orders ?? 0,
        totalRevenue: metrics.revenue ?? (revenueRes as { total?: number } | null)?.total ?? 0,
        averageOrderValue: metrics.orders ? (metrics.revenue ?? 0) / metrics.orders : 0,
        byStatus: {},
        byProduct: {},
        trends: Array.isArray(charts.revenueOverTime) ? charts.revenueOverTime.map((d: any) => ({ date: new Date(d.date ?? d.x), count: d.count ?? 0, revenue: d.revenue ?? d.y ?? 0 })) : [],
      };
      const revenue: RevenueStats = {
        total: metrics.revenue ?? 0,
        periodStart: start,
        periodEnd: end,
        trends: Array.isArray(charts.revenueOverTime) ? charts.revenueOverTime.map((d: any) => ({ date: new Date(d.date ?? d.x), revenue: d.revenue ?? d.y ?? 0, orders: d.orders ?? 0 })) : [],
        byProduct: [],
      };
      const ar: ARStats = {
        sessions: 0,
        uniqueUsers: metrics.activeUsers ?? 0,
        averageSessionDuration: 0,
        conversionRate: metrics.conversionChange ?? 0,
        byDevice: {},
        byProduct: {},
      };

      const stats: DashboardStats = {
        products,
        customizations,
        orders,
        revenue,
        ar,
        periodStart: start,
        periodEnd: end,
      };

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
   * Récupère les statistiques par produit (via backend API)
   */
  async getProductStats(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<ProductStats[]> {
    try {
      const period = this.periodToParam(periodStart, periodEnd);
      const res = await api.get<any>('/api/v1/analytics/dashboard', { params: { period, brandId } });
      const products = res?.products ?? res?.metrics?.products ?? [];
      return Array.isArray(products) ? products.map((p: any) => ({
        productId: p.productId ?? p.id,
        productName: p.productName ?? p.name ?? '',
        views: p.views ?? 0,
        customizations: p.customizations ?? 0,
        orders: p.orders ?? 0,
        revenue: p.revenue ?? 0,
        conversionRate: p.conversionRate ?? 0,
      })) : [];
    } catch (error: any) {
      logger.error('Error fetching product stats', { error, brandId });
      throw error;
    }
  }

  // ========================================
  // CUSTOMIZATION STATS
  // ========================================

  /**
   * Récupère les statistiques de personnalisation (via backend API)
   */
  async getCustomizationStats(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<CustomizationStats> {
    try {
      const res = await api.get<any>('/api/v1/analytics/usage', { params: { brandId } });
      const u = res?.customizations ?? res ?? {};
      return {
        total: u.total ?? res?.totalDesigns ?? 0,
        completed: u.completed ?? res?.totalRenders ?? 0,
        failed: u.failed ?? 0,
        averageTime: u.averageTime ?? 0,
        byEffect: u.byEffect ?? {},
        byZone: u.byZone ?? {},
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
   * Récupère les statistiques de commandes (via backend API)
   */
  async getOrderStats(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<OrderStats> {
    try {
      const period = this.periodToParam(periodStart, periodEnd);
      const res = await endpoints.analytics.orders({
        startDate: (periodStart ?? new Date()).toISOString(),
        endDate: (periodEnd ?? new Date()).toISOString(),
      });
      const data = (res as any)?.data ?? res ?? {};
      return {
        total: data.total ?? 0,
        totalRevenue: data.totalRevenue ?? data.revenue ?? 0,
        averageOrderValue: data.averageOrderValue ?? 0,
        byStatus: data.byStatus ?? {},
        byProduct: data.byProduct ?? {},
        trends: Array.isArray(data.trends) ? data.trends.map((t: any) => ({ date: new Date(t.date), count: t.count ?? 0, revenue: t.revenue ?? 0 })) : [],
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
   * Récupère les statistiques de revenus (via backend API)
   */
  async getRevenueStats(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<RevenueStats> {
    try {
      const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = periodEnd || new Date();
      const res = await endpoints.analytics.revenue({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      const data = (res as any)?.data ?? res ?? {};
      const trends = Array.isArray(data.trends) ? data.trends.map((t: any) => ({
        date: new Date(t.date ?? t.x),
        revenue: t.revenue ?? t.y ?? 0,
        orders: t.orders ?? 0,
      })) : [];
      return {
        total: data.total ?? 0,
        periodStart: start,
        periodEnd: end,
        trends,
        byProduct: Array.isArray(data.byProduct) ? data.byProduct : [],
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
   * Récupère les statistiques AR (via backend API or defaults)
   */
  async getARStats(
    brandId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<ARStats> {
    try {
      const res = await api.get<any>('/api/v1/analytics/ar', {
        params: { brandId, start: periodStart?.toISOString(), end: periodEnd?.toISOString() },
      }).catch(() => null);
      const data = res ?? {};
      return {
        sessions: data.sessions ?? 0,
        uniqueUsers: data.uniqueUsers ?? 0,
        averageSessionDuration: data.averageSessionDuration ?? 0,
        conversionRate: data.conversionRate ?? 0,
        byDevice: data.byDevice ?? {},
        byProduct: data.byProduct ?? {},
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

