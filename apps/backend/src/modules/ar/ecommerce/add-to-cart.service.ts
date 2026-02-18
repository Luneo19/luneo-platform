/**
 * E-Commerce AR - Add to Cart Service
 * Add to cart from AR session and track AR attribution on orders
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class AddToCartService {
  private readonly logger = new Logger(AddToCartService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add product to cart from AR session (creates/updates cart item, stores AR attribution in metadata)
   */
  async addToCartFromAR(
    sessionId: string,
    productId: string,
    variantId: string | null,
    userId?: string | null,
    quantity = 1,
  ) {
    this.logger.log(`Add to cart from AR: session=${sessionId}, product=${productId}, variant=${variantId ?? 'none'}`);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, brandId: true, price: true, currency: true },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    const priceCents = Math.round(Number(product.price) * 100);

    let cart = await this.prisma.cart.findFirst({
      where: userId ? { userId, brandId: product.brandId } : { sessionId, brandId: product.brandId },
      include: { items: true },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          brandId: product.brandId,
          ...(userId ? { userId } : { sessionId }),
        },
        include: { items: true },
      });
    }

    const metadata: Record<string, unknown> = {
      arSessionId: sessionId,
      source: 'ar',
      ...(variantId && { variantId }),
    };

    const existingItem = cart.items.find(
      (i) =>
        i.productId === productId &&
        (i.designId ?? null) === null &&
        (i.customizationId ?? null) === (variantId ?? null),
    );

    if (existingItem) {
      const updated = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
          metadata: { ...((existingItem.metadata as object) ?? {}), ...metadata } as object,
        },
      });
      return updated;
    }

    const newItem = await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
        priceCents,
        customizationId: variantId ?? undefined,
        metadata: metadata as object,
      },
    });

    return newItem;
  }

  /**
   * Link an order to an AR session for attribution (store in order metadata)
   */
  async trackARAttribution(orderId: string, sessionId: string) {
    this.logger.log(`Tracking AR attribution: order=${orderId}, session=${sessionId}`);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, metadata: true },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const metadata = (order.metadata as Record<string, unknown>) ?? {};
    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        metadata: {
          ...metadata,
          arSessionId: sessionId,
          arAttributionTrackedAt: new Date().toISOString(),
        } as object,
      },
    });

    return updated;
  }
}
