/**
 * ★★★ TRPC ROUTER - COMMANDES ★★★
 * Router tRPC complet pour les commandes
 * - CRUD commandes
 * - Workflow statuts
 * - Génération fichiers production
 * - Tracking
 * - Intégration POD
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { OrderStatus, ShippingStatus } from '@prisma/client';
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

      // Calculate totals (in cents)
      const subtotalCents = Math.round(
        input.items.reduce((sum, item) => sum + item.totalPrice * 100, 0)
      );

      // Calculate shipping based on address
      const { calculateShipping } = await import('@/lib/utils/shipping-calculator');
      const shippingCost = calculateShipping(
        input.shippingAddress,
        {
          weight: input.items.reduce((sum, item) => sum + (item.weight || 0.1), 0), // Default 100g per item
          carrier: (input.metadata as any)?.shippingMethod || 'standard',
        }
      );
      const shippingCents = Math.round(shippingCost * 100);

      // Calculate tax based on country
      const { calculateTax, isTaxExempt } = await import('@/lib/utils/tax-calculator');
      const subtotal = subtotalCents / 100;
      const vatNumber = (input.metadata as any)?.vatNumber;
      const taxExempt = isTaxExempt(input.shippingAddress, vatNumber);
      const taxCost = taxExempt ? 0 : calculateTax(subtotal, input.shippingAddress);
      const taxCents = Math.round(taxCost * 100);

      const totalCents = subtotalCents + shippingCents + taxCents;

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      // Get brandId from user
      const userWithBrand = await db.user.findUnique({
        where: { id: user.id },
        select: { brandId: true },
      });

      if (!userWithBrand?.brandId) {
        throw new Error('User must be associated with a brand');
      }

      // Get first item for design/product (simplified - in real app, handle multiple items)
      const firstItem = input.items[0];

      // Create order (matching Prisma schema)
      const order = await db.order.create({
        data: {
          orderNumber,
          status: 'CREATED',
          customerEmail: user.email,
          customerName: input.shippingAddress.name,
          customerPhone: input.shippingAddress.phone,
          shippingAddress: input.shippingAddress as any,
          subtotalCents,
          taxCents,
          shippingCents,
          totalCents,
          currency: 'EUR',
          paymentStatus: 'PENDING',
          notes: input.customerNotes,
          metadata: {
            items: input.items,
            billingAddress: input.billingAddress,
            ...input.metadata,
          } as any,
          userId: user.id,
          brandId: userWithBrand.brandId,
          designId: firstItem.designId || '',
          productId: firstItem.productId,
        },
      });

      logger.info('Order created', { orderId: order.id, orderNumber });

      return order;
    }),

  // ========================================
  // READ
  // ========================================

  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      const { user } = ctx;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const userId = user.id;

      const order = await db.order.findFirst({
        where: {
          id: input.id,
          userId,
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      return order;
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
      const { user } = ctx;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const userId = user.id;

      const where: any = {
        userId,
      };

      if (input.status) {
        where.status = input.status;
      }

      if (input.startDate || input.endDate) {
        where.createdAt = {};
        if (input.startDate) {
          where.createdAt.gte = input.startDate;
        }
        if (input.endDate) {
          where.createdAt.lte = input.endDate;
        }
      }

      const [orders, total] = await Promise.all([
        db.order.findMany({
          where,
          include: {
            items: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: input.limit,
          skip: input.offset,
        }),
        db.order.count({ where }),
      ]);

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
      const { user } = ctx;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const userId = user.id;
      const { id, ...data } = input;

      // Verify ownership
      const existingOrder = await db.order.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }

      // Update order
      const order = await db.order.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
          // Update timestamps based on status
          ...(data.status === OrderStatus.CONFIRMED && !existingOrder.confirmedAt
            ? { confirmedAt: new Date() }
            : {}),
          ...(data.status === OrderStatus.SHIPPED && !existingOrder.shippedAt
            ? { shippedAt: new Date() }
            : {}),
          ...(data.status === OrderStatus.DELIVERED && !existingOrder.deliveredAt
            ? { deliveredAt: new Date() }
            : {}),
          ...(data.status === OrderStatus.CANCELLED && !existingOrder.cancelledAt
            ? { cancelledAt: new Date() }
            : {}),
        },
      });

      logger.info('Order updated', { orderId: id, status: data.status });

      return order;
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
      const { user } = ctx;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const userId = user.id;

      // Verify ownership
      const existingOrder = await db.order.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }

      if (existingOrder.status === OrderStatus.DELIVERED) {
        throw new Error('Cannot cancel delivered order');
      }

      // Cancel order
      const order = await db.order.update({
        where: { id: input.id },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          internalNotes: input.reason
            ? `Annulée: ${input.reason}`
            : 'Commande annulée',
          updatedAt: new Date(),
        },
      });

      logger.info('Order cancelled', { orderId: input.id, reason: input.reason });

      return order;
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
      const { user } = ctx;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const userId = user.id;

      // Verify ownership
      const order = await db.order.findFirst({
        where: {
          id: input.orderId,
          userId,
        },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      // Call production service
      const { productionService } = await import('@/lib/services/ProductionService');

      // Get order items
      const orderWithItems = await db.order.findUnique({
        where: { id: input.orderId },
        include: {
          items: true,
        },
      });

      if (!orderWithItems || !orderWithItems.items || orderWithItems.items.length === 0) {
        throw new Error('Order has no items');
      }

      // Prepare items for batch generation
      const items = orderWithItems.items.map((item) => ({
        id: item.id,
        format: input.formats?.[0] || 'pdf',
        quality: input.quality || 'standard',
      }));

      // Generate production files
      const result = await productionService.generateBatch(
        input.orderId,
        items,
        {
          quality: input.quality || 'standard',
          cmyk: input.cmyk || false,
        }
      );

      logger.info('Production files generation started', {
        orderId: input.orderId,
        jobId: result.jobId,
        itemsCount: items.length,
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
      const { user } = ctx;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const userId = user.id;

      // Check production job status from cache (or job queue in production)
      const { cacheService } = await import('@/lib/cache/CacheService');
      const jobStatus = cacheService.get<{
        status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
        progress: number;
        files?: Array<{ itemId: string; format: string; url: string; size: number; metadata?: any }>;
        error?: string;
        orderId?: string;
      }>(`production:job:${input.jobId}`);

      if (!jobStatus) {
        throw new Error('Production job not found');
      }

      // Verify ownership if orderId is available
      if (jobStatus.orderId) {
        const order = await db.order.findFirst({
          where: {
            id: jobStatus.orderId,
            userId,
          },
        });

        if (!order) {
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
      const { user } = ctx;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const userId = user.id;

      // Verify ownership
      const existingOrder = await db.order.findFirst({
        where: {
          id: input.orderId,
          userId,
        },
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }

      // Update tracking
      const order = await db.order.update({
        where: { id: input.orderId },
        data: {
          trackingNumber: input.trackingNumber,
          shippingProvider: input.shippingProvider,
          status: OrderStatus.SHIPPED,
          shippingStatus: ShippingStatus.SHIPPED,
          shippedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info('Order tracking updated', {
        orderId: input.orderId,
        trackingNumber: input.trackingNumber,
      });

      return order;
    }),

  markAsDelivered: protectedProcedure
    .input(z.object({ orderId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const userId = user.id;

      // Verify ownership
      const existingOrder = await db.order.findFirst({
        where: {
          id: input.orderId,
          userId,
        },
      });

      if (!existingOrder) {
        throw new Error('Order not found');
      }

      // Mark as delivered
      const order = await db.order.update({
        where: { id: input.orderId },
        data: {
          status: OrderStatus.DELIVERED,
          shippingStatus: ShippingStatus.DELIVERED,
          deliveredAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info('Order marked as delivered', { orderId: input.orderId });

      return order;
    }),
});

