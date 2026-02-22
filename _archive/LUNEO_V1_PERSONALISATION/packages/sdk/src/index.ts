/**
 * Luneo SDK
 * D-006: SDK JavaScript/TypeScript officiel
 */

export interface LuneoConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface Design {
  id: string;
  name: string;
  templateId?: string;
  canvasData: Record<string, any>;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  preview: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  images: string[];
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  designId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ListOptions {
  page?: number;
  limit?: number;
  search?: string;
}

class LuneoError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'LuneoError';
  }
}

class BaseResource {
  constructor(protected client: Luneo) {}

  protected async request<T>(
    method: string,
    path: string,
    body?: Record<string, any>
  ): Promise<T> {
    const url = `${this.client.baseUrl}${path}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.client.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.client.apiKey}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw new LuneoError(
          data.message || 'Request failed',
          response.status,
          data.code
        );
      }

      return data;
    } catch (error) {
      if (error instanceof LuneoError) throw error;
      if ((error as Error).name === 'AbortError') {
        throw new LuneoError('Request timeout', 408, 'TIMEOUT');
      }
      throw new LuneoError((error as Error).message, 500, 'NETWORK_ERROR');
    }
  }
}

class DesignsResource extends BaseResource {
  async list(options: ListOptions = {}): Promise<PaginatedResponse<Design>> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.search) params.set('search', options.search);
    
    return this.request('GET', `/designs?${params.toString()}`);
  }

  async get(id: string): Promise<Design> {
    return this.request('GET', `/designs/${id}`);
  }

  async create(data: Partial<Design>): Promise<Design> {
    return this.request('POST', '/designs', data);
  }

  async update(id: string, data: Partial<Design>): Promise<Design> {
    return this.request('PATCH', `/designs/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return this.request('DELETE', `/designs/${id}`);
  }

  async export(id: string, format: 'png' | 'pdf' | 'svg' = 'png'): Promise<{ url: string }> {
    return this.request('POST', `/designs/${id}/export`, { format });
  }

  async duplicate(id: string): Promise<Design> {
    return this.request('POST', `/designs/${id}/duplicate`);
  }
}

class TemplatesResource extends BaseResource {
  async list(options: ListOptions & { category?: string } = {}): Promise<PaginatedResponse<Template>> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.category) params.set('category', options.category);
    
    return this.request('GET', `/templates?${params.toString()}`);
  }

  async get(id: string): Promise<Template> {
    return this.request('GET', `/templates/${id}`);
  }

  async categories(): Promise<string[]> {
    return this.request('GET', '/templates/categories');
  }
}

class ProductsResource extends BaseResource {
  async list(options: ListOptions = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    
    return this.request('GET', `/products?${params.toString()}`);
  }

  async get(id: string): Promise<Product> {
    return this.request('GET', `/products/${id}`);
  }
}

class OrdersResource extends BaseResource {
  async list(options: ListOptions = {}): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    
    return this.request('GET', `/orders?${params.toString()}`);
  }

  async get(id: string): Promise<Order> {
    return this.request('GET', `/orders/${id}`);
  }

  async create(data: {
    items: { designId: string; productId: string; quantity: number }[];
    shippingAddress?: Record<string, any>;
  }): Promise<Order> {
    return this.request('POST', '/orders', data);
  }
}

export class Luneo {
  public readonly apiKey: string;
  public readonly baseUrl: string;
  public readonly timeout: number;

  public readonly designs: DesignsResource;
  public readonly templates: TemplatesResource;
  public readonly products: ProductsResource;
  public readonly orders: OrdersResource;

  constructor(config: LuneoConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.luneo.app/v1';
    this.timeout = config.timeout || 30000;

    this.designs = new DesignsResource(this);
    this.templates = new TemplatesResource(this);
    this.products = new ProductsResource(this);
    this.orders = new OrdersResource(this);
  }

  // Utility methods
  async ping(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/health`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
    return response.json();
  }
}

// Export error class
export { LuneoError };

// Default export
export default Luneo;

