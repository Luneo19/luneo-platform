import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get or create cart for a user+brand combination
   */
  async getOrCreateCart(userId: string, brandId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId_brandId: { userId, brandId } },
      include: { items: true },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
          brandId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        include: { items: true },
      });
    }

    return this.formatCart(cart);
  }

  /**
   * Get cart by session ID (for anonymous users)
   */
  async getCartBySession(sessionId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });

    if (!cart) return null;
    return this.formatCart(cart);
  }

  /**
   * Add item to cart
   */
  async addItem(
    userId: string,
    brandId: string,
    data: {
      productId: string;
      quantity: number;
      priceCents: number;
      designId?: string;
      customizationId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    // Get or create cart
    const cart = await this.prisma.cart.upsert({
      where: { userId_brandId: { userId, brandId } },
      create: {
        userId,
        brandId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: { updatedAt: new Date() },
    });

    // Check if item already exists
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: data.productId,
        designId: data.designId || null,
        customizationId: data.customizationId || null,
      },
    });

    if (existing) {
      // Update quantity
      const updated = await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + data.quantity,
          priceCents: data.priceCents,
          metadata: (data.metadata ?? existing.metadata) as import('@prisma/client').Prisma.InputJsonValue | undefined,
        },
      });
      return this.getOrCreateCart(userId, brandId);
    }

    // Add new item
    await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: data.productId,
        quantity: data.quantity,
        priceCents: data.priceCents,
        designId: data.designId,
        customizationId: data.customizationId,
        metadata: data.metadata as import('@prisma/client').Prisma.InputJsonValue | undefined,
      },
    });

    return this.getOrCreateCart(userId, brandId);
  }

  /**
   * Update item quantity
   */
  async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    if (quantity < 1) {
      return this.removeItem(userId, itemId);
    }

    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getOrCreateCart(userId, item.cart.brandId);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Cart item not found');
    }

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.getOrCreateCart(userId, item.cart.brandId);
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string, brandId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId_brandId: { userId, brandId } },
    });

    if (!cart) return { items: [], subtotalCents: 0, itemCount: 0 };

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return this.getOrCreateCart(userId, brandId);
  }

  /**
   * Convert cart to order and clear it
   */
  async cartToOrderData(userId: string, brandId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId_brandId: { userId, brandId } },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const items = cart.items.map((item) => ({
      productId: item.productId,
      designId: item.designId,
      customizationId: item.customizationId,
      quantity: item.quantity,
      priceCents: item.priceCents,
      totalCents: item.priceCents * item.quantity,
      metadata: item.metadata,
    }));

    // Clear the cart after converting to order data
    await this.deleteCart(cart.id);

    return { items, cartId: cart.id };
  }

  /**
   * Delete cart after successful order
   */
  async deleteCart(cartId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
    await this.prisma.cart.delete({ where: { id: cartId } }).catch((err) => this.logger.warn('Non-critical error deleting cart', err instanceof Error ? err.message : String(err)));
  }

  /**
   * Format cart for API response
   */
  private formatCart(cart: Prisma.CartGetPayload<{ include: { items: true } }>) {
    const items = cart.items || [];
    const subtotalCents = items.reduce(
      (sum: number, item: Prisma.CartItemGetPayload<{}>) => sum + item.priceCents * item.quantity,
      0,
    );

    return {
      id: cart.id,
      brandId: cart.brandId,
      items: items.map((item: Prisma.CartItemGetPayload<{}>) => ({
        id: item.id,
        productId: item.productId,
        designId: item.designId,
        customizationId: item.customizationId,
        quantity: item.quantity,
        priceCents: item.priceCents,
        totalCents: item.priceCents * item.quantity,
        metadata: item.metadata,
      })),
      subtotalCents,
      itemCount: items.reduce((sum: number, item: Prisma.CartItemGetPayload<{}>) => sum + item.quantity, 0),
      updatedAt: cart.updatedAt,
    };
  }
}
