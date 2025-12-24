import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole, OrderStatus, PaymentStatus } from '@prisma/client';
import type Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { Cacheable, CacheInvalidate } from '@/libs/cache/cacheable.decorator';
import { JsonValue } from '@/common/types/utility-types';
import { CurrentUser } from '@/common/types/user.types';

@Injectable()
export class OrdersService {
  private stripeInstance: Stripe | null = null;
  private stripeModule: typeof import('stripe') | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Lazy load Stripe module to reduce cold start time
   */
  private async getStripe(): Promise<Stripe> {
    if (!this.stripeInstance) {
      if (!this.stripeModule) {
        this.stripeModule = await import('stripe');
      }
      this.stripeInstance = new this.stripeModule.default(this.configService.get('stripe.secretKey'), {
        apiVersion: '2023-10-16',
      });
    }
    return this.stripeInstance;
  }

  async create(createOrderDto: Record<string, JsonValue>, currentUser: CurrentUser) {
    const designId = createOrderDto.designId as string;
    const customerEmail = createOrderDto.customerEmail as string;
    const customerName = createOrderDto.customerName as string | undefined;
    const customerPhone = createOrderDto.customerPhone as string | undefined;
    const shippingAddress = createOrderDto.shippingAddress as string | undefined;

    // Optimisé: select au lieu de include
    // Get design and check permissions
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: {
        id: true,
        prompt: true,
        brandId: true,
        productId: true,
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!design) {
      throw new NotFoundException('Design not found');
    }

    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== design.brandId) {
      throw new ForbiddenException('Access denied to this design');
    }

    // Calculate pricing
    const product = design.product as { price: { toString: () => string } };
    const subtotalCents = Math.round(parseFloat(product.price.toString()) * 100);
    const taxCents = Math.round(subtotalCents * 0.20); // 20% VAT
    const shippingCents = 0; // Free shipping for now
    const totalCents = subtotalCents + taxCents + shippingCents;

    // Optimisé: select au lieu de include
    // Create order
    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        customerEmail,
        customerName,
        customerPhone,
        shippingAddress,
        subtotalCents,
        taxCents,
        shippingCents,
        totalCents,
        userId: currentUser.id,
        brandId: design.brandId,
        designId,
        productId: design.productId,
      },
      select: {
        id: true,
        orderNumber: true,
        customerEmail: true,
        customerName: true,
        customerPhone: true,
        shippingAddress: true,
        subtotalCents: true,
        taxCents: true,
        shippingCents: true,
        totalCents: true,
        status: true,
        paymentStatus: true,
        userId: true,
        brandId: true,
        designId: true,
        productId: true,
        createdAt: true,
        design: {
          select: {
            id: true,
            prompt: true,
            previewUrl: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create Stripe checkout session
    const stripe = await this.getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
              product_data: {
                name: (design.product as { name: string }).name,
                description: `Design personnalisé: ${design.prompt}`,
              },
            unit_amount: totalCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${this.configService.get('app.frontendUrl')}/orders/${order.id}/success`,
      cancel_url: `${this.configService.get('app.frontendUrl')}/orders/${order.id}/cancel`,
      metadata: {
        orderId: order.id,
      },
    });

    // Update order with session ID
    await this.prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return {
      ...order,
      checkoutUrl: session.url,
    };
  }

  // Optimisé: select au lieu de include, cache automatique
  @Cacheable({ 
    type: 'order', 
    ttl: 1800,
    keyGenerator: (args) => `order:${args[0]}`,
    tags: () => ['orders:list'],
  })
  async findOne(id: string, currentUser: CurrentUser) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        customerEmail: true,
        customerName: true,
        customerPhone: true,
        shippingAddress: true,
        subtotalCents: true,
        taxCents: true,
        shippingCents: true,
        totalCents: true,
        status: true,
        paymentStatus: true,
        stripeSessionId: true,
        userId: true,
        brandId: true,
        designId: true,
        productId: true,
        createdAt: true,
        updatedAt: true,
        design: {
          select: {
            id: true,
            prompt: true,
            previewUrl: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            description: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check permissions
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== order.brandId) {
      throw new ForbiddenException('Access denied to this order');
    }

    return order;
  }

  async cancel(id: string, currentUser: CurrentUser) {
    const order = await this.findOne(id, currentUser);

    if (order.status !== OrderStatus.CREATED) {
      throw new ForbiddenException('Order cannot be cancelled');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.CANCELLED,
      },
    });
  }

  private generateOrderNumber(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}
