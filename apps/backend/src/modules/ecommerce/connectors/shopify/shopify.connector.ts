import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Prisma, EcommerceIntegration as PrismaEcommerceIntegration, ProductMapping as PrismaProductMapping, OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import {
  ShopifyProduct,
  ShopifyOrder,
  ShopifyWebhook,
  ShopifyLineItem,
  EcommerceIntegration as EcommerceIntegrationModel,
  SyncResult,
  SyncOptions,
  SyncError,
  EcommerceConfig,
} from '../../interfaces/ecommerce.interface';

interface ShopifyConfig extends EcommerceConfig {
  apiVersion: string;
  webhookSecret?: string;
}

type ShopifyIntegration = Omit<EcommerceIntegrationModel, 'config'> & {
  config: ShopifyConfig;
};

@Injectable()
export class ShopifyConnector {
  private readonly logger = new Logger(ShopifyConnector.name);
  private readonly API_VERSION = '2024-10';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
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
      throw new Error('Failed to obtain access token from Shopify');
    }
  }

  /**
   * Sauvegarde l'intégration Shopify
   */
  async saveIntegration(
    brandId: string,
    shop: string,
    accessToken: string,
  ): Promise<ShopifyIntegration> {
    const webhookSecret = this.resolveWebhookSecret();

    const integrationRecord = await this.prisma.ecommerceIntegration.create({
      data: {
        brandId,
        platform: 'shopify',
        shopDomain: shop,
        accessToken: this.encryptToken(accessToken),
        config: {
          apiVersion: this.API_VERSION,
          scopes: ['read_products', 'write_products', 'read_orders', 'write_orders'],
          webhookSecret,
        },
        status: 'active',
      },
    });

    // Configurer les webhooks
    const integration = this.mapIntegration(integrationRecord);
    await this.setupWebhooks(integration, accessToken);

    this.logger.log(`Shopify integration saved for brand ${brandId}`);
    return integration;
  }

  /**
   * Configure les webhooks Shopify
   */
  async setupWebhooks(
    integration: ShopifyIntegration,
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
        await this.createWebhook(integration.shopDomain, accessToken, topic, webhookUrl);
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
    const accessToken = this.getAccessToken(integration);

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
    const accessToken = this.getAccessToken(integration);

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
    const accessToken = this.getAccessToken(integration);

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

      return response.data.orders;
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
    const accessToken = this.getAccessToken(integration);

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

      return response.data.order;
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
    payload: unknown,
  ): Promise<void> {
    this.logger.log(`Handling Shopify webhook: ${topic} for shop: ${shop}`);

    try {
      // Trouver l'intégration
      const integrationRecord = await this.prisma.ecommerceIntegration.findFirst({
        where: {
          platform: 'shopify',
          shopDomain: shop,
          status: 'active',
        },
      });

      if (!integrationRecord) {
        this.logger.warn(`No active integration found for shop: ${shop}`);
        return;
      }

      const integration = this.mapIntegration(integrationRecord);

      // Traiter selon le topic
      switch (topic) {
        case 'products/create':
        case 'products/update':
          await this.handleProductWebhook(integration.id, this.ensureProductPayload(payload));
          break;

        case 'products/delete':
          await this.handleProductDeleteWebhook(
            integration.id,
            this.ensureProductDeletePayload(payload),
          );
          break;

        case 'orders/create':
        case 'orders/updated':
        case 'orders/paid':
          await this.handleOrderWebhook(
            integration,
            this.ensureOrderPayload(payload),
          );
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
  private async handleProductDeleteWebhook(
    integrationId: string,
    payload: Pick<ShopifyProduct, 'id'>,
  ): Promise<void> {
    const mapping = await this.prisma.productMapping.findFirst({
      where: {
        integrationId,
        externalProductId: payload.id.toString(),
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
  private async handleOrderWebhook(integration: ShopifyIntegration, order: ShopifyOrder): Promise<void> {
    // Créer une commande LUNEO à partir de la commande Shopify
    for (const lineItem of order.line_items) {
      const mapping = await this.prisma.productMapping.findFirst({
        where: {
          integrationId: integration.id,
          externalProductId: lineItem.product_id.toString(),
        },
      });

      if (mapping) {
        // Créer la commande LUNEO
        await this.createLuneoOrder(integration, order, lineItem, mapping);
      }
    }
  }

  /**
   * Traite un webhook d'inventaire
   */
  private async handleInventoryWebhook(integrationId: string, payload: unknown): Promise<void> {
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
        description: shopifyProduct.body_html,
        sku: shopifyProduct.variants[0]?.sku || shopifyProduct.handle,
        price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
        images: shopifyProduct.images.map(img => img.src),
        isActive: shopifyProduct.status === 'active',
      },
    });

    // Créer le mapping
    await this.prisma.productMapping.create({
      data: {
        integrationId,
        luneoProductId: luneoProduct.id,
        externalProductId: shopifyProduct.id.toString(),
        externalSku: shopifyProduct.variants[0]?.sku || shopifyProduct.handle,
        syncStatus: 'synced' as const,
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
    integration: ShopifyIntegration,
    shopifyOrder: ShopifyOrder,
    lineItem: ShopifyLineItem,
    mapping: PrismaProductMapping,
  ): Promise<void> {

    // Vérifier si la commande existe déjà
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        orderNumber: `SH-${shopifyOrder.order_number}`,
      },
      select: { id: true },
    });

    if (existingOrder) {
      this.logger.log(`Order already exists for Shopify order ${shopifyOrder.id}`);
      return;
    }

    const productRecord = await this.prisma.product.findUnique({
      where: { id: mapping.luneoProductId },
      select: {
        brandId: true,
        designs: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!productRecord) {
      this.logger.warn(`Product ${mapping.luneoProductId} not found while creating Shopify order`);
      return;
    }

    const designId = productRecord.designs[0]?.id;

    if (!designId) {
      this.logger.warn(`No design linked to product ${mapping.luneoProductId}; skipping order creation`);
      return;
    }

    const customerName = `${shopifyOrder.customer?.first_name ?? ''} ${shopifyOrder.customer?.last_name ?? ''}`.trim();
    const subtotalCents = this.toCents(lineItem.price) * lineItem.quantity;
    const taxCents = this.toCents(shopifyOrder.total_tax);
    const totalCents = this.toCents(shopifyOrder.total_price);

    const shippingAddress = shopifyOrder.shipping_address
      ? this.toJson(shopifyOrder.shipping_address)
      : Prisma.JsonNull;

    await this.prisma.order.create({
      data: {
        brandId: productRecord.brandId,
        productId: mapping.luneoProductId,
        designId,
        orderNumber: `SH-${shopifyOrder.order_number}`,
        customerEmail: shopifyOrder.email,
        customerName: customerName || shopifyOrder.email,
        subtotalCents,
        taxCents,
        totalCents,
        currency: shopifyOrder.currency,
        status: this.mapShopifyOrderStatus(shopifyOrder.financial_status),
        paymentStatus: this.mapShopifyPaymentStatus(shopifyOrder.financial_status),
        shippingAddress,
        metadata: this.toJson({
          integrationId: integration.id,
          shopifyOrderId: shopifyOrder.id,
          shopifyOrderNumber: shopifyOrder.order_number,
          lineItemId: lineItem.id,
          customProperties: lineItem.properties || [],
        }),
      },
    });

    this.logger.log(`Created LUNEO order from Shopify order ${shopifyOrder.id}`);
  }

  /**
   * Mappe le statut de commande Shopify vers LUNEO
   */
  private mapShopifyOrderStatus(financialStatus: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      pending: OrderStatus.PENDING_PAYMENT,
      authorized: OrderStatus.PENDING_PAYMENT,
      paid: OrderStatus.PAID,
      partially_paid: OrderStatus.PENDING_PAYMENT,
      refunded: OrderStatus.REFUNDED,
      voided: OrderStatus.CANCELLED,
      partially_refunded: OrderStatus.PAID,
    };

    return statusMap[financialStatus] ?? OrderStatus.CREATED;
  }

  /**
   * Mappe le statut de paiement Shopify vers LUNEO
   */
  private mapShopifyPaymentStatus(financialStatus: string): PaymentStatus {
    const paymentMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      authorized: PaymentStatus.PENDING,
      paid: PaymentStatus.SUCCEEDED,
      partially_paid: PaymentStatus.PENDING,
      refunded: PaymentStatus.REFUNDED,
      voided: PaymentStatus.CANCELLED,
      partially_refunded: PaymentStatus.SUCCEEDED,
    };

    return paymentMap[financialStatus] ?? PaymentStatus.PENDING;
  }

  /**
   * Récupère une intégration
   */
  private async getIntegration(integrationId: string): Promise<ShopifyIntegration> {
    const integrationRecord = await this.prisma.ecommerceIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integrationRecord) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    return this.mapIntegration(integrationRecord);
  }

  /**
   * Crypte un token
   */
  private encryptToken(token: string): string {
    // En production, utiliser un vrai système de cryptage (AES-256)
    return Buffer.from(token).toString('base64');
  }

  /**
   * Décrypte un token
   */
  private decryptToken(encryptedToken: string): string {
    // En production, utiliser un vrai système de décryptage
    return Buffer.from(encryptedToken, 'base64').toString('utf8');
  }

  private getAccessToken(integration: ShopifyIntegration): string {
    if (!integration.accessToken) {
      throw new Error(`Shopify integration ${integration.id} has no access token`);
    }
    return this.decryptToken(integration.accessToken);
  }

  /**
   * Synchronise tous les produits
   */
  async syncProducts(
    integrationId: string,
    options?: SyncOptions,
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: SyncError[] = [];
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
            itemId: product.id.toString(),
            code: 'SYNC_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          itemsFailed++;
        }
      }

      // Sauvegarder le log de sync
      const syncStatus: SyncResult['status'] =
        itemsFailed === 0 ? 'success' : itemsProcessed === 0 ? 'failed' : 'partial';

      const syncLog = await this.prisma.syncLog.create({
        data: {
          integrationId,
          type: 'product',
          direction: 'import',
          status: syncStatus,
          itemsProcessed,
          itemsFailed,
          errors: this.toJson(errors),
          duration: Date.now() - startTime,
        },
      });

      const result: SyncResult = {
        integrationId,
        platform: 'shopify',
        type: 'product',
        direction: 'import',
        status: syncStatus,
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
        createdAt: syncLog.createdAt,
      };

      this.logger.log(`Product sync completed: ${itemsProcessed} processed, ${itemsFailed} failed`);

      return result;
    } catch (error) {
      this.logger.error(`Product sync failed:`, error);
      throw error;
    }
  }

  private mapIntegration(record: PrismaEcommerceIntegration): ShopifyIntegration {
    return {
      ...record,
      config: this.parseConfig(record.config),
    } as ShopifyIntegration;
  }

  private parseConfig(config: Prisma.JsonValue): ShopifyConfig {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Error('Shopify configuration is invalid');
    }

    const parsed = config as Record<string, unknown>;
    const apiVersion = parsed.apiVersion;
    const webhookSecret = parsed.webhookSecret;
    const scopes = Array.isArray(parsed.scopes) ? (parsed.scopes as string[]) : undefined;
    const features = Array.isArray(parsed.features) ? (parsed.features as string[]) : undefined;
    const customFields = isRecord(parsed.customFields)
      ? (parsed.customFields as Record<string, unknown>)
      : undefined;

    if (typeof apiVersion !== 'string') {
      throw new Error('Shopify configuration missing API version');
    }

    return {
      apiVersion,
      webhookSecret: typeof webhookSecret === 'string' ? webhookSecret : undefined,
      scopes,
      features,
      customFields,
    };
  }

  private ensureProductPayload(payload: unknown): ShopifyProduct {
    if (!payload || typeof payload !== 'object' || !('id' in payload)) {
      throw new Error('Invalid Shopify product payload');
    }
    return payload as ShopifyProduct;
  }

  private ensureProductDeletePayload(payload: unknown): Pick<ShopifyProduct, 'id'> {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid Shopify product delete payload');
    }

    const rawId = (payload as Record<string, unknown>).id;

    if (typeof rawId !== 'string' && typeof rawId !== 'number') {
      throw new Error('Invalid Shopify product delete payload');
    }

    return { id: String(rawId) };
  }

  private ensureOrderPayload(payload: unknown): ShopifyOrder {
    if (!payload || typeof payload !== 'object' || !('id' in payload)) {
      throw new Error('Invalid Shopify order payload');
    }
    return payload as ShopifyOrder;
  }

  private resolveWebhookSecret(): string {
    return (
      this.configService.get<string>('shopify.webhookSecret') ||
      this.configService.get<string>('shopify.apiSecret') ||
      ''
    );
  }

  private toCents(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  }
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

