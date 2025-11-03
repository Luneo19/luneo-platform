import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole, OrderStatus, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrdersService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get('stripe.secretKey'), {
      apiVersion: '2023-10-16',
    });
  }

  async create(createOrderDto: any, currentUser: any) {
    const { designId, customerEmail, customerName, customerPhone, shippingAddress } = createOrderDto;

    // Get design and check permissions
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      include: {
        product: true,
        brand: true,
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
    const subtotalCents = Math.round(parseFloat(design.product.price.toString()) * 100);
    const taxCents = Math.round(subtotalCents * 0.20); // 20% VAT
    const shippingCents = 0; // Free shipping for now
    const totalCents = subtotalCents + taxCents + shippingCents;

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
      include: {
        design: true,
        product: true,
        brand: true,
      },
    });

    // Create Stripe checkout session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: design.product.name,
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

  async findOne(id: string, currentUser: any) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        design: true,
        product: true,
        brand: true,
        user: true,
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

  async cancel(id: string, currentUser: any) {
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
