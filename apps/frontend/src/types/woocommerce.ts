/**
 * Types TypeScript pour WooCommerce API
 * Remplace tous les `any` par des types stricts
 */

export interface WooCommerceOrder {
  id: number;
  status: string;
  currency: string;
  date_created: string;
  date_modified: string;
  total: string;
  subtotal: string;
  total_tax: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    subtotal: string;
    total: string;
    sku?: string;
    meta_data?: Array<{
      id: number;
      key: string;
      value: string;
    }>;
  }>;
  meta_data?: Array<{
    id: number;
    key: string;
    value: string | number | boolean;
  }>;
  customer_id?: number;
  customer_note?: string;
  payment_method?: string;
  payment_method_title?: string;
  transaction_id?: string;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description?: string;
  short_description?: string;
  sku?: string;
  price: string;
  regular_price: string;
  sale_price?: string;
  date_created: string;
  date_modified: string;
  stock_status: string;
  stock_quantity?: number;
  images: Array<{
    id: number;
    src: string;
    name: string;
    alt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  attributes?: Array<{
    id: number;
    name: string;
    options: string[];
  }>;
  variations?: number[];
  meta_data?: Array<{
    id: number;
    key: string;
    value: string | number | boolean;
  }>;
}

export interface WooCommerceWebhookResult {
  success: boolean;
  orderId?: string;
  productId?: string;
  message?: string;
  error?: string;
}

export interface WooCommerceIntegration {
  id: string;
  user_id: string;
  platform: 'woocommerce';
  store_url: string;
  is_active: boolean;
  credentials: {
    consumer_key: string;
    consumer_secret: string;
  };
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

