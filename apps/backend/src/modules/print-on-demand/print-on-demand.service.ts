import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type {
  PrintProduct,
  PrintProvider,
  PrintOrderRequest,
  PrintOrderItem,
  ShippingAddress,
} from './interfaces/print-provider.interface';
import { PrintfulProvider } from './providers/printful.provider';
import { PrintifyProvider } from './providers/printify.provider';
import { GelatoProvider } from './providers/gelato.provider';

const LUNEO_MARGIN_PERCENT = 10;
const PROVIDER_NAMES = ['printful', 'printify', 'gelato'] as const;

export interface PricingInputItem {
  productId: string;
  variantId: string;
  quantity: number;
  unitPriceCents?: number; // If not provided, fetched from provider
}

export interface PricingResult {
  providerCost: number;
  luneoMargin: number;
  brandMargin: number;
  totalPrice: number;
  currency: string;
}

@Injectable()
export class PrintOnDemandService {
  private readonly logger = new Logger(PrintOnDemandService.name);
  private readonly providers = new Map<string, PrintProvider>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly printfulProvider: PrintfulProvider,
    private readonly printifyProvider: PrintifyProvider,
    private readonly gelatoProvider: GelatoProvider,
  ) {
    this.providers.set('printful', printfulProvider);
    this.providers.set('printify', printifyProvider);
    this.providers.set('gelato', gelatoProvider);
  }

  getProvider(providerName: string): PrintProvider {
    const normalized = providerName?.toLowerCase();
    const provider = this.providers.get(normalized);
    if (!provider) {
      throw new BadRequestException(
        `Unknown print provider: ${providerName}. Available: ${PROVIDER_NAMES.join(', ')}`,
      );
    }
    return provider;
  }

  getAvailableProviders(): string[] {
    return [...PROVIDER_NAMES];
  }

  async getAvailableProducts(providerName: string): Promise<PrintProduct[]> {
    const provider = this.getProvider(providerName);
    return provider.getProducts();
  }

  async getProductById(providerName: string, productId: string): Promise<PrintProduct | null> {
    const provider = this.getProvider(providerName);
    return provider.getProductById(productId);
  }

  async createPrintOrder(
    brandId: string,
    orderId: string,
    providerName: string,
    items: PrintOrderItem[],
    shippingAddress: ShippingAddress,
    brandMarginPercent?: number,
  ) {
    const provider = this.getProvider(providerName);
    const pricing = await this.calculatePricing(
      items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      providerName,
      brandMarginPercent,
    );
    const request: PrintOrderRequest = {
      externalId: orderId,
      items,
      shippingAddress,
    };
    const result = await provider.createOrder(request);
    const printOrder = await this.prisma.printOrder.create({
      data: {
        orderId,
        brandId,
        provider: providerName.toLowerCase(),
        providerOrderId: result.providerOrderId,
        status: result.status,
        trackingUrl: result.trackingUrl ?? undefined,
        items: items as unknown as object,
        shippingAddress: shippingAddress as unknown as object,
        providerCost: pricing.providerCost,
        luneoMargin: pricing.luneoMargin,
        brandMargin: pricing.brandMargin,
        totalPrice: pricing.totalPrice,
        metadata: { estimatedDelivery: result.estimatedDelivery?.toISOString() },
      },
    });
    return { printOrder, providerResult: result };
  }

  async getOrderStatus(orderId: string) {
    const printOrder = await this.prisma.printOrder.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    if (!printOrder) {
      throw new NotFoundException(`Print order not found for order ${orderId}`);
    }
    if (!printOrder.providerOrderId) {
      return {
        id: printOrder.id,
        orderId: printOrder.orderId,
        provider: printOrder.provider,
        providerOrderId: printOrder.providerOrderId,
        status: printOrder.status,
        trackingNumber: printOrder.trackingNumber,
        trackingUrl: printOrder.trackingUrl,
      };
    }
    const provider = this.getProvider(printOrder.provider);
    const result = await provider.getOrderStatus(printOrder.providerOrderId);
    await this.prisma.printOrder.update({
      where: { id: printOrder.id },
      data: {
        status: result.status,
        trackingUrl: result.trackingUrl ?? printOrder.trackingUrl,
      },
    });
    return {
      id: printOrder.id,
      orderId: printOrder.orderId,
      provider: printOrder.provider,
      providerOrderId: result.providerOrderId,
      status: result.status,
      trackingUrl: result.trackingUrl ?? printOrder.trackingUrl,
      estimatedDelivery: result.estimatedDelivery,
    };
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const printOrder = await this.prisma.printOrder.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
    if (!printOrder) {
      throw new NotFoundException(`Print order not found for order ${orderId}`);
    }
    if (!printOrder.providerOrderId) {
      await this.prisma.printOrder.update({
        where: { id: printOrder.id },
        data: { status: 'cancelled' },
      });
      return true;
    }
    const provider = this.getProvider(printOrder.provider);
    const cancelled = await provider.cancelOrder(printOrder.providerOrderId);
    if (cancelled) {
      await this.prisma.printOrder.update({
        where: { id: printOrder.id },
        data: { status: 'cancelled' },
      });
    }
    return cancelled;
  }

  async calculatePricing(
    items: PricingInputItem[],
    providerName: string,
    brandMarginPercent?: number,
  ): Promise<PricingResult> {
    const provider = this.getProvider(providerName);
    let providerCostCents = 0;
    const currency = 'EUR';
    for (const item of items) {
      let unitCents = item.unitPriceCents;
      if (unitCents == null) {
        const product = await provider.getProductById(item.productId);
        const variant = product?.variants?.find((v) => v.id === item.variantId);
        unitCents = variant?.price ?? 0;
      }
      providerCostCents += unitCents * item.quantity;
    }
    const luneoMarginCents = Math.round((providerCostCents * LUNEO_MARGIN_PERCENT) / 100);
    const brandPercent = brandMarginPercent ?? 0;
    const brandMarginCents = Math.round((providerCostCents * brandPercent) / 100);
    const totalPrice = providerCostCents + luneoMarginCents + brandMarginCents;
    return {
      providerCost: providerCostCents,
      luneoMargin: luneoMarginCents,
      brandMargin: brandMarginCents,
      totalPrice,
      currency,
    };
  }

  async getMockup(providerName: string, productId: string, designUrl: string): Promise<string> {
    const provider = this.getProvider(providerName);
    return provider.getMockup(productId, designUrl);
  }
}
