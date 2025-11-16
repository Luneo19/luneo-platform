import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma, UserRole, OrderStatus, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { ProductionJobQueueService } from '@/modules/production/services/production-job-queue.service';
import type {
  ProductionJobData,
  ProductionOptions,
  Address as ProductionAddress,
} from '@/modules/production/interfaces/production-jobs.interface';
import type { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private stripe: Stripe;
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private readonly productionQueue: ProductionJobQueueService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      throw new Error('Stripe secret key is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
  }

  async create(createOrderDto: CreateOrderDto, currentUser: any) {
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
    const quantity = this.normalizeQuantity(createOrderDto.quantity);
    const unitPriceCents = Math.round(parseFloat(design.product.price.toString()) * 100);
    const subtotalCents = unitPriceCents * quantity;
    const taxCents = Math.round(subtotalCents * 0.20); // 20% VAT
    const shippingCents = 0; // Free shipping for now
    const totalCents = subtotalCents + taxCents + shippingCents;
    const normalizedShippingAddress = this.sanitizeAddress(shippingAddress);

    // Create order
    const order = await this.prisma.order.create({
      data: {
        orderNumber: this.generateOrderNumber(),
        customerEmail,
        customerName,
        customerPhone,
        shippingAddress: this.toJsonValue(normalizedShippingAddress),
        subtotalCents,
        taxCents,
        shippingCents,
        totalCents,
        userId: currentUser.id,
        brandId: design.brandId,
        designId,
        productId: design.productId,
        metadata: this.toJsonValue({
          quantity,
          unitPriceCents,
        }),
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
            unit_amount: unitPriceCents,
          },
          quantity,
        },
      ],
      mode: 'payment',
      success_url: `${this.configService.get('app.frontendUrl')}/orders/${order.id}/success`,
      cancel_url: `${this.configService.get('app.frontendUrl')}/orders/${order.id}/cancel`,
      metadata: {
        orderId: order.id,
        quantity: quantity.toString(),
        subtotal_cents: subtotalCents.toString(),
        tax_cents: taxCents.toString(),
        total_cents: totalCents.toString(),
      },
      automatic_tax: { enabled: false },
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

  async cancel(
    id: string,
    currentUser?: any,
    options?: { reason?: string; enforceOwnership?: boolean; actorId?: string },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const enforceOwnership = options?.enforceOwnership ?? true;

    if (
      enforceOwnership &&
      currentUser &&
      currentUser.role !== UserRole.PLATFORM_ADMIN &&
      currentUser.brandId !== order.brandId
    ) {
      throw new ForbiddenException('Access denied to this order');
    }

    if (!this.isCancellableStatus(order.status)) {
      throw new ForbiddenException('Order cannot be cancelled at this stage');
    }

    const cancellationReason = options?.reason ?? 'user_request';
    const actorId = currentUser?.id ?? options?.actorId ?? 'system';
    let refund: Stripe.Response<Stripe.Refund> | null = null;

    if (order.paymentStatus === PaymentStatus.SUCCEEDED && order.stripePaymentId) {
      try {
        refund = await this.stripe.refunds.create({
          payment_intent: order.stripePaymentId,
          amount: order.totalCents,
          reason: 'requested_by_customer',
          metadata: {
            orderId: order.id,
            cancelledAt: new Date().toISOString(),
            cancelledBy: actorId,
            cancellationReason,
          },
        });
      } catch (error) {
        this.logger.error(
          `Stripe refund failed for order ${order.id}`,
          error instanceof Error ? error.stack : undefined,
        );
        throw new ForbiddenException('Unable to issue refund for this order');
      }
    }

    const refundMetadata =
      refund !== null
        ? {
            id: refund.id,
            amount: refund.amount ?? order.totalCents,
            status: refund.status,
          }
        : order.paymentStatus === PaymentStatus.SUCCEEDED
        ? { status: 'pending_manual' }
        : undefined;

    const updateData: Prisma.OrderUpdateInput = {
      status: OrderStatus.CANCELLED,
      paymentStatus: refund
        ? PaymentStatus.REFUNDED
        : order.paymentStatus === PaymentStatus.SUCCEEDED
        ? PaymentStatus.CANCELLED
        : order.paymentStatus,
      notes: this.buildCancellationNote(order.notes, cancellationReason, Boolean(refund)),
      metadata: this.mergeMetadata(order.metadata, {
        cancellationReason,
        cancellationActor: actorId,
        ...(refundMetadata ? { refund: refundMetadata } : {}),
      }),
      ...(refund
        ? {
            refundId: refund.id,
            refundAmountCents: refund.amount ?? order.totalCents,
            refundedAt: new Date(refund.created * 1000),
          }
        : {}),
    };

    return this.prisma.order.update({
      where: { id },
      data: updateData,
    });
  }

  private generateOrderNumber(): string {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  async handleStripeCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      this.logger.debug(`Réception d'une session Stripe sans orderId (session ${session.id ?? 'unknown'})`);
      return;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        design: true,
        product: true,
      },
    });

    if (!order) {
      this.logger.warn(`Stripe checkout complété pour une commande introuvable (${orderId})`);
      return;
    }

    if (order.paymentStatus === PaymentStatus.SUCCEEDED) {
      this.logger.debug(`Commande ${orderId} déjà marquée comme payée, skip`);
      return;
    }

    const paymentIntentId = this.extractPaymentIntent(session.payment_intent);
    const updateData: Prisma.OrderUpdateInput = {
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.SUCCEEDED,
      paidAt: new Date(),
    };

    if (paymentIntentId) {
      updateData.stripePaymentId = paymentIntentId;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    const options = this.extractProductionOptions(order.design?.options as unknown);
    const shippingAddress = this.sanitizeAddress(order.shippingAddress);
    const billingAddress = { ...shippingAddress };
    const productionJob: ProductionJobData = {
      orderId: order.id,
      brandId: order.brandId,
      designId: order.designId,
      productId: order.productId,
      quantity: this.extractQuantity(order.metadata),
      priority: 'normal',
      options,
      factoryWebhookUrl: this.extractFactoryWebhookUrl(order.product),
      shippingAddress,
      billingAddress,
    };

    try {
      await this.productionQueue.enqueueCreateBundle(productionJob);
      this.logger.log(`Commande ${orderId}: job de production en file (payment)`);
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Impossible d'enfiler le job de production pour la commande ${orderId}`, stack);
      throw error;
    }
  }

  async handleStripeCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      this.logger.debug(`Sessions Stripe expirée sans orderId (session ${session.id ?? 'unknown'})`);
      return;
    }

    await this.prisma.order.updateMany({
      where: { id: orderId, paymentStatus: { in: [PaymentStatus.PENDING] } },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.FAILED,
      },
    });
  }

  async handleStripePaymentFailed(session: Stripe.Checkout.Session): Promise<void> {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      this.logger.debug(`Sessions Stripe payment_failed sans orderId (session ${session.id ?? 'unknown'})`);
      return;
    }

    await this.prisma.order.updateMany({
      where: { id: orderId, paymentStatus: { in: [PaymentStatus.PENDING] } },
      data: {
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.FAILED,
      },
    });
  }

  private extractProductionOptions(rawOptions: unknown): ProductionOptions {
    if (!rawOptions || typeof rawOptions !== 'object' || Array.isArray(rawOptions)) {
      return {};
    }

    const options = rawOptions as Record<string, unknown>;
    const pickStringArray = (key: string): string[] | undefined => {
      const value = options[key];
      if (!Array.isArray(value)) {
        return undefined;
      }
      const filtered = value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
      return filtered.length > 0 ? filtered : undefined;
    };

    const quality = options.qualityLevel;
    const allowedQuality: NonNullable<ProductionOptions['qualityLevel']>[] = ['standard', 'premium', 'luxury'];
    const resolvedQuality =
      typeof quality === 'string' && allowedQuality.includes(quality as NonNullable<ProductionOptions['qualityLevel']>)
        ? (quality as NonNullable<ProductionOptions['qualityLevel']>)
        : undefined;

    return {
      materials: pickStringArray('materials'),
      finishes: pickStringArray('finishes'),
      specialInstructions: pickStringArray('specialInstructions'),
      specialRequirements: pickStringArray('specialRequirements'),
      qualityLevel: resolvedQuality,
      packaging:
        typeof options.packaging === 'string' && options.packaging.trim().length > 0
          ? options.packaging.trim()
          : undefined,
      rush: typeof options.rush === 'boolean' ? options.rush : undefined,
    };
  }

  private extractFactoryWebhookUrl(product: unknown): string | undefined {
    if (!product || typeof product !== 'object') {
      return undefined;
    }

    const maybeProduct = product as Record<string, unknown>;

    if (typeof maybeProduct.factoryWebhookUrl === 'string' && maybeProduct.factoryWebhookUrl.length > 0) {
      return maybeProduct.factoryWebhookUrl;
    }

    if (
      typeof maybeProduct.metadata === 'object' &&
      maybeProduct.metadata !== null &&
      !Array.isArray(maybeProduct.metadata)
    ) {
      const metadata = maybeProduct.metadata as Record<string, unknown>;
      const webhook = metadata.factoryWebhookUrl;
      if (typeof webhook === 'string' && webhook.length > 0) {
        return webhook;
      }
    }

    return undefined;
  }

  private sanitizeAddress(address: unknown): ProductionAddress {
    const defaultAddress: ProductionAddress = {
      firstName: 'Client',
      lastName: 'Luneo',
      address1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      phone: '',
    };

    if (!address || typeof address !== 'object' || Array.isArray(address)) {
      return defaultAddress;
    }

    const record = address as Record<string, unknown>;

    const getString = (key: string, fallback = ''): string => {
      const value = record[key];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : fallback;
      }
      return fallback;
    };

    return {
      firstName: getString('firstName', defaultAddress.firstName),
      lastName: getString('lastName', defaultAddress.lastName),
      company: getString('company') || undefined,
      address1: getString('address1', defaultAddress.address1),
      address2: getString('address2') || undefined,
      city: getString('city', defaultAddress.city),
      state: getString('state', defaultAddress.state),
      postalCode: getString('postalCode', defaultAddress.postalCode),
      country: getString('country', defaultAddress.country),
      phone: getString('phone', defaultAddress.phone),
    };
  }

  private toJsonValue<T>(value: T): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  private extractPaymentIntent(paymentIntent: unknown): string | undefined {
    if (!paymentIntent) {
      return undefined;
    }

    if (typeof paymentIntent === 'string') {
      return paymentIntent;
    }

    if (typeof paymentIntent === 'object' && !Array.isArray(paymentIntent) && 'id' in paymentIntent) {
      const candidate = (paymentIntent as { id?: unknown }).id;
      if (typeof candidate === 'string') {
        return candidate;
      }
    }

    return undefined;
  }

  private extractQuantity(metadata: unknown): number {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return 1;
    }

    const value = (metadata as Record<string, unknown>).quantity;
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.floor(value);
    }

    return 1;
  }

  private normalizeQuantity(quantity: unknown): number {
    if (typeof quantity === 'number' && Number.isFinite(quantity) && quantity > 0) {
      return Math.floor(quantity);
    }

    if (typeof quantity === 'string') {
      const parsed = Number.parseInt(quantity, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return 1;
  }

  private isCancellableStatus(status: OrderStatus): boolean {
    return (
      status === OrderStatus.CREATED ||
      status === OrderStatus.PENDING_PAYMENT ||
      status === OrderStatus.PROCESSING
    );
  }

  private buildCancellationNote(
    existingNote: string | null | undefined,
    reason: string,
    refunded: boolean,
  ): string {
    const timestamp = new Date().toISOString();
    const statusLabel = refunded ? 'refund issued' : 'no payment captured';
    const entry = `[${timestamp}] Cancellation (${reason}) – ${statusLabel}`;
    return existingNote ? `${existingNote}\n${entry}` : entry;
  }

  private mergeMetadata(
    existing: Prisma.JsonValue | null | undefined,
    patch: Record<string, unknown>,
  ): Prisma.InputJsonValue {
    const base =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? (existing as Record<string, unknown>)
        : {};

    return JSON.parse(JSON.stringify({ ...base, ...patch })) as Prisma.InputJsonValue;
  }
}
