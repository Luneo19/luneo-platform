/**
 * ★★★ TRPC ROUTER - ANALYTICS ★★★
 * Router tRPC complet pour les analytics
 * - Dashboard stats
 * - Product stats
 * - Customization stats
 * - Order stats
 * - Revenue stats
 * - AR stats
 * - Reports
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { analyticsService } from '@/lib/services/AnalyticsService';

// db importé depuis @/lib/db

// ========================================
// SCHEMAS
// ========================================

const ReportTypeSchema = z.enum([
  'products',
  'customizations',
  'orders',
  'revenue',
  'ar',
  'full',
]);

const ReportFormatSchema = z.enum(['json', 'csv', 'pdf']);

// ========================================
// ROUTER
// ========================================

export const analyticsRouter = router({
  // ========================================
  // DASHBOARD
  // ========================================

  getDashboardStats: protectedProcedure
    .input(
      z.object({
        periodStart: z.date().optional(),
        periodEnd: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      return await analyticsService.getDashboardStats(
        user.brandId,
        input.periodStart,
        input.periodEnd
      );
    }),

  // ========================================
  // PRODUCT STATS
  // ========================================

  getProductStats: protectedProcedure
    .input(
      z.object({
        periodStart: z.date().optional(),
        periodEnd: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      return await analyticsService.getProductStats(
        user.brandId,
        input.periodStart,
        input.periodEnd
      );
    }),

  // ========================================
  // CUSTOMIZATION STATS
  // ========================================

  getCustomizationStats: protectedProcedure
    .input(
      z.object({
        periodStart: z.date().optional(),
        periodEnd: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      return await analyticsService.getCustomizationStats(
        user.brandId,
        input.periodStart,
        input.periodEnd
      );
    }),

  // ========================================
  // ORDER STATS
  // ========================================

  getOrderStats: protectedProcedure
    .input(
      z.object({
        periodStart: z.date().optional(),
        periodEnd: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      return await analyticsService.getOrderStats(
        user.brandId,
        input.periodStart,
        input.periodEnd
      );
    }),

  // ========================================
  // REVENUE STATS
  // ========================================

  getRevenueStats: protectedProcedure
    .input(
      z.object({
        periodStart: z.date().optional(),
        periodEnd: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      return await analyticsService.getRevenueStats(
        user.brandId,
        input.periodStart,
        input.periodEnd
      );
    }),

  // ========================================
  // AR STATS
  // ========================================

  getARStats: protectedProcedure
    .input(
      z.object({
        periodStart: z.date().optional(),
        periodEnd: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      return await analyticsService.getARStats(
        user.brandId,
        input.periodStart,
        input.periodEnd
      );
    }),

  // ========================================
  // REPORTS
  // ========================================

  generateReport: protectedProcedure
    .input(
      z.object({
        type: ReportTypeSchema,
        periodStart: z.date(),
        periodEnd: z.date(),
        format: ReportFormatSchema,
        includeCharts: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      const result = await analyticsService.generateReport(user.brandId, input);

      logger.info('Report generation started', {
        brandId: user.brandId,
        reportId: result.reportId,
        type: input.type,
      });

      return result;
    }),

  checkReportStatus: protectedProcedure
    .input(z.object({ reportId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await analyticsService.checkReportStatus(input.reportId);
    }),
});

