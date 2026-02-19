import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { PODOrderItem, PODShippingAddress } from '../interfaces/manufacturing.interface';
import { ProviderManagerService } from './provider-manager.service';

export interface ProductionCostResult {
  itemsCost: number;
  currency: string;
  breakdown: Array<{ productId: string; quantity: number; unitCost: number; total: number }>;
}

export interface ShippingCostResult {
  cost: number;
  currency: string;
  carrier?: string;
  service?: string;
}

export interface TotalCostResult {
  productionOrderId: string;
  itemsCost: number;
  shippingCost: number;
  total: number;
  currency: string;
}

@Injectable()
export class CostCalculatorService {
  private readonly logger = new Logger(CostCalculatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerManager: ProviderManagerService,
  ) {}

  /**
   * Estimate production cost for items using the given provider (quotes from provider).
   */
  async calculateProductionCost(
    items: PODOrderItem[],
    providerId: string,
  ): Promise<ProductionCostResult> {
    const provider = await this.providerManager.getProviderInstance(providerId);
    const products = await provider.getProducts();
    const breakdown: Array<{ productId: string; quantity: number; unitCost: number; total: number }> = [];
    let itemsCost = 0;
    const currency = 'USD';

    for (const item of items) {
      const variantId = item.variantId ?? item.productId;
      let unitCost = 0;
      for (const p of products) {
        const v = p.variants.find((x) => x.id === variantId || x.id === item.productId);
        if (v) {
          unitCost = v.price;
          break;
        }
        if (p.id === item.productId && p.variants.length > 0) {
          unitCost = p.variants[0].price;
          break;
        }
      }
      const total = unitCost * item.quantity;
      itemsCost += total;
      breakdown.push({
        productId: item.productId,
        quantity: item.quantity,
        unitCost,
        total,
      });
    }

    return { itemsCost, currency, breakdown };
  }

  /**
   * Estimate shipping cost for address and items using the given provider.
   */
  async calculateShippingCost(
    address: PODShippingAddress,
    items: PODOrderItem[],
    providerId: string,
  ): Promise<ShippingCostResult> {
    const provider = await this.providerManager.getProviderInstance(providerId);
    const rates = await provider.getShippingRates(address, items);
    if (rates.length === 0) {
      return { cost: 0, currency: 'USD' };
    }
    const best = rates.reduce((a, b) => (a.cost <= b.cost ? a : b));
    return {
      cost: best.cost,
      currency: best.currency ?? 'USD',
      carrier: best.carrier,
      service: best.service,
    };
  }

  /**
   * Aggregate total cost from an existing production order (reads costs from DB).
   */
  async calculateTotalCost(productionOrderId: string): Promise<TotalCostResult> {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id: productionOrderId },
    });
    if (!order) {
      throw new NotFoundException(`Production order not found: ${productionOrderId}`);
    }
    const costs = (order.costs as Record<string, unknown>) ?? {};
    const itemsCost = Number(costs['itemsCost']) || 0;
    const shippingCost = Number(costs['shippingCost']) || 0;
    const currency = (costs['currency'] as string) ?? 'USD';
    return {
      productionOrderId: order.id,
      itemsCost,
      shippingCost,
      total: itemsCost + shippingCost,
      currency,
    };
  }
}
