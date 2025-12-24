/**
 * Integrations Module
 * Export centralisé des intégrations e-commerce
 */

export { ShopifyService, createShopifyService } from './shopify';
export { WooCommerceService, createWooCommerceService } from './woocommerce';

export type {
  // Platform types
  EcommercePlatform,
  IntegrationStatus,
  Integration,
  IntegrationSettings,
  SyncConfig,
  SyncResult,
  SyncError,
  
  // Shopify types
  ShopifyStore,
  ShopifyProduct,
  ShopifyVariant,
  ShopifyImage,
  ShopifyOption,
  ShopifyOrder,
  ShopifyLineItem,
  ShopifyCustomer,
  
  // WooCommerce types
  WooCommerceProduct,
  WooCommerceCategory,
  WooCommerceImage,
  WooCommerceAttribute,
  WooCommerceOrder,
  WooCommerceBilling,
  WooCommerceShipping,
  WooCommerceLineItem,
  WooCommerceMetaData,
  
  // Webhook types
  WebhookEvent,
  WebhookPayload,
} from './types';


