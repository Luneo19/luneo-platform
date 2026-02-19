import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type {
  Address,
  ShippingRate,
  GetRatesParams,
  CreateShipmentParams,
  CreateShipmentResult,
  ValidateAddressResult,
  IShippingProvider,
} from './shipping.types';
import { SHIPPING_PROVIDER_REGISTRY } from './shipping.types';

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name);
  private readonly providerByCarrier = new Map<string, IShippingProvider>();

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject(SHIPPING_PROVIDER_REGISTRY)
    providers: IShippingProvider[] | null,
  ) {
    const list = providers ?? [];
    for (const p of list) {
      this.providerByCarrier.set(p.carrier.toLowerCase(), p);
    }
    this.logger.log(
      `ShippingService initialized with ${this.providerByCarrier.size} carrier(s)`,
    );
  }

  async getRates(params: GetRatesParams): Promise<ShippingRate[]> {
    const carrier = params.carrier?.toLowerCase();
    if (carrier) {
      const provider = this.providerByCarrier.get(carrier);
      if (provider) {
        return provider.getRates(params);
      }
      this.logger.warn(`No shipping provider for carrier: ${carrier}`);
      return [];
    }

    const results: ShippingRate[] = [];
    for (const provider of this.providerByCarrier.values()) {
      try {
        const rates = await provider.getRates(params);
        results.push(...rates);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`getRates failed for ${provider.carrier}: ${msg}`);
      }
    }
    return results;
  }

  async createShipment(
    params: CreateShipmentParams,
  ): Promise<CreateShipmentResult> {
    const provider = this.getProviderForRateId(params.rateId);
    return provider.createShipment(params);
  }

  async getLabel(
    shipmentId: string,
    carrier?: string,
  ): Promise<{ labelUrl: string; format?: string }> {
    const provider = carrier
      ? this.providerByCarrier.get(carrier.toLowerCase())
      : this.getDefaultProvider();
    if (!provider) {
      throw new Error(`No shipping provider for shipment: ${shipmentId}`);
    }
    return provider.getLabel(shipmentId);
  }

  async cancelShipment(shipmentId: string, carrier?: string): Promise<void> {
    const provider = carrier
      ? this.providerByCarrier.get(carrier.toLowerCase())
      : this.getDefaultProvider();
    if (!provider) {
      throw new Error(`No shipping provider for shipment: ${shipmentId}`);
    }
    return provider.cancelShipment(shipmentId);
  }

  async validateAddress(address: Address): Promise<ValidateAddressResult> {
    const provider = this.getDefaultProvider();
    if (!provider) {
      return { valid: true, normalized: address };
    }
    return provider.validateAddress(address);
  }

  getCarriers(): string[] {
    return Array.from(this.providerByCarrier.keys());
  }

  async getBrandRates(brandId: string) {
    return this.prisma.shippingRate.findMany({
      where: { brandId, isActive: true },
      select: {
        id: true,
        name: true,
        carrier: true,
        serviceLevel: true,
        basePriceCents: true,
        perKgCents: true,
        estimatedDaysMin: true,
        estimatedDaysMax: true,
        isActive: true,
      },
    });
  }

  private getProviderForRateId(rateId: string): IShippingProvider {
    const [carrier] = rateId.split('_');
    const provider = carrier
      ? this.providerByCarrier.get(carrier.toLowerCase())
      : undefined;
    if (!provider) {
      throw new Error(`No shipping provider for rate: ${rateId}`);
    }
    return provider;
  }

  private getDefaultProvider(): IShippingProvider | undefined {
    if (this.providerByCarrier.size === 1) {
      return this.providerByCarrier.values().next().value;
    }
    return undefined;
  }
}
