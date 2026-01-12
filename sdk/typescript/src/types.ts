/**
 * Type definitions for Luneo API SDK
 */

export interface LuneoClientConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  retries?: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  available: boolean;
  customizationOptions?: {
    materials?: string[];
    sizes?: string[];
    engraving?: boolean;
    colors?: string[];
  };
}

export interface CreateDesignRequest {
  productId: string;
  prompt: string;
  options?: {
    material?: string;
    size?: string;
    color?: string;
    engravingText?: string;
    [key: string]: any;
  };
}

export interface Design {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  productId: string;
  previewUrl?: string;
  highResUrl?: string;
  createdAt: string;
  completedAt?: string;
  estimatedCompletionTime?: number;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  shipping: ShippingInfo;
  currency: string;
}

export interface OrderItem {
  productId: string;
  designId: string;
  quantity: number;
  unitPrice: number;
}

export interface ShippingInfo {
  address: string;
  method: string;
  name: string;
  email: string;
  phone: string;
}

export interface Order {
  id: string;
  status: 'pending_payment' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  currency: string;
  items: OrderItem[];
  shipping: ShippingInfo;
  paymentUrl?: string;
  trackingNumber?: string;
  createdAt: string;
  paidAt?: string;
  shippedAt?: string;
}

export interface AnalyticsOverview {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
  period: {
    start: string;
    end: string;
  };
}

export interface WebhookEvent {
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface LuneoError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export class LuneoAPIError extends Error {
  code: string;
  details?: Record<string, any>;
  statusCode?: number;

  constructor(error: LuneoError['error'], statusCode?: number) {
    super(error.message);
    this.name = 'LuneoAPIError';
    this.code = error.code;
    this.details = error.details;
    this.statusCode = statusCode;
  }
}
