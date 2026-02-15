/**
 * ★★★ TRPC ROUTER - INTÉGRATIONS E-COMMERCE ★★★
 * Router tRPC complet pour les intégrations
 * - Shopify
 * - WooCommerce
 * - Magento
 * - Sync
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { logger } from '@/lib/logger';
import { integrationService } from '@/lib/services/IntegrationService';
import { endpoints } from '@/lib/api/client';

// ========================================
// SCHEMAS
// ========================================

const PlatformSchema = z.enum(['shopify', 'woocommerce', 'magento', 'custom']);

const CreateShopifyIntegrationSchema = z.object({
  shopDomain: z.string().min(1),
  accessToken: z.string().min(1),
});

const CreateWooCommerceIntegrationSchema = z.object({
  shopDomain: z.string().min(1),
  consumerKey: z.string().min(1),
  consumerSecret: z.string().min(1),
});

const SyncOptionsSchema = z.object({
  products: z.boolean().optional(),
  orders: z.boolean().optional(),
  inventory: z.boolean().optional(),
  direction: z.enum(['import', 'export', 'both']).optional(),
});

// ========================================
// ROUTER
// ========================================

export const integrationRouter = router({
  // ========================================
  // CRUD
  // ========================================

  list: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    if (!user?.brandId) {
      throw new Error('User must be associated with a brand');
    }

    return await integrationService.listIntegrations(user.brandId);
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return await integrationService.getIntegrationById(input.id);
    }),

  // ========================================
  // SHOPIFY
  // ========================================

  createShopify: protectedProcedure
    .input(CreateShopifyIntegrationSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      const integration = await integrationService.createShopifyIntegration({
        brandId: user.brandId,
        ...input,
      });

      logger.info('Shopify integration created', {
        brandId: user.brandId,
        shopDomain: input.shopDomain,
      });

      return integration;
    }),

  syncShopify: protectedProcedure
    .input(
      z.object({
        integrationId: z.string().cuid(),
        options: SyncOptionsSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await integrationService.syncShopify(
        input.integrationId,
        input.options || {}
      );

      logger.info('Shopify sync completed', {
        integrationId: input.integrationId,
        result,
      });

      return result;
    }),

  // ========================================
  // WOOCOMMERCE
  // ========================================

  createWooCommerce: protectedProcedure
    .input(CreateWooCommerceIntegrationSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      const integration = await integrationService.createWooCommerceIntegration({
        brandId: user.brandId,
        ...input,
      });

      logger.info('WooCommerce integration created', {
        brandId: user.brandId,
        shopDomain: input.shopDomain,
      });

      return integration;
    }),

  syncWooCommerce: protectedProcedure
    .input(
      z.object({
        integrationId: z.string().cuid(),
        options: SyncOptionsSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await integrationService.syncWooCommerce(
        input.integrationId,
        input.options || {}
      );

      logger.info('WooCommerce sync completed', {
        integrationId: input.integrationId,
        result,
      });

      return result;
    }),

  // ========================================
  // GENERIC SYNC
  // ========================================

  sync: protectedProcedure
    .input(
      z.object({
        integrationId: z.string().cuid(),
        options: SyncOptionsSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await integrationService.syncIntegration(
        input.integrationId,
        input.options || {}
      );

      logger.info('Integration sync completed', {
        integrationId: input.integrationId,
        result,
      });

      return result;
    }),

  // ========================================
  // DELETE
  // ========================================

  delete: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      await integrationService.deleteIntegration(input.id, user.brandId);

      logger.info('Integration deleted', {
        integrationId: input.id,
        brandId: user.brandId,
      });
    }),

  // ========================================
  // ANALYTICS
  // ========================================

  getAnalytics: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      try {
        const params: {
          brandId: string;
          startDate?: string;
          endDate?: string;
        } = {
          brandId: user.brandId,
        };

        if (input?.startDate) {
          params.startDate = input.startDate.toISOString();
        }
        if (input?.endDate) {
          params.endDate = input.endDate.toISOString();
        }

        const analytics = await endpoints.integrations.analytics(params);

        logger.info('Integration analytics retrieved', {
          brandId: user.brandId,
          totalIntegrations: analytics.totalIntegrations,
        });

        return analytics;
      } catch (error) {
        logger.error('Error fetching integration analytics', {
          error,
          brandId: user.brandId,
        });
        throw new Error('Failed to fetch integration analytics');
      }
    }),
});
