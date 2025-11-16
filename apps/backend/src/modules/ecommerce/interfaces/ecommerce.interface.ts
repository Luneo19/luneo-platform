export interface EcommerceIntegration {
  id: string;
  brandId: string;
  platform: 'shopify' | 'woocommerce' | 'magento';
  shopDomain: string;
  accessToken?: string;
  refreshToken?: string;
  config: EcommerceConfig;
  status: 'active' | 'inactive' | 'error' | 'pending';
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EcommerceConfig {
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  scopes?: string[];
  features?: string[];
  customFields?: Record<string, unknown>;
}

export interface ProductMapping {
  id: string;
  integrationId: string;
  luneoProductId: string;
  externalProductId: string;
  externalSku: string;
  syncStatus: 'synced' | 'pending' | 'failed' | 'conflict';
  lastSyncedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface SyncLog {
  id: string;
  integrationId: string;
  type: 'product' | 'order' | 'inventory' | 'customer';
  direction: 'import' | 'export' | 'bidirectional';
  status: 'success' | 'failed' | 'partial';
  itemsProcessed: number;
  itemsFailed: number;
  errors?: SyncError[];
  duration: number;
  createdAt: Date;
}

export interface SyncError {
  itemId: string;
  code: string;
  message: string;
  details?: unknown;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: ShopifyOption[];
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ShopifyVariant {
  id?: string;
  product_id?: string;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_quantity: number;
  option1?: string;
  option2?: string;
  option3?: string;
  image_id?: string;
}

export interface ShopifyImage {
  id?: string;
  product_id?: string;
  src: string;
  position: number;
  alt?: string;
  width?: number;
  height?: number;
}

export interface ShopifyOption {
  id: string;
  product_id: string;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyOrder {
  id: string;
  order_number: number;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string;
  line_items: ShopifyLineItem[];
  customer: ShopifyCustomer;
  shipping_address: ShopifyAddress;
  billing_address: ShopifyAddress;
}

export interface ShopifyLineItem {
  id: string;
  product_id: string;
  variant_id: string;
  title: string;
  quantity: number;
  price: string;
  sku: string;
  properties?: Array<{ name: string; value: string }>;
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface ShopifyAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone?: string;
}

export interface ShopifyWebhook {
  id: string;
  address: string;
  topic: string;
  format: 'json' | 'xml';
  fields?: string[];
  created_at: string;
  updated_at: string;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  type: 'simple' | 'grouped' | 'external' | 'variable';
  status: 'publish' | 'draft' | 'pending' | 'private';
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: WooCommerceImage[];
  attributes: WooCommerceAttribute[];
  variations: number[];
  date_created: string;
  date_modified: string;
}

export interface WooCommerceImage {
  id?: number;
  src: string;
  name: string;
  alt: string;
  position: number;
}

export interface WooCommerceAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface WooCommerceOrder {
  id: number;
  parent_id: number;
  status: string;
  currency: string;
  date_created: string;
  date_modified: string;
  total: string;
  total_tax: string;
  customer_id: number;
  billing: WooCommerceAddress;
  shipping: WooCommerceAddress;
  line_items: WooCommerceLineItem[];
}

export interface WooCommerceLineItem {
  id: number;
  name: string;
  product_id: number;
  variation_id: number;
  quantity: number;
  price: string;
  total: string;
  sku: string;
  meta_data: Array<{ key: string; value: unknown }>;
}

export interface WooCommerceAddress {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
}

export interface MagentoProduct {
  id: number;
  sku: string;
  name: string;
  status: number;
  visibility: number;
  type_id: string;
  price: number;
  attribute_set_id: number;
  extension_attributes?: unknown;
  custom_attributes: MagentoAttribute[];
  media_gallery_entries: MagentoMediaEntry[];
}

export interface MagentoAttribute {
  attribute_code: string;
  value: unknown;
}

export interface MagentoMediaEntry {
  id: number;
  media_type: string;
  label: string;
  position: number;
  disabled: boolean;
  types: string[];
  file: string;
}

export interface MagentoOrder {
  entity_id: number;
  increment_id: string;
  status: string;
  state: string;
  created_at: string;
  updated_at: string;
  grand_total: number;
  subtotal: number;
  tax_amount: number;
  customer_email: string;
  customer_firstname: string;
  customer_lastname: string;
  billing_address: MagentoAddress;
  shipping_address: MagentoAddress;
  items: MagentoOrderItem[];
}

export interface MagentoOrderItem {
  item_id: number;
  order_id: number;
  product_id: number;
  sku: string;
  name: string;
  qty_ordered: number;
  price: number;
  row_total: number;
}

export interface MagentoAddress {
  firstname: string;
  lastname: string;
  street: string[];
  city: string;
  region: string;
  postcode: string;
  country_id: string;
  telephone: string;
}

export interface SyncOptions {
  direction: 'import' | 'export' | 'bidirectional';
  includeImages: boolean;
  includeInventory: boolean;
  includeOrders: boolean;
  filterStatus?: string[];
  filterUpdatedSince?: Date;
  batchSize?: number;
  dryRun?: boolean;
}

export interface SyncResult {
  integrationId: string;
  platform: string;
  type: string;
  direction: string;
  status: 'success' | 'failed' | 'partial';
  itemsProcessed: number;
  itemsFailed: number;
  duration: number;
  errors: SyncError[];
  summary: {
    created: number;
    updated: number;
    deleted: number;
    skipped: number;
  };
  createdAt: Date;
}

export interface WebhookPayload {
  id: string;
  topic: string;
  shop_domain?: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export type ShopifyWebhookPayload = Record<string, unknown>;
export type WooCommerceWebhookPayload = Record<string, unknown>;

export interface WebhookStats {
  period: 'day' | 'week' | 'month';
  totalWebhooks: number;
  webhooksByTopic: Record<string, number>;
  webhooksByStatus: Record<string, number>;
  successRate: number;
}

export interface ProductSyncRequest {
  integrationId: string;
  productIds?: string[];
  options?: SyncOptions;
}

export interface OrderSyncRequest {
  integrationId: string;
  orderIds?: string[];
  options?: SyncOptions;
}

export interface EcommerceSyncJobPayload {
  integrationId: string;
  scope?: 'products' | 'orders' | 'inventory';
  forceFullSync?: boolean;
}

export interface EcommerceWebhookJobPayload {
  integrationId: string;
  topic: string;
  payload: Record<string, unknown>;
  shopDomain?: string;
  signature?: string;
}


