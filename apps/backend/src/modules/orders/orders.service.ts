import { CurrentUser } from '@/common/types/user.types';
import { Cacheable } from '@/libs/cache/cacheable.decorator';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import type Stripe from 'stripe';
import { CommissionService } from '@/modules/billing/services/commission.service';
import { DiscountService } from './services/discount.service';
import { ReferralService } from '../referral/referral.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private stripeInstance: Stripe | null = null;
  private stripeModule: typeof import('stripe') | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private discountService: DiscountService,
    private commissionService: CommissionService,
    @Optional() private referralService?: ReferralService, // Optional to avoid DI issues in unit tests
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

  async create(createOrderDto: CreateOrderDto, currentUser: CurrentUser) {
    // Support both old format (single design) and new format (multiple items)
    const items = createOrderDto.items;
    
    const designId = createOrderDto.designId; // Legacy support
    const customerEmail = createOrderDto.customerEmail;
    const customerName = createOrderDto.customerName;
    const customerPhone = createOrderDto.customerPhone;
    const shippingAddress = createOrderDto.shippingAddress;
    const shippingMethod = createOrderDto.shippingMethod;
    const discountCode = createOrderDto.discountCode;

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
    // ✅ OPTIMISÉ: Charger tous les produits et designs en une seule requête (évite N+1)
    if (items && items.length > 0) {
      const productIds = [...new Set(items.map(item => item.product_id))];
      const designIds = items
        .map(item => item.design_id)
        .filter((id): id is string => Boolean(id));

      // Charger tous les produits en une seule requête
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          price: true,
          brandId: true,
        },
      });

      // Créer un Map pour accès O(1)
      const productsMap = new Map(products.map(p => [p.id, p]));

      // Charger tous les designs en une seule requête si nécessaire
      let designsMap = new Map();
      if (designIds.length > 0) {
        const designs = await this.prisma.design.findMany({
          where: { id: { in: designIds } },
          select: { id: true, brandId: true, productId: true },
        });
        designsMap = new Map(designs.map(d => [d.id, d]));
      }

      // Vérifier chaque item
      for (const item of items) {
        const product = productsMap.get(item.product_id);

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
          const design = designsMap.get(item.design_id);

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

    // Apply discount code if provided
    let discountCents = 0;
    let discountMetadata: Record<string, unknown> | undefined;
    if (discountCode) {
      try {
        const discountResult = await this.discountService.validateAndApplyDiscount(
          discountCode,
          subtotalCents,
          brandId,
          currentUser.id,
        );
        discountCents = discountResult.discountCents;
        discountMetadata = {
          discountId: discountResult.discountId,
          discountCode: discountResult.code,
          discountCents: discountResult.discountCents,
          discountPercent: discountResult.discountPercent,
          discountType: discountResult.type,
          discountDescription: discountResult.description,
        };
        this.logger.log(`Applied discount code ${discountCode}: ${discountCents} cents off`);
      } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

        this.logger.warn(`Failed to apply discount code ${discountCode}: ${error instanceof Error ? errorMessage : 'Unknown error'}`);
        throw error; // Re-throw pour que l'utilisateur soit informé du code invalide
      }
    }

    // Store discount result for later use (after order creation)
    const discountResultForRecording = discountCode && discountMetadata 
      ? { discountId: discountMetadata.discountId as string }
      : null;

    // Calculate tax (20% VAT) on subtotal after discount + shipping
    const taxCents = Math.round((subtotalCents - discountCents + shippingCents) * 0.20);
    
    const totalCents = subtotalCents - discountCents + shippingCents + taxCents;

    const commissionPercent = await this.commissionService.getCommissionPercent(brandId);
    const commissionCents = this.commissionService.calculateCommissionCents(totalCents, commissionPercent);

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
        commissionPercent,
        commissionCents,
        userId: currentUser.id,
        brandId,
        designId: orderItems.length === 1 && orderItems[0].designId ? orderItems[0].designId : null, // Legacy support
        productId: orderItems.length === 1 ? orderItems[0].productId : null, // Legacy support
        metadata: discountMetadata ? { discount: discountMetadata } as any : undefined,
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

    // Record discount usage if a discount code was applied
    if (discountResultForRecording) {
      try {
        await this.discountService.recordDiscountUsage(
          discountResultForRecording.discountId,
          order.id,
          currentUser.id,
        );
        this.logger.log(`Recorded discount usage for order ${order.orderNumber}`);
      } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

        // Log error but don't fail the order creation
        this.logger.warn(
          `Failed to record discount usage for order ${order.orderNumber}: ${error instanceof Error ? errorMessage : 'Unknown error'}`,
        );
      }
    }

    // ✅ Créer une commission automatiquement si l'utilisateur a été référé
    if (this.referralService && currentUser.id) {
      try {
        const commission = await this.referralService.createCommissionFromOrder(
          order.id,
          currentUser.id,
          totalCents,
          10, // 10% de commission par défaut
        );
        if (commission) {
          this.logger.log(
            `Commission created for order ${order.orderNumber}: ${commission.amountCents / 100}€`,
          );
        }
      } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

        // Log error but don't fail the order creation
        this.logger.warn(
          `Failed to create commission for order ${order.orderNumber}: ${error instanceof Error ? errorMessage : 'Unknown error'}`,
        );
      }
    }

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
        stripePaymentId: true,
        trackingNumber: true,
        trackingUrl: true,
        shippedAt: true,
        metadata: true,
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

  /**
   * Mettre à jour le statut d'une commande (admin only)
   */
  async updateStatus(id: string, status: OrderStatus, currentUser: CurrentUser) {
    const order = await this.findOne(id, currentUser);

    // Vérifier que l'utilisateur est admin ou propriétaire de la brand
    if (currentUser.role !== UserRole.PLATFORM_ADMIN && 
        currentUser.brandId !== order.brandId) {
      throw new ForbiddenException('Only admins or brand owners can update order status');
    }

    // Valider la transition de statut
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.CREATED]: [OrderStatus.PENDING_PAYMENT, OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PENDING_PAYMENT]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.REFUNDED],
      [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };

    const allowedStatuses = validTransitions[order.status] || [];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${status}. Allowed transitions: ${allowedStatuses.join(', ')}`,
      );
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Récupérer les informations de suivi d'une commande
   */
  async getTracking(id: string, currentUser: CurrentUser) {
    const order = await this.findOne(id, currentUser);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber || null,
      trackingUrl: order.trackingUrl || null,
      shippedAt: order.shippedAt || null,
      estimatedDelivery: order.shippedAt
        ? new Date(new Date(order.shippedAt).getTime() + 7 * 24 * 60 * 60 * 1000) // +7 jours
        : null,
      shippingAddress: order.shippingAddress,
      carrier: order.metadata ? (order.metadata as any).carrier : null,
    };
  }

  /**
   * Demander un remboursement pour une commande
   */
  async requestRefund(
    id: string,
    reason: string,
    currentUser: CurrentUser,
  ) {
    const order = await this.findOne(id, currentUser);

    // Vérifier que la commande peut être remboursée
    if (order.paymentStatus !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Only paid orders can be refunded');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    // Vérifier que l'utilisateur est le propriétaire de la commande
    if (order.userId !== currentUser.id && currentUser.role !== UserRole.PLATFORM_ADMIN) {
      throw new ForbiddenException('Only order owner can request refund');
    }

    try {
      // Créer un remboursement Stripe si la commande a été payée via Stripe
      if (order.stripePaymentId) {
        const stripe = await this.getStripe();
        const refund = await stripe.refunds.create({
          payment_intent: order.stripePaymentId,
          reason: 'requested_by_customer',
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            reason,
            requestedBy: currentUser.id,
          },
        });

        // Mettre à jour la commande
        const updatedOrder = await this.prisma.order.update({
          where: { id },
          data: {
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.REFUNDED,
            metadata: {
              ...((order.metadata as any) || {}),
              refund: {
                refundId: refund.id,
                amountCents: refund.amount,
                reason,
                requestedAt: new Date().toISOString(),
                requestedBy: currentUser.id,
              },
            } as any,
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            metadata: true,
          },
        });

        this.logger.log(`Refund processed for order ${order.orderNumber}: ${refund.amount / 100}€`);

        return {
          success: true,
          refundId: refund.id,
          amountCents: refund.amount,
          order: updatedOrder,
        };
      } else {
        // Pas de paiement Stripe, marquer comme remboursement manuel
        const updatedOrder = await this.prisma.order.update({
          where: { id },
          data: {
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.REFUNDED,
            metadata: {
              ...((order.metadata as any) || {}),
              refund: {
                reason,
                requestedAt: new Date().toISOString(),
                requestedBy: currentUser.id,
                type: 'manual',
              },
            } as any,
          },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
          },
        });

        this.logger.log(`Manual refund requested for order ${order.orderNumber}`);

        return {
          success: true,
          refundId: null,
          amountCents: order.totalCents,
          order: updatedOrder,
          note: 'Manual refund - requires admin approval',
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process refund for order ${order.orderNumber}: ${errorMessage}`);
      throw new BadRequestException(`Failed to process refund: ${errorMessage}`);
    }
  }

  private generateOrderNumber(): string {
    const crypto = require('crypto');
    const randomPart = crypto.randomBytes(5).toString('hex').toUpperCase();
    return `ORD-${Date.now()}-${randomPart}`;
  }
}
