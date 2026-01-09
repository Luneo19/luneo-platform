import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
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

  @Cacheable({ 
    type: 'orders', 
    ttl: 300,
    keyGenerator: (args) => `orders:list:${args[0]?.id || 'all'}`,
    tags: () => ['orders:list'],
  })
  async findAll(currentUser: CurrentUser, query?: { page?: number; limit?: number; status?: string; search?: string }) {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // Filtrer par brandId si l'utilisateur n'est pas admin
    if (currentUser.role !== UserRole.PLATFORM_ADMIN) {
      if (!currentUser.brandId) {
        return { orders: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }
      where.brandId = currentUser.brandId;
    }

    // Filtre par statut
    if (query?.status && query.status !== 'all') {
      where.status = query.status;
    }

    // Recherche par orderNumber ou customerEmail
    if (query?.search && query.search.trim() !== '') {
      where.OR = [
        { orderNumber: { contains: query.search.trim(), mode: 'insensitive' } },
        { customerEmail: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
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
          createdAt: true,
          items: {
            select: {
              id: true,
              productId: true,
              designId: true,
              quantity: true,
              priceCents: true,
              totalCents: true,
              metadata: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
              design: {
                select: {
                  id: true,
                  prompt: true,
                  previewUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(createOrderDto: Record<string, JsonValue>, currentUser: CurrentUser) {
    // Support both old format (single design) and new format (multiple items)
    const items = createOrderDto.items as Array<{
      product_id: string;
      design_id?: string;
      quantity?: number;
      customization?: Record<string, any>;
      production_notes?: string;
    }> | undefined;
    
    const designId = createOrderDto.designId as string | undefined; // Legacy support
    const customerEmail = createOrderDto.customerEmail as string;
    const customerName = createOrderDto.customerName as string | undefined;
    const customerPhone = createOrderDto.customerPhone as string | undefined;
    const shippingAddress = createOrderDto.shippingAddress as string | undefined;
    const shippingMethod = createOrderDto.shippingMethod as string | undefined;
    const discountCode = createOrderDto.discountCode as string | undefined;

    let orderItems: Array<{
      productId: string;
      designId?: string;
      quantity: number;
      priceCents: number;
      totalCents: number;
      metadata?: Record<string, any>;
    }> = [];
    let subtotalCents = 0;
    let brandId = currentUser.brandId || '';

    // New format: multiple items
    if (items && items.length > 0) {
      for (const item of items) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.product_id },
          select: {
            id: true,
            name: true,
            price: true,
            brandId: true,
          },
        });

        if (!product) {
          throw new NotFoundException(`Product ${item.product_id} not found`);
        }

        // Check permissions
        if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
            currentUser.brandId !== product.brandId) {
          throw new ForbiddenException(`Access denied to product ${item.product_id}`);
        }

        // Verify design if provided
        if (item.design_id) {
          const design = await this.prisma.design.findUnique({
            where: { id: item.design_id },
            select: { id: true, brandId: true, productId: true },
          });

          if (!design) {
            throw new NotFoundException(`Design ${item.design_id} not found`);
          }

          if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
              currentUser.brandId !== design.brandId) {
            throw new ForbiddenException(`Access denied to design ${item.design_id}`);
          }

          if (design.productId !== item.product_id) {
            throw new BadRequestException(`Design ${item.design_id} does not match product ${item.product_id}`);
          }
        }

        brandId = product.brandId;
        const quantity = item.quantity || 1;
        const priceCents = Math.round(parseFloat(product.price.toString()) * 100);
        const totalCents = priceCents * quantity;

        orderItems.push({
          productId: item.product_id,
          designId: item.design_id,
          quantity,
          priceCents,
          totalCents,
          metadata: item.customization || item.production_notes ? {
            customization: item.customization,
            production_notes: item.production_notes,
          } : undefined,
        });

        subtotalCents += totalCents;
      }
    } 
    // Legacy format: single design
    else if (designId) {
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

      brandId = design.brandId;
      const product = design.product as { price: { toString: () => string }; id: string };
      const priceCents = Math.round(parseFloat(product.price.toString()) * 100);
      
      orderItems.push({
        productId: product.id,
        designId: designId,
        quantity: 1,
        priceCents,
        totalCents: priceCents,
      });

      subtotalCents = priceCents;
    } else {
      throw new BadRequestException('Either items array or designId must be provided');
    }

    // Calculate shipping costs
    let shippingCents = 0;
    if (shippingMethod === 'express') {
      shippingCents = 1500; // 15€
    } else if (shippingMethod === 'overnight') {
      shippingCents = 3000; // 30€
    } else {
      shippingCents = 500; // 5€ standard
    }

    // Calculate tax (20% VAT)
    const taxCents = Math.round((subtotalCents + shippingCents) * 0.20);
    
    // TODO: Apply discount code if provided
    // const discountCents = 0; // To be implemented
    
    const totalCents = subtotalCents + shippingCents + taxCents;

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        customerEmail,
        customerName,
        customerPhone,
        shippingAddress: shippingAddress as any,
        subtotalCents,
        taxCents,
        shippingCents,
        totalCents,
        userId: currentUser.id,
        brandId,
        designId: orderItems.length === 1 && orderItems[0].designId ? orderItems[0].designId : null, // Legacy support
        productId: orderItems.length === 1 ? orderItems[0].productId : null, // Legacy support
        items: {
          create: orderItems.map(item => ({
            productId: item.productId,
            designId: item.designId,
            quantity: item.quantity,
            priceCents: item.priceCents,
            totalCents: item.totalCents,
            metadata: item.metadata as any,
          })),
        },
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
        items: {
          select: {
            id: true,
            productId: true,
            designId: true,
            quantity: true,
            priceCents: true,
            totalCents: true,
            metadata: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
            design: {
              select: {
                id: true,
                prompt: true,
                previewUrl: true,
              },
            },
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

    // Create Stripe checkout session with all items
    const stripe = await this.getStripe();
    const lineItems = await Promise.all(
      order.items.map(async (item) => {
        const product = item.product;
        const design = item.design;
        const productName = product?.name || 'Product';
        const description = design?.prompt 
          ? `Design personnalisé: ${design.prompt.substring(0, 100)}` 
          : productName;
        
        return {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${productName}${item.quantity > 1 ? ` x${item.quantity}` : ''}`,
              description,
            },
            unit_amount: item.priceCents,
          },
          quantity: item.quantity,
        };
      })
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
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
        items: {
          select: {
            id: true,
            productId: true,
            designId: true,
            quantity: true,
            priceCents: true,
            totalCents: true,
            metadata: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                description: true,
              },
            },
            design: {
              select: {
                id: true,
                prompt: true,
                previewUrl: true,
              },
            },
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

  async update(id: string, data: { status?: OrderStatus; trackingNumber?: string; notes?: string }, currentUser: CurrentUser) {
    const order = await this.findOne(id, currentUser);

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.trackingNumber) updateData.trackingNumber = data.trackingNumber;
    if (data.notes) updateData.notes = data.notes;

    return this.prisma.order.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        trackingNumber: true,
        notes: true,
        updatedAt: true,
      },
    });
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
