import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { EncryptionService } from '@/libs/crypto/encryption.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import {
  ShopifyProduct,
  ShopifyOrder,
  ShopifyLineItem,
  ShopifyWebhook,
  EcommerceIntegration,
  ProductMapping,
  SyncResult,
  SyncOptions,
} from '../../interfaces/ecommerce.interface';
import { JsonValue } from '@/common/types/utility-types';
// ENUM-01: Import des enums Prisma pour intégrité des données
import { SyncLogStatus, SyncLogType, SyncDirection, OrderStatus, PaymentStatus } from '@prisma/client';
import type { EcommerceIntegration as PrismaEcommerceIntegration } from '@prisma/client';

interface ShopifyApiResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface ShopifyOrdersResponse {
  orders: ShopifyOrder[];
}

interface ShopifyOrderResponse {
  order: ShopifyOrder;
}

@Injectable()
export class ShopifyConnector {
  private readonly logger = new Logger(ShopifyConnector.name);
  private readonly API_VERSION = '2024-10';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Génère l'URL d'installation Shopify OAuth
   */
  generateInstallUrl(shop: string, brandId: string): string {
    const apiKey = this.configService.get('shopify.apiKey');
    const scopes = [
      'read_products',
      'write_products',
      'read_orders',
      'write_orders',
      'read_inventory',
      'write_inventory',
      'read_customers',
    ].join(',');

    const redirectUri = `${this.configService.get('app.url')}/api/ecommerce/shopify/callback`;
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Sauvegarder le nonce pour validation
    this.cache.setSimple(`shopify_nonce:${shop}`, nonce, 600); // 10 minutes

    const installUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${apiKey}&` +
      `scope=${scopes}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${nonce}&` +
      `grant_options[]=per-user`;

    return installUrl;
  }

  /**
   * Échange le code OAuth contre un access token
   */
  async exchangeCodeForToken(shop: string, code: string): Promise<string> {
    const apiKey = this.configService.get('shopify.apiKey');
    const apiSecret = this.configService.get('shopify.apiSecret');

    try {
      const response = await firstValueFrom(
        this.httpService.post(`https://${shop}/admin/oauth/access_token`, {
          client_id: apiKey,
          client_secret: apiSecret,
          code,
        })
      );

      return response.data.access_token;
    } catch (error) {
      this.logger.error(`Error exchanging code for token:`, error);
      throw new InternalServerErrorException('Failed to obtain access token from Shopify');
    }
  }

  /**
   * Sauvegarde l'intégration Shopify
   */
  async saveIntegration(
    brandId: string,
    shop: string,
    accessToken: string,
  ): Promise<EcommerceIntegration> {
    const integration = await this.prisma.ecommerceIntegration.create({
      data: {
        brandId,
        platform: 'shopify',
        shopDomain: shop,
        accessToken: this.encryptToken(accessToken),
        config: {
          apiVersion: this.API_VERSION,
          scopes: ['read_products', 'write_products', 'read_orders', 'write_orders'],
        },
        status: 'active',
      },
    });

    // Configurer les webhooks
    await this.setupWebhooks(integration.id, shop, accessToken);

    this.logger.log(`Shopify integration saved for brand ${brandId}`);
    return integration as unknown as EcommerceIntegration;
  }

  /**
   * Configure les webhooks Shopify
   */
  async setupWebhooks(
    integrationId: string,
    shop: string,
    accessToken: string,
  ): Promise<void> {
    const webhookUrl = `${this.configService.get('app.url')}/api/ecommerce/shopify/webhook`;
    
    const topics = [
      'products/create',
      'products/update',
      'products/delete',
      'orders/create',
      'orders/updated',
      'orders/paid',
      'inventory_levels/update',
    ];

    for (const topic of topics) {
      try {
        await this.createWebhook(shop, accessToken, topic, webhookUrl);
        this.logger.log(`Webhook created for topic: ${topic}`);
      } catch (error) {
        this.logger.error(`Error creating webhook for ${topic}:`, error);
      }
    }
  }

  /**
   * Crée un webhook Shopify
   */
  private async createWebhook(
    shop: string,
    accessToken: string,
    topic: string,
    address: string,
  ): Promise<ShopifyWebhook> {
    const response = await firstValueFrom(
      this.httpService.post(
        `https://${shop}/admin/api/${this.API_VERSION}/webhooks.json`,
        {
          webhook: {
            topic,
            address,
            format: 'json',
          },
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      )
    );

    return response.data.webhook;
  }

  /**
   * Récupère les produits Shopify
   */
  async getProducts(
    integrationId: string,
    options?: { limit?: number; since_id?: string; status?: string }
  ): Promise<ShopifyProduct[]> {
    const integration = await this.getIntegration(integrationId);
    const accessToken = this.decryptToken(integration.accessToken);

    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.since_id) params.append('since_id', options.since_id);
      if (options?.status) params.append('status', options.status);

      const response = await firstValueFrom(
        this.httpService.get(
          `https://${integration.shopDomain}/admin/api/${this.API_VERSION}/products.json?${params}`,
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
            },
          }
        )
      );

      return response.data.products;
    } catch (error) {
      this.logger.error(`Error fetching Shopify products:`, error);
      throw error;
    }
  }

  /**
   * Crée ou met à jour un produit Shopify
   */
  async upsertProduct(
    integrationId: string,
    productData: Partial<ShopifyProduct>,
    externalProductId?: string,
  ): Promise<ShopifyProduct> {
    const integration = await this.getIntegration(integrationId);
    const accessToken = this.decryptToken(integration.accessToken);

    try {
      const url = externalProductId
        ? `https://${integration.shopDomain}/admin/api/${this.API_VERSION}/products/${externalProductId}.json`
        : `https://${integration.shopDomain}/admin/api/${this.API_VERSION}/products.json`;

      const method = externalProductId ? 'put' : 'post';

      const response = await firstValueFrom(
        this.httpService[method](
          url,
          { product: productData },
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      return response.data.product;
    } catch (error) {
      this.logger.error(`Error upserting Shopify product:`, error);
      throw error;
    }
  }

  /**
   * Récupère les commandes Shopify
   */
  async getOrders(
    integrationId: string,
    options?: { limit?: number; status?: string; created_at_min?: string }
  ): Promise<ShopifyOrder[]> {
    const integration = await this.getIntegration(integrationId);
    const accessToken = this.decryptToken(integration.accessToken);

    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.status) params.append('status', options.status);
      if (options?.created_at_min) params.append('created_at_min', options.created_at_min);

      const response = await firstValueFrom(
        this.httpService.get(
          `https://${integration.shopDomain}/admin/api/${this.API_VERSION}/orders.json?${params}`,
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
            },
          }
        )
      );

      const apiResponse = response.data as ShopifyApiResponse<ShopifyOrdersResponse>;
      return apiResponse?.data?.orders || [];
    } catch (error) {
      this.logger.error(`Error fetching Shopify orders:`, error);
      throw error;
    }
  }

  /**
   * Met à jour le statut d'une commande Shopify
   */
  async updateOrderStatus(
    integrationId: string,
    orderId: string,
    status: string,
  ): Promise<ShopifyOrder> {
    const integration = await this.getIntegration(integrationId);
    const accessToken = this.decryptToken(integration.accessToken);

    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `https://${integration.shopDomain}/admin/api/${this.API_VERSION}/orders/${orderId}.json`,
          {
            order: {
              id: orderId,
              tags: `luneo_status:${status}`,
            },
          },
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
          }
        )
      );

      const apiResponse = response.data as ShopifyApiResponse<ShopifyOrderResponse>;
      const order = apiResponse?.data?.order;
      if (!order) {
        throw new InternalServerErrorException('Shopify API did not return order');
      }
      return order;
    } catch (error) {
      this.logger.error(`Error updating Shopify order status:`, error);
      throw error;
    }
  }

  /**
   * Valide un webhook Shopify
   */
  validateWebhook(payload: string, hmacHeader: string, secret: string): boolean {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('base64');

    return hash === hmacHeader;
  }

  /**
   * Traite un webhook Shopify
   */
  async handleWebhook(
    topic: string,
    shop: string,
    payload: Record<string, JsonValue>,
  ): Promise<void> {
    this.logger.log(`Handling Shopify webhook: ${topic} for shop: ${shop}`);

    try {
      // Trouver l'intégration
      const integration = await this.prisma.ecommerceIntegration.findFirst({
        where: {
          platform: 'shopify',
          shopDomain: shop,
          status: 'active',
        },
      });

      if (!integration) {
        this.logger.warn(`No active integration found for shop: ${shop}`);
        return;
      }

      // Traiter selon le topic
      switch (topic) {
        case 'products/create':
        case 'products/update':
          await this.handleProductWebhook(integration.id, payload as unknown as ShopifyProduct);
          break;

        case 'products/delete':
          await this.handleProductDeleteWebhook(integration.id, payload);
          break;

        case 'orders/create':
        case 'orders/updated':
        case 'orders/paid':
          await this.handleOrderWebhook(integration.id, payload as unknown as ShopifyOrder);
          break;

        case 'inventory_levels/update':
          await this.handleInventoryWebhook(integration.id, payload);
          break;

        default:
          this.logger.warn(`Unhandled webhook topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error handling webhook for ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Traite un webhook de produit
   */
  private async handleProductWebhook(integrationId: string, product: ShopifyProduct): Promise<void> {
    // Vérifier si le produit existe déjà dans le mapping
    const mapping = await this.prisma.productMapping.findFirst({
      where: {
        integrationId,
        externalProductId: product.id.toString(),
      },
    });

    if (mapping) {
      // Mettre à jour le produit existant
      await this.updateLuneoProductFromShopify(mapping.luneoProductId, product);
    } else {
      // Créer un nouveau produit
      await this.createLuneoProductFromShopify(integrationId, product);
    }
  }

  /**
   * Traite un webhook de suppression de produit
   */
  private async handleProductDeleteWebhook(integrationId: string, payload: Record<string, JsonValue>): Promise<void> {
    const mapping = await this.prisma.productMapping.findFirst({
      where: {
        integrationId,
        externalProductId: (payload.id ?? '').toString(),
      },
    });

    if (mapping) {
      // Désactiver le produit au lieu de le supprimer
      await this.prisma.product.update({
        where: { id: mapping.luneoProductId },
        data: { isActive: false },
      });
    }
  }

  /**
   * Traite un webhook de commande
   */
  private async handleOrderWebhook(integrationId: string, order: ShopifyOrder): Promise<void> {
    // Créer une commande LUNEO à partir de la commande Shopify
    for (const lineItem of order.line_items) {
      const mapping = await this.prisma.productMapping.findFirst({
        where: {
          integrationId,
          externalProductId: lineItem.product_id.toString(),
        },
      });

      if (mapping) {
        // Créer la commande LUNEO
        await this.createLuneoOrder(integrationId, order, lineItem, mapping as unknown as ProductMapping);
      }
    }
  }

  /**
   * Traite un webhook d'inventaire
   */
  private async handleInventoryWebhook(integrationId: string, payload: Record<string, unknown>): Promise<void> {
    // Mettre à jour l'inventaire dans LUNEO
    this.logger.log(`Inventory update received: ${JSON.stringify(payload)}`);
  }

  /**
   * Crée un produit LUNEO à partir d'un produit Shopify
   */
  private async createLuneoProductFromShopify(
    integrationId: string,
    shopifyProduct: ShopifyProduct,
  ): Promise<void> {
    const integration = await this.getIntegration(integrationId);

    // Créer le produit LUNEO
    const luneoProduct = await this.prisma.product.create({
      data: {
        brandId: integration.brandId,
        name: shopifyProduct.title,
        description: shopifyProduct.body_html ?? '',
        sku: shopifyProduct.variants[0]?.sku || shopifyProduct.handle,
        price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
        images: shopifyProduct.images.map(img => img.src),
        isActive: shopifyProduct.status === 'active',
      } as unknown as import('@prisma/client').Prisma.ProductCreateInput,
    });

    // Créer le mapping
    await this.prisma.productMapping.create({
      data: {
        integrationId,
        luneoProductId: luneoProduct.id,
        externalProductId: shopifyProduct.id.toString(),
        externalSku: shopifyProduct.variants[0]?.sku || shopifyProduct.handle,
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
      },
    });

    this.logger.log(`Created LUNEO product ${luneoProduct.id} from Shopify product ${shopifyProduct.id}`);
  }

  /**
   * Met à jour un produit LUNEO à partir d'un produit Shopify
   */
  private async updateLuneoProductFromShopify(
    luneoProductId: string,
    shopifyProduct: ShopifyProduct,
  ): Promise<void> {
    await this.prisma.product.update({
      where: { id: luneoProductId },
      data: {
        name: shopifyProduct.title,
        description: shopifyProduct.body_html,
        price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
        images: shopifyProduct.images.map(img => img.src),
        isActive: shopifyProduct.status === 'active',
      },
    });

    this.logger.log(`Updated LUNEO product ${luneoProductId} from Shopify product ${shopifyProduct.id}`);
  }

  /**
   * Crée une commande LUNEO à partir d'une commande Shopify
   */
  private async createLuneoOrder(
    integrationId: string,
    shopifyOrder: ShopifyOrder,
    lineItem: ShopifyLineItem,
    mapping: ProductMapping,
  ): Promise<void> {
    const integration = await this.getIntegration(integrationId);

    // Vérifier si la commande existe déjà
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        userEmail: shopifyOrder.email,
      },
    });

    if (existingOrder) {
      this.logger.log(`Order already exists for Shopify order ${shopifyOrder.id}`);
      return;
    }

    // Créer la commande LUNEO
    await this.prisma.order.create({
      data: {
        brandId: integration.brandId,
        productId: mapping.luneoProductId,
        orderNumber: `SH-${shopifyOrder.order_number}`,
        customerEmail: shopifyOrder.email,
        customerName: `${shopifyOrder.customer?.first_name ?? ''} ${shopifyOrder.customer?.last_name ?? ''}`.trim(),
        subtotalCents: Math.round(parseFloat(lineItem.price) * lineItem.quantity * 100),
        taxCents: Math.round(parseFloat(shopifyOrder.total_tax || '0') * 100),
        totalCents: Math.round(parseFloat(shopifyOrder.total_price) * 100),
        currency: shopifyOrder.currency,
        status: this.mapShopifyOrderStatus(shopifyOrder.financial_status) as OrderStatus,
        paymentStatus: this.mapShopifyPaymentStatus(shopifyOrder.financial_status) as PaymentStatus,
        shippingAddress: shopifyOrder.shipping_address as unknown as import('@prisma/client').Prisma.InputJsonValue,
        metadata: {
          shopifyOrderId: shopifyOrder.id,
          shopifyOrderNumber: shopifyOrder.order_number,
          lineItemId: lineItem.id,
          customProperties: lineItem.properties || [],
        },
      },
    });

    this.logger.log(`Created LUNEO order from Shopify order ${shopifyOrder.id}`);
  }

  /**
   * Mappe le statut de commande Shopify vers LUNEO
   */
  private mapShopifyOrderStatus(financialStatus: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'PENDING_PAYMENT',
      'authorized': 'PENDING_PAYMENT',
      'paid': 'PAID',
      'partially_paid': 'PENDING_PAYMENT',
      'refunded': 'REFUNDED',
      'voided': 'CANCELLED',
      'partially_refunded': 'PAID',
    };

    return statusMap[financialStatus] || 'CREATED';
  }

  /**
   * Mappe le statut de paiement Shopify vers LUNEO
   */
  private mapShopifyPaymentStatus(financialStatus: string): string {
    const paymentMap: Record<string, string> = {
      'pending': 'PENDING',
      'authorized': 'PENDING',
      'paid': 'SUCCEEDED',
      'partially_paid': 'PENDING',
      'refunded': 'REFUNDED',
      'voided': 'CANCELLED',
      'partially_refunded': 'SUCCEEDED',
    };

    return paymentMap[financialStatus] || 'PENDING';
  }

  /**
   * Récupère une intégration (avec accessToken requis)
   */
  private async getIntegration(integrationId: string): Promise<Omit<PrismaEcommerceIntegration, 'accessToken'> & { accessToken: string }> {
    const integration = await this.prisma.ecommerceIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException(`Integration ${integrationId} not found`);
    }
    if (!integration.accessToken) {
      throw new NotFoundException(`Integration ${integrationId} has no access token`);
    }
    return { ...integration, accessToken: integration.accessToken };
  }

  /**
   * Chiffre un token avec AES-256-GCM
   * SEC-06: Chiffrement des credentials Shopify
   */
  private encryptToken(token: string): string {
    return this.encryptionService.encrypt(token);
  }

  /**
   * Déchiffre un token avec AES-256-GCM
   * Supporte la migration depuis Base64 pour les données existantes
   */
  private decryptToken(encryptedToken: string): string {
    try {
      // Essayer d'abord le nouveau format AES-256-GCM
      return this.encryptionService.decrypt(encryptedToken);
    } catch {
      // Fallback vers Base64 pour les données existantes
      this.logger.warn('Decrypting legacy Base64 token - consider migrating to AES-256-GCM');
      return Buffer.from(encryptedToken, 'base64').toString('utf8');
    }
  }

  /**
   * Synchronise tous les produits
   */
  async syncProducts(
    integrationId: string,
    options?: SyncOptions,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: Array<{ itemId: string; code: string; message: string }> = [];
    let itemsProcessed = 0;
    let itemsFailed = 0;

    try {
      this.logger.log(`Starting product sync for integration ${integrationId}`);

      // Récupérer tous les produits Shopify
      const shopifyProducts = await this.getProducts(integrationId, { limit: 250 });

      // Traiter chaque produit
      for (const product of shopifyProducts) {
        try {
          await this.handleProductWebhook(integrationId, product);
          itemsProcessed++;
        } catch (error) {
          this.logger.error(`Error syncing product ${product.id}:`, error);
          errors.push({
            itemId: product.id,
            code: 'SYNC_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          itemsFailed++;
        }
      }

      // Sauvegarder le log de sync - ENUM-01: Utilise enums Prisma
      const syncLog = await this.prisma.syncLog.create({
        data: {
          integrationId,
          type: SyncLogType.PRODUCT,
          direction: SyncDirection.IMPORT,
          status: itemsFailed === 0 ? SyncLogStatus.SUCCESS : itemsFailed < itemsProcessed ? SyncLogStatus.PARTIAL : SyncLogStatus.FAILED,
          itemsProcessed,
          itemsFailed,
          errors,
          duration: Date.now() - startTime,
        },
      });

      const statusMap: Record<SyncLogStatus, 'success' | 'failed' | 'partial'> = {
        [SyncLogStatus.SUCCESS]: 'success',
        [SyncLogStatus.FAILED]: 'failed',
        [SyncLogStatus.PARTIAL]: 'partial',
      };
      const result: SyncResult = {
        integrationId,
        platform: 'shopify',
        type: 'product',
        direction: 'import',
        status: statusMap[syncLog.status],
        itemsProcessed,
        itemsFailed,
        duration: Date.now() - startTime,
        errors,
        summary: {
          created: itemsProcessed - itemsFailed,
          updated: 0,
          deleted: 0,
          skipped: itemsFailed,
        },
        createdAt: new Date(),
      };

      this.logger.log(`Product sync completed: ${itemsProcessed} processed, ${itemsFailed} failed`);

      return result;
    } catch (error) {
      this.logger.error(`Product sync failed:`, error);
      throw error;
    }
  }
}


