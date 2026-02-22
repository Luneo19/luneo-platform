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

const PRINTIFY_BASE = 'https://api.printify.com/v1';

@Injectable()
export class PrintifyProvider implements PrintProvider {
  readonly name = 'printify';
  private readonly apiKey: string;
  private readonly logger = new Logger(PrintifyProvider.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('printify.apiKey') ?? '';
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getProducts(): Promise<PrintProduct[]> {
    if (!this.apiKey) {
      this.logger.warn('PRINTIFY_API_KEY not set');
      return [];
    }
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<PrintifyCatalogProduct[]>(
          `${PRINTIFY_BASE}/catalog/blueprints.json`,
          { headers: this.getHeaders() },
        ),
      );
      if (!Array.isArray(data)) return [];
      return data.map((p) => this.mapBlueprintToPrintProduct(p));
    } catch (err) {
      this.logger.error('Printify getProducts failed', err);
      throw err;
    }
  }

  async getProductById(id: string): Promise<PrintProduct | null> {
    if (!this.apiKey) return null;
    try {
      const [blueprintRes, variantsRes] = await Promise.all([
        firstValueFrom(
          this.httpService.get<PrintifyBlueprint>(`${PRINTIFY_BASE}/catalog/blueprints/${id}.json`, {
            headers: this.getHeaders(),
          }),
        ),
        firstValueFrom(
          this.httpService.get<PrintifyPrintProvider[]>(
            `${PRINTIFY_BASE}/catalog/blueprints/${id}/print_providers.json`,
            { headers: this.getHeaders() },
          ),
        ),
      ]);
      const blueprint = blueprintRes.data;
      const printProviders = Array.isArray(variantsRes.data) ? variantsRes.data : [];
      let variants: PrintVariant[] = [];
      if (printProviders.length > 0) {
        const providerId = printProviders[0].id;
        const skusRes = await firstValueFrom(
          this.httpService.get<{ variants: PrintifyVariant[] }>(
            `${PRINTIFY_BASE}/catalog/blueprints/${id}/print_providers/${providerId}/variants.json`,
            { headers: this.getHeaders() },
          ),
        ).catch(() => ({ data: { variants: [] } }));
        variants = (skusRes.data?.variants ?? []).map((v) => ({
          id: String(v.id),
          size: v.options?.size ?? v.title,
          color: v.options?.color,
          price: Math.round((v.cost ?? 0) * 100),
          currency: 'USD',
        }));
      }
      return {
        id: String(blueprint.id),
        name: blueprint.title ?? '',
        category: blueprint.title?.toLowerCase().replace(/\s+/g, '-') ?? 'product',
        mockupUrl: blueprint.images?.[0],
        variants,
      };
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      this.logger.error('Printify getProductById failed', err);
      throw err;
    }
  }

  async createOrder(order: PrintOrderRequest): Promise<PrintOrderResult> {
    if (!this.apiKey) {
      throw new Error('PRINTIFY_API_KEY is not configured');
    }
    const address = order.shippingAddress;
    const payload = {
      external_id: order.externalId,
      line_items: order.items.map((item) => ({
        product_id: order.items.length === 1 ? order.items[0].productId : undefined,
        variant_id: Number(item.variantId),
        quantity: item.quantity,
        print_provider_id: undefined,
        print_areas: [{ default: true, url: item.designUrl }],
      })),
      shipping_method: 1,
      send_shipping_notification: false,
      address_to: {
        first_name: address.name.split(' ')[0] ?? address.name,
        last_name: address.name.split(' ').slice(1).join(' ') || '',
        email: '',
        phone: '',
        country: address.country,
        region: address.state ?? '',
        address1: address.address1,
        address2: address.address2 ?? '',
        city: address.city,
        zip: address.zip,
      },
    };
    const { data } = await firstValueFrom(
      this.httpService.post<{ id: string; status: string }>(
        `${PRINTIFY_BASE}/orders.json`,
        payload,
        { headers: this.getHeaders() },
      ),
    ).catch((err) => {
      this.logger.error('Printify createOrder failed', err?.response?.data ?? err);
      throw err;
    });
    return {
      providerId: this.name,
      providerOrderId: data.id ?? '',
      status: data.status ?? 'pending',
    };
  }

  async getOrderStatus(providerOrderId: string): Promise<PrintOrderResult> {
    if (!this.apiKey) {
      throw new Error('PRINTIFY_API_KEY is not configured');
    }
    const { data } = await firstValueFrom(
      this.httpService.get<{ id: string; status: string; shipment?: { tracking_url?: string } }>(
        `${PRINTIFY_BASE}/orders/${providerOrderId}.json`,
        { headers: this.getHeaders() },
      ),
    );
    return {
      providerId: this.name,
      providerOrderId: data.id ?? providerOrderId,
      status: data.status ?? 'unknown',
      trackingUrl: data.shipment?.tracking_url,
    };
  }

  async cancelOrder(providerOrderId: string): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      await firstValueFrom(
        this.httpService.post<unknown>(
          `${PRINTIFY_BASE}/orders/${providerOrderId}/cancel.json`,
          {},
          { headers: this.getHeaders() },
        ),
      );
      return true;
    } catch (err) {
      this.logger.warn('Printify cancelOrder failed', err);
      return false;
    }
  }

  async getMockup(productId: string, designUrl: string): Promise<string> {
    return designUrl;
  }

  private mapBlueprintToPrintProduct(p: PrintifyCatalogProduct): PrintProduct {
    return {
      id: String(p.id),
      name: p.title ?? '',
      category: (p.title ?? 'product').toLowerCase().replace(/\s+/g, '-'),
      mockupUrl: p.images?.[0],
      variants: [],
    };
  }
}

interface PrintifyCatalogProduct {
  id: number;
  title?: string;
  images?: string[];
}

interface PrintifyBlueprint {
  id: number;
  title?: string;
  images?: string[];
}

interface PrintifyPrintProvider {
  id: number;
}

interface PrintifyVariant {
  id: number;
  title?: string;
  options?: { size?: string; color?: string };
  cost?: number;
}
