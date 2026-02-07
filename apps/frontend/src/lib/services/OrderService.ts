/**
 * ★★★ SERVICE - COMMANDES ★★★
 * Service professionnel pour gérer les commandes
 * - CRUD commandes
 * - Workflow statuts
 * - Génération fichiers production
 * - Tracking
 * - Intégration POD
 */

import { trpcVanilla } from '@/lib/trpc/vanilla-client';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';
import { cacheService } from '@/lib/cache/CacheService';
import { OrderStatus } from '@/lib/types/order';
import type { Order, OrderItem } from '@/lib/types/order';

// ========================================
// TYPES
// ========================================

export interface CreateOrderRequest {
  items: OrderItem[];
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    name: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethodId?: string;
  customerNotes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateOrderRequest {
  status?: string;
  trackingNumber?: string;
  shippingProvider?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface ProductionFileRequest {
  orderId: string;
  itemId: string;
  format: 'pdf' | 'png' | 'jpg' | 'stl' | 'obj' | 'glb';
  quality?: 'standard' | 'high' | 'print-ready';
  options?: {
    cmyk?: boolean;
    resolution?: number;
    colorProfile?: string;
  };
}

// ========================================
// SERVICE
// ========================================

export class OrderService {
  private static instance: OrderService;

  private constructor() {}

  static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  // ========================================
  // CRUD
  // ========================================

  /**
   * Crée une commande
   */
  async create(request: CreateOrderRequest): Promise<Order> {
    try {
      logger.info('Creating order', { itemsCount: request.items.length });

      // Appel tRPC pour créer la commande
      const orderData = await trpcVanilla.order.create.mutate({
        items: request.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          customizationId: item.customizationId,
          designId: item.designId,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.totalPrice,
          metadata: item.metadata,
        })),
        shippingAddress: request.shippingAddress,
        billingAddress: request.billingAddress,
        paymentMethodId: request.paymentMethodId,
        customerNotes: request.customerNotes,
        metadata: request.metadata,
      });

      // Convertir la réponse API en type Order
      const raw = orderData as any;
      const order: Order = {
        id: raw.id,
        userId: raw.userId ?? '',
        brandId: raw.brandId || undefined,
        orderNumber: raw.orderNumber ?? '',
        status: raw.status as OrderStatus,
        paymentStatus: raw.paymentStatus as any,
        shippingStatus: raw.shippingStatus as any,
        items: raw.metadata?.items || [],
        subtotal: (raw.subtotalCents ?? 0) / 100,
        shippingCost: (raw.shippingCents ?? 0) / 100,
        tax: (raw.taxCents ?? 0) / 100,
        discount: 0,
        totalAmount: (raw.totalCents ?? 0) / 100,
        currency: raw.currency ?? 'EUR',
        shippingAddress: raw.shippingAddress as any,
        billingAddress: raw.metadata?.billingAddress,
        paymentMethodId: request.paymentMethodId,
        customerNotes: raw.notes || undefined,
        internalNotes: raw.internalNotes || undefined,
        metadata: raw.metadata as any,
        createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
        updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
        confirmedAt: raw.confirmedAt ? new Date(raw.confirmedAt) : undefined,
        shippedAt: raw.shippedAt ? new Date(raw.shippedAt) : undefined,
        deliveredAt: raw.deliveredAt ? new Date(raw.deliveredAt) : undefined,
        cancelledAt: raw.cancelledAt ? new Date(raw.cancelledAt) : undefined,
      };

      // Invalidate cache
      cacheService.clear();

      logger.info('Order created', { orderId: order.id });

      return order;
    } catch (error: any) {
      logger.error('Error creating order', { error, request });
      throw error;
    }
  }

  /**
   * Récupère une commande par ID
   */
  async getById(orderId: string, useCache: boolean = true): Promise<Order> {
    try {
      // Check cache
      if (useCache) {
        const cached = cacheService.get<Order>(`order:${orderId}`);
        if (cached) {
          logger.info('Cache hit for order', { orderId });
          return cached;
        }
      }

      // Appel tRPC pour récupérer la commande
      const orderData = await trpcVanilla.order.getById.query({ id: orderId }) as any;

      // Convertir la réponse Prisma en type Order
      const order: Order = {
        id: orderData.id ?? orderId,
        userId: orderData.userId ?? '',
        brandId: orderData.brandId ?? undefined,
        orderNumber: orderData.orderNumber ?? '',
        status: (orderData.status ?? OrderStatus.PENDING) as OrderStatus,
        paymentStatus: (orderData.paymentStatus ?? 'PENDING') as any,
        shippingStatus: (orderData.shippingStatus ?? 'PENDING') as any,
        items: (orderData.items ?? []).map((item: any) => ({
          id: item.id ?? '',
          productId: item.productId ?? '',
          productName: item.productName ?? '',
          customizationId: item.customizationId ?? undefined,
          designId: item.designId ?? undefined,
          quantity: item.quantity ?? 0,
          price: (item.priceCents ?? item.price ?? 0) / 100,
          totalPrice: (item.totalPriceCents ?? item.totalPrice ?? 0) / 100,
          metadata: item.metadata as any,
        })),
        subtotal: (orderData.subtotalCents ?? 0) / 100,
        shippingCost: (orderData.shippingCents ?? 0) / 100,
        tax: (orderData.taxCents ?? 0) / 100,
        discount: 0,
        totalAmount: (orderData.totalCents ?? 0) / 100,
        currency: orderData.currency ?? 'EUR',
        shippingAddress: (orderData.shippingAddress ?? {}) as any,
        billingAddress: (orderData.metadata as any)?.billingAddress,
        paymentMethodId: orderData.paymentMethodId ?? undefined,
        customerNotes: orderData.notes ?? undefined,
        internalNotes: orderData.internalNotes ?? undefined,
        metadata: orderData.metadata as any,
        createdAt: orderData.createdAt ? new Date(orderData.createdAt) : new Date(),
        updatedAt: orderData.updatedAt ? new Date(orderData.updatedAt) : new Date(),
        confirmedAt: orderData.confirmedAt != null ? new Date(orderData.confirmedAt) : undefined,
        shippedAt: orderData.shippedAt != null ? new Date(orderData.shippedAt) : undefined,
        deliveredAt: orderData.deliveredAt != null ? new Date(orderData.deliveredAt) : undefined,
        cancelledAt: orderData.cancelledAt != null ? new Date(orderData.cancelledAt) : undefined,
      };

      // Cache for 5 minutes
      if (useCache) {
        cacheService.set(`order:${orderId}`, order, { ttl: 300 * 1000 });
      }

      logger.info('Order fetched', { orderId });

      return order;
    } catch (error: any) {
      logger.error('Error fetching order', { error, orderId });
      throw error;
    }
  }

  /**
   * Liste les commandes
   */
  async list(options?: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number; hasMore: boolean }> {
    try {
      // Appel tRPC pour lister les commandes
      const status = options?.status as any;
      const result = await trpcVanilla.order.list.query({
        status,
        startDate: options?.startDate,
        endDate: options?.endDate,
        limit: options?.limit || 20,
        offset: options?.offset || 0,
      });

      // Convertir les réponses Prisma en types Order
      const orders: Order[] = result.orders.map((orderData: any) => ({
        id: orderData.id,
        userId: orderData.userId,
        brandId: orderData.brandId || undefined,
        orderNumber: orderData.orderNumber,
        status: orderData.status as OrderStatus,
        paymentStatus: orderData.paymentStatus as any,
        shippingStatus: orderData.shippingStatus as any,
        items: (orderData.items || []).map((item: any) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName || '',
          customizationId: item.customizationId || undefined,
          designId: item.designId || undefined,
          quantity: item.quantity,
          price: item.priceCents / 100,
          totalPrice: item.totalPriceCents / 100,
          metadata: item.metadata as any,
        })),
        subtotal: orderData.subtotalCents / 100,
        shippingCost: orderData.shippingCents / 100,
        tax: orderData.taxCents / 100,
        discount: 0,
        totalAmount: orderData.totalCents / 100,
        currency: orderData.currency,
        shippingAddress: orderData.shippingAddress as any,
        billingAddress: (orderData.metadata as any)?.billingAddress,
        paymentMethodId: orderData.paymentMethodId || undefined,
        customerNotes: orderData.notes || undefined,
        internalNotes: orderData.internalNotes || undefined,
        metadata: orderData.metadata as any,
        createdAt: orderData.createdAt,
        updatedAt: orderData.updatedAt,
        confirmedAt: orderData.confirmedAt || undefined,
        shippedAt: orderData.shippedAt || undefined,
        deliveredAt: orderData.deliveredAt || undefined,
        cancelledAt: orderData.cancelledAt || undefined,
      }));

      return {
        orders,
        total: result.total,
        hasMore: result.hasMore,
      };
    } catch (error: any) {
      logger.error('Error listing orders', { error, options });
      throw error;
    }
  }

  /**
   * Met à jour une commande
   */
  async update(orderId: string, request: UpdateOrderRequest): Promise<Order> {
    try {
      logger.info('Updating order', { orderId, status: request.status });

      // Appel tRPC pour mettre à jour la commande
      const updatePayload = {
        id: orderId,
        status: request.status,
        trackingNumber: request.trackingNumber,
        shippingProvider: request.shippingProvider,
        notes: request.notes,
        metadata: request.metadata,
      } as any;
      const orderData = await trpcVanilla.order.update.mutate(updatePayload);

      // Convertir la réponse Prisma en type Order
      const order: Order = {
        id: orderData.id,
        userId: orderData.userId,
        brandId: orderData.brandId || undefined,
        orderNumber: orderData.orderNumber,
        status: orderData.status as OrderStatus,
        paymentStatus: orderData.paymentStatus as any,
        shippingStatus: orderData.shippingStatus as any,
        items: (orderData.metadata as any)?.items || [],
        subtotal: orderData.subtotalCents / 100,
        shippingCost: orderData.shippingCents / 100,
        tax: orderData.taxCents / 100,
        discount: 0,
        totalAmount: orderData.totalCents / 100,
        currency: orderData.currency,
        shippingAddress: orderData.shippingAddress as any,
        billingAddress: (orderData.metadata as any)?.billingAddress,
        paymentMethodId: orderData.paymentMethodId || undefined,
        trackingNumber: orderData.trackingNumber || undefined,
        shippingProvider: orderData.shippingProvider || undefined,
        customerNotes: orderData.notes || undefined,
        internalNotes: orderData.internalNotes || undefined,
        metadata: orderData.metadata as any,
        createdAt: orderData.createdAt,
        updatedAt: orderData.updatedAt,
        confirmedAt: orderData.confirmedAt || undefined,
        shippedAt: orderData.shippedAt || undefined,
        deliveredAt: orderData.deliveredAt || undefined,
        cancelledAt: orderData.cancelledAt || undefined,
      };

      // Invalidate cache
      cacheService.delete(`order:${orderId}`);
      cacheService.clear();

      logger.info('Order updated', { orderId });

      return order;
    } catch (error: any) {
      logger.error('Error updating order', { error, orderId, request });
      throw error;
    }
  }

  /**
   * Annule une commande
   */
  async cancel(orderId: string, reason?: string): Promise<Order> {
    try {
      logger.info('Cancelling order', { orderId, reason });

      return await this.update(orderId, {
        status: OrderStatus.CANCELLED,
        notes: reason ? `Annulée: ${reason}` : 'Commande annulée',
      });
    } catch (error: any) {
      logger.error('Error cancelling order', { error, orderId });
      throw error;
    }
  }

  // ========================================
  // PRODUCTION
  // ========================================

  /**
   * Génère les fichiers de production pour une commande
   */
  async generateProductionFiles(
    orderId: string,
    options?: {
      formats?: string[];
      quality?: 'standard' | 'high' | 'print-ready';
      cmyk?: boolean;
    }
  ): Promise<{
    jobId: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    files: Array<{
      itemId: string;
      format: string;
      url: string;
      size: number;
    }>;
  }> {
    try {
      logger.info('Generating production files', { orderId, options });

      // Appel tRPC pour générer les fichiers de production
      const result = await trpcVanilla.order.generateProductionFiles.mutate({
        orderId,
        formats: options?.formats,
        quality: options?.quality,
        cmyk: options?.cmyk,
      });

      logger.info('Production files generation started', { orderId, jobId: result.jobId });

      return {
        jobId: result.jobId,
        status: result.status,
        files: result.files || [],
      };
    } catch (error: any) {
      logger.error('Error generating production files', { error, orderId });
      throw error;
    }
  }

  /**
   * Vérifie le statut de génération des fichiers
   */
  async checkProductionStatus(jobId: string): Promise<{
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    progress: number;
    files?: Array<{
      itemId: string;
      format: string;
      url: string;
      size: number;
    }>;
    error?: string;
  }> {
    try {
      // Appel tRPC pour vérifier le statut de production
      const result = await trpcVanilla.order.checkProductionStatus.query({ jobId });

      return {
        status: result.status,
        progress: result.progress,
        files: result.files || [],
        error: result.error,
      };
    } catch (error: any) {
      logger.error('Error checking production status', { error, jobId });
      throw error;
    }
  }

  // ========================================
  // TRACKING
  // ========================================

  /**
   * Met à jour le tracking d'une commande
   */
  async updateTracking(
    orderId: string,
    trackingNumber: string,
    shippingProvider: string
  ): Promise<Order> {
    try {
      logger.info('Updating order tracking', {
        orderId,
        trackingNumber,
        shippingProvider,
      });

      return await this.update(orderId, {
        trackingNumber,
        shippingProvider,
        status: 'SHIPPED',
      });
    } catch (error: any) {
      logger.error('Error updating tracking', { error, orderId });
      throw error;
    }
  }

  /**
   * Marque une commande comme livrée
   */
  async markAsDelivered(orderId: string): Promise<Order> {
    try {
      logger.info('Marking order as delivered', { orderId });

      return await this.update(orderId, {
        status: 'DELIVERED',
      });
    } catch (error: any) {
      logger.error('Error marking order as delivered', { error, orderId });
      throw error;
    }
  }

  // ========================================
  // POD INTEGRATION
  // ========================================

  /**
   * Envoie une commande à Print-on-Demand
   */
  async sendToPOD(
    orderId: string,
    provider: 'printful' | 'printify' | 'gelato',
    options?: {
      autoFulfill?: boolean;
      notifyCustomer?: boolean;
    }
  ): Promise<{
    podOrderId: string;
    status: string;
    trackingUrl?: string;
  }> {
    try {
      logger.info('Sending order to POD', { orderId, provider, options });

      const data = await api.post<{ data?: { podOrderId?: string; status?: string; trackingUrl?: string } }>(
        `/api/v1/pod/${provider}/submit`,
        {
          orderId,
          autoFulfill: options?.autoFulfill || false,
          notifyCustomer: options?.notifyCustomer !== false,
        }
      );
      
      // Vérifier que la réponse contient les données attendues
      if (!data.data || !data.data.podOrderId) {
        throw new Error('Invalid response from POD API');
      }

      logger.info('Order sent to POD', {
        orderId,
        podOrderId: data.data.podOrderId,
        provider,
      });

      return {
        podOrderId: data.data.podOrderId ?? '',
        status: data.data.status ?? '',
        trackingUrl: data.data.trackingUrl ?? '',
      };
    } catch (error: any) {
      logger.error('Error sending order to POD', { error, orderId, provider });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const orderService = OrderService.getInstance();

