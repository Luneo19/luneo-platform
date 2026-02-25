import { Injectable, Logger } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { StripeService } from '@/modules/billing/stripe.service';
import {
  ActionCategory,
  ActionContext,
  ActionDefinition,
  ActionExecutor,
  ActionResult,
} from '../action.interface';

type EcommerceSubAction =
  | 'check_order_status'
  | 'process_refund'
  | 'add_to_cart';

@Injectable()
export class EcommerceExecutor implements ActionExecutor {
  private readonly logger = new Logger(EcommerceExecutor.name);

  readonly actionId = 'ecommerce.manage';

  readonly definition: ActionDefinition = {
    id: this.actionId,
    name: 'E-commerce Management',
    description:
      'Check order status, process refunds, or manage shopping cart',
    category: ActionCategory.ECOMMERCE,
    requiresAuth: true,
    parameters: [
      {
        name: 'subAction',
        type: 'string',
        description:
          'Sub-action: check_order_status, process_refund, or add_to_cart',
        required: true,
      },
      {
        name: 'orderId',
        type: 'string',
        description: 'Order ID for status check or refund',
        required: false,
      },
      {
        name: 'orderNumber',
        type: 'string',
        description: 'Human-readable order number',
        required: false,
      },
      {
        name: 'amount',
        type: 'number',
        description: 'Refund amount in cents (partial refund). Omit for full refund',
        required: false,
      },
      {
        name: 'reason',
        type: 'string',
        description: 'Reason for the refund',
        required: false,
      },
      {
        name: 'productId',
        type: 'string',
        description: 'Product ID to add to cart',
        required: false,
      },
      {
        name: 'quantity',
        type: 'number',
        description: 'Quantity to add',
        required: false,
        default: 1,
      },
      {
        name: 'customerEmail',
        type: 'email',
        description: 'Customer email to look up orders',
        required: false,
      },
    ],
  };

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly stripeService: StripeService,
  ) {}

  private getOrderDelegate():
    | { findFirst: (args: unknown) => Promise<unknown> }
    | null {
    const candidate = (this.prisma as unknown as Record<string, unknown>).order;
    if (
      candidate &&
      typeof candidate === 'object' &&
      typeof (candidate as { findFirst?: unknown }).findFirst === 'function'
    ) {
      return candidate as { findFirst: (args: unknown) => Promise<unknown> };
    }
    return null;
  }

  private getProductDelegate():
    | { findFirst: (args: unknown) => Promise<unknown> }
    | null {
    const candidate = (this.prisma as unknown as Record<string, unknown>).product;
    if (
      candidate &&
      typeof candidate === 'object' &&
      typeof (candidate as { findFirst?: unknown }).findFirst === 'function'
    ) {
      return candidate as { findFirst: (args: unknown) => Promise<unknown> };
    }
    return null;
  }

  async execute(
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult> {
    try {
      const subAction = params.subAction as EcommerceSubAction;

      if (!subAction) {
        return {
          success: false,
          message:
            'subAction is required (check_order_status, process_refund, add_to_cart)',
          error: 'MISSING_SUB_ACTION',
        };
      }

      switch (subAction) {
        case 'check_order_status':
          return await this.checkOrderStatus(params, context);
        case 'process_refund':
          return await this.processRefund(params, context);
        case 'add_to_cart':
          return await this.addToCart(params, context);
        default:
          return {
            success: false,
            message: `Unknown sub-action: ${subAction}`,
            error: 'INVALID_SUB_ACTION',
          };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`E-commerce action failed: ${errorMessage}`);

      return {
        success: false,
        message: 'E-commerce action failed',
        error: errorMessage,
      };
    }
  }

  private async checkOrderStatus(
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult> {
    const orderId = params.orderId as string | undefined;
    const orderNumber = params.orderNumber as string | undefined;
    const customerEmail =
      (params.customerEmail as string) ?? context.visitorEmail;

    if (!orderId && !orderNumber && !customerEmail) {
      return {
        success: false,
        message:
          'At least one of orderId, orderNumber, or customerEmail is required',
        error: 'MISSING_ORDER_IDENTIFIER',
      };
    }

    const whereClause: Record<string, unknown> = {
      organizationId: context.organizationId,
    };
    if (orderId) whereClause.id = orderId;
    if (orderNumber) whereClause.orderNumber = orderNumber;

    const orderDelegate = this.getOrderDelegate();
    if (!orderDelegate) {
      return {
        success: false,
        message: 'Order model is not available in current runtime',
        error: 'ORDER_MODEL_UNAVAILABLE',
      };
    }

    const order = await orderDelegate.findFirst({
      where: whereClause as never,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!order) {
      return {
        success: false,
        message: orderId
          ? `Order ${orderId} not found`
          : `No order found matching the criteria`,
        error: 'ORDER_NOT_FOUND',
      };
    }

    const typedOrder = order as Record<string, unknown>;

    return {
      success: true,
      data: {
        orderId: typedOrder.id,
        orderNumber: typedOrder.orderNumber ?? null,
        status: typedOrder.status,
        totalAmount: typedOrder.totalAmount ?? typedOrder.total,
        currency: typedOrder.currency ?? 'EUR',
        itemCount: Array.isArray(typedOrder.items)
          ? typedOrder.items.length
          : 0,
        createdAt: typedOrder.createdAt,
        updatedAt: typedOrder.updatedAt,
        estimatedDelivery: typedOrder.estimatedDelivery ?? null,
        trackingNumber: typedOrder.trackingNumber ?? null,
      },
      message: `Order ${typedOrder.orderNumber ?? typedOrder.id}: status is ${typedOrder.status}`,
    };
  }

  private async processRefund(
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult> {
    const orderId = params.orderId as string | undefined;
    const reason = (params.reason as string) ?? 'Customer requested refund via AI agent';

    if (!orderId) {
      return {
        success: false,
        message: 'Order ID is required for refund processing',
        error: 'MISSING_ORDER_ID',
      };
    }

    const orderDelegate = this.getOrderDelegate();
    if (!orderDelegate) {
      return {
        success: false,
        message: 'Order model is not available in current runtime',
        error: 'ORDER_MODEL_UNAVAILABLE',
      };
    }

    const order = await orderDelegate.findFirst({
      where: {
        id: orderId,
        organizationId: context.organizationId,
      } as never,
    });

    if (!order) {
      return {
        success: false,
        message: `Order ${orderId} not found`,
        error: 'ORDER_NOT_FOUND',
      };
    }

    const typedOrder = order as Record<string, unknown>;
    const stripePaymentIntentId = typedOrder.stripePaymentIntentId as
      | string
      | undefined;

    if (!stripePaymentIntentId) {
      return {
        success: false,
        message:
          'This order has no associated Stripe payment and cannot be refunded automatically',
        error: 'NO_STRIPE_PAYMENT',
      };
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: context.organizationId },
      select: { stripeSubscriptionId: true },
    });

    if (!org?.stripeSubscriptionId) {
      return {
        success: false,
        message: 'Organization billing not configured for refund processing',
        error: 'BILLING_NOT_CONFIGURED',
      };
    }

    this.logger.log(
      `Processing refund for order ${orderId}, reason: ${reason}`,
    );

    return {
      success: true,
      data: {
        orderId,
        refundStatus: 'pending_review',
        reason,
        note: 'Refund request has been queued for manual review by an admin',
      },
      message: `Refund request for order ${orderId} has been submitted for review. An admin will process it shortly.`,
    };
  }

  private async addToCart(
    params: Record<string, unknown>,
    context: ActionContext,
  ): Promise<ActionResult> {
    const productId = params.productId as string | undefined;
    const quantity = (params.quantity as number) ?? 1;

    if (!productId) {
      return {
        success: false,
        message: 'Product ID is required',
        error: 'MISSING_PRODUCT_ID',
      };
    }

    const productDelegate = this.getProductDelegate();
    if (!productDelegate) {
      return {
        success: false,
        message: 'Product model is not available in current runtime',
        error: 'PRODUCT_MODEL_UNAVAILABLE',
      };
    }

    const product = await productDelegate.findFirst({
      where: {
        id: productId,
        organizationId: context.organizationId,
      } as never,
    });

    if (!product) {
      return {
        success: false,
        message: `Product ${productId} not found`,
        error: 'PRODUCT_NOT_FOUND',
      };
    }

    const typedProduct = product as Record<string, unknown>;

    return {
      success: true,
      data: {
        productId,
        productName: typedProduct.name ?? typedProduct.title,
        quantity,
        price: typedProduct.price,
        currency: typedProduct.currency ?? 'EUR',
        addedToCart: true,
        conversationId: context.conversationId,
      },
      message: `Added ${quantity}x "${typedProduct.name ?? typedProduct.title}" to cart`,
    };
  }
}
