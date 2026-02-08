/**
 * ★★★ TRPC ROUTER - COMMANDES ★★★
 * Router tRPC complet pour les commandes
 * - CRUD commandes
 * - Workflow statuts
 * - Génération fichiers production
 * - Tracking
 * - Intégration POD
 */

import { api, endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { OrderStatus } from '@/lib/types/order';
import { z } from 'zod';
import { protectedProcedure, router } from '../server';

// ========================================
// SCHEMAS
// ========================================

const OrderItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().cuid(),
  productName: z.string().min(1),
  customizationId: z.string().cuid().optional(),
  designId: z.string().cuid().optional(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  metadata: z.record(z.any()).optional(),
});

const ShippingAddressSchema = z.object({
  name: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().optional(),
  state: z.string().optional(),
});

const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1),
  shippingAddress: ShippingAddressSchema,
  billingAddress: ShippingAddressSchema.optional(),
  paymentMethodId: z.string().optional(),
  customerNotes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const UpdateOrderSchema = z.object({
  id: z.string().cuid(),
  status: z.nativeEnum(OrderStatus).optional(),
  trackingNumber: z.string().optional(),
  shippingProvider: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// ========================================
// ROUTER
// ========================================

export const orderRouter = router({
  // ========================================
  // CREATE
  // ========================================

  create: protectedProcedure
    .input(CreateOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;

      if (!user) {
        throw new Error('User not authenticated');
      }

      logger.info('Creating order', { userId: user.id, itemsCount: input.items.length });

      // Get current user (brandId) from backend
      const me = await endpoints.auth.me();
      const brandId = (me as { brandId?: string }).brandId;

      if (!brandId) {
        throw new Error('User must be associated with a brand');
      }

      // Map frontend input to backend CreateOrderDto shape
      const createBody = {
        items: input.items.map((item: { productId: string; designId?: string; quantity: number; metadata?: Record<string, unknown> }) => ({
          product_id: item.productId,
          design_id: item.designId,
          quantity: item.quantity,
          customization: item.metadata,
        })),
        customerEmail: user.email,
        customerName: input.shippingAddress.name,
        customerPhone: input.shippingAddress.phone,
        shippingAddress: {
          line1: input.shippingAddress.street,
          line2: undefined,
          city: input.shippingAddress.city,
          state: input.shippingAddress.state,
          postalCode: input.shippingAddress.postalCode,
          country: input.shippingAddress.country,
        },
        shippingMethod: (input.metadata as Record<string, unknown>)?.shippingMethod as string | undefined || 'standard',
        metadata: {
          items: input.items,
          billingAddress: input.billingAddress,
          ...input.metadata,
        },
      };

      const order = await api.post<{
        id: string;
        orderNumber?: string;
        status: string;
        customerEmail?: string;
        customerName?: string;
        customerPhone?: string;
        shippingAddress?: any;
        subtotalCents?: number;
        taxCents?: number;
        shippingCents?: number;
        totalCents?: number;
        currency?: string;
        paymentStatus?: string;
        notes?: string;
        metadata?: any;
        userId?: string;
        brandId?: string;
        designId?: string;
        productId?: string;
        items?: any[];
        createdAt?: string;
        updatedAt?: string;
      }>('/api/v1/orders', createBody);

      logger.info('Order created', { orderId: order.id, orderNumber: order.orderNumber });

      return order;
    }),

  // ========================================
  // READ
  // ========================================

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      const order = await endpoints.orders.get(input.id);

      if (!order) {
        throw new Error('Order not found');
      }

      return order as Record<string, unknown>;
    }),

  list: protectedProcedure
    .input(
      z.object({
        status: z.nativeEnum(OrderStatus).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().int().positive().max(100).default(20),
        offset: z.number().int().nonnegative().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      const page = Math.floor(input.offset / input.limit) + 1;
      const result = await endpoints.orders.list({
        page,
        limit: input.limit,
        status: input.status,
      });

      const data = result as { orders?: unknown[]; pagination?: { total: number } };
      const orders = data.orders ?? (result as { data?: unknown[] }).data ?? [];
      const total = data.pagination?.total ?? orders.length;

      return {
        orders,
        total,
        hasMore: input.offset + input.limit < total,
      };
    }),

  // ========================================
  // UPDATE
  // ========================================

  update: protectedProcedure
    .input(UpdateOrderSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }
      const { id, ...data } = input;

      const existingOrder = await endpoints.orders.get(id);
      if (!existingOrder) {
        throw new Error('Order not found');
      }

      const order = await api.put(`/api/v1/orders/${id}`, {
        ...data,
        ...(data.status ? { status: data.status } : {}),
      });

      logger.info('Order updated', { orderId: id, status: data.status });

      return order as Record<string, unknown>;
    }),

  // ========================================
  // DELETE
  // ========================================

  cancel: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      const existingOrder = await endpoints.orders.get(input.id);
      if (!existingOrder) {
        throw new Error('Order not found');
      }

      if ((existingOrder as { status?: string }).status === OrderStatus.DELIVERED) {
        throw new Error('Cannot cancel delivered order');
      }

      const order = await endpoints.orders.cancel(input.id);

      logger.info('Order cancelled', { orderId: input.id, reason: input.reason });

      return order as Record<string, unknown>;
    }),

  // ========================================
  // PRODUCTION
  // ========================================

  generateProductionFiles: protectedProcedure
    .input(
      z.object({
        orderId: z.string().cuid(),
        formats: z.array(z.string()).optional(),
        quality: z.enum(['standard', 'high', 'print-ready']).optional(),
        cmyk: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      const orderWithItems = await endpoints.orders.get(input.orderId);
      if (!orderWithItems) {
        throw new Error('Order not found');
      }

      const items = (orderWithItems as { items?: { id: string }[] }).items ?? [];
      if (!items.length) {
        throw new Error('Order has no items');
      }

      const { productionService } = await import('@/lib/services/ProductionService');

      const batchItems = items.map((item: { id: string }) => ({
        id: item.id,
        format: input.formats?.[0] || 'pdf',
        quality: input.quality || 'standard',
      }));

      const result = await productionService.generateBatch(
        input.orderId,
        batchItems,
        {
          quality: input.quality || 'standard',
          cmyk: input.cmyk || false,
        }
      );

      logger.info('Production files generation started', {
        orderId: input.orderId,
        jobId: result.jobId,
        itemsCount: batchItems.length,
      });

      return {
        jobId: result.jobId,
        status: result.status,
        files: result.files,
        progress: result.progress,
        error: result.error,
      };
    }),

  checkProductionStatus: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      // Check production job status from cache (or job queue in production)
      const { cacheService } = await import('@/lib/cache/CacheService');
      const jobStatus = cacheService.get<{
        status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
        progress: number;
        files?: Array<{ itemId: string; format: string; url: string; size: number; metadata?: Record<string, unknown> }>;
        error?: string;
        orderId?: string;
      }>(`production:job:${input.jobId}`);

      if (!jobStatus) {
        throw new Error('Production job not found');
      }

      if (jobStatus.orderId) {
        try {
          const order = await endpoints.orders.get(jobStatus.orderId);
          if (!order) {
            throw new Error('Order not found or access denied');
          }
        } catch {
          throw new Error('Order not found or access denied');
        }
      }

      return {
        status: jobStatus.status,
        progress: jobStatus.progress,
        files: jobStatus.files || [],
        error: jobStatus.error,
      };
    }),

  // ========================================
  // TRACKING
  // ========================================

  updateTracking: protectedProcedure
    .input(
      z.object({
        orderId: z.string().cuid(),
        trackingNumber: z.string().min(1),
        shippingProvider: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      const existingOrder = await endpoints.orders.get(input.orderId);
      if (!existingOrder) {
        throw new Error('Order not found');
      }

      const order = await api.put(`/api/v1/orders/${input.orderId}`, {
        trackingNumber: input.trackingNumber,
        shippingProvider: input.shippingProvider,
        status: OrderStatus.SHIPPED,
      });

      logger.info('Order tracking updated', {
        orderId: input.orderId,
        trackingNumber: input.trackingNumber,
      });

      return order as Record<string, unknown>;
    }),

  markAsDelivered: protectedProcedure
    .input(z.object({ orderId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new Error('User not authenticated');
      }

      const existingOrder = await endpoints.orders.get(input.orderId);
      if (!existingOrder) {
        throw new Error('Order not found');
      }

      const order = await endpoints.orders.updateStatus(input.orderId, OrderStatus.DELIVERED);

      logger.info('Order marked as delivered', { orderId: input.orderId });

      return order as Record<string, unknown>;
    }),
});

