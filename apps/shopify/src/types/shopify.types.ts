// ============================================================================
// SHOPIFY TYPES - Définitions complètes
// ============================================================================

export interface ShopifyTokenData {
  access_token: string;
  scope: string;
  expires_in?: number;
  associated_user?: ShopifyAssociatedUser;
  associated_user_scope?: string;
}

export interface ShopifyAssociatedUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  account_owner: boolean;
  locale: string;
  collaborator: boolean;
  email_verified: boolean;
}

export interface ShopifyShop {
  id: string;
  name: string;
  domain: string;
  email: string;
  currency: string;
  timezone: string;
  plan_name: string;
  plan_display_name: string;
  shop_owner: string;
  iana_timezone: string;
  created_at: string;
  updated_at: string;
  address1?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
  phone?: string;
}

export interface ShopifyVariant {
  id: string;
  product_id: string;
  title: string;
  price: string;
  sku: string;
  position: number;
  inventory_policy: string;
  compare_at_price: string | null;
  fulfillment_service: string;
  inventory_management: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode: string | null;
  grams: number;
  image_id: string | null;
  weight: number;
  weight_unit: string;
  inventory_item_id: string;
  inventory_quantity: number;
  old_inventory_quantity: number;
  requires_shipping: boolean;
}

export interface ShopifyProductOption {
  id: string;
  product_id: string;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyProductImage {
  id: string;
  product_id: string;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
  variant_ids: string[];
}

export interface ShopifyProduct {
  id: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  handle: string;
  updated_at: string;
  published_at: string;
  template_suffix: string | null;
  status: 'active' | 'archived' | 'draft';
  published_scope: string;
  tags: string;
  admin_graphql_api_id: string;
  variants: ShopifyVariant[];
  options: ShopifyProductOption[];
  images: ShopifyProductImage[];
  image: ShopifyProductImage | null;
}

export interface ShopifyLineItem {
  id: string;
  variant_id: string;
  title: string;
  quantity: number;
  sku: string;
  variant_title: string | null;
  vendor: string | null;
  fulfillment_service: string;
  product_id: string;
  requires_shipping: boolean;
  taxable: boolean;
  gift_card: boolean;
  name: string;
  variant_inventory_management: string;
  properties: ShopifyLineItemProperty[];
  product_exists: boolean;
  fulfillable_quantity: number;
  grams: number;
  price: string;
  total_discount: string;
  fulfillment_status: string | null;
  price_set: ShopifyPriceSet;
  total_discount_set: ShopifyPriceSet;
  discount_allocations: ShopifyDiscountAllocation[];
  duties: unknown[];
  admin_graphql_api_id: string;
  tax_lines: ShopifyTaxLine[];
}

export interface ShopifyLineItemProperty {
  name: string;
  value: string;
}

export interface ShopifyPriceSet {
  shop_money: ShopifyMoney;
  presentment_money: ShopifyMoney;
}

export interface ShopifyMoney {
  amount: string;
  currency_code: string;
}

export interface ShopifyDiscountAllocation {
  amount: string;
  discount_application_index: number;
  amount_set: ShopifyPriceSet;
}

export interface ShopifyTaxLine {
  price: string;
  rate: number;
  title: string;
  price_set: ShopifyPriceSet;
}

export interface ShopifyCustomer {
  id: string;
  email: string;
  accepts_marketing: boolean;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  orders_count: number;
  state: string;
  total_spent: string;
  last_order_id: string | null;
  note: string | null;
  verified_email: boolean;
  multipass_identifier: string | null;
  tax_exempt: boolean;
  phone: string | null;
  tags: string;
  last_order_name: string | null;
  currency: string;
  addresses: ShopifyAddress[];
  accepts_marketing_updated_at: string;
  marketing_opt_in_level: string | null;
  tax_exemptions: string[];
  admin_graphql_api_id: string;
  default_address: ShopifyAddress;
}

export interface ShopifyAddress {
  id?: string;
  customer_id?: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string | null;
  name: string;
  province_code: string | null;
  country_code: string;
  country_name: string;
  default?: boolean;
}

export interface ShopifyOrder {
  id: string;
  admin_graphql_api_id: string;
  app_id: number;
  browser_ip: string | null;
  buyer_accepts_marketing: boolean;
  cancel_reason: string | null;
  cancelled_at: string | null;
  cart_token: string | null;
  checkout_id: number;
  checkout_token: string;
  client_details: ShopifyClientDetails | null;
  closed_at: string | null;
  confirmed: boolean;
  contact_email: string;
  created_at: string;
  currency: string;
  current_subtotal_price: string;
  current_total_discounts: string;
  current_total_price: string;
  current_total_tax: string;
  customer_locale: string | null;
  device_id: number | null;
  discount_codes: ShopifyDiscountCode[];
  email: string;
  estimated_taxes: boolean;
  financial_status: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided';
  fulfillment_status: string | null;
  gateway: string;
  landing_site: string | null;
  landing_site_ref: string | null;
  location_id: number | null;
  name: string;
  note: string | null;
  note_attributes: ShopifyNoteAttribute[];
  number: number;
  order_number: number;
  order_status_url: string;
  original_total_duties_set: ShopifyPriceSet | null;
  payment_gateway_names: string[];
  phone: string | null;
  presentment_currency: string;
  processed_at: string;
  processing_method: string;
  reference: string | null;
  referring_site: string | null;
  source_identifier: string | null;
  source_name: string;
  source_url: string | null;
  subtotal_price: string;
  tags: string;
  tax_lines: ShopifyTaxLine[];
  taxes_included: boolean;
  test: boolean;
  token: string;
  total_discounts: string;
  total_line_items_price: string;
  total_outstanding: string;
  total_price: string;
  total_price_usd: string;
  total_shipping_price_set: ShopifyPriceSet;
  total_tax: string;
  total_tip_received: string;
  total_weight: number;
  updated_at: string;
  user_id: number | null;
  billing_address: ShopifyAddress;
  customer: ShopifyCustomer;
  discount_applications: ShopifyDiscountApplication[];
  fulfillments: ShopifyFulfillment[];
  line_items: ShopifyLineItem[];
  payment_terms: unknown | null;
  refunds: ShopifyRefund[];
  shipping_address: ShopifyAddress;
  shipping_lines: ShopifyShippingLine[];
}

export interface ShopifyClientDetails {
  accept_language: string | null;
  browser_height: number | null;
  browser_ip: string;
  browser_width: number | null;
  session_hash: string | null;
  user_agent: string | null;
}

export interface ShopifyDiscountCode {
  code: string;
  amount: string;
  type: string;
}

export interface ShopifyNoteAttribute {
  name: string;
  value: string;
}

export interface ShopifyDiscountApplication {
  type: string;
  value: string;
  value_type: string;
  allocation_method: string;
  target_selection: string;
  target_type: string;
  description: string | null;
  title: string;
}

export interface ShopifyFulfillment {
  id: string;
  order_id: string;
  status: string;
  created_at: string;
  service: string;
  updated_at: string;
  tracking_company: string | null;
  shipment_status: string | null;
  location_id: number;
  line_items: ShopifyLineItem[];
  tracking_number: string | null;
  tracking_numbers: string[];
  tracking_url: string | null;
  tracking_urls: string[];
  receipt: unknown;
  name: string;
  admin_graphql_api_id: string;
}

export interface ShopifyRefund {
  id: string;
  order_id: string;
  created_at: string;
  note: string | null;
  user_id: number;
  processed_at: string;
  restock: boolean;
  duties: unknown[];
  total_duties_set: ShopifyPriceSet;
  admin_graphql_api_id: string;
  refund_line_items: ShopifyRefundLineItem[];
  transactions: ShopifyTransaction[];
  order_adjustments: ShopifyOrderAdjustment[];
}

export interface ShopifyRefundLineItem {
  id: string;
  quantity: number;
  line_item_id: string;
  location_id: number;
  restock_type: string;
  subtotal: string;
  total_tax: string;
  subtotal_set: ShopifyPriceSet;
  total_tax_set: ShopifyPriceSet;
  line_item: ShopifyLineItem;
}

export interface ShopifyTransaction {
  id: string;
  order_id: string;
  kind: string;
  gateway: string;
  status: string;
  message: string | null;
  created_at: string;
  test: boolean;
  authorization: string | null;
  location_id: number | null;
  user_id: number | null;
  parent_id: number | null;
  processed_at: string;
  device_id: number | null;
  error_code: string | null;
  source_name: string;
  receipt: unknown;
  amount: string;
  currency: string;
  admin_graphql_api_id: string;
}

export interface ShopifyOrderAdjustment {
  id: string;
  order_id: string;
  refund_id: string;
  amount: string;
  tax_amount: string;
  kind: string;
  reason: string | null;
  amount_set: ShopifyPriceSet;
  tax_amount_set: ShopifyPriceSet;
}

export interface ShopifyShippingLine {
  id: string;
  carrier_identifier: string | null;
  code: string | null;
  delivery_category: string | null;
  discounted_price: string;
  discounted_price_set: ShopifyPriceSet;
  phone: string | null;
  price: string;
  price_set: ShopifyPriceSet;
  requested_fulfillment_service_id: string | null;
  source: string;
  title: string;
  tax_lines: ShopifyTaxLine[];
  discount_allocations: ShopifyDiscountAllocation[];
}

export interface ShopifyScriptTag {
  id: string;
  src: string;
  event: 'onload';
  created_at: string;
  updated_at: string;
  display_scope: 'online_store' | 'order_status' | 'all';
  cache: boolean;
}

export interface ShopifyWebhook {
  id: string;
  address: string;
  topic: string;
  created_at: string;
  updated_at: string;
  format: 'json' | 'xml';
  fields: string[];
  metafield_namespaces: string[];
  private_metafield_namespaces: string[];
  api_version: string;
}

export interface ShopifyWebhookPayload {
  topic: string;
  shop_domain: string;
  api_version: string;
  webhook_id: string;
  payload: unknown;
}

export interface ShopifyAppSubscription {
  id: string;
  name: string;
  status: 'pending' | 'active' | 'declined' | 'expired' | 'frozen' | 'cancelled';
  admin_graphql_api_id: string;
  created_at: string;
  updated_at: string;
  test: boolean;
  trial_days: number;
  trial_ends_on: string | null;
  capped_amount: string;
  billing_on: string | null;
  activated_on: string | null;
  cancelled_on: string | null;
  current_period_end: string | null;
  line_items: ShopifyAppSubscriptionLineItem[];
}

export interface ShopifyAppSubscriptionLineItem {
  id: string;
  plan: {
    recurring_pricing: {
      price: {
        amount: string;
        currency_code: string;
      };
      interval: 'annual' | 'every_30_days';
    };
  };
  usage_records: unknown[];
}

export interface ShopifyInventoryLevel {
  inventory_item_id: string;
  location_id: string;
  available: number;
  updated_at: string;
}

export interface ShopifyLocation {
  id: string;
  name: string;
  address1: string;
  address2: string | null;
  city: string;
  zip: string;
  province: string;
  country: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  country_code: string;
  country_name: string;
  province_code: string;
  legacy: boolean;
  active: boolean;
  admin_graphql_api_id: string;
}

export interface ShopifyMetafield {
  id: string;
  namespace: string;
  key: string;
  value: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  owner_resource: string;
  type: string;
  admin_graphql_api_id: string;
}

export interface ShopifyContext {
  shop?: ShopifyShop;
  user?: ShopifyAssociatedUser;
  session?: {
    access_token: string;
    scope: string;
  };
  theme?: 'light' | 'dark';
  locale?: string;
  currency?: string;
}

export interface ShopifyModalAction {
  label: string;
  action: () => void;
  type?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
}

export interface ShopifyError {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
  status?: number;
}

export interface ShopifyPaginationInfo {
  limit: number;
  page_info?: string;
  has_next_page: boolean;
  has_previous_page: boolean;
}

export interface ShopifyBulkOperation {
  id: string;
  status: 'created' | 'running' | 'completed' | 'canceled' | 'failed' | 'expired';
  error_code: string | null;
  created_at: string;
  completed_at: string | null;
  object_count: string;
  file_size: string | null;
  url: string | null;
  partial_data_url: string | null;
}



