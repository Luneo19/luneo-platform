/**
 * E-commerce Integration Types
 * Types pour les intégrations Shopify, WooCommerce, etc.
 */

// Supported platforms
export type EcommercePlatform = 'shopify' | 'woocommerce' | 'prestashop' | 'magento' | 'bigcommerce';

// Integration status
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';

// Base integration
export interface Integration {
  id: string;
  userId: string;
  platform: EcommercePlatform;
  status: IntegrationStatus;
  storeName: string;
  storeUrl: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  settings: IntegrationSettings;
  syncConfig: SyncConfig;
  lastSyncAt?: number;
  createdAt: number;
  updatedAt: number;
}

// Integration settings
export interface IntegrationSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  importProducts: boolean;
  exportDesigns: boolean;
  webhooksEnabled: boolean;
  notifyOnOrder: boolean;
  notifyOnSync: boolean;
}

// Sync configuration
export interface SyncConfig {
  products: {
    enabled: boolean;
    direction: 'import' | 'export' | 'bidirectional';
    filters?: {
      collections?: string[];
      tags?: string[];
      productTypes?: string[];
    };
  };
  orders: {
    enabled: boolean;
    statuses?: string[];
  };
  inventory: {
    enabled: boolean;
    updateStock: boolean;
  };
}

// Shopify-specific types
export interface ShopifyStore {
  id: string;
  name: string;
  domain: string;
  email: string;
  currency: string;
  timezone: string;
  plan: string;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  status: 'active' | 'draft' | 'archived';
  images: ShopifyImage[];
  variants: ShopifyVariant[];
  options: ShopifyOption[];
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyVariant {
  id: string;
  productId: string;
  title: string;
  sku: string;
  price: string;
  compareAtPrice?: string;
  inventoryQuantity: number;
  weight: number;
  weightUnit: string;
  option1?: string;
  option2?: string;
  option3?: string;
}

export interface ShopifyImage {
  id: string;
  src: string;
  alt?: string;
  position: number;
}

export interface ShopifyOption {
  id: string;
  name: string;
  values: string[];
}

export interface ShopifyOrder {
  id: string;
  name: string; // Order number
  email: string;
  totalPrice: string;
  currency: string;
  financialStatus: string;
  fulfillmentStatus: string;
  lineItems: ShopifyLineItem[];
  customer: ShopifyCustomer;
  createdAt: string;
}

export interface ShopifyLineItem {
  id: string;
  productId: string;
  variantId: string;
  title: string;
  quantity: number;
  price: string;
  sku: string;
  customizations?: Record<string, unknown>;
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// WooCommerce-specific types
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  type: 'simple' | 'variable' | 'grouped';
  status: 'publish' | 'draft' | 'pending';
  description: string;
  shortDescription: string;
  sku: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  stockQuantity: number;
  stockStatus: 'instock' | 'outofstock' | 'onbackorder';
  categories: WooCommerceCategory[];
  images: WooCommerceImage[];
  attributes: WooCommerceAttribute[];
  variations: number[];
}

export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WooCommerceImage {
  id: number;
  src: string;
  alt: string;
}

export interface WooCommerceAttribute {
  id: number;
  name: string;
  options: string[];
  visible: boolean;
  variation: boolean;
}

export interface WooCommerceOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  billing: WooCommerceBilling;
  shipping: WooCommerceShipping;
  lineItems: WooCommerceLineItem[];
  dateCreated: string;
}

export interface WooCommerceBilling {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  postcode: string;
  country: string;
}

export interface WooCommerceShipping {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  postcode: string;
  country: string;
}

export interface WooCommerceLineItem {
  id: number;
  productId: number;
  variationId: number;
  name: string;
  quantity: number;
  total: string;
  sku: string;
  meta: WooCommerceMetaData[];
}

export interface WooCommerceMetaData {
  key: string;
  value: string;
}

// Sync result
export interface SyncResult {
  id: string;
  integrationId: string;
  type: 'products' | 'orders' | 'inventory';
  direction: 'import' | 'export';
  status: 'success' | 'partial' | 'failed';
  itemsProcessed: number;
  itemsSuccess: number;
  itemsFailed: number;
  errors: SyncError[];
  startedAt: number;
  completedAt: number;
}

export interface SyncError {
  itemId: string;
  itemType: string;
  error: string;
  details?: Record<string, unknown>;
}

// Webhook events
export type WebhookEvent =
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'order.created'
  | 'order.updated'
  | 'order.fulfilled'
  | 'inventory.updated'
  | 'app.uninstalled';

export interface WebhookPayload {
  event: WebhookEvent;
  platform: EcommercePlatform;
  integrationId: string;
  data: Record<string, unknown>;
  timestamp: number;
}


