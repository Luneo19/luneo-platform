/**
 * Shopify Integration Service
 * EC-001: Intégration complète Shopify
 */

import { logger } from '@/lib/logger';
import type {
  ShopifyStore,
  ShopifyProduct,
  ShopifyOrder,
} from './types';

interface ShopifyConfig {
  shopDomain: string;
  accessToken: string;
  apiVersion?: string;
}

// Raw API response types
interface ShopifyRawShop {
  id: number;
  name: string;
  domain: string;
  email: string;
  currency: string;
  timezone: string;
  plan_name: string;
}

interface ShopifyRawImage {
  id?: number;
  src?: string;
  alt?: string;
  position?: number;
}

interface ShopifyRawVariant {
  id?: number;
  title?: string;
  price?: string;
  sku?: string;
  inventory_quantity?: number;
  compare_at_price?: string;
  weight?: number;
  weight_unit?: string;
  option1?: string;
  option2?: string;
  option3?: string;
}

interface ShopifyRawOption {
  name?: string;
  position?: number;
  values?: string[];
}

interface ShopifyRawProduct {
  id: number;
  title: string;
  handle: string;
  body_html?: string | null;
  vendor?: string;
  product_type?: string;
  tags?: string;
  status?: string;
  images?: ShopifyRawImage[];
  variants?: ShopifyRawVariant[];
  options?: ShopifyRawOption[];
  created_at?: string;
  updated_at?: string;
}

interface ShopifyRawLineItem {
  id?: number;
  product_id?: number;
  variant_id?: number;
  title?: string;
  quantity?: number;
  price?: string;
  sku?: string;
  properties?: Array<{ name?: string; value?: string }>;
}

interface ShopifyRawOrder {
  id: number;
  name?: string;
  email?: string;
  total_price?: string;
  currency?: string;
  financial_status?: string;
  fulfillment_status?: string;
  line_items?: ShopifyRawLineItem[];
  customer?: {
    id?: number;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  created_at?: string;
}

interface ShopifyRawCollection {
  id: number;
  title: string;
  handle: string;
}

class ShopifyService {
  private shopDomain: string;
  private accessToken: string;
  private apiVersion: string;
  private baseUrl: string;

  constructor(config: ShopifyConfig) {
    this.shopDomain = config.shopDomain;
    this.accessToken = config.accessToken;
    this.apiVersion = config.apiVersion || '2024-01';
    this.baseUrl = `https://${this.shopDomain}/admin/api/${this.apiVersion}`;
  }

  /**
   * Make authenticated request to Shopify API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.accessToken,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Shopify API error', { endpoint, status: response.status, error });
      throw new Error(`Shopify API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get shop information
   */
  async getShop(): Promise<ShopifyStore> {
    const data = await this.request<{ shop: ShopifyRawShop }>('/shop.json');
    
    return {
      id: data.shop.id.toString(),
      name: data.shop.name,
      domain: data.shop.domain,
      email: data.shop.email,
      currency: data.shop.currency,
      timezone: data.shop.timezone,
      plan: data.shop.plan_name,
    };
  }

  /**
   * Get all products
   */
  async getProducts(params: {
    limit?: number;
    pageInfo?: string;
    status?: 'active' | 'draft' | 'archived';
    collectionId?: string;
  } = {}): Promise<{ products: ShopifyProduct[]; pageInfo?: string }> {
    const queryParams = new URLSearchParams();
    queryParams.set('limit', (params.limit || 50).toString());
    
    if (params.pageInfo) {
      queryParams.set('page_info', params.pageInfo);
    }
    if (params.status) {
      queryParams.set('status', params.status);
    }
    if (params.collectionId) {
      queryParams.set('collection_id', params.collectionId);
    }

    const data = await this.request<{ products: ShopifyRawProduct[] }>(
      `/products.json?${queryParams.toString()}`
    );

    const products: ShopifyProduct[] = data.products.map((p) => ({
      id: p.id.toString(),
      title: p.title,
      handle: p.handle,
      description: p.body_html || '',
      vendor: p.vendor || '',
      productType: p.product_type || '',
      tags: p.tags ? p.tags.split(', ') : [],
      status: (p.status || 'draft') as 'active' | 'draft' | 'archived',
      images: (p.images || []).map((img: ShopifyRawImage) => ({
        id: (img.id || 0).toString(),
        src: img.src || '',
        alt: img.alt,
        position: img.position || 0,
      })),
      variants: (p.variants || []).map((v: ShopifyRawVariant) => ({
        id: (v.id || 0).toString(),
        productId: p.id.toString(),
        title: v.title || '',
        sku: v.sku || '',
        price: v.price || '0',
        compareAtPrice: v.compare_at_price,
        inventoryQuantity: v.inventory_quantity || 0,
        weight: v.weight || 0,
        weightUnit: v.weight_unit || 'kg',
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
      })),
      options: (p.options || []).map((o: ShopifyRawOption) => ({
        id: o.name || '',
        name: o.name || '',
        values: o.values || [],
      })),
      createdAt: p.created_at || '',
      updatedAt: p.updated_at || '',
    }));

    return { products };
  }

  /**
   * Get single product
   */
  async getProduct(productId: string): Promise<ShopifyProduct> {
    const data = await this.request<{ product: ShopifyRawProduct }>(`/products/${productId}.json`);
    const p = data.product;

    return {
      id: p.id.toString(),
      title: p.title,
      handle: p.handle,
      description: p.body_html || '',
      vendor: p.vendor || '',
      productType: p.product_type || '',
      tags: p.tags ? p.tags.split(', ') : [],
      status: (p.status || 'draft') as 'active' | 'draft' | 'archived',
      images: (p.images || []).map((img: ShopifyRawImage) => ({
        id: (img.id || 0).toString(),
        src: img.src || '',
        alt: img.alt,
        position: img.position || 0,
      })),
      variants: (p.variants || []).map((v: ShopifyRawVariant) => ({
        id: (v.id || 0).toString(),
        productId: p.id.toString(),
        title: v.title || '',
        sku: v.sku || '',
        price: v.price || '0',
        compareAtPrice: v.compare_at_price,
        inventoryQuantity: v.inventory_quantity || 0,
        weight: v.weight || 0,
        weightUnit: v.weight_unit || 'kg',
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
      })),
      options: (p.options || []).map((o: ShopifyRawOption) => ({
        id: o.name || '',
        name: o.name || '',
        values: o.values || [],
      })),
      createdAt: p.created_at || '',
      updatedAt: p.updated_at || '',
    };
  }

  /**
   * Create product
   */
  async createProduct(product: Partial<ShopifyProduct>): Promise<ShopifyProduct> {
    const payload = {
      product: {
        title: product.title,
        body_html: product.description,
        vendor: product.vendor,
        product_type: product.productType,
        tags: product.tags?.join(', '),
        status: product.status || 'draft',
        variants: product.variants?.map((v) => ({
          title: v.title,
          sku: v.sku,
          price: v.price,
          compare_at_price: v.compareAtPrice,
          inventory_quantity: v.inventoryQuantity,
          weight: v.weight,
          weight_unit: v.weightUnit,
          option1: v.option1,
          option2: v.option2,
          option3: v.option3,
        })),
        options: product.options?.map((o) => ({
          name: o.name,
          values: o.values,
        })),
      },
    };

    const data = await this.request<{ product: ShopifyRawProduct }>('/products.json', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return this.getProduct(data.product.id.toString());
  }

  /**
   * Update product
   */
  async updateProduct(
    productId: string,
    updates: Partial<ShopifyProduct>
  ): Promise<ShopifyProduct> {
    const payload = {
      product: {
        id: productId,
        title: updates.title,
        body_html: updates.description,
        vendor: updates.vendor,
        product_type: updates.productType,
        tags: updates.tags?.join(', '),
        status: updates.status,
      },
    };

    await this.request(`/products/${productId}.json`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return this.getProduct(productId);
  }

  /**
   * Delete product
   */
  async deleteProduct(productId: string): Promise<void> {
    await this.request(`/products/${productId}.json`, {
      method: 'DELETE',
    });
  }

  /**
   * Get orders
   */
  async getOrders(params: {
    limit?: number;
    status?: string;
    createdAtMin?: string;
    createdAtMax?: string;
  } = {}): Promise<ShopifyOrder[]> {
    const queryParams = new URLSearchParams();
    queryParams.set('limit', (params.limit || 50).toString());
    
    if (params.status) {
      queryParams.set('status', params.status);
    }
    if (params.createdAtMin) {
      queryParams.set('created_at_min', params.createdAtMin);
    }
    if (params.createdAtMax) {
      queryParams.set('created_at_max', params.createdAtMax);
    }

    const data = await this.request<{ orders: ShopifyRawOrder[] }>(
      `/orders.json?${queryParams.toString()}`
    );

    return data.orders.map((o) => ({
      id: o.id.toString(),
      name: o.name || '',
      email: o.email || '',
      totalPrice: o.total_price || '0',
      currency: o.currency || 'USD',
      financialStatus: o.financial_status || 'pending',
      fulfillmentStatus: o.fulfillment_status || 'unfulfilled',
      lineItems: (o.line_items || []).map((item: ShopifyRawLineItem) => ({
        id: (item.id || 0).toString(),
        productId: item.product_id?.toString() ?? '',
        variantId: item.variant_id?.toString() ?? '',
        title: item.title || '',
        quantity: item.quantity || 0,
        price: item.price || '0',
        sku: item.sku || '',
        customizations: item.properties?.reduce((acc: Record<string, string>, prop: { name?: string; value?: string }) => {
          if (prop.name && prop.value) {
            acc[prop.name] = prop.value;
          }
          return acc;
        }, {}),
      })),
      customer: o.customer ? {
        id: (o.customer.id || 0).toString(),
        email: o.customer.email || '',
        firstName: o.customer.first_name || '',
        lastName: o.customer.last_name || '',
      } : {
        id: '',
        email: o.email || '',
        firstName: '',
        lastName: '',
      },
      createdAt: o.created_at || '',
    }));
  }

  /**
   * Update inventory
   */
  async updateInventory(
    inventoryItemId: string,
    locationId: string,
    quantity: number
  ): Promise<void> {
    await this.request('/inventory_levels/set.json', {
      method: 'POST',
      body: JSON.stringify({
        inventory_item_id: inventoryItemId,
        location_id: locationId,
        available: quantity,
      }),
    });
  }

  /**
   * Create webhook
   */
  async createWebhook(topic: string, address: string): Promise<string> {
    const data = await this.request<{ webhook: { id: number } }>('/webhooks.json', {
      method: 'POST',
      body: JSON.stringify({
        webhook: {
          topic,
          address,
          format: 'json',
        },
      }),
    });

    return data.webhook.id.toString();
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await this.request(`/webhooks/${webhookId}.json`, {
      method: 'DELETE',
    });
  }

  /**
   * Get collections
   */
  async getCollections(): Promise<Array<{ id: string; title: string; handle: string }>> {
    const [smart, custom] = await Promise.all([
      this.request<{ smart_collections: ShopifyRawCollection[] }>('/smart_collections.json'),
      this.request<{ custom_collections: ShopifyRawCollection[] }>('/custom_collections.json'),
    ]);

    const collections = [
      ...(smart.smart_collections || []),
      ...(custom.custom_collections || []),
    ];

    return collections.map((c) => ({
      id: c.id.toString(),
      title: c.title,
      handle: c.handle,
    }));
  }
}

/**
 * Create Shopify service instance
 */
export function createShopifyService(config: ShopifyConfig): ShopifyService {
  return new ShopifyService(config);
}

export { ShopifyService };
