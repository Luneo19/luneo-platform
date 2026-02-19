import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ProductionOrderStatus } from '@prisma/client';
import { PCE_EVENTS } from '../../pce.constants';
import { ProviderManagerService } from './provider-manager.service';
import { CostCalculatorService } from './cost-calculator.service';
import type { PODQuote, PODShippingAddress, PODOrderItem } from '../interfaces/manufacturing.interface';

export interface GetQuotesParams {
  brandId: string;
  items: PODOrderItem[];
  shippingAddress: PODShippingAddress;
  providerId?: string;
}

export interface CreateProductionOrderParams {
  brandId: string;
  orderId: string;
  items: PODOrderItem[];
  shippingAddress: PODShippingAddress;
  providerId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ManufacturingOrchestratorService {
  private readonly logger = new Logger(ManufacturingOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerManager: ProviderManagerService,
    private readonly costCalculator: CostCalculatorService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get quotes from one or all available providers.
   */
  async getQuotes(params: GetQuotesParams): Promise<PODQuote[]> {
    const providers = params.providerId
      ? [await this.providerManager.getProvider(params.providerId)]
      : await this.providerManager.getAvailableProviders(params.brandId);

    const quotes: PODQuote[] = [];
    for (const p of providers) {
      const providerId = 'id' in p ? p.id : (p as { id: string }).id;
      try {
        const instance = await this.providerManager.getProviderInstance(providerId);
        const [prodCost, shipCost] = await Promise.all([
          this.costCalculator.calculateProductionCost(params.items, providerId),
          this.costCalculator.calculateShippingCost(
            params.shippingAddress,
            params.items,
            providerId,
          ),
        ]);
        const totalCost = prodCost.itemsCost + shipCost.cost;
        quotes.push({
          providerId,
          providerName: 'name' in p ? p.name : (p as { name: string }).name,
          items: prodCost.breakdown.map((b) => ({
            productId: b.productId,
            quantity: b.quantity,
            unitCost: b.unitCost,
            totalCost: b.total,
            currency: prodCost.currency,
          })),
          shippingCost: shipCost.cost,
          totalCost,
          currency: prodCost.currency,
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      } catch (err) {
        this.logger.warn(`Quote failed for provider ${providerId}: ${err}`);
      }
    }
    return quotes;
  }

  /**
   * Create a production order and submit to the selected (or optimal) provider.
   */
  async createProductionOrder(params: CreateProductionOrderParams): Promise<{
    id: string;
    externalOrderId: string | null;
    status: string;
  }> {
    const provider = params.providerId
      ? await this.providerManager.getProvider(params.providerId)
      : await this.providerManager.selectOptimalProvider(params.brandId);

    if (!provider) {
      throw new BadRequestException('No POD provider available for this brand');
    }
    const providerId = typeof provider === 'object' && 'id' in provider ? provider.id : (provider as { id: string }).id;

    const [prodCost, shipCost] = await Promise.all([
      this.costCalculator.calculateProductionCost(params.items, providerId),
      this.costCalculator.calculateShippingCost(
        params.shippingAddress,
        params.items,
        providerId,
      ),
    ]);

    const costs = {
      itemsCost: prodCost.itemsCost,
      shippingCost: shipCost.cost,
      currency: prodCost.currency,
    };

    const productionOrder = await this.prisma.productionOrder.create({
      data: {
        brandId: params.brandId,
        orderId: params.orderId,
        providerId,
        status: ProductionOrderStatus.DRAFT,
        items: params.items as object,
        shippingAddress: params.shippingAddress as object,
        costs: costs as object,
        statusHistory: [
          { status: ProductionOrderStatus.DRAFT, at: new Date().toISOString() },
        ] as object,
        metadata: (params.metadata ?? {}) as object,
      },
    });

    let externalOrderId: string | null = null;
    let status: string = ProductionOrderStatus.DRAFT;

    try {
      const instance = await this.providerManager.getProviderInstance(providerId);
      const result = await instance.createOrder(
        params.items,
        params.shippingAddress,
        { externalId: productionOrder.id },
      );
      externalOrderId = result.externalOrderId;
      status = result.status;

      const statusHistory = (productionOrder.statusHistory as Array<{ status: string; at: string }>) ?? [];
      statusHistory.push({ status: ProductionOrderStatus.SUBMITTED, at: new Date().toISOString() });

      await this.prisma.productionOrder.update({
        where: { id: productionOrder.id },
        data: {
          externalOrderId,
          status: status as ProductionOrderStatus,
          submittedAt: new Date(),
          statusHistory: statusHistory as object,
        },
      });

      this.eventEmitter.emit(PCE_EVENTS.PRODUCTION_SUBMITTED, {
        productionOrderId: productionOrder.id,
        orderId: params.orderId,
        brandId: params.brandId,
        externalOrderId,
        providerId,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.productionOrder.update({
        where: { id: productionOrder.id },
        data: {
          status: ProductionOrderStatus.FAILED,
          error: message,
          statusHistory: [
            ...((productionOrder.statusHistory as Array<{ status: string; at: string }>) ?? []),
            { status: ProductionOrderStatus.FAILED, at: new Date().toISOString() },
          ] as object,
        },
      });
      this.eventEmitter.emit(PCE_EVENTS.PRODUCTION_FAILED, {
        productionOrderId: productionOrder.id,
        orderId: params.orderId,
        brandId: params.brandId,
        error: message,
      });
      throw new BadRequestException(`Failed to submit to provider: ${message}`);
    }

    return {
      id: productionOrder.id,
      externalOrderId,
      status,
    };
  }

  /**
   * List production orders for a brand with optional status filter and pagination.
   */
  async listProductionOrders(
    brandId: string,
    options: { status?: string; limit?: number; offset?: number } = {},
  ): Promise<{ items: unknown[]; total: number }> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const where: { brandId: string; status?: ProductionOrderStatus } = { brandId };
    if (options.status) where.status = options.status as ProductionOrderStatus;
    const [items, total] = await Promise.all([
      this.prisma.productionOrder.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderId: true,
          providerId: true,
          externalOrderId: true,
          status: true,
          trackingNumber: true,
          submittedAt: true,
          completedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.productionOrder.count({ where }),
    ]);
    return { items, total };
  }

  /**
   * Get current status of a production order (from DB and optionally from provider).
   */
  async getProductionOrderStatus(id: string): Promise<{
    id: string;
    status: string;
    externalOrderId: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    submittedAt: Date | null;
    completedAt: Date | null;
    error: string | null;
  }> {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (!order) {
      throw new NotFoundException(`Production order not found: ${id}`);
    }
    if (order.externalOrderId && order.providerId) {
      try {
        const instance = await this.providerManager.getProviderInstance(order.providerId);
        const remote = await instance.getOrderStatus(order.externalOrderId);
        if (remote.trackingNumber || remote.trackingUrl || remote.status !== order.status) {
          await this.prisma.productionOrder.update({
            where: { id },
            data: {
              status: remote.status as ProductionOrderStatus,
              trackingNumber: remote.trackingNumber ?? order.trackingNumber,
              trackingUrl: remote.trackingUrl ?? order.trackingUrl,
              completedAt: remote.completedAt ?? order.completedAt,
              error: remote.error ?? order.error,
            },
          });
          return {
            id: order.id,
            status: remote.status,
            externalOrderId: order.externalOrderId,
            trackingNumber: remote.trackingNumber ?? order.trackingNumber,
            trackingUrl: remote.trackingUrl ?? order.trackingUrl,
            submittedAt: order.submittedAt,
            completedAt: remote.completedAt ?? order.completedAt,
            error: remote.error ?? order.error,
          };
        }
      } catch (err) {
        this.logger.warn(`Could not fetch remote status for ${id}: ${err}`);
      }
    }
    return {
      id: order.id,
      status: order.status,
      externalOrderId: order.externalOrderId,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      submittedAt: order.submittedAt,
      completedAt: order.completedAt,
      error: order.error,
    };
  }

  /**
   * Cancel a production order (and cancel with provider if submitted).
   */
  async cancelProductionOrder(id: string): Promise<{ id: string; status: string }> {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException(`Production order not found: ${id}`);
    }
    if (
      order.status === ProductionOrderStatus.CANCELLED ||
      order.status === ProductionOrderStatus.DELIVERED
    ) {
      throw new BadRequestException(`Order cannot be cancelled in status: ${order.status}`);
    }
    if (order.externalOrderId && order.providerId) {
      try {
        const instance = await this.providerManager.getProviderInstance(order.providerId);
        await instance.cancelOrder(order.externalOrderId);
      } catch (err) {
        this.logger.warn(`Provider cancel failed for ${id}: ${err}`);
      }
    }
    const statusHistory = (order.statusHistory as Array<{ status: string; at: string }>) ?? [];
    statusHistory.push({ status: ProductionOrderStatus.CANCELLED, at: new Date().toISOString() });

    await this.prisma.productionOrder.update({
      where: { id },
      data: {
        status: ProductionOrderStatus.CANCELLED,
        statusHistory: statusHistory as object,
      },
    });

    this.eventEmitter.emit(PCE_EVENTS.PRODUCTION_FAILED, {
      productionOrderId: id,
      orderId: order.orderId,
      brandId: order.brandId,
      error: 'Cancelled',
    });

    return { id, status: ProductionOrderStatus.CANCELLED };
  }

  /**
   * Resubmit a failed or cancelled production order to the same provider.
   */
  async resubmitProductionOrder(id: string): Promise<{ id: string; status: string }> {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException(`Production order not found: ${id}`);
    }
    if (order.status !== ProductionOrderStatus.FAILED && order.status !== ProductionOrderStatus.CANCELLED) {
      throw new BadRequestException(`Only FAILED or CANCELLED orders can be resubmitted. Current: ${order.status}`);
    }
    if (!order.providerId) {
      throw new BadRequestException('Order has no provider');
    }

    const items = order.items as unknown as PODOrderItem[];
    const shippingAddress = order.shippingAddress as unknown as PODShippingAddress;
    if (!items?.length || !shippingAddress) {
      throw new BadRequestException('Order missing items or shipping address');
    }

    const instance = await this.providerManager.getProviderInstance(order.providerId);
    const result = await instance.createOrder(items, shippingAddress, {
      externalId: order.id,
      resubmit: true,
    });

    const statusHistory = (order.statusHistory as Array<{ status: string; at: string }>) ?? [];
    statusHistory.push({ status: ProductionOrderStatus.SUBMITTED, at: new Date().toISOString() });

    await this.prisma.productionOrder.update({
      where: { id },
      data: {
        externalOrderId: result.externalOrderId,
        status: result.status as ProductionOrderStatus,
        submittedAt: new Date(),
        error: null,
        statusHistory: statusHistory as object,
      },
    });

    this.eventEmitter.emit(PCE_EVENTS.PRODUCTION_SUBMITTED, {
      productionOrderId: id,
      orderId: order.orderId,
      brandId: order.brandId,
      externalOrderId: result.externalOrderId,
      providerId: order.providerId,
    });

    return { id, status: result.status };
  }
}
