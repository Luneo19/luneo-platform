import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type {
  PrintProduct,
  PrintVariant,
  PrintOrderRequest,
  PrintOrderResult,
  PrintProvider,
} from '../interfaces/print-provider.interface';

const GELATO_BASE = 'https://product.gelatoapis.com/v3';
const GELATO_ORDER_BASE = 'https://order.gelatoapis.com/v3';

@Injectable()
export class GelatoProvider implements PrintProvider {
  readonly name = 'gelato';
  private readonly apiKey: string;
  private readonly logger = new Logger(GelatoProvider.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('gelato.apiKey') ?? '';
  }

  private getHeaders() {
    return {
      'X-API-KEY': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  async getProducts(): Promise<PrintProduct[]> {
    if (!this.apiKey) {
      this.logger.warn('GELATO_API_KEY not set');
      return [];
    }
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{ products?: GelatoProduct[] }>(
          `${GELATO_BASE}/products`,
          { headers: this.getHeaders() },
        ),
      );
      const products = data.products ?? [];
      return products.map((p) => this.mapGelatoProductToPrintProduct(p));
    } catch (err) {
      this.logger.error('Gelato getProducts failed', err);
      throw err;
    }
  }

  async getProductById(id: string): Promise<PrintProduct | null> {
    if (!this.apiKey) return null;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<GelatoProduct>(`${GELATO_BASE}/products/${id}`, {
          headers: this.getHeaders(),
        }),
      );
      if (!data) return null;
      return this.mapGelatoProductToPrintProduct(data);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      this.logger.error('Gelato getProductById failed', err);
      throw err;
    }
  }

  async createOrder(order: PrintOrderRequest): Promise<PrintOrderResult> {
    if (!this.apiKey) {
      throw new Error('GELATO_API_KEY is not configured');
    }
    const address = order.shippingAddress;
    const orderPayload = {
      orderReferenceId: order.externalId,
      customerReferenceId: `luneo-${order.externalId}`,
      shippingAddress: {
        firstName: address.name.split(' ')[0] ?? address.name,
        lastName: address.name.split(' ').slice(1).join(' ') || '',
        addressLine1: address.address1,
        addressLine2: address.address2 ?? '',
        city: address.city,
        state: address.state ?? '',
        postCode: address.zip,
        country: address.country,
      },
      items: order.items.map((item, idx) => ({
        itemReferenceId: `item-${idx}-${item.variantId}`,
        productUid: item.productId,
        quantity: item.quantity,
        files: [{ url: item.designUrl }],
      })),
    };
    const { data } = await firstValueFrom(
      this.httpService.post<{ orderId?: string; status?: string }>(
        `${GELATO_ORDER_BASE}/orders`,
        orderPayload,
        { headers: this.getHeaders() },
      ),
    ).catch((err) => {
      this.logger.error('Gelato createOrder failed', err?.response?.data ?? err);
      throw err;
    });
    return {
      providerId: this.name,
      providerOrderId: data.orderId ?? '',
      status: data.status ?? 'created',
    };
  }

  async getOrderStatus(providerOrderId: string): Promise<PrintOrderResult> {
    if (!this.apiKey) {
      throw new Error('GELATO_API_KEY is not configured');
    }
    const { data } = await firstValueFrom(
      this.httpService.get<{
        orderId?: string;
        status?: string;
        shipments?: Array<{ trackingUrl?: string }>;
      }>(`${GELATO_ORDER_BASE}/orders/${providerOrderId}`, {
        headers: this.getHeaders(),
      }),
    );
    const trackingUrl = data.shipments?.[0]?.trackingUrl;
    return {
      providerId: this.name,
      providerOrderId: data.orderId ?? providerOrderId,
      status: data.status ?? 'unknown',
      trackingUrl,
    };
  }

  async cancelOrder(providerOrderId: string): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      await firstValueFrom(
        this.httpService.post<unknown>(
          `${GELATO_ORDER_BASE}/orders/${providerOrderId}:cancel`,
          {},
          { headers: this.getHeaders() },
        ),
      );
      return true;
    } catch (err) {
      this.logger.warn('Gelato cancelOrder failed', err);
      return false;
    }
  }

  async getMockup(productId: string, designUrl: string): Promise<string> {
    return designUrl;
  }

  private mapGelatoProductToPrintProduct(p: GelatoProduct): PrintProduct {
    const variants: PrintVariant[] = (p.variants ?? []).map((v) => ({
      id: v.uid ?? String(v.sku ?? ''),
      size: v.attributes?.size,
      color: v.attributes?.color,
      price: Math.round((v.price?.amount ?? 0) * 100),
      currency: v.price?.currency ?? 'EUR',
    }));
    return {
      id: p.uid ?? String(p.sku ?? ''),
      name: p.name ?? p.title ?? '',
      category: (p.productType ?? 'product').toLowerCase().replace(/\s+/g, '-'),
      mockupUrl: p.previewImageUrl ?? p.imageUrl,
      variants,
    };
  }
}

interface GelatoProduct {
  uid?: string;
  sku?: string;
  name?: string;
  title?: string;
  productType?: string;
  previewImageUrl?: string;
  imageUrl?: string;
  variants?: Array<{
    uid?: string;
    sku?: string;
    attributes?: { size?: string; color?: string };
    price?: { amount?: number; currency?: string };
  }>;
}
