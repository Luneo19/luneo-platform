/**
 * ★★★ TRPC ROUTER - FACTURATION ★★★
 * Router tRPC complet pour la facturation
 * - Gestion abonnements
 * - Gestion factures
 * - Usage & limits
 * - Payment methods
 * - Refunds
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../server';
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';
import { billingService } from '@/lib/services/BillingService';
import { db } from '@/lib/db';

// ========================================
// SCHEMAS
// ========================================

const PlanSchema = z.enum(['free', 'starter', 'pro', 'enterprise']);

const UpdateSubscriptionSchema = z.object({
  plan: PlanSchema,
  cancelAtPeriodEnd: z.boolean().optional(),
});

// ========================================
// ROUTER
// ========================================

export const billingRouter = router({
  // ========================================
  // SUBSCRIPTIONS
  // ========================================

  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    if (!user?.brandId) {
      throw new Error('User must be associated with a brand');
    }

    const subscription = await billingService.getSubscription(user.brandId);

    return subscription;
  }),

  updateSubscription: protectedProcedure
    .input(UpdateSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      const subscription = await billingService.updateSubscription(user.brandId, input);

      logger.info('Subscription updated', {
        brandId: user.brandId,
        plan: input.plan,
      });

      return subscription;
    }),

  cancelSubscription: protectedProcedure
    .input(
      z.object({
        cancelAtPeriodEnd: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      const subscription = await billingService.cancelSubscription(
        user.brandId,
        input.cancelAtPeriodEnd
      );

      logger.info('Subscription cancelled', {
        brandId: user.brandId,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
      });

      return subscription;
    }),

  reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const { user } = ctx;

    if (!user?.brandId) {
      throw new Error('User must be associated with a brand');
    }

    const subscription = await billingService.reactivateSubscription(user.brandId);

    logger.info('Subscription reactivated', { brandId: user.brandId });

    return subscription;
  }),

  // ========================================
  // INVOICES
  // ========================================

  listInvoices: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().max(100).default(20),
        offset: z.number().int().nonnegative().default(0),
        status: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      return await billingService.listInvoices(user.brandId, input);
    }),

  getInvoice: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await billingService.getInvoice(input.id);

      return invoice;
    }),

  downloadInvoice: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await billingService.downloadInvoice(input.id);

      return result;
    }),

  // ========================================
  // USAGE & LIMITS
  // ========================================

  getUsageMetrics: protectedProcedure
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

      return await billingService.getUsageMetrics(
        user.brandId,
        input.periodStart,
        input.periodEnd
      );
    }),

  getBillingLimits: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    if (!user?.brandId) {
      throw new Error('User must be associated with a brand');
    }

    return await billingService.getBillingLimits(user.brandId);
  }),

  checkLimit: protectedProcedure
    .input(
      z.object({
        metric: z.enum(['customizations', 'renders', 'apiCalls', 'storage']),
      })
    )
    .query(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      return await billingService.checkLimit(user.brandId, input.metric);
    }),

  // ========================================
  // PAYMENT METHODS
  // ========================================

  listPaymentMethods: protectedProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    if (!user?.brandId) {
      throw new Error('User must be associated with a brand');
    }

    return await billingService.listPaymentMethods(user.brandId);
  }),

  addPaymentMethod: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      const paymentMethod = await billingService.addPaymentMethod(
        user.brandId,
        input.paymentMethodId
      );

      logger.info('Payment method added', {
        brandId: user.brandId,
        paymentMethodId: input.paymentMethodId,
      });

      return paymentMethod;
    }),

  removePaymentMethod: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await billingService.removePaymentMethod(input.paymentMethodId);

      logger.info('Payment method removed', {
        paymentMethodId: input.paymentMethodId,
      });
    }),

  setDefaultPaymentMethod: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      await billingService.setDefaultPaymentMethod(user.brandId, input.paymentMethodId);

      logger.info('Default payment method set', {
        brandId: user.brandId,
        paymentMethodId: input.paymentMethodId,
      });
    }),

  // ========================================
  // REFUNDS
  // ========================================

  createRefund: protectedProcedure
    .input(
      z.object({
        paymentIntentId: z.string().min(1),
        amount: z.number().positive().optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const refund = await billingService.createRefund(
        input.paymentIntentId,
        input.amount,
        input.reason
      );

      logger.info('Refund created', {
        paymentIntentId: input.paymentIntentId,
        refundId: refund.id,
      });

      return refund;
    }),
});

