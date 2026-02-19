import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  brandId: string;
  totalCents: number;
  items: Array<{
    id: string;
    productId: string;
    designId: string | null;
    quantity: number;
    priceCents: number;
    totalCents: number;
  }>;
}

export interface OrderItemRecord {
  id: string;
  productId: string;
  designId: string | null;
  quantity: number;
  priceCents: number;
  totalCents: number;
  metadata: unknown;
}

/**
 * Bridge to the existing orders module. Simple delegation via Prisma for PCE-internal use (no auth context).
 */
@Injectable()
export class OrderBridgeService {
  private readonly logger = new Logger(OrderBridgeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrder(orderId: string): Promise<OrderSummary | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        brandId: true,
        totalCents: true,
        items: {
          select: {
            id: true,
            productId: true,
            designId: true,
            quantity: true,
            priceCents: true,
            totalCents: true,
          },
        },
      },
    });
    if (!order) return null;
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      brandId: order.brandId,
      totalCents: order.totalCents,
      items: order.items,
    };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const existing = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      throw new NotFoundException(`Order not found: ${orderId}`);
    }
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
    this.logger.log(`Order ${orderId} status updated to ${status}`);
  }

  async getOrderItems(orderId: string): Promise<OrderItemRecord[]> {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      select: {
        id: true,
        productId: true,
        designId: true,
        quantity: true,
        priceCents: true,
        totalCents: true,
        metadata: true,
      },
    });
    return items.map((i) => ({
      id: i.id,
      productId: i.productId,
      designId: i.designId,
      quantity: i.quantity,
      priceCents: i.priceCents,
      totalCents: i.totalCents,
      metadata: i.metadata,
    }));
  }
}
