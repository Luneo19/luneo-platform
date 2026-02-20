import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PaymentStatus } from '@prisma/client';

export interface CartItemInput {
  productId: string;
  designId?: string;
  customizationId?: string;
  quantity: number;
  priceCents: number;
  metadata?: Record<string, unknown>;
}

export interface RefundItemInput {
  orderItemId: string;
  quantity?: number;
}

@Injectable()
export class OrdersEnhancedService {
  private readonly logger = new Logger(OrdersEnhancedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get persistent cart for user (cross-device).
   */
  async getCart(userId: string, brandId: string): Promise<{
    id: string;
    items: Array<{
      id: string;
      productId: string;
      designId: string | null;
      quantity: number;
      priceCents: number;
      metadata: unknown;
      product: { id: string; name: string; price: unknown; images: string[] };
    }>;
  }> {
    let cart = await this.prisma.cart.findUnique({
      where: { userId_brandId: { userId, brandId } },
      include: { items: true },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId, brandId },
        include: { items: true },
      });
    }
    const productIds = [...new Set(cart.items.map((i) => i.productId))];
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, price: true, images: true },
        })
      : [];
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
    return {
      id: cart.id,
      items: cart.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        designId: i.designId,
        quantity: i.quantity,
        priceCents: i.priceCents,
        metadata: i.metadata,
        product: productMap[i.productId] ?? { id: i.productId, name: '', price: 0, images: [] },
      })),
    };
  }

  /**
   * Add item to cart with customization data.
   */
  async addToCart(userId: string, brandId: string, item: CartItemInput): Promise<void> {
    if (item.quantity < 1) {
      throw new BadRequestException('Quantity must be at least 1');
    }
    const product = await this.prisma.product.findFirst({
      where: { id: item.productId, brandId, deletedAt: null },
      select: { id: true, price: true },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    const priceCents = item.priceCents ?? Math.round(Number(product.price) * 100);
    let cart = await this.prisma.cart.findUnique({
      where: { userId_brandId: { userId, brandId } },
      include: { items: true },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId, brandId },
        include: { items: true },
      });
    }
    const existing = cart.items.find(
      (i) =>
        i.productId === item.productId &&
        (i.designId ?? null) === (item.designId ?? null) &&
        (i.customizationId ?? null) === (item.customizationId ?? null),
    );
    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + item.quantity, priceCents, metadata: (item.metadata ?? existing.metadata) as object },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: item.productId,
          designId: item.designId ?? null,
          customizationId: item.customizationId ?? null,
          quantity: item.quantity,
          priceCents,
          metadata: (item.metadata ?? undefined) as object,
        },
      });
    }
    this.logger.debug(`Added to cart for user ${userId}, brand ${brandId}`);
  }

  /**
   * Find and process abandoned carts (no purchase, older than 1h).
   */
  async abandonedCartRecovery(brandId: string): Promise<{ cartsProcessed: number; emailsSent: number }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const carts = await this.prisma.cart.findMany({
      where: {
        brandId,
        userId: { not: null },
        items: { some: {} },
        createdAt: { lt: oneHourAgo },
      },
      include: { items: true },
    });
    let emailsSent = 0;
    for (const cart of carts) {
      const hasOrder = await this.prisma.order.findFirst({
        where: {
          brandId,
          userId: cart.userId ?? undefined,
          createdAt: { gte: cart.createdAt },
          paymentStatus: 'SUCCEEDED',
        },
      });
      if (hasOrder) continue;
      const userEmail = cart.userId
        ? (await this.prisma.user.findUnique({ where: { id: cart.userId }, select: { email: true } }))?.email
        : null;
      if (userEmail) {
        await this.sendAbandonedCartEmail(
          userEmail,
          cart.items.map((i) => ({ quantity: i.quantity, productId: i.productId })),
        );
        emailsSent++;
      }
    }
    this.logger.log(`Abandoned cart recovery for brand ${brandId}: ${carts.length} carts, ${emailsSent} emails`);
    return { cartsProcessed: carts.length, emailsSent };
  }

  /**
   * Process partial or full refund for an order.
   */
  async processRefund(
    orderId: string,
    items: RefundItemInput[],
    reason: string,
  ): Promise<{ refundedCents: number }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.paymentStatus === PaymentStatus.REFUNDED) {
      throw new BadRequestException('Order is already fully refunded');
    }

    let refundCents = 0;
    if (items.length === 0) {
      refundCents = order.totalCents;
    } else {
      for (const ref of items) {
        const line = order.items.find((i) => i.id === ref.orderItemId);
        if (!line) continue;
        const qty = ref.quantity ?? line.quantity;
        const amount = Math.round((line.totalCents / line.quantity) * Math.min(qty, line.quantity));
        refundCents += amount;
      }
    }

    const stripePaymentId = order.stripePaymentId;
    if (stripePaymentId && refundCents > 0) {
      try {
        const stripeModule = await import('stripe');
        const stripe = new stripeModule.default(process.env.STRIPE_SECRET_KEY ?? '', {
          apiVersion: '2023-10-16',
        });
        await stripe.refunds.create({
          payment_intent: stripePaymentId,
          amount: refundCents,
          reason: 'requested_by_customer',
          metadata: { orderId, reason: reason.slice(0, 500) },
        });
      } catch (e) {
        this.logger.error(`Stripe refund failed for order ${orderId}: ${e instanceof Error ? e.message : e}`);
        throw new InternalServerErrorException('Payment refund failed');
      }
    }

    const isFullRefund = refundCents >= order.totalCents;
    const metadata = (order.metadata as Record<string, unknown>) ?? {};
    const refunds = (metadata.refunds as Array<{ at: string; cents: number; reason: string }>) ?? [];
    refunds.push({ at: new Date().toISOString(), cents: refundCents, reason });

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: isFullRefund ? PaymentStatus.REFUNDED : order.paymentStatus,
        metadata: { ...metadata, refunds },
      },
    });
    this.logger.log(`Refund processed for order ${orderId}: ${refundCents} cents`);
    return { refundedCents: refundCents };
  }

  /**
   * Get order tracking information.
   */
  async getTrackingInfo(orderId: string): Promise<{
    orderNumber: string;
    trackingNumber: string | null;
    trackingCarrier: string | null;
    trackingUrl: string | null;
    shippedAt: Date | null;
    estimatedDelivery: Date | null;
    status: string;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderNumber: true,
        trackingNumber: true,
        trackingCarrier: true,
        trackingUrl: true,
        shippedAt: true,
        estimatedDelivery: true,
        status: true,
      },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return {
      orderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      trackingCarrier: order.trackingCarrier,
      trackingUrl: order.trackingUrl,
      shippedAt: order.shippedAt,
      estimatedDelivery: order.estimatedDelivery,
      status: order.status,
    };
  }

  private async sendAbandonedCartEmail(
    _email: string,
    _items: { quantity: number; productId: string }[],
  ): Promise<void> {
    // Integrate with your EmailService / notification queue
    return;
  }
}
