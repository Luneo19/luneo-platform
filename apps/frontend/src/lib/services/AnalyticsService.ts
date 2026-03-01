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

      type DashboardApiRes = { metrics?: Record<string, unknown>; charts?: Record<string, unknown> };
      type UsageApiRes = { totalDesigns?: number; totalRenders?: number } | null;
      const [dashboardRes, usageRes, revenueRes] = await Promise.all([
        api.get<DashboardApiRes>('/api/v1/analytics/dashboard', { params: { period } }),
        api.get<UsageApiRes>('/api/v1/analytics/usage', { params: { brandId } }).catch(() => null),
        endpoints.analytics.revenue({ startDate: start.toISOString(), endDate: end.toISOString() }).catch(() => null),
      ]);

      const metrics: Record<string, unknown> = (dashboardRes as DashboardApiRes)?.metrics ?? (dashboardRes as Record<string, unknown>) ?? {};
      const charts: Record<string, unknown> = (dashboardRes as DashboardApiRes)?.charts ?? {};
      const products: ProductStats[] = Array.isArray(metrics.products) ? (metrics.products as ProductStats[]) : (charts.designsOverTime ? [] : []);
      const customizations: CustomizationStats = {
        total: Number(metrics.totalDesigns ?? (usageRes as UsageApiRes)?.totalDesigns ?? 0),
        completed: Number(metrics.totalRenders ?? (usageRes as UsageApiRes)?.totalRenders ?? 0),
        failed: 0,
        averageTime: 0,
        byEffect: {},
        byZone: {},
      };
      const orders: OrderStats = {
        total: Number(metrics.orders ?? 0),
        totalRevenue: Number(metrics.revenue ?? (revenueRes as { total?: number } | null)?.total ?? 0),
        averageOrderValue: Number(metrics.orders) ? Number(metrics.revenue ?? 0) / Number(metrics.orders) : 0,
        byStatus: {},
        byProduct: {},
        trends: Array.isArray(charts.revenueOverTime) ? (charts.revenueOverTime as Array<{ date?: string | number; x?: string | number; count?: number; revenue?: number; y?: number }>).map((d) => ({ date: new Date(d.date ?? d.x ?? 0), count: d.count ?? 0, revenue: d.revenue ?? d.y ?? 0 })) : [],
      };
      const revenue: RevenueStats = {
        total: Number(metrics.revenue ?? 0),
        periodStart: start,
        periodEnd: end,
        trends: Array.isArray(charts.revenueOverTime) ? (charts.revenueOverTime as Array<{ date?: string | number; x?: string | number; revenue?: number; y?: number; orders?: number }>).map((d) => ({ date: new Date(d.date ?? d.x ?? 0), revenue: d.revenue ?? d.y ?? 0, orders: d.orders ?? 0 })) : [],
        byProduct: [],
      };
      const ar: ARStats = {
        sessions: 0,
        uniqueUsers: Number(metrics.activeUsers ?? 0),
        averageSessionDuration: 0,
        conversionRate: Number(metrics.conversionChange ?? 0),
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
    } catch (error: unknown) {
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
      type DashboardListRes = { products?: unknown[]; metrics?: { products?: unknown[] } };
      const res = await api.get<DashboardListRes>('/api/v1/analytics/dashboard', { params: { period, brandId } });
      const products = res?.products ?? (res?.metrics?.products ?? []) ?? [];
      const productsList = Array.isArray(products) ? (products as Array<Record<string, unknown>>) : [];
      return productsList.map((p) => ({
        productId: String(p.productId ?? p.id ?? ''),
        productName: String(p.productName ?? p.name ?? ''),
        views: Number(p.views ?? 0),
        customizations: Number(p.customizations ?? 0),
        orders: Number(p.orders ?? 0),
        revenue: Number(p.revenue ?? 0),
        conversionRate: Number(p.conversionRate ?? 0),
      }));
    } catch (error: unknown) {
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
    _periodStart?: Date,
    _periodEnd?: Date
  ): Promise<CustomizationStats> {
    try {
      type UsageRes = { customizations?: Record<string, unknown>; totalDesigns?: number; totalRenders?: number };
      const res = await api.get<UsageRes & Record<string, unknown>>('/api/v1/analytics/usage', { params: { brandId } });
      const u: Record<string, unknown> = (res?.customizations as Record<string, unknown>) ?? res ?? {};
      return {
        total: Number(u.total ?? res?.totalDesigns ?? 0),
        completed: Number(u.completed ?? res?.totalRenders ?? 0),
        failed: Number(u.failed ?? 0),
        averageTime: Number(u.averageTime ?? 0),
        byEffect: (u.byEffect as Record<string, number>) ?? {},
        byZone: (u.byZone as Record<string, number>) ?? {},
      };
    } catch (error: unknown) {
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
      const res = await endpoints.analytics.orders({
        startDate: (periodStart ?? new Date()).toISOString(),
        endDate: (periodEnd ?? new Date()).toISOString(),
      });
      const data = (res as unknown as { data?: Record<string, unknown> } | null)?.data ?? (res as Record<string, unknown> | null) ?? {};
      const trendsRaw = data.trends as Array<{ date: string | number; count?: number; revenue?: number }> | undefined;
      return {
        total: Number(data.total ?? 0),
        totalRevenue: Number(data.totalRevenue ?? data.revenue ?? 0),
        averageOrderValue: Number(data.averageOrderValue ?? 0),
        byStatus: (data.byStatus as Record<string, number>) ?? {},
        byProduct: (data.byProduct as Record<string, number>) ?? {},
        trends: Array.isArray(trendsRaw) ? trendsRaw.map((t) => ({ date: new Date(t.date), count: t.count ?? 0, revenue: t.revenue ?? 0 })) : [],
      };
    } catch (error: unknown) {
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
      const data = (res as { data?: Record<string, unknown> } | null)?.data ?? (res as Record<string, unknown> | null) ?? {};
      const trendsRaw = data.trends as Array<{ date?: string | number; x?: string | number; revenue?: number; y?: number; orders?: number }> | undefined;
      const trends = Array.isArray(trendsRaw) ? trendsRaw.map((t) => ({
        date: new Date(t.date ?? t.x ?? 0),
        revenue: Number(t.revenue ?? t.y ?? 0),
        orders: Number(t.orders ?? 0),
      })) : [];
      return {
        total: Number(data.total ?? 0),
        periodStart: start,
        periodEnd: end,
        trends,
        byProduct: Array.isArray(data.byProduct) ? data.byProduct : [],
      };
    } catch (error: unknown) {
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
      type ARStatsRes = { sessions?: number; uniqueUsers?: number; averageSessionDuration?: number; conversionRate?: number; byDevice?: Record<string, number>; byProduct?: Record<string, number> };
      const res = await api.get<ARStatsRes>('/api/v1/analytics/ar', {
        params: { brandId, start: periodStart?.toISOString(), end: periodEnd?.toISOString() },
      }).catch(() => null);
      const data = res ?? {};
      return {
        sessions: Number(data.sessions ?? 0),
        uniqueUsers: Number(data.uniqueUsers ?? 0),
        averageSessionDuration: Number(data.averageSessionDuration ?? 0),
        conversionRate: Number(data.conversionRate ?? 0),
        byDevice: data.byDevice ?? {},
        byProduct: data.byProduct ?? {},
      };
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
      logger.error('Error checking report status', { error, reportId });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const analyticsService = AnalyticsService.getInstance();

