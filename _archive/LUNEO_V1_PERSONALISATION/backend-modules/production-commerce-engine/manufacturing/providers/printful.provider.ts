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

const PRINTFUL_BASE_URL = 'https://api.printful.com';

/** Printful API response types (simplified) */
interface PrintfulProductResult {
  id: number;
  title: string;
  variants?: Array<{
    id: number;
    title: string;
    sku?: string;
    price: string;
  }>;
  type?: string;
}

interface PrintfulShippingRateResult {
  id: string;
  name: string;
  rate: string;
  currency: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
}

interface PrintfulOrderResult {
  id: number;
  status: string;
  created?: number;
}

export class PrintfulProvider extends BasePODProvider {
  constructor(
    config: BasePODProviderConfig,
    private readonly httpService: HttpService,
  ) {
    super(config);
  }

  get name(): string {
    return 'Printful';
  }

  get slug(): string {
    return 'printful';
  }

  private getApiKey(): string {
    const key = this.credentials['apiKey'];
    if (typeof key !== 'string' || !key) {
      throw new Error('Printful provider missing apiKey in credentials');
    }
    return key;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${PRINTFUL_BASE_URL}${path}`;
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
      const errMsg = error instanceof Error ? error.message : String(error);
      const responseData =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: unknown } }).response?.data
          : undefined;
      const message = responseData != null ? String(responseData) : errMsg;
      this.logger.warn(`Printful API error: ${message}`);
      throw new Error(`Printful API error: ${message}`);
    }
  }

  async connect(): Promise<void> {
    const data = await this.request<{ result?: unknown }>('GET', '/store');
    if (!data) {
      throw new Error('Printful connect: no store data');
    }
    this.logger.log('Printful connection verified');
  }

  async getProducts(): Promise<PODProduct[]> {
    const data = await this.request<{ result?: PrintfulProductResult[] }>('GET', '/products');
    const list = data?.result ?? [];
    return list.map((p) => ({
      id: String(p.id),
      title: p.title,
      variants: (p.variants ?? []).map((v) => ({
        id: String(v.id),
        title: v.title,
        sku: v.sku,
        price: parseFloat(v.price ?? '0'),
        currency: 'USD',
      })),
      category: p.type,
    }));
  }

  async getShippingRates(
    address: PODShippingAddress,
    items: PODOrderItem[],
  ): Promise<PODShippingRate[]> {
    const body = {
      recipient: {
        address1: address.address1,
        address2: address.address2,
        city: address.city,
        state_code: address.state,
        zip_code: address.zip,
        country_code: address.country,
      },
      items: items.map((i) => ({
        variant_id: i.variantId ?? i.productId,
        quantity: i.quantity,
      })),
    };
    const data = await this.request<{ result?: { shipping?: PrintfulShippingRateResult[] } }>(
      'POST',
      '/shipping/rates',
      body as Record<string, unknown>,
    );
    const rates = data?.result?.shipping ?? [];
    return rates.map((r) => ({
      carrier: r.name,
      service: r.name,
      cost: parseFloat(r.rate ?? '0'),
      currency: r.currency ?? 'USD',
      estimatedDays: r.maxDeliveryDays ?? r.minDeliveryDays,
    }));
  }

  async createOrder(
    items: PODOrderItem[],
    address: PODShippingAddress,
    metadata?: Record<string, unknown>,
  ): Promise<PODCreateOrderResult> {
    const recipient = {
      name: address.name,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      state_code: address.state,
      zip_code: address.zip,
      country_code: address.country,
      phone: address.phone,
    };
    const orderItems = items.map((i) => ({
      variant_id: parseInt(i.variantId ?? i.productId, 10) || 0,
      quantity: i.quantity,
      files: i.files
        ? Object.entries(i.files).map(([type, url]) => ({ type: type as 'default' | 'front' | 'back', url }))
        : undefined,
    }));
    const body = {
      recipient,
      items: orderItems,
      ...(metadata && { external_id: metadata['externalId'] }),
    };
    const data = await this.request<{ result?: PrintfulOrderResult }>(
      'POST',
      '/orders',
      body as Record<string, unknown>,
    );
    const order = data?.result;
    if (!order?.id) {
      throw new Error('Printful createOrder: no order id in response');
    }
    return {
      externalOrderId: String(order.id),
      status: this.mapPrintfulStatus(order.status),
      raw: order as unknown as Record<string, unknown>,
    };
  }

  async getOrderStatus(externalOrderId: string): Promise<PODOrderStatusResult> {
    const data = await this.request<{
      result?: {
        id: number;
        status: string;
        shipment?: { tracking_number?: string; tracking_url?: string; shipped_at?: number };
      };
    }>('GET', `/orders/${externalOrderId}`);
    const order = data?.result;
    if (!order) {
      throw new Error(`Printful order not found: ${externalOrderId}`);
    }
    const shipment = order.shipment;
    return {
      externalOrderId: String(order.id),
      status: this.mapPrintfulStatus(order.status),
      trackingNumber: shipment?.tracking_number,
      trackingUrl: shipment?.tracking_url,
      shippedAt: shipment?.shipped_at ? new Date(shipment.shipped_at * 1000) : undefined,
      raw: order as unknown as Record<string, unknown>,
    };
  }

  async cancelOrder(externalOrderId: string): Promise<{ cancelled: boolean; message?: string }> {
    try {
      await this.request('DELETE', `/orders/${externalOrderId}`);
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

  private mapPrintfulStatus(status: string): string {
    const map: Record<string, string> = {
      draft: 'DRAFT',
      pending: 'SUBMITTED',
      failed: 'FAILED',
      canceled: 'CANCELLED',
      inprocess: 'IN_PRODUCTION',
      onhold: 'QUALITY_CHECK',
      fulfilled: 'READY_TO_SHIP',
      shipped: 'SHIPPED',
      delivered: 'DELIVERED',
    };
    return map[status?.toLowerCase() ?? ''] ?? status ?? 'SUBMITTED';
  }
}
