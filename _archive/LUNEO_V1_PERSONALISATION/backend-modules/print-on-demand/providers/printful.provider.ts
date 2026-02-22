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

const PRINTFUL_BASE = 'https://api.printful.com';

@Injectable()
export class PrintfulProvider implements PrintProvider {
  readonly name = 'printful';
  private readonly apiKey: string;
  private readonly logger = new Logger(PrintfulProvider.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('printful.apiKey') ?? '';
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getProducts(): Promise<PrintProduct[]> {
    if (!this.apiKey) {
      this.logger.warn('PRINTFUL_API_KEY not set');
      return [];
    }
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{ code: number; result: PrintfulCatalogProduct[] }>(
          `${PRINTFUL_BASE}/products`,
          { headers: this.getHeaders() },
        ),
      );
      if (data.code !== 200 || !Array.isArray(data.result)) return [];
      return data.result.map((p) => this.mapCatalogProductToPrintProduct(p));
    } catch (err) {
      this.logger.error('Printful getProducts failed', err);
      throw err;
    }
  }

  async getProductById(id: string): Promise<PrintProduct | null> {
    if (!this.apiKey) return null;
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<{
          code: number;
          result: { product: PrintfulCatalogProduct; variants: PrintfulVariant[] };
        }>(`${PRINTFUL_BASE}/products/${id}`, { headers: this.getHeaders() }),
      );
      if (data.code !== 200 || !data.result) return null;
      const { product, variants } = data.result;
      return this.mapProductWithVariantsToPrintProduct(product, variants ?? []);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      this.logger.error('Printful getProductById failed', err);
      throw err;
    }
  }

  async createOrder(order: PrintOrderRequest): Promise<PrintOrderResult> {
    if (!this.apiKey) {
      throw new Error('PRINTFUL_API_KEY is not configured');
    }
    const recipient = {
      name: order.shippingAddress.name,
      address1: order.shippingAddress.address1,
      address2: order.shippingAddress.address2 ?? '',
      city: order.shippingAddress.city,
      state_code: order.shippingAddress.state ?? '',
      country_code: order.shippingAddress.country,
      zip: order.shippingAddress.zip,
    };
    const items = order.items.map((item) => ({
      variant_id: Number(item.variantId),
      quantity: item.quantity,
      files: [{ url: item.designUrl }],
    }));
    const { data } = await firstValueFrom(
      this.httpService.post<{
        code: number;
        result: { id: number; status: string; shipping?: string; created?: number };
      }>(
        `${PRINTFUL_BASE}/orders`,
        { external_id: order.externalId, recipient, items },
        { headers: this.getHeaders() },
      ),
    );
    if (data.code !== 200 || !data.result) {
      throw new Error(`Printful createOrder failed: ${JSON.stringify(data)}`);
    }
    const result = data.result;
    return {
      providerId: this.name,
      providerOrderId: String(result.id),
      status: result.status ?? 'draft',
      estimatedDelivery: result.created
        ? new Date((result.created + 5 * 24 * 3600) * 1000)
        : undefined,
    };
  }

  async getOrderStatus(providerOrderId: string): Promise<PrintOrderResult> {
    if (!this.apiKey) {
      throw new Error('PRINTFUL_API_KEY is not configured');
    }
    const { data } = await firstValueFrom(
      this.httpService.get<{
        code: number;
        result: {
          id: number;
          status: string;
          shipping?: string;
          shipment?: { tracking_url?: string; tracking_number?: string };
        };
      }>(`${PRINTFUL_BASE}/orders/${providerOrderId}`, {
        headers: this.getHeaders(),
      }),
    );
    if (data.code !== 200 || !data.result) {
      throw new Error(`Printful getOrderStatus failed: ${JSON.stringify(data)}`);
    }
    const r = data.result;
    return {
      providerId: this.name,
      providerOrderId: String(r.id),
      status: r.status ?? 'unknown',
      trackingUrl: r.shipment?.tracking_url ?? undefined,
    };
  }

  async cancelOrder(providerOrderId: string): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const { data } = await firstValueFrom(
        this.httpService.delete<{ code: number }>(
          `${PRINTFUL_BASE}/orders/${providerOrderId}`,
          { headers: this.getHeaders() },
        ),
      );
      return data.code === 200;
    } catch (err) {
      this.logger.warn('Printful cancelOrder failed', err);
      return false;
    }
  }

  async getMockup(productId: string, designUrl: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('PRINTFUL_API_KEY is not configured');
    }
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<{
          code: number;
          result?: { mockup_url?: string; task_key?: string };
        }>(
          `${PRINTFUL_BASE}/mockup-generator/create-task/${productId}`,
          {
            variant_ids: [],
            printfile_placement: 'default',
            option_groups: [],
            files: [{ url: designUrl }],
          },
          { headers: this.getHeaders() },
        ),
      );
      if (data.code === 200 && data.result?.mockup_url) {
        return data.result.mockup_url;
      }
      return designUrl;
    } catch (err) {
      this.logger.warn('Printful getMockup failed, returning design URL', err);
      return designUrl;
    }
  }

  private mapCatalogProductToPrintProduct(p: PrintfulCatalogProduct): PrintProduct {
    const category = (p.type_name ?? p.type ?? 'product').toLowerCase().replace(/\s+/g, '-');
    const variants: PrintVariant[] = [];
    return {
      id: String(p.id),
      name: p.title ?? p.type_name ?? '',
      category,
      mockupUrl: p.image,
      variants,
    };
  }

  private mapProductWithVariantsToPrintProduct(
    product: PrintfulCatalogProduct,
    variants: PrintfulVariant[],
  ): PrintProduct {
    const category = (product.type_name ?? product.type ?? 'product')
      .toLowerCase()
      .replace(/\s+/g, '-');
    const printVariants: PrintVariant[] = variants.map((v) => ({
      id: String(v.id),
      size: v.size,
      color: v.color,
      price: Math.round(parseFloat(String(v.price ?? 0)) * 100),
      currency: product.currency ?? 'EUR',
    }));
    return {
      id: String(product.id),
      name: product.title ?? product.type_name ?? '',
      category,
      mockupUrl: product.image,
      variants: printVariants,
    };
  }
}

interface PrintfulCatalogProduct {
  id: number;
  type?: string;
  type_name?: string;
  title?: string;
  image?: string;
  currency?: string;
  variant_count?: number;
}

interface PrintfulVariant {
  id: number;
  size?: string;
  color?: string;
  price?: string | number;
}
