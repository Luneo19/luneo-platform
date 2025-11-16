import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Prisma, EcommerceIntegration as PrismaEcommerceIntegration, ProductMapping as PrismaProductMapping, OrderStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import {
  WooCommerceProduct,
  WooCommerceOrder,
  EcommerceIntegration as EcommerceIntegrationModel,
  SyncResult,
  SyncOptions,
  SyncError,
  EcommerceConfig,
  WooCommerceLineItem,
} from '../../interfaces/ecommerce.interface';

interface WooWebhookCreatePayload {
  name: string;
  topic: string;
  delivery_url: string;
  secret: string;
}

interface WooWebhookResponse {
  id: number;
  topic: string;
  delivery_url: string;
  secret?: string;
  status?: string;
}

interface WooCommerceConfig extends EcommerceConfig {
  consumerKey: string;
  consumerSecret: string;
  apiVersion: string;
  webhookSecret: string;
}

type WooCommerceIntegration = Omit<EcommerceIntegrationModel, 'config'> & { config: WooCommerceConfig };

@Injectable()
export class WooCommerceConnector {
  private readonly logger = new Logger(WooCommerceConnector.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Connecte une boutique WooCommerce
   */
  async connect(
    brandId: string,
    siteUrl: string,
    consumerKey: string,
    consumerSecret: string,
  ): Promise<WooCommerceIntegration> {
    try {
      // Valider les credentials
      await this.validateCredentials(siteUrl, consumerKey, consumerSecret);

      const webhookSecret = this.generateWebhookSecret();

      // Créer l'intégration
      const integrationRecord = await this.prisma.ecommerceIntegration.create({
        data: {
          brandId,
          platform: 'woocommerce',
          shopDomain: siteUrl,
          config: {
            consumerKey: this.encryptToken(consumerKey),
            consumerSecret: this.encryptToken(consumerSecret),
            apiVersion: 'v3',
            webhookSecret,
          },
          status: 'active',
        },
      });

      // Configurer les webhooks
      await this.setupWebhooks(integrationRecord.id, siteUrl, consumerKey, consumerSecret, webhookSecret);

      this.logger.log(`WooCommerce integration created for brand ${brandId}`);
      return this.mapIntegration(integrationRecord);
    } catch (error) {
      this.logger.error(`Error connecting WooCommerce:`, error);
      throw error;
    }
  }

  /**
   * Valide les credentials WooCommerce
   */
  private async validateCredentials(
    siteUrl: string,
    consumerKey: string,
    consumerSecret: string,
  ): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${siteUrl}/wp-json/wc/v3/system_status`, {
          auth: {
            username: consumerKey,
            password: consumerSecret,
          },
        })
      );

      return response.status === 200;
    } catch (error) {
      this.logger.error(`Invalid WooCommerce credentials:`, error);
      throw new Error('Invalid WooCommerce credentials');
    }
  }

  /**
   * Configure les webhooks WooCommerce
   */
  private async setupWebhooks(
    integrationId: string,
    siteUrl: string,
    consumerKey: string,
    consumerSecret: string,
    webhookSecret: string,
  ): Promise<void> {
    const webhookUrl = `${this.configService.get<string>('app.url')}/api/ecommerce/woocommerce/webhook`;

    const topics = [
      { name: 'Product created', topic: 'product.created' },
      { name: 'Product updated', topic: 'product.updated' },
      { name: 'Product deleted', topic: 'product.deleted' },
      { name: 'Order created', topic: 'order.created' },
      { name: 'Order updated', topic: 'order.updated' },
    ];

    for (const { name, topic } of topics) {
      try {
        await this.createWebhook(siteUrl, consumerKey, consumerSecret, {
          name,
          topic,
          delivery_url: webhookUrl,
          secret: webhookSecret,
        });
        this.logger.log(`WooCommerce webhook created: ${topic}`);
      } catch (error) {
        this.logger.error(`Error creating webhook ${topic}:`, error);
      }
    }
  }

  /**
   * Crée un webhook WooCommerce
   */
  private async createWebhook(
    siteUrl: string,
    consumerKey: string,
    consumerSecret: string,
    webhookData: WooWebhookCreatePayload,
  ): Promise<WooWebhookResponse> {
    const response = await firstValueFrom(
      this.httpService.post(`${siteUrl}/wp-json/wc/v3/webhooks`, webhookData, {
        auth: {
          username: consumerKey,
          password: consumerSecret,
        },
      })
    );

    return response.data as WooWebhookResponse;
  }

  /**
   * Récupère les produits WooCommerce
   */
  async getProducts(
    integrationId: string,
    options?: { per_page?: number; page?: number; status?: string }
  ): Promise<WooCommerceProduct[]> {
    const integration = await this.getIntegration(integrationId);
    const { consumerKey, consumerSecret } = this.getCredentials(integration);

    try {
      const params = new URLSearchParams();
      params.append('per_page', (options?.per_page || 100).toString());
      params.append('page', (options?.page || 1).toString());
      if (options?.status) params.append('status', options.status);

      const response = await firstValueFrom(
        this.httpService.get(
          `${integration.shopDomain}/wp-json/wc/v3/products?${params}`,
          {
            auth: {
              username: consumerKey,
              password: consumerSecret,
            },
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching WooCommerce products:`, error);
      throw error;
    }
  }

  /**
   * Crée ou met à jour un produit WooCommerce
   */
  async upsertProduct(
    integrationId: string,
    productData: Partial<WooCommerceProduct>,
    externalProductId?: number,
  ): Promise<WooCommerceProduct> {
    const integration = await this.getIntegration(integrationId);
    const { consumerKey, consumerSecret } = this.getCredentials(integration);

    try {
      const url = externalProductId
        ? `${integration.shopDomain}/wp-json/wc/v3/products/${externalProductId}`
        : `${integration.shopDomain}/wp-json/wc/v3/products`;

      const method = externalProductId ? 'put' : 'post';

      const response = await firstValueFrom(
        this.httpService[method](url, productData, {
          auth: {
            username: consumerKey,
            password: consumerSecret,
          },
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error upserting WooCommerce product:`, error);
      throw error;
    }
  }

  /**
   * Récupère les commandes WooCommerce
   */
  async getOrders(
    integrationId: string,
    options?: { per_page?: number; page?: number; status?: string }
  ): Promise<WooCommerceOrder[]> {
    const integration = await this.getIntegration(integrationId);
    const { consumerKey, consumerSecret } = this.getCredentials(integration);

    try {
      const params = new URLSearchParams();
      params.append('per_page', (options?.per_page || 100).toString());
      params.append('page', (options?.page || 1).toString());
      if (options?.status) params.append('status', options.status);

      const response = await firstValueFrom(
        this.httpService.get(
          `${integration.shopDomain}/wp-json/wc/v3/orders?${params}`,
          {
            auth: {
              username: consumerKey,
              password: consumerSecret,
            },
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching WooCommerce orders:`, error);
      throw error;
    }
  }

  /**
   * Met à jour le statut d'une commande WooCommerce
   */
  async updateOrderStatus(
    integrationId: string,
    orderId: number,
    status: string,
  ): Promise<WooCommerceOrder> {
    const integration = await this.getIntegration(integrationId);
    const { consumerKey, consumerSecret } = this.getCredentials(integration);

    try {
      const response = await firstValueFrom(
        this.httpService.put(
          `${integration.shopDomain}/wp-json/wc/v3/orders/${orderId}`,
          { status },
          {
            auth: {
              username: consumerKey,
              password: consumerSecret,
            },
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error updating WooCommerce order status:`, error);
      throw error;
    }
  }

  /**
   * Traite un webhook WooCommerce
   */
  async handleWebhook(topic: string, payload: unknown, signature: string): Promise<void> {
    this.logger.log(`Handling WooCommerce webhook: ${topic}`);

    try {
      // Trouver l'intégration par le site URL
      const integrationRecord = await this.prisma.ecommerceIntegration.findFirst({
        where: {
          platform: 'woocommerce',
          status: 'active',
        },
      });

      if (!integrationRecord) {
        this.logger.warn(`No active WooCommerce integration found`);
        return;
      }

      const integration = this.mapIntegration(integrationRecord);

      // Valider la signature
      const isValid = this.validateWebhookSignature(
        JSON.stringify(payload),
        signature,
        integration.config.webhookSecret,
      );

      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      // Traiter selon le topic
      switch (topic) {
        case 'product.created':
        case 'product.updated':
          await this.handleProductWebhook(integration.id, this.ensureProductPayload(payload));
          break;

        case 'product.deleted':
          await this.handleProductDeleteWebhook(
            integration.id,
            this.ensureProductDeletePayload(payload),
          );
          break;

        case 'order.created':
        case 'order.updated':
          await this.handleOrderWebhook(
            integration.id,
            this.ensureOrderPayload(payload),
          );
          break;

        default:
          this.logger.warn(`Unhandled webhook topic: ${topic}`);
      }
    } catch (error) {
      this.logger.error(`Error handling WooCommerce webhook:`, error);
      throw error;
    }
  }

  /**
   * Valide la signature d'un webhook
   */
  private validateWebhookSignature(payload: string, signature: string, secret: string): boolean {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('base64');

    return hash === signature;
  }

  /**
   * Traite un webhook de produit
   */
  private async handleProductWebhook(integrationId: string, product: WooCommerceProduct): Promise<void> {
    const mapping = await this.prisma.productMapping.findFirst({
      where: {
        integrationId,
        externalProductId: product.id.toString(),
      },
    });

    if (mapping) {
      await this.updateLuneoProductFromWooCommerce(mapping.luneoProductId, product);
    } else {
      await this.createLuneoProductFromWooCommerce(integrationId, product);
    }
  }

  /**
   * Traite un webhook de suppression de produit
   */
  private async handleProductDeleteWebhook(
    integrationId: string,
    payload: Pick<WooCommerceProduct, 'id'>,
  ): Promise<void> {
    const mapping = await this.prisma.productMapping.findFirst({
      where: {
        integrationId,
        externalProductId: payload.id.toString(),
      },
    });

    if (mapping) {
      await this.prisma.product.update({
        where: { id: mapping.luneoProductId },
        data: { isActive: false },
      });
    }
  }

  /**
   * Traite un webhook de commande
   */
  private async handleOrderWebhook(integrationId: string, order: WooCommerceOrder): Promise<void> {
    const integration = await this.getIntegration(integrationId);

    for (const lineItem of order.line_items) {
      const mapping = await this.prisma.productMapping.findFirst({
        where: {
          integrationId,
          externalProductId: lineItem.product_id.toString(),
        },
      });

      if (mapping) {
        await this.createLuneoOrder(order, lineItem, mapping);
      }
    }
  }

  /**
   * Crée un produit LUNEO à partir de WooCommerce
   */
  private async createLuneoProductFromWooCommerce(
    integrationId: string,
    wooProduct: WooCommerceProduct,
  ): Promise<void> {
    const integration = await this.getIntegration(integrationId);

    const luneoProduct = await this.prisma.product.create({
      data: {
        brandId: integration.brandId,
        name: wooProduct.name,
        description: wooProduct.description,
        sku: wooProduct.sku,
        price: parseFloat(wooProduct.price || '0'),
        images: wooProduct.images.map(img => img.src),
        isActive: wooProduct.status === 'publish',
      },
    });

    await this.prisma.productMapping.create({
      data: {
        integrationId,
        luneoProductId: luneoProduct.id,
        externalProductId: wooProduct.id.toString(),
        externalSku: wooProduct.sku,
        syncStatus: 'synced' as const,
        lastSyncedAt: new Date(),
      },
    });

    this.logger.log(`Created LUNEO product from WooCommerce product ${wooProduct.id}`);
  }

  /**
   * Met à jour un produit LUNEO à partir de WooCommerce
   */
  private async updateLuneoProductFromWooCommerce(
    luneoProductId: string,
    wooProduct: WooCommerceProduct,
  ): Promise<void> {
    await this.prisma.product.update({
      where: { id: luneoProductId },
      data: {
        name: wooProduct.name,
        description: wooProduct.description,
        price: parseFloat(wooProduct.price || '0'),
        images: wooProduct.images.map(img => img.src),
        isActive: wooProduct.status === 'publish',
      },
    });

    this.logger.log(`Updated LUNEO product ${luneoProductId} from WooCommerce`);
  }

  /**
   * Crée une commande LUNEO à partir de WooCommerce
   */
  private async createLuneoOrder(
    wooOrder: WooCommerceOrder,
    lineItem: WooCommerceLineItem,
    mapping: PrismaProductMapping,
  ): Promise<void> {
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        userEmail: wooOrder.billing.email,
        // Recherche par email car metadata n'est pas dans OrderWhereInput
      },
    });

    if (existingOrder) return;

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
      this.logger.warn(`Product ${mapping.luneoProductId} not found while creating order`);
      return;
    }

    const designId = productRecord.designs[0]?.id;

    if (!designId) {
      this.logger.warn(
        `No design associated with product ${mapping.luneoProductId}; skipping order creation`,
      );
      return;
    }

    const customerName = `${wooOrder.billing.first_name} ${wooOrder.billing.last_name}`.trim();
    const subtotalCents = this.toCents(lineItem.total);
    const taxCents = this.toCents(wooOrder.total_tax);
    const totalCents = this.toCents(wooOrder.total);

    await this.prisma.order.create({
      data: {
        brandId: productRecord.brandId,
        productId: mapping.luneoProductId,
        designId,
        orderNumber: `WC-${wooOrder.id}`,
        customerEmail: wooOrder.billing.email,
        customerName: customerName || wooOrder.billing.email,
        subtotalCents,
        taxCents,
        totalCents,
        currency: wooOrder.currency,
        status: this.mapWooCommerceOrderStatus(wooOrder.status),
        shippingAddress: this.toJson(wooOrder.shipping),
        metadata: this.toJson({
          integrationId: mapping.integrationId,
          woocommerceOrderId: wooOrder.id,
          lineItemId: lineItem.id,
          customMeta: lineItem.meta_data || [],
        }),
      },
    });

    this.logger.log(`Created LUNEO order from WooCommerce order ${wooOrder.id}`);
  }

  /**
   * Mappe le statut de commande WooCommerce
   */
  private mapWooCommerceOrderStatus(status: string): OrderStatus {
    const statusMap: Record<string, OrderStatus> = {
      pending: OrderStatus.PENDING_PAYMENT,
      processing: OrderStatus.PROCESSING,
      'on-hold': OrderStatus.PENDING_PAYMENT,
      completed: OrderStatus.DELIVERED,
      cancelled: OrderStatus.CANCELLED,
      refunded: OrderStatus.REFUNDED,
      failed: OrderStatus.CANCELLED,
    };

    return statusMap[status] ?? OrderStatus.CREATED;
  }

  /**
   * Synchronise les produits
   */
  async syncProducts(integrationId: string, options?: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: SyncError[] = [];
    let itemsProcessed = 0;
    let itemsFailed = 0;

    try {
      this.logger.log(`Starting WooCommerce product sync for ${integrationId}`);

      const products = await this.getProducts(integrationId, { per_page: 100 });

      for (const product of products) {
        try {
          await this.handleProductWebhook(integrationId, product);
          itemsProcessed++;
        } catch (error) {
          errors.push({
            itemId: product.id.toString(),
            code: 'SYNC_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
          itemsFailed++;
        }
      }

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

      return {
        integrationId,
        platform: 'woocommerce',
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
    } catch (error) {
      this.logger.error(`WooCommerce product sync failed:`, error);
      throw error;
    }
  }

  /**
   * Récupère une intégration
   */
  private async getIntegration(integrationId: string): Promise<WooCommerceIntegration> {
    const integrationRecord = await this.prisma.ecommerceIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integrationRecord) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    return this.mapIntegration(integrationRecord);
  }

  /**
   * Récupère les credentials décryptés
   */
  private getCredentials(integration: WooCommerceIntegration): { consumerKey: string; consumerSecret: string } {
    return {
      consumerKey: this.decryptToken(integration.config.consumerKey),
      consumerSecret: this.decryptToken(integration.config.consumerSecret),
    };
  }

  private mapIntegration(record: PrismaEcommerceIntegration): WooCommerceIntegration {
    return {
      ...record,
      config: this.parseConfig(record.config),
    } as WooCommerceIntegration;
  }

  private parseConfig(config: Prisma.JsonValue): WooCommerceConfig {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new Error('WooCommerce configuration is invalid');
    }

    const parsed = config as Record<string, unknown>;

    const consumerKey = parsed.consumerKey;
    const consumerSecret = parsed.consumerSecret;
    const apiVersion = parsed.apiVersion;
    const webhookSecret = parsed.webhookSecret;
    const apiKey = typeof parsed.apiKey === 'string' ? parsed.apiKey : undefined;
    const apiSecret = typeof parsed.apiSecret === 'string' ? parsed.apiSecret : undefined;

    if (typeof consumerKey !== 'string' || typeof consumerSecret !== 'string' || typeof apiVersion !== 'string') {
      throw new Error('WooCommerce configuration missing credentials');
    }

    const scopes = Array.isArray(parsed.scopes) ? (parsed.scopes as string[]) : undefined;
    const features = Array.isArray(parsed.features) ? (parsed.features as string[]) : undefined;
    const customFields = isRecord(parsed.customFields)
      ? (parsed.customFields as Record<string, unknown>)
      : undefined;

    if (typeof webhookSecret !== 'string') {
      this.logger.warn('WooCommerce configuration missing webhook secret; validation may fail');
    }

    return {
      consumerKey,
      consumerSecret,
      apiVersion,
      webhookSecret: typeof webhookSecret === 'string' ? webhookSecret : '',
      apiKey,
      apiSecret,
      scopes,
      features,
      customFields,
    };
  }

  private ensureProductPayload(payload: unknown): WooCommerceProduct {
    if (!payload || typeof payload !== 'object' || !('id' in (payload as Record<string, unknown>))) {
      throw new Error('Invalid product payload received');
    }
    return payload as WooCommerceProduct;
  }

  private ensureProductDeletePayload(payload: unknown): Pick<WooCommerceProduct, 'id'> {
    if (!payload || typeof payload !== 'object' || typeof (payload as Record<string, unknown>).id !== 'number') {
      throw new Error('Invalid product deletion payload received');
    }
    return { id: (payload as Record<string, number>).id };
  }

  private ensureOrderPayload(payload: unknown): WooCommerceOrder {
    if (!payload || typeof payload !== 'object' || !('id' in (payload as Record<string, unknown>))) {
      throw new Error('Invalid order payload received');
    }
    return payload as WooCommerceOrder;
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? null)) as Prisma.InputJsonValue;
  }

  private toCents(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
  }

  /**
   * Génère un secret de webhook
   */
  private generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Crypte un token
   */
  private encryptToken(token: string): string {
    return Buffer.from(token).toString('base64');
  }

  /**
   * Décrypte un token
   */
  private decryptToken(encryptedToken: string): string {
    return Buffer.from(encryptedToken, 'base64').toString('utf8');
  }
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}


