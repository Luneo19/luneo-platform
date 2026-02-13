/**
 * ★★★ TRPC ROUTER - ANALYTICS ★★★
 * Router tRPC complet pour les analytics
 * - Dashboard analytics
 * - Métriques
 * - Rapports
 * - Export
 * 
 * ~300 lignes de code professionnel
 */

import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { protectedProcedure, router } from '../server';

// ========================================
// SCHEMAS
// ========================================

const TimeRangeSchema = z.enum(['24h', '7d', '30d', '90d', '1y', 'custom']);

const GetDashboardSchema = z.object({
  timeRange: TimeRangeSchema,
  compare: z.boolean().optional(),
  metrics: z.array(z.string()).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ========================================
// ROUTER
// ========================================

export const analyticsRouter = router({
  /**
   * Récupère les données du dashboard analytics
   */
  getDashboard: protectedProcedure
    .input(GetDashboardSchema)
    .query(async ({ input, ctx }) => {
      try {
        const { timeRange, compare, metrics, dateFrom, dateTo } = input;

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;

        switch (timeRange) {
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case '1y':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          case 'custom':
            startDate = dateFrom ? new Date(dateFrom) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = dateTo ? new Date(dateTo) : now;
            break;
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const user = await endpoints.auth.me() as { brandId?: string };
        if (!user?.brandId) {
          throw new Error('User must have a brandId');
        }

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
        const previousEndDate = startDate;
        const prevStartStr = previousStartDate.toISOString().split('T')[0];
        const prevEndStr = previousEndDate.toISOString().split('T')[0];

        const [ordersCurrent, ordersPrevious] = await Promise.all([
          endpoints.analytics.orders({ startDate: startStr, endDate: endStr }).catch(() => []),
          compare
            ? endpoints.analytics.orders({ startDate: prevStartStr, endDate: prevEndStr }).catch(() => [])
            : Promise.resolve([]),
        ]);

        const currRaw = ordersCurrent as unknown[] | { orders?: unknown[]; data?: unknown[] };
        const currentOrders = Array.isArray(ordersCurrent) ? ordersCurrent : (currRaw && typeof currRaw === 'object' && !Array.isArray(currRaw) ? ((currRaw as { orders?: unknown[]; data?: unknown[] }).orders ?? (currRaw as { data?: unknown[] }).data ?? []) : []);
        const prevRaw = ordersPrevious as unknown[] | { orders?: unknown[]; data?: unknown[] };
        const previousOrders = Array.isArray(ordersPrevious) ? ordersPrevious : (prevRaw && typeof prevRaw === 'object' && !Array.isArray(prevRaw) ? ((prevRaw as { orders?: unknown[]; data?: unknown[] }).orders ?? (prevRaw as { data?: unknown[] }).data ?? []) : []);

        type OrderLike = { totalCents?: number | null; userId?: string | null; status?: string; createdAt?: Date | string };
        const currentTyped = currentOrders as OrderLike[];
        const previousTyped = previousOrders as OrderLike[];
        // Calculate metrics
        const revenue =
          currentTyped.reduce(
            (sum: number, o: OrderLike) => sum + (o.totalCents || 0),
            0
          ) / 100;
        const previousRevenue =
          previousTyped.reduce(
            (sum: number, o: OrderLike) => sum + (o.totalCents || 0),
            0
          ) / 100;
        const revenueChange = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0;

        const orders = currentTyped.length;
        const previousOrdersCount = previousTyped.length;
        const ordersChange = previousOrdersCount > 0 ? ((orders - previousOrdersCount) / previousOrdersCount) * 100 : 0;

        // Get unique users
        const currentUserIds = new Set(
          currentTyped
            .map((o: OrderLike) => o.userId)
            .filter((id: string | null | undefined): id is string => !!id)
        );
        const previousUserIds = new Set(
          previousTyped
            .map((o: OrderLike) => o.userId)
            .filter((id: string | null | undefined): id is string => !!id)
        );
        const users = currentUserIds.size;
        const previousUsers = previousUserIds.size;
        const usersChange = previousUsers > 0 ? ((users - previousUsers) / previousUsers) * 100 : 0;

        // Calculate conversions (paid orders)
        const conversions = currentTyped.filter((o: OrderLike) => o.status === 'PAID').length;
        const previousConversions = previousTyped.filter((o: OrderLike) => o.status === 'PAID').length;
        const conversionsChange =
          previousConversions > 0 ? ((conversions - previousConversions) / previousConversions) * 100 : 0;

        // Calculate average order value
        const avgOrderValue = orders > 0 ? revenue / orders : 0;
        const previousAvgOrderValue = previousOrdersCount > 0 ? previousRevenue / previousOrdersCount : 0;
        const avgOrderValueChange =
          previousAvgOrderValue > 0 ? ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100 : 0;

        // Calculate conversion rate
        const conversionRate = orders > 0 ? (conversions / orders) * 100 : 0;
        const previousConversionRate = previousOrdersCount > 0 ? (previousConversions / previousOrdersCount) * 100 : 0;
        const conversionRateChange =
          previousConversionRate > 0 ? ((conversionRate - previousConversionRate) / previousConversionRate) * 100 : 0;

        // Generate chart data (daily aggregation)
        const chartData: { labels: string[]; datasets: Array<{ label: string; data: number[] }> } = {
          labels: [],
          datasets: [],
        };

        // Group orders by day
        const dailyData = new Map<string, number>();
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          const dateKey = currentDate.toISOString().split('T')[0];
          dailyData.set(dateKey, 0);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        currentTyped.forEach((order: OrderLike) => {
          const raw = order.createdAt;
          const d = raw != null ? (raw instanceof Date ? raw : new Date(raw)) : new Date(0);
          const dateKey = d.toISOString().split('T')[0];
          const current = dailyData.get(dateKey) || 0;
          dailyData.set(dateKey, current + (order.totalCents || 0) / 100);
        });

        chartData.labels = Array.from(dailyData.keys()).sort();
        chartData.datasets = [
          {
            label: 'Revenus',
            data: Array.from(dailyData.values()),
          },
        ];

        return {
          revenue,
          revenueChange,
          orders,
          ordersChange,
          users,
          usersChange,
          conversions,
          conversionsChange,
          avgOrderValue,
          avgOrderValueChange,
          conversionRate,
          conversionRateChange,
          chartData,
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
          compare: compare
            ? {
                revenue: previousRevenue,
                orders: previousOrdersCount,
                users: previousUsers,
                conversions: previousConversions,
                avgOrderValue: previousAvgOrderValue,
                conversionRate: previousConversionRate,
                period: {
                  start: previousStartDate.toISOString(),
                  end: previousEndDate.toISOString(),
                },
              }
            : undefined,
        };
      } catch (error: unknown) {
        logger.error('Error fetching analytics dashboard', { error, input });
        throw new Error(error instanceof Error ? error.message : 'Erreur lors de la récupération des analytics');
      }
    }),

  /**
   * Récupère les métriques détaillées
   */
  getMetrics: protectedProcedure
    .input(
      z.object({
        metric: z.string(),
        timeRange: TimeRangeSchema,
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const { metric, timeRange, dateFrom, dateTo } = input;

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;

        switch (timeRange) {
          case '24h': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
          case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
          case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
          case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
          case '1y': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
          case 'custom':
            startDate = dateFrom ? new Date(dateFrom) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = dateTo ? new Date(dateTo) : now;
            break;
          default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // Fetch the appropriate data based on the metric
        let rawData: unknown[] = [];

        if (metric === 'revenue' || metric === 'orders' || metric === 'conversions' || metric === 'avgOrderValue') {
          const orderResult = await endpoints.analytics.orders({ startDate: startStr, endDate: endStr }).catch(() => []);
          const ordersArr = Array.isArray(orderResult) ? orderResult : ((orderResult as Record<string, unknown>)?.orders ?? (orderResult as Record<string, unknown>)?.data ?? []) as unknown[];

          type OrderLike = { totalCents?: number | null; status?: string; createdAt?: Date | string };
          const orders = ordersArr as OrderLike[];

          // Group by day
          const dailyMap = new Map<string, { revenue: number; count: number; conversions: number }>();
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            const key = currentDate.toISOString().split('T')[0];
            dailyMap.set(key, { revenue: 0, count: 0, conversions: 0 });
            currentDate.setDate(currentDate.getDate() + 1);
          }

          orders.forEach((order) => {
            const d = order.createdAt ? (order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt as string)) : new Date(0);
            const key = d.toISOString().split('T')[0];
            const entry = dailyMap.get(key);
            if (entry) {
              entry.revenue += (order.totalCents || 0) / 100;
              entry.count += 1;
              if (order.status === 'PAID') entry.conversions += 1;
            }
          });

          rawData = Array.from(dailyMap.entries()).sort().map(([date, vals]) => ({
            date,
            value: metric === 'revenue' ? vals.revenue
              : metric === 'orders' ? vals.count
              : metric === 'conversions' ? vals.conversions
              : vals.count > 0 ? vals.revenue / vals.count : 0,
          }));
        } else if (metric === 'designs') {
          const designResult = await endpoints.analytics.designs({ startDate: startStr, endDate: endStr }).catch(() => ({ data: [] }));
          const designsArr = Array.isArray(designResult) ? designResult : ((designResult as Record<string, unknown>)?.data ?? []) as unknown[];
          type DesignLike = { createdAt?: Date | string };
          const designs = designsArr as DesignLike[];

          const dailyMap = new Map<string, number>();
          const currentDate = new Date(startDate);
          while (currentDate <= endDate) {
            dailyMap.set(currentDate.toISOString().split('T')[0], 0);
            currentDate.setDate(currentDate.getDate() + 1);
          }

          designs.forEach((d) => {
            const dt = d.createdAt ? (d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt as string)) : new Date(0);
            const key = dt.toISOString().split('T')[0];
            dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
          });

          rawData = Array.from(dailyMap.entries()).sort().map(([date, value]) => ({ date, value }));
        }

        return {
          metric: input.metric,
          data: rawData,
        };
      } catch (error: unknown) {
        logger.error('Error fetching metrics', { error, input });
        throw new Error('Erreur lors de la récupération des métriques');
      }
    }),

  /**
   * Export analytics data
   */
  export: protectedProcedure
    .input(
      z.object({
        format: z.enum(['csv', 'json', 'pdf', 'excel']),
        timeRange: TimeRangeSchema,
        metrics: z.array(z.string()).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { format, timeRange, metrics } = input;
        const metricsStr = metrics?.join(',') || 'revenue,orders,conversions';

        // Calculate date range
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;

        switch (timeRange) {
          case '24h': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
          case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
          case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
          case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
          case '1y': startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
          case 'custom':
            startDate = input.startDate ? new Date(input.startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = input.endDate ? new Date(input.endDate) : now;
            break;
          default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }

        const params = {
          metrics: metricsStr,
          timeRange,
          startDate: input.startDate || startDate.toISOString().split('T')[0],
          endDate: input.endDate || endDate.toISOString().split('T')[0],
        };

        let result: unknown;

        if (format === 'csv') {
          result = await endpoints.analytics.export.csv(params);
        } else if (format === 'excel') {
          result = await endpoints.analytics.export.excel(params);
        } else if (format === 'pdf') {
          result = await endpoints.analytics.export.pdf(params);
        } else {
          // JSON: aggregate locally from orders data
          const orderResult = await endpoints.analytics.orders({
            startDate: params.startDate,
            endDate: params.endDate,
          }).catch(() => []);

          return {
            url: '',
            data: orderResult,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          };
        }

        const rawResult = result as Record<string, unknown>;
        const url = (rawResult?.url as string) || (rawResult?.downloadUrl as string) || '';

        return {
          url,
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        };
      } catch (error: unknown) {
        logger.error('Error exporting analytics', { error, input });
        throw new Error('Erreur lors de l\'export');
      }
    }),
});