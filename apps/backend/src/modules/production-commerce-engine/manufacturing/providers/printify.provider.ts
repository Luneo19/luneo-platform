import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type {
  PODProduct,
  PODOrderItem,
  PODShippingAddress,
  PODShippingRate,
  PODCreateOrderResult,
  PODOrderStatusResult,
} from '../interfaces/manufacturing.interface';
import { BasePODProvider, BasePODProviderConfig } from './base-pod.provider';

const PRINTIFY_BASE_URL = 'https://api.printify.com/v1';

/** Printify API response types (simplified) */
interface PrintifyProductResult {
  id: number;
  title: string;
  variants?: Array<{
    id: number;
    title: string;
    sku?: string;
    price: number;
  }>;
}

interface PrintifyShippingOption {
  carrier: string;
  service: string;
  price: number;
  currency: string;
  min_delivery_days?: number;
  max_delivery_days?: number;
}

interface PrintifyOrderResult {
  id: number;
  status: string;
  created_at?: string;
}

export class PrintifyProvider extends BasePODProvider {
  constructor(
    config: BasePODProviderConfig,
    private readonly httpService: HttpService,
  ) {
    super(config);
  }

  get name(): string {
    return 'Printify';
  }

  get slug(): string {
    return 'printify';
  }

  private getApiKey(): string {
    const key = this.credentials['apiKey'];
    if (typeof key !== 'string' || !key) {
      throw new Error('Printify provider missing apiKey in credentials');
    }
    return key;
  }

  private getShopId(): string | undefined {
    const id = this.settings['shopId'] ?? this.credentials['shopId'];
    return id != null ? String(id) : undefined;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${PRINTIFY_BASE_URL}${path}`;
    const headers = {
      Authorization: `Bearer ${this.getApiKey()}`,
      'Content-Type': 'application/json',
    };
    try {
      const response = await firstValueFrom(
        this.httpService.request<T>({ method, url, headers, data: body }),
      );
      return response.data;
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : String(error);
      const responseData =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: unknown } }).response?.data
          : undefined;
      const message = responseData != null ? String(responseData) : errMsg;
      this.logger.warn(`Printify API error: ${message}`);
      throw new Error(`Printify API error: ${message}`);
    }
  }

  async connect(): Promise<void> {
    const shopId = this.getShopId();
    const path = shopId ? `/shops/${shopId}/orders.json` : '/shops.json';
    await this.request('GET', path);
    this.logger.log('Printify connection verified');
  }

  async getProducts(): Promise<PODProduct[]> {
    const shopId = this.getShopId();
    if (!shopId) {
      this.logger.warn('Printify getProducts: no shopId configured');
      return [];
    }
    const data = await this.request<{ data?: PrintifyProductResult[] }>(
      'GET',
      `/shops/${shopId}/products.json?limit=100`,
    );
    const list = data?.data ?? [];
    return list.map((p) => ({
      id: String(p.id),
      title: p.title,
      variants: (p.variants ?? []).map((v) => ({
        id: String(v.id),
        title: v.title,
        sku: v.sku,
        price: v.price,
        currency: 'USD',
      })),
      category: undefined,
    }));
  }

  async getShippingRates(
    address: PODShippingAddress,
    items: PODOrderItem[],
  ): Promise<PODShippingRate[]> {
    const shopId = this.getShopId();
    if (!shopId) return [];
    const body = {
      address_to: {
        address1: address.address1,
        address2: address.address2,
        city: address.city,
        province: address.state,
        zip: address.zip,
        country: address.country,
        phone: address.phone,
      },
      line_items: items.map((i) => ({
        product_id: parseInt(i.productId, 10),
        variant_id: parseInt(i.variantId ?? i.productId, 10),
        quantity: i.quantity,
      })),
    };
    const data = await this.request<{ shipping_options?: PrintifyShippingOption[] }>(
      'POST',
      `/shops/${shopId}/orders/shipping.json`,
      body as Record<string, unknown>,
    );
    const options = data?.shipping_options ?? [];
    return options.map((o) => ({
      carrier: o.carrier,
      service: o.service,
      cost: o.price,
      currency: o.currency ?? 'USD',
      estimatedDays: o.max_delivery_days ?? o.min_delivery_days,
    }));
  }

  async createOrder(
    items: PODOrderItem[],
    address: PODShippingAddress,
    metadata?: Record<string, unknown>,
  ): Promise<PODCreateOrderResult> {
    const shopId = this.getShopId();
    if (!shopId) {
      throw new Error('Printify createOrder: no shopId configured');
    }
    const body = {
      address_to: {
        first_name: address.name.split(' ')[0] ?? address.name,
        last_name: address.name.split(' ').slice(1).join(' ') || address.name,
        address1: address.address1,
        address2: address.address2,
        city: address.city,
        province: address.state,
        zip: address.zip,
        country: address.country,
        phone: address.phone,
      },
      line_items: items.map((i) => ({
        product_id: parseInt(i.productId, 10),
        variant_id: parseInt(i.variantId ?? i.productId, 10),
        quantity: i.quantity,
        files: i.files
          ? Object.entries(i.files).map(([type, url]) => ({ type, url }))
          : undefined,
      })),
      ...(metadata && { external_id: metadata['externalId'] }),
    };
    const data = await this.request<PrintifyOrderResult>(
      'POST',
      `/shops/${shopId}/orders.json`,
      body as Record<string, unknown>,
    );
    if (!data?.id) {
      throw new Error('Printify createOrder: no order id in response');
    }
    return {
      externalOrderId: String(data.id),
      status: this.mapPrintifyStatus(data.status),
      estimatedCompletion: data.created_at ? new Date(data.created_at) : undefined,
      raw: data as unknown as Record<string, unknown>,
    };
  }

  async getOrderStatus(externalOrderId: string): Promise<PODOrderStatusResult> {
    const shopId = this.getShopId();
    if (!shopId) {
      throw new Error('Printify getOrderStatus: no shopId configured');
    }
    const data = await this.request<{
      id: number;
      status: string;
      shipment?: { tracking_number?: string; tracking_url?: string; shipped_at?: string };
    }>('GET', `/shops/${shopId}/orders/${externalOrderId}.json`);
    if (!data?.id) {
      throw new Error(`Printify order not found: ${externalOrderId}`);
    }
    const shipment = data.shipment;
    return {
      externalOrderId: String(data.id),
      status: this.mapPrintifyStatus(data.status),
      trackingNumber: shipment?.tracking_number,
      trackingUrl: shipment?.tracking_url,
      shippedAt: shipment?.shipped_at ? new Date(shipment.shipped_at) : undefined,
      raw: data as unknown as Record<string, unknown>,
    };
  }

  async cancelOrder(externalOrderId: string): Promise<{ cancelled: boolean; message?: string }> {
    const shopId = this.getShopId();
    if (!shopId) {
      return { cancelled: false, message: 'No shopId configured' };
    }
    try {
      await this.request('POST', `/shops/${shopId}/orders/${externalOrderId}/cancel.json`, {});
      return { cancelled: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return { cancelled: false, message };
    }
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    if (!payload || typeof payload !== 'object') return false;
    const secret = this.credentials['webhookSecret'] as string | undefined;
    if (secret && signature) {
      return signature.length > 0 && secret.length > 0;
    }
    return true;
  }

  private mapPrintifyStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'SUBMITTED',
      failed: 'FAILED',
      canceled: 'CANCELLED',
      in_production: 'IN_PRODUCTION',
      shipped: 'SHIPPED',
      delivered: 'DELIVERED',
    };
    return map[status?.toLowerCase() ?? ''] ?? status ?? 'SUBMITTED';
  }
}
