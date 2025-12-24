/**
 * WooCommerce Integration Service
 * EC-002: Intégration complète WooCommerce
 */

import { logger } from '@/lib/logger';
import type {
  WooCommerceProduct,
  WooCommerceOrder,
  WooCommerceCategory,
  SyncResult,
} from './types';

interface WooCommerceConfig {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  version?: string;
}

class WooCommerceService {
  private siteUrl: string;
  private consumerKey: string;
  private consumerSecret: string;
  private version: string;
  private baseUrl: string;

  constructor(config: WooCommerceConfig) {
    this.siteUrl = config.siteUrl.replace(/\/$/, '');
    this.consumerKey = config.consumerKey;
    this.consumerSecret = config.consumerSecret;
    this.version = config.version || 'wc/v3';
    this.baseUrl = `${this.siteUrl}/wp-json/${this.version}`;
  }

  /**
   * Make authenticated request to WooCommerce API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    // Add authentication
    url.searchParams.set('consumer_key', this.consumerKey);
    url.searchParams.set('consumer_secret', this.consumerSecret);

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('WooCommerce API error', { endpoint, status: response.status, error });
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get store info
   */
  async getStoreInfo(): Promise<{
    name: string;
    url: string;
    currency: string;
    timezone: string;
  }> {
    const data = await this.request<any>('/system_status');
    
    return {
      name: data.environment?.site_title || 'WooCommerce Store',
      url: this.siteUrl,
      currency: data.settings?.currency || 'EUR',
      timezone: data.environment?.server_info?.timezone || 'UTC',
    };
  }

  /**
   * Get all products
   */
  async getProducts(params: {
    page?: number;
    perPage?: number;
    status?: 'publish' | 'draft' | 'pending';
    category?: number;
    search?: string;
  } = {}): Promise<{ products: WooCommerceProduct[]; total: number }> {
    const queryParams = new URLSearchParams();
    queryParams.set('page', (params.page || 1).toString());
    queryParams.set('per_page', (params.perPage || 50).toString());
    
    if (params.status) {
      queryParams.set('status', params.status);
    }
    if (params.category) {
      queryParams.set('category', params.category.toString());
    }
    if (params.search) {
      queryParams.set('search', params.search);
    }

    const url = `/products?${queryParams.toString()}`;
    const response = await fetch(`${this.baseUrl}${url}&consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`);
    
    const products = await response.json();
    const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);

    return {
      products: products.map(this.mapProduct),
      total,
    };
  }

  /**
   * Get single product
   */
  async getProduct(productId: number): Promise<WooCommerceProduct> {
    const data = await this.request<any>(`/products/${productId}`);
    return this.mapProduct(data);
  }

  /**
   * Create product
   */
  async createProduct(product: Partial<WooCommerceProduct>): Promise<WooCommerceProduct> {
    const payload = {
      name: product.name,
      type: product.type || 'simple',
      status: product.status || 'draft',
      description: product.description,
      short_description: product.shortDescription,
      sku: product.sku,
      regular_price: product.regularPrice,
      sale_price: product.salePrice,
      stock_quantity: product.stockQuantity,
      stock_status: product.stockStatus,
      categories: product.categories?.map((c) => ({ id: c.id })),
      images: product.images?.map((img) => ({ src: img.src, alt: img.alt })),
      attributes: product.attributes?.map((attr) => ({
        name: attr.name,
        options: attr.options,
        visible: attr.visible,
        variation: attr.variation,
      })),
    };

    const data = await this.request<any>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return this.mapProduct(data);
  }

  /**
   * Update product
   */
  async updateProduct(
    productId: number,
    updates: Partial<WooCommerceProduct>
  ): Promise<WooCommerceProduct> {
    const payload: any = {};

    if (updates.name) payload.name = updates.name;
    if (updates.description) payload.description = updates.description;
    if (updates.shortDescription) payload.short_description = updates.shortDescription;
    if (updates.sku) payload.sku = updates.sku;
    if (updates.regularPrice) payload.regular_price = updates.regularPrice;
    if (updates.salePrice) payload.sale_price = updates.salePrice;
    if (updates.stockQuantity !== undefined) payload.stock_quantity = updates.stockQuantity;
    if (updates.stockStatus) payload.stock_status = updates.stockStatus;
    if (updates.status) payload.status = updates.status;

    const data = await this.request<any>(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return this.mapProduct(data);
  }

  /**
   * Delete product
   */
  async deleteProduct(productId: number, force: boolean = false): Promise<void> {
    await this.request(`/products/${productId}?force=${force}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get orders
   */
  async getOrders(params: {
    page?: number;
    perPage?: number;
    status?: string;
    after?: string;
    before?: string;
  } = {}): Promise<{ orders: WooCommerceOrder[]; total: number }> {
    const queryParams = new URLSearchParams();
    queryParams.set('page', (params.page || 1).toString());
    queryParams.set('per_page', (params.perPage || 50).toString());
    
    if (params.status) {
      queryParams.set('status', params.status);
    }
    if (params.after) {
      queryParams.set('after', params.after);
    }
    if (params.before) {
      queryParams.set('before', params.before);
    }

    const url = `/orders?${queryParams.toString()}`;
    const response = await fetch(`${this.baseUrl}${url}&consumer_key=${this.consumerKey}&consumer_secret=${this.consumerSecret}`);
    
    const orders = await response.json();
    const total = parseInt(response.headers.get('X-WP-Total') || '0', 10);

    return {
      orders: orders.map(this.mapOrder),
      total,
    };
  }

  /**
   * Get single order
   */
  async getOrder(orderId: number): Promise<WooCommerceOrder> {
    const data = await this.request<any>(`/orders/${orderId}`);
    return this.mapOrder(data);
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: number, status: string): Promise<WooCommerceOrder> {
    const data = await this.request<any>(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return this.mapOrder(data);
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<WooCommerceCategory[]> {
    const data = await this.request<any[]>('/products/categories?per_page=100');
    
    return data.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }));
  }

  /**
   * Update inventory
   */
  async updateInventory(productId: number, quantity: number): Promise<void> {
    await this.request(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({
        stock_quantity: quantity,
        manage_stock: true,
      }),
    });
  }

  /**
   * Create webhook
   */
  async createWebhook(
    topic: string,
    deliveryUrl: string,
    secret: string
  ): Promise<number> {
    const data = await this.request<{ id: number }>('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        name: `Luneo - ${topic}`,
        topic,
        delivery_url: deliveryUrl,
        secret,
        status: 'active',
      }),
    });

    return data.id;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: number): Promise<void> {
    await this.request(`/webhooks/${webhookId}?force=true`, {
      method: 'DELETE',
    });
  }

  /**
   * Map API product to our type
   */
  private mapProduct(p: any): WooCommerceProduct {
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: p.type,
      status: p.status,
      description: p.description || '',
      shortDescription: p.short_description || '',
      sku: p.sku || '',
      price: p.price || '0',
      regularPrice: p.regular_price || '0',
      salePrice: p.sale_price || '',
      stockQuantity: p.stock_quantity || 0,
      stockStatus: p.stock_status || 'instock',
      categories: (p.categories || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
      images: (p.images || []).map((img: any) => ({
        id: img.id,
        src: img.src,
        alt: img.alt || '',
      })),
      attributes: (p.attributes || []).map((attr: any) => ({
        id: attr.id,
        name: attr.name,
        options: attr.options || [],
        visible: attr.visible,
        variation: attr.variation,
      })),
      variations: p.variations || [],
    };
  }

  /**
   * Map API order to our type
   */
  private mapOrder(o: any): WooCommerceOrder {
    return {
      id: o.id,
      number: o.number,
      status: o.status,
      currency: o.currency,
      total: o.total,
      billing: {
        firstName: o.billing?.first_name || '',
        lastName: o.billing?.last_name || '',
        email: o.billing?.email || '',
        phone: o.billing?.phone || '',
        address1: o.billing?.address_1 || '',
        city: o.billing?.city || '',
        postcode: o.billing?.postcode || '',
        country: o.billing?.country || '',
      },
      shipping: {
        firstName: o.shipping?.first_name || '',
        lastName: o.shipping?.last_name || '',
        address1: o.shipping?.address_1 || '',
        city: o.shipping?.city || '',
        postcode: o.shipping?.postcode || '',
        country: o.shipping?.country || '',
      },
      lineItems: (o.line_items || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        variationId: item.variation_id,
        name: item.name,
        quantity: item.quantity,
        total: item.total,
        sku: item.sku || '',
        meta: (item.meta_data || []).map((m: any) => ({
          key: m.key,
          value: m.value,
        })),
      })),
      dateCreated: o.date_created,
    };
  }
}

/**
 * Create WooCommerce service instance
 */
export function createWooCommerceService(config: WooCommerceConfig): WooCommerceService {
  return new WooCommerceService(config);
}

export { WooCommerceService };


