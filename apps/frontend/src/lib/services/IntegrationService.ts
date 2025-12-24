/**
 * ★★★ SERVICE - INTÉGRATIONS E-COMMERCE ★★★
 * Service professionnel pour les intégrations
 * - Shopify
 * - WooCommerce
 * - Magento
 * - API générique
 */

import { logger } from '@/lib/logger';
import { cacheService } from '@/lib/cache/CacheService';
import { PrismaClient } from '@prisma/client';
import { verifyShopifyToken, getShopifyProducts } from '@/lib/integrations/shopify-client';
import { verifyWooCommerceCredentials, getWooCommerceProducts } from '@/lib/integrations/woocommerce-client';

// db importé depuis @/lib/db

// ========================================
// TYPES
// ========================================

export interface Integration {
  id: string;
  brandId: string;
  platform: 'shopify' | 'woocommerce' | 'magento' | 'custom';
  shopDomain: string;
  status: 'active' | 'inactive' | 'error';
  lastSyncAt?: Date;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShopifyIntegrationRequest {
  brandId: string;
  shopDomain: string;
  accessToken: string;
}

export interface CreateWooCommerceIntegrationRequest {
  brandId: string;
  shopDomain: string;
  consumerKey: string;
  consumerSecret: string;
}

export interface SyncOptions {
  products?: boolean;
  orders?: boolean;
  inventory?: boolean;
  direction?: 'import' | 'export' | 'both';
}

export interface SyncResult {
  success: boolean;
  itemsProcessed: number;
  itemsFailed: number;
  errors?: string[];
  duration: number;
}

// ========================================
// SERVICE
// ========================================

export class IntegrationService {
  private static instance: IntegrationService;

  private constructor() {}

  static getInstance(): IntegrationService {
    if (!IntegrationService.instance) {
      IntegrationService.instance = new IntegrationService();
    }
    return IntegrationService.instance;
  }

  // ========================================
  // CRUD
  // ========================================

  /**
   * Liste les intégrations
   */
  async listIntegrations(
    brandId: string,
    useCache: boolean = true
  ): Promise<Integration[]> {
    try {
      const cacheKey = `integrations:${brandId}`;

      // Check cache
      if (useCache) {
        const cached = cacheService.get<Integration[]>(cacheKey);
        if (cached) {
          logger.info('Cache hit for integrations', { brandId });
          return cached;
        }
      }

      // Fetch from database
      const dbIntegrations = await db.ecommerceIntegration.findMany({
        where: { brandId },
        orderBy: { createdAt: 'desc' },
      });

      const integrations: Integration[] = dbIntegrations.map((integration) => ({
        id: integration.id,
        brandId: integration.brandId,
        platform: integration.platform as any,
        shopDomain: integration.shopDomain,
        status: integration.status as any,
        lastSyncAt: integration.lastSyncAt || undefined,
        config: integration.config as any,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      }));

      // Cache for 5 minutes
      cacheService.set(cacheKey, integrations, 300);

      return integrations;
    } catch (error: any) {
      logger.error('Error listing integrations', { error, brandId });
      throw error;
    }
  }

  /**
   * Récupère une intégration par ID
   */
  async getIntegrationById(integrationId: string): Promise<Integration> {
    try {
      const integration = await db.ecommerceIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error('Integration not found');
      }

      return {
        id: integration.id,
        brandId: integration.brandId,
        platform: integration.platform as any,
        shopDomain: integration.shopDomain,
        status: integration.status as any,
        lastSyncAt: integration.lastSyncAt || undefined,
        config: integration.config as any,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      };
    } catch (error: any) {
      logger.error('Error fetching integration', { error, integrationId });
      throw error;
    }
  }

  // ========================================
  // SHOPIFY
  // ========================================

  /**
   * Crée une intégration Shopify
   */
  async createShopifyIntegration(
    request: CreateShopifyIntegrationRequest
  ): Promise<Integration> {
    try {
      logger.info('Creating Shopify integration', {
        brandId: request.brandId,
        shopDomain: request.shopDomain,
      });

      // 1. Verify access token and get shop info
      const shopInfo = await verifyShopifyToken(request.shopDomain, request.accessToken);

      // 2. Save to database
      const integration = await db.ecommerceIntegration.create({
        data: {
          brandId: request.brandId,
          platform: 'shopify',
          shopDomain: request.shopDomain,
          accessToken: request.accessToken, // Store encrypted in production
          config: {
            shopName: shopInfo.name,
            shopEmail: shopInfo.email,
            currency: shopInfo.currency,
            timezone: shopInfo.timezone,
          } as any,
          status: 'active',
        },
      });

      // 3. Setup webhooks (async, don't wait)
      this.setupShopifyWebhooks(integration.id, request.shopDomain, request.accessToken).catch(
        (error) => {
          logger.error('Error setting up Shopify webhooks', { error, integrationId: integration.id });
        }
      );

      // Invalidate cache
      cacheService.delete(`integrations:${request.brandId}`);

      logger.info('Shopify integration created', {
        integrationId: integration.id,
        brandId: request.brandId,
      });

      return {
        id: integration.id,
        brandId: integration.brandId,
        platform: integration.platform as any,
        shopDomain: integration.shopDomain,
        status: integration.status as any,
        lastSyncAt: integration.lastSyncAt || undefined,
        config: integration.config as any,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      };
    } catch (error: any) {
      logger.error('Error creating Shopify integration', { error, request });
      throw error;
    }
  }

  /**
   * Configure les webhooks Shopify
   */
  private async setupShopifyWebhooks(
    integrationId: string,
    shopDomain: string,
    accessToken: string
  ): Promise<void> {
    try {
      logger.info('Setting up Shopify webhooks', { integrationId, shopDomain });

      const webhookBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.luneo.app';
      const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || '';

      const webhooks = [
        { topic: 'products/create', address: `${webhookBaseUrl}/api/integrations/shopify/webhook` },
        { topic: 'products/update', address: `${webhookBaseUrl}/api/integrations/shopify/webhook` },
        { topic: 'products/delete', address: `${webhookBaseUrl}/api/integrations/shopify/webhook` },
        { topic: 'orders/create', address: `${webhookBaseUrl}/api/integrations/shopify/webhook` },
        { topic: 'orders/updated', address: `${webhookBaseUrl}/api/integrations/shopify/webhook` },
        { topic: 'orders/fulfilled', address: `${webhookBaseUrl}/api/integrations/shopify/webhook` },
        { topic: 'inventory_levels/update', address: `${webhookBaseUrl}/api/integrations/shopify/webhook` },
        { topic: 'app/uninstalled', address: `${webhookBaseUrl}/api/integrations/shopify/webhook` },
      ];

      // Create webhooks via Shopify Admin API
      for (const webhook of webhooks) {
        try {
          const response = await fetch(`https://${shopDomain}/admin/api/2024-01/webhooks.json`, {
            method: 'POST',
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              webhook: {
                topic: webhook.topic,
                address: webhook.address,
                format: 'json',
              },
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            logger.warn('Failed to create Shopify webhook', {
              topic: webhook.topic,
              error,
              status: response.status,
            });
          } else {
            const data = await response.json();
            logger.info('Shopify webhook created', {
              topic: webhook.topic,
              webhookId: data.webhook?.id,
            });
          }
        } catch (error: any) {
          logger.error('Error creating Shopify webhook', {
            error,
            topic: webhook.topic,
          });
        }
      }

      // Store webhook IDs in integration config
      await db.ecommerceIntegration.update({
        where: { id: integrationId },
        data: {
          config: {
            ...((await db.ecommerceIntegration.findUnique({ where: { id: integrationId } }))?.config as any || {}),
            webhooksConfigured: true,
            webhookSecret,
          } as any,
        },
      });

      logger.info('Shopify webhooks setup completed', { integrationId });
    } catch (error: any) {
      logger.error('Error setting up Shopify webhooks', { error, integrationId, shopDomain });
      // Don't throw - webhook setup failure shouldn't break integration creation
    }
  }

  /**
   * Synchronise avec Shopify
   */
  async syncShopify(
    integrationId: string,
    options: SyncOptions
  ): Promise<SyncResult> {
    try {
      logger.info('Syncing Shopify', { integrationId, options });

      const startTime = Date.now();

      // 1. Get integration
      const integration = await db.ecommerceIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration || integration.platform !== 'shopify') {
        throw new Error('Shopify integration not found');
      }

      const accessToken = integration.accessToken || '';
      const shopDomain = integration.shopDomain;
      const errors: string[] = [];
      let itemsProcessed = 0;
      let itemsFailed = 0;

      // 2. Sync products if requested
      if (options.products !== false) {
        try {
          const shopifyProducts = await getShopifyProducts(shopDomain, accessToken, 250);

          for (const shopifyProduct of shopifyProducts) {
            try {
              // Check if product mapping exists
              const existingMapping = await db.productMapping.findFirst({
                where: {
                  integrationId,
                  externalProductId: shopifyProduct.id.toString(),
                },
              });

              if (!existingMapping && options.direction !== 'export') {
                // Create or find Luneo product from Shopify product
                let luneoProductId = existingMapping?.luneoProductId;

                if (!luneoProductId || luneoProductId.startsWith('temp_')) {
                  // Create product in Luneo database
                  const luneoProduct = await db.product.create({
                    data: {
                      brandId: integration.brandId,
                      name: shopifyProduct.title,
                      description: shopifyProduct.body_html || '',
                      sku: shopifyProduct.variants[0]?.sku || shopifyProduct.handle,
                      price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
                      currency: 'EUR',
                      images: shopifyProduct.images?.map((img: any) => img.src) || [],
                      imageUrl: shopifyProduct.images?.[0]?.src || null,
                      isActive: shopifyProduct.status === 'active',
                      isPublic: shopifyProduct.published_at ? true : false,
                      metadata: {
                        shopifyProductId: shopifyProduct.id,
                        shopifyHandle: shopifyProduct.handle,
                        shopifyVariants: shopifyProduct.variants,
                        importedAt: new Date().toISOString(),
                      } as any,
                    },
                  });

                  luneoProductId = luneoProduct.id;
                }

                // Create or update product mapping
                await db.productMapping.upsert({
                  where: {
                    integrationId_externalProductId: {
                      integrationId,
                      externalProductId: shopifyProduct.id.toString(),
                    },
                  },
                  create: {
                    integrationId,
                    luneoProductId,
                    externalProductId: shopifyProduct.id.toString(),
                    externalSku: shopifyProduct.variants[0]?.sku || '',
                    syncStatus: 'synced',
                    metadata: {
                      shopifyVariants: shopifyProduct.variants,
                      lastSyncedAt: new Date().toISOString(),
                    } as any,
                  },
                  update: {
                    luneoProductId,
                    externalSku: shopifyProduct.variants[0]?.sku || '',
                    syncStatus: 'synced',
                    lastSyncedAt: new Date(),
                    metadata: {
                      shopifyVariants: shopifyProduct.variants,
                      lastSyncedAt: new Date().toISOString(),
                    } as any,
                  },
                });
              }

              itemsProcessed++;
            } catch (error: any) {
              itemsFailed++;
              errors.push(`Product ${shopifyProduct.id}: ${error.message}`);
            }
          }
        } catch (error: any) {
          itemsFailed++;
          errors.push(`Products sync failed: ${error.message}`);
        }
      }

      // 3. Sync orders if requested
      if (options.orders !== false) {
        try {
          const { getShopifyOrders } = await import('@/lib/integrations/shopify-client');
          const shopifyOrders = await getShopifyOrders(shopDomain, accessToken, 100);

          for (const shopifyOrder of shopifyOrders) {
            try {
              // Check if order mapping exists
              const existingMapping = await db.productMapping.findFirst({
                where: {
                  integrationId,
                  externalProductId: shopifyOrder.id.toString(),
                  externalOrderId: shopifyOrder.id.toString(),
                },
              });

              if (!existingMapping && options.direction !== 'export') {
                // Create order in Luneo database
                // Extract customization metadata from line items
                const lineItems = shopifyOrder.line_items || [];
                const customizedItems = lineItems.filter((item: any) => 
                  item.properties?.some((prop: any) => prop.name === 'customization_id')
                );

                if (customizedItems.length > 0) {
                  // Create order record
                  const order = await db.order.create({
                    data: {
                      orderNumber: shopifyOrder.order_number?.toString() || shopifyOrder.name || `SHOP-${shopifyOrder.id}`,
                      status: 'CREATED',
                      customerEmail: shopifyOrder.email || '',
                      customerName: `${shopifyOrder.shipping_address?.first_name || ''} ${shopifyOrder.shipping_address?.last_name || ''}`.trim(),
                      shippingAddress: shopifyOrder.shipping_address as any,
                      subtotalCents: Math.round((shopifyOrder.subtotal_price || 0) * 100),
                      taxCents: Math.round((shopifyOrder.total_tax || 0) * 100),
                      shippingCents: Math.round((shopifyOrder.total_shipping_price_set?.shop_money?.amount || 0) * 100),
                      totalCents: Math.round((shopifyOrder.total_price || 0) * 100),
                      currency: shopifyOrder.currency || 'USD',
                      paymentStatus: shopifyOrder.financial_status === 'paid' ? 'SUCCEEDED' : 'PENDING',
                      metadata: {
                        shopifyOrderId: shopifyOrder.id,
                        shopifyOrderName: shopifyOrder.name,
                        lineItems: customizedItems,
                      } as any,
                      brandId: integration.brandId,
                    },
                  });

                  // Create order mapping
                  await db.productMapping.create({
                    data: {
                      integrationId,
                      luneoProductId: order.id,
                      externalProductId: customizedItems[0]?.product_id?.toString() || '',
                      externalOrderId: shopifyOrder.id.toString(),
                      externalSku: shopifyOrder.order_number?.toString() || '',
                      syncStatus: 'synced',
                    },
                  });

                  itemsProcessed++;
                }
              }
            } catch (error: any) {
              itemsFailed++;
              errors.push(`Order ${shopifyOrder.id}: ${error.message}`);
            }
          }
        } catch (error: any) {
          itemsFailed++;
          errors.push(`Orders sync failed: ${error.message}`);
        }
      }

      // 4. Update lastSyncAt
      await db.ecommerceIntegration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          status: itemsFailed > 0 ? 'error' : 'active',
        },
      });

      const duration = Date.now() - startTime;

      logger.info('Shopify sync completed', {
        integrationId,
        itemsProcessed,
        itemsFailed,
        duration,
      });

      return {
        success: itemsFailed === 0,
        itemsProcessed,
        itemsFailed,
        errors: errors.length > 0 ? errors : undefined,
        duration: duration / 1000, // Convert to seconds
      };
    } catch (error: any) {
      logger.error('Error syncing Shopify', { error, integrationId });
      throw error;
    }
  }

  // ========================================
  // WOOCOMMERCE
  // ========================================

  /**
   * Crée une intégration WooCommerce
   */
  async createWooCommerceIntegration(
    request: CreateWooCommerceIntegrationRequest
  ): Promise<Integration> {
    try {
      logger.info('Creating WooCommerce integration', {
        brandId: request.brandId,
        shopDomain: request.shopDomain,
      });

      // 1. Verify credentials and get shop info
      const shopInfo = await verifyWooCommerceCredentials(
        request.shopDomain,
        request.consumerKey,
        request.consumerSecret
      );

      // 2. Save to database
      const integration = await db.ecommerceIntegration.create({
        data: {
          brandId: request.brandId,
          platform: 'woocommerce',
          shopDomain: request.shopDomain,
          accessToken: `${request.consumerKey}:${request.consumerSecret}`, // Store encrypted in production
          config: {
            shopName: shopInfo.name,
            currency: shopInfo.currency,
            version: shopInfo.version,
            consumerKey: request.consumerKey,
          } as any,
          status: 'active',
        },
      });

      // Invalidate cache
      cacheService.delete(`integrations:${request.brandId}`);

      logger.info('WooCommerce integration created', {
        integrationId: integration.id,
        brandId: request.brandId,
      });

      return {
        id: integration.id,
        brandId: integration.brandId,
        platform: integration.platform as any,
        shopDomain: integration.shopDomain,
        status: integration.status as any,
        lastSyncAt: integration.lastSyncAt || undefined,
        config: integration.config as any,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      };
    } catch (error: any) {
      logger.error('Error creating WooCommerce integration', { error, request });
      throw error;
    }
  }

  /**
   * Synchronise avec WooCommerce
   */
  async syncWooCommerce(
    integrationId: string,
    options: SyncOptions
  ): Promise<SyncResult> {
    try {
      logger.info('Syncing WooCommerce', { integrationId, options });

      const startTime = Date.now();

      // 1. Get integration
      const integration = await db.ecommerceIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration || integration.platform !== 'woocommerce') {
        throw new Error('WooCommerce integration not found');
      }

      const config = integration.config as any;
      const [consumerKey, consumerSecret] = (integration.accessToken || '').split(':');
      const shopDomain = integration.shopDomain;
      const errors: string[] = [];
      let itemsProcessed = 0;
      let itemsFailed = 0;

      // 2. Sync products if requested
      if (options.products !== false) {
        try {
          const wooProducts = await getWooCommerceProducts(
            shopDomain,
            consumerKey,
            consumerSecret,
            100
          );

          for (const wooProduct of wooProducts) {
            try {
              // Check if product mapping exists
              const existingMapping = await db.productMapping.findFirst({
                where: {
                  integrationId,
                  externalProductId: wooProduct.id.toString(),
                },
              });

              if (!existingMapping && options.direction !== 'export') {
                // Create or find Luneo product from WooCommerce product
                let luneoProductId = existingMapping?.luneoProductId;

                if (!luneoProductId || luneoProductId.startsWith('temp_')) {
                  // Create product in Luneo database
                  const luneoProduct = await db.product.create({
                    data: {
                      brandId: integration.brandId,
                      name: wooProduct.name,
                      description: wooProduct.description || '',
                      sku: wooProduct.sku || wooProduct.slug,
                      price: parseFloat(wooProduct.price || '0'),
                      currency: 'EUR',
                      images: wooProduct.images?.map((img: any) => img.src) || [],
                      imageUrl: wooProduct.images?.[0]?.src || null,
                      isActive: wooProduct.status === 'publish',
                      isPublic: true,
                      metadata: {
                        wooProductId: wooProduct.id,
                        wooSlug: wooProduct.slug,
                        wooPrice: wooProduct.price,
                        importedAt: new Date().toISOString(),
                      } as any,
                    },
                  });

                  luneoProductId = luneoProduct.id;
                }

                // Create or update product mapping
                await db.productMapping.upsert({
                  where: {
                    integrationId_externalProductId: {
                      integrationId,
                      externalProductId: wooProduct.id.toString(),
                    },
                  },
                  create: {
                    integrationId,
                    luneoProductId,
                    externalProductId: wooProduct.id.toString(),
                    externalSku: wooProduct.sku || '',
                    syncStatus: 'synced',
                    metadata: {
                      wooPrice: wooProduct.price,
                      lastSyncedAt: new Date().toISOString(),
                    } as any,
                  },
                  update: {
                    luneoProductId,
                    externalSku: wooProduct.sku || '',
                    syncStatus: 'synced',
                    lastSyncedAt: new Date(),
                    metadata: {
                      wooPrice: wooProduct.price,
                      lastSyncedAt: new Date().toISOString(),
                    } as any,
                  },
                });
              }

              itemsProcessed++;
            } catch (error: any) {
              itemsFailed++;
              errors.push(`Product ${wooProduct.id}: ${error.message}`);
            }
          }
        } catch (error: any) {
          itemsFailed++;
          errors.push(`Products sync failed: ${error.message}`);
        }
      }

      // 3. Sync orders if requested
      if (options.orders !== false) {
        try {
          const { getWooCommerceOrders } = await import('@/lib/integrations/woocommerce-client');
          const wooOrders = await getWooCommerceOrders(shopDomain, consumerKey, consumerSecret, 100);

          for (const wooOrder of wooOrders) {
            try {
              // Check if order mapping exists
              const existingMapping = await db.productMapping.findFirst({
                where: {
                  integrationId,
                  externalOrderId: wooOrder.id.toString(),
                },
              });

              if (!existingMapping && options.direction !== 'export') {
                // Extract customization metadata from line items
                const lineItems = wooOrder.line_items || [];
                const customizedItems = lineItems.filter((item: any) => 
                  item.meta_data?.some((meta: any) => meta.key === 'customization_id')
                );

                if (customizedItems.length > 0) {
                  // Create order in Luneo database
                  const order = await db.order.create({
                    data: {
                      orderNumber: wooOrder.number?.toString() || `WC-${wooOrder.id}`,
                      status: wooOrder.status === 'completed' ? 'DELIVERED' : 'CREATED',
                      customerEmail: wooOrder.billing?.email || '',
                      customerName: `${wooOrder.billing?.first_name || ''} ${wooOrder.billing?.last_name || ''}`.trim(),
                      shippingAddress: {
                        name: `${wooOrder.shipping?.first_name || ''} ${wooOrder.shipping?.last_name || ''}`.trim(),
                        street: wooOrder.shipping?.address_1 || '',
                        city: wooOrder.shipping?.city || '',
                        postalCode: wooOrder.shipping?.postcode || '',
                        country: wooOrder.shipping?.country || '',
                        phone: wooOrder.billing?.phone || '',
                        state: wooOrder.shipping?.state || '',
                      } as any,
                      subtotalCents: Math.round((parseFloat(wooOrder.total || '0') - parseFloat(wooOrder.total_tax || '0') - parseFloat(wooOrder.shipping_total || '0')) * 100),
                      taxCents: Math.round(parseFloat(wooOrder.total_tax || '0') * 100),
                      shippingCents: Math.round(parseFloat(wooOrder.shipping_total || '0') * 100),
                      totalCents: Math.round(parseFloat(wooOrder.total || '0') * 100),
                      currency: wooOrder.currency || 'USD',
                      paymentStatus: wooOrder.status === 'completed' ? 'SUCCEEDED' : 'PENDING',
                      metadata: {
                        wooOrderId: wooOrder.id,
                        lineItems: customizedItems,
                      } as any,
                      brandId: integration.brandId,
                    },
                  });

                  // Create order mapping
                  await db.productMapping.create({
                    data: {
                      integrationId,
                      luneoProductId: order.id,
                      externalProductId: customizedItems[0]?.product_id?.toString() || '',
                      externalOrderId: wooOrder.id.toString(),
                      externalSku: wooOrder.number?.toString() || '',
                      syncStatus: 'synced',
                    },
                  });

                  itemsProcessed++;
                }
              }
            } catch (error: any) {
              itemsFailed++;
              errors.push(`Order ${wooOrder.id}: ${error.message}`);
            }
          }
        } catch (error: any) {
          itemsFailed++;
          errors.push(`Orders sync failed: ${error.message}`);
        }
      }

      // 4. Update lastSyncAt
      await db.ecommerceIntegration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          status: itemsFailed > 0 ? 'error' : 'active',
        },
      });

      const duration = Date.now() - startTime;

      logger.info('WooCommerce sync completed', {
        integrationId,
        itemsProcessed,
        itemsFailed,
        duration,
      });

      return {
        success: itemsFailed === 0,
        itemsProcessed,
        itemsFailed,
        errors: errors.length > 0 ? errors : undefined,
        duration: duration / 1000, // Convert to seconds
      };
    } catch (error: any) {
      logger.error('Error syncing WooCommerce', { error, integrationId });
      throw error;
    }
  }

  // ========================================
  // GENERIC SYNC
  // ========================================

  /**
   * Synchronise une intégration
   */
  async syncIntegration(
    integrationId: string,
    options: SyncOptions
  ): Promise<SyncResult> {
    try {
      const integration = await this.getIntegrationById(integrationId);

      switch (integration.platform) {
        case 'shopify':
          return await this.syncShopify(integrationId, options);
        case 'woocommerce':
          return await this.syncWooCommerce(integrationId, options);
        default:
          throw new Error(`Unsupported platform: ${integration.platform}`);
      }
    } catch (error: any) {
      logger.error('Error syncing integration', { error, integrationId });
      throw error;
    }
  }

  /**
   * Supprime une intégration
   */
  async deleteIntegration(integrationId: string, brandId: string): Promise<void> {
    try {
      logger.info('Deleting integration', { integrationId, brandId });

      // Get integration details
      const integration = await db.ecommerceIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error('Integration not found');
      }

      // Verify brand ownership
      if (integration.brandId !== brandId) {
        throw new Error('Integration does not belong to this brand');
      }

      // 1. Remove webhooks if Shopify
      if (integration.platform === 'shopify') {
        try {
          const shopDomain = integration.shopDomain;
          const accessToken = integration.accessToken;
          
          if (accessToken) {
            // Get existing webhooks
            const webhooksResponse = await fetch(`https://${shopDomain}/admin/api/2024-01/webhooks.json`, {
              headers: {
                'X-Shopify-Access-Token': accessToken,
              },
            });

            if (webhooksResponse.ok) {
              const webhooksData = await webhooksResponse.json();
              const webhooks = webhooksData.webhooks || [];
              const webhookBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.luneo.app';

              // Delete each webhook that belongs to this integration
              for (const webhook of webhooks) {
                if (webhook.address?.includes(webhookBaseUrl)) {
                  await fetch(`https://${shopDomain}/admin/api/2024-01/webhooks/${webhook.id}.json`, {
                    method: 'DELETE',
                    headers: {
                      'X-Shopify-Access-Token': accessToken,
                    },
                  });
                  logger.info('Shopify webhook deleted', { webhookId: webhook.id, integrationId });
                }
              }
            }
          }
        } catch (error: any) {
          logger.warn('Error deleting Shopify webhooks', { error, integrationId });
          // Don't throw - continue with deletion
        }
      }

      // 2. Delete product mappings
      await db.productMapping.deleteMany({
        where: { integrationId },
      });

      // 3. Delete sync logs
      await db.syncLog.deleteMany({
        where: { integrationId },
      });

      // 4. Delete webhook logs
      await db.webhookLog.deleteMany({
        where: { integrationId },
      });

      // 5. Delete integration
      await db.ecommerceIntegration.delete({
        where: { id: integrationId },
      });

      // Invalidate cache
      cacheService.delete(`integrations:${brandId}`);
      cacheService.delete(`integration:${integrationId}`);

      logger.info('Integration deleted successfully', { integrationId, platform: integration.platform });
    } catch (error: any) {
      logger.error('Error deleting integration', { error, integrationId });
      throw error;
    }
  }
}

// ========================================
// EXPORT
// ========================================

export const integrationService = IntegrationService.getInstance();

