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

const GELATO_BASE_URL = 'https://product-api.gelato.com';

/** Gelato API response types (simplified) */
interface GelatoProductResult {
  uid: string;
  title: string;
  productType?: string;
  catalogProducts?: Array<{
    uid: string;
    title: string;
    sku?: string;
    price?: { amount: number; currency: string };
  }>;
}

interface GelatoShippingOption {
  carrier?: string;
  service?: string;
  price?: { amount: number; currency: string };
  estimatedDeliveryDays?: number;
}

interface GelatoOrderResult {
  orderUid: string;
  status: string;
  createdAt?: string;
}

export class GelatoProvider extends BasePODProvider {
  constructor(
    config: BasePODProviderConfig,
    private readonly httpService: HttpService,
  ) {
    super(config);
  }

  get name(): string {
    return 'Gelato';
  }

  get slug(): string {
    return 'gelato';
  }

  private getApiKey(): string {
    const key = this.credentials['apiKey'];
    if (typeof key !== 'string' || !key) {
      throw new Error('Gelato provider missing apiKey in credentials');
    }
    return key;
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${GELATO_BASE_URL}${path}`;
    const headers = {
      'X-API-KEY': this.getApiKey(),
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
      this.logger.warn(`Gelato API error: ${message}`);
      throw new Error(`Gelato API error: ${message}`);
    }
  }

  async connect(): Promise<void> {
    await this.request('GET', '/v3/products?limit=1');
    this.logger.log('Gelato connection verified');
  }

  async getProducts(): Promise<PODProduct[]> {
    const data = await this.request<{ items?: GelatoProductResult[] }>(
      'GET',
      '/v3/products?limit=100',
    );
    const list = data?.items ?? [];
    return list.map((p) => ({
      id: p.uid,
      title: p.title,
      variants: (p.catalogProducts ?? []).map((v) => ({
        id: v.uid,
        title: v.title,
        sku: v.sku,
        price: v.price?.amount ?? 0,
        currency: v.price?.currency ?? 'USD',
      })),
      category: p.productType,
    }));
  }

  async getShippingRates(
    address: PODShippingAddress,
    items: PODOrderItem[],
  ): Promise<PODShippingRate[]> {
    const body = {
      shippingAddress: {
        recipientName: address.name,
        addressLine1: address.address1,
        addressLine2: address.address2,
        city: address.city,
        state: address.state,
        postalCode: address.zip,
        countryCode: address.country,
        phone: address.phone,
      },
      items: items.map((i) => ({
        catalogProductUid: i.variantId ?? i.productId,
        quantity: i.quantity,
      })),
    };
    const data = await this.request<{ shippingOptions?: GelatoShippingOption[] }>(
      'POST',
      '/v3/shipping/rates',
      body as Record<string, unknown>,
    );
    const options = data?.shippingOptions ?? [];
    return options.map((o) => ({
      carrier: o.carrier ?? 'Gelato',
      service: o.service ?? 'Standard',
      cost: o.price?.amount ?? 0,
      currency: o.price?.currency ?? 'USD',
      estimatedDays: o.estimatedDeliveryDays,
    }));
  }

  async createOrder(
    items: PODOrderItem[],
    address: PODShippingAddress,
    metadata?: Record<string, unknown>,
  ): Promise<PODCreateOrderResult> {
    const body = {
      shippingAddress: {
        recipientName: address.name,
        addressLine1: address.address1,
        addressLine2: address.address2,
        city: address.city,
        state: address.state,
        postalCode: address.zip,
        countryCode: address.country,
        phone: address.phone,
      },
      items: items.map((i) => ({
        catalogProductUid: i.variantId ?? i.productId,
        quantity: i.quantity,
        imageUrls: i.files ? Object.values(i.files) : undefined,
      })),
      ...(metadata && { externalId: metadata['externalId'] }),
    };
    const data = await this.request<GelatoOrderResult>(
      'POST',
      '/v3/orders',
      body as Record<string, unknown>,
    );
    if (!data?.orderUid) {
      throw new Error('Gelato createOrder: no orderUid in response');
    }
    return {
      externalOrderId: data.orderUid,
      status: this.mapGelatoStatus(data.status),
      estimatedCompletion: data.createdAt ? new Date(data.createdAt) : undefined,
      raw: data as unknown as Record<string, unknown>,
    };
  }

  async getOrderStatus(externalOrderId: string): Promise<PODOrderStatusResult> {
    const data = await this.request<{
      orderUid: string;
      status: string;
      trackingNumber?: string;
      trackingUrl?: string;
      shippedAt?: string;
      completedAt?: string;
    }>('GET', `/v3/orders/${externalOrderId}`);
    if (!data?.orderUid) {
      throw new Error(`Gelato order not found: ${externalOrderId}`);
    }
    return {
      externalOrderId: data.orderUid,
      status: this.mapGelatoStatus(data.status),
      trackingNumber: data.trackingNumber,
      trackingUrl: data.trackingUrl,
      shippedAt: data.shippedAt ? new Date(data.shippedAt) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      raw: data as unknown as Record<string, unknown>,
    };
  }

  async cancelOrder(externalOrderId: string): Promise<{ cancelled: boolean; message?: string }> {
    try {
      await this.request('POST', `/v3/orders/${externalOrderId}/cancel`, {});
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

  private mapGelatoStatus(status: string): string {
    const map: Record<string, string> = {
      draft: 'DRAFT',
      submitted: 'SUBMITTED',
      in_production: 'IN_PRODUCTION',
      quality_check: 'QUALITY_CHECK',
      shipped: 'SHIPPED',
      delivered: 'DELIVERED',
      cancelled: 'CANCELLED',
      failed: 'FAILED',
    };
    return map[status?.toLowerCase() ?? ''] ?? status ?? 'SUBMITTED';
  }
}
