import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { EncryptionService } from '@/libs/crypto/encryption.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import {
  WooCommerceProduct,
  WooCommerceOrder,
  WooCommerceLineItem,
  EcommerceIntegration,
  SyncResult,
  SyncOptions,
} from '../../interfaces/ecommerce.interface';
// ENUM-01: Import des enums Prisma pour intégrité des données
import { SyncLogStatus, SyncLogType, SyncDirection } from '@prisma/client';
import type { EcommerceIntegration as PrismaEcommerceIntegration } from '@prisma/client';

@Injectable()
export class WooCommerceConnector {
  private readonly logger = new Logger(WooCommerceConnector.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Connecte une boutique WooCommerce
   */
  async connect(
    brandId: string,
    siteUrl: string,
    consumerKey: string,
    consumerSecret: string,
  ): Promise<EcommerceIntegration> {
    try {
      // Valider les credentials
      await this.validateCredentials(siteUrl, consumerKey, consumerSecret);

      // Créer l'intégration
      const integration = await this.prisma.ecommerceIntegration.create({
        data: {
          brandId,
          platform: 'woocommerce',
          shopDomain: siteUrl,
          config: {
            consumerKey: this.encryptToken(consumerKey),
            consumerSecret: this.encryptToken(consumerSecret),
            apiVersion: 'v3',
          },
          status: 'active',
        },
      });

      // Configurer les webhooks
      await this.setupWebhooks(integration.id, siteUrl, consumerKey, consumerSecret);

      this.logger.log(`WooCommerce integration created for brand ${brandId}`);
      return integration as unknown as EcommerceIntegration;
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
      throw new BadRequestException('Invalid WooCommerce credentials');
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
  ): Promise<void> {
    const webhookUrl = `${this.configService.get('app.url')}/api/ecommerce/woocommerce/webhook`;

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
          secret: this.generateWebhookSecret(),
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
    webhookData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const response = await firstValueFrom(
      this.httpService.post(`${siteUrl}/wp-json/wc/v3/webhooks`, webhookData, {
        auth: {
          username: consumerKey,
          password: consumerSecret,
        },
      })
    );

    return response.data;
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
  async handleWebhook(topic: string, payload: Record<string, unknown>, signature: string): Promise<void> {
    this.logger.log(`Handling WooCommerce webhook: ${topic}`);

    try {
      // Trouver l'intégration par le site URL
      const integration = await this.prisma.ecommerceIntegration.findFirst({
        where: {
          platform: 'woocommerce',
          status: 'active',
        },
      });

      if (!integration) {
        this.logger.warn(`No active WooCommerce integration found`);
        return;
      }

      // Valider la signature
      const config = integration.config as Record<string, unknown>;
      const isValid = this.validateWebhookSignature(
        JSON.stringify(payload),
        signature,
        (config.webhookSecret as string) || ''
      );

      if (!isValid) {
        throw new BadRequestException('Invalid webhook signature');
      }

      // Traiter selon le topic
      switch (topic) {
        case 'product.created':
        case 'product.updated':
          await this.handleProductWebhook(integration.id, payload);
          break;

        case 'product.deleted':
          await this.handleProductDeleteWebhook(integration.id, payload);
          break;

        case 'order.created':
        case 'order.updated':
          await this.handleOrderWebhook(integration.id, payload);
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
  private async handleProductDeleteWebhook(integrationId: string, payload: Record<string, unknown>): Promise<void> {
    const id = (payload as { id?: number }).id;
    const mapping = await this.prisma.productMapping.findFirst({
      where: {
        integrationId,
        externalProductId: id != null ? String(id) : '',
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
        await this.createLuneoOrder(integration, order, lineItem, mapping);
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
        description: wooProduct.description ?? '',
        sku: wooProduct.sku ?? '',
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
        syncStatus: 'synced',
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
    integration: PrismaEcommerceIntegration,
    wooOrder: WooCommerceOrder,
    lineItem: WooCommerceLineItem,
    mapping: { luneoProductId: string },
  ): Promise<void> {
      const existingOrder = await this.prisma.order.findFirst({
        where: {
          userEmail: wooOrder.billing.email,
          // Recherche par email car metadata n'est pas dans OrderWhereInput
        },
      });

    if (existingOrder) return;

    await this.prisma.order.create({
      data: {
        brandId: integration.brandId,
        productId: mapping.luneoProductId,
        orderNumber: `WC-${wooOrder.id}`,
        customerEmail: wooOrder.billing.email,
        customerName: `${wooOrder.billing.first_name} ${wooOrder.billing.last_name}`,
        subtotalCents: Math.round(parseFloat(lineItem.total) * 100),
        taxCents: Math.round(parseFloat(wooOrder.total_tax || '0') * 100),
        totalCents: Math.round(parseFloat(wooOrder.total) * 100),
        currency: wooOrder.currency,
        status: this.mapWooCommerceOrderStatus(wooOrder.status) as import('@prisma/client').OrderStatus,
        shippingAddress: wooOrder.shipping as Record<string, unknown>,
        metadata: {
          woocommerceOrderId: wooOrder.id,
          lineItemId: lineItem.id,
          customMeta: lineItem.meta_data || [],
        },
      },
    });

    this.logger.log(`Created LUNEO order from WooCommerce order ${wooOrder.id}`);
  }

  /**
   * Mappe le statut de commande WooCommerce
   */
  private mapWooCommerceOrderStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'PENDING_PAYMENT',
      'processing': 'PROCESSING',
      'on-hold': 'PENDING_PAYMENT',
      'completed': 'DELIVERED',
      'cancelled': 'CANCELLED',
      'refunded': 'REFUNDED',
      'failed': 'CANCELLED',
    };

    return statusMap[status] || 'CREATED';
  }

  /**
   * Synchronise les produits
   */
  async syncProducts(integrationId: string, options?: SyncOptions): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: any[] = [];
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
            message: error.message,
          });
          itemsFailed++;
        }
      }

      // ENUM-01: Utilise enums Prisma pour intégrité des données
      const syncLog = await this.prisma.syncLog.create({
        data: {
          integrationId,
          type: SyncLogType.PRODUCT,
          direction: SyncDirection.IMPORT,
          status: itemsFailed === 0 ? SyncLogStatus.SUCCESS : SyncLogStatus.PARTIAL,
          itemsProcessed,
          itemsFailed,
          errors,
          duration: Date.now() - startTime,
        },
      });

      const statusMap: Record<import('@prisma/client').SyncLogStatus, 'success' | 'failed' | 'partial'> = {
        SUCCESS: 'success',
        FAILED: 'failed',
        PARTIAL: 'partial',
      };
      return {
        integrationId,
        platform: 'woocommerce',
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
    } catch (error) {
      this.logger.error(`WooCommerce product sync failed:`, error);
      throw error;
    }
  }

  /**
   * Récupère une intégration
   */
  private async getIntegration(integrationId: string): Promise<PrismaEcommerceIntegration> {
    const integration = await this.prisma.ecommerceIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new NotFoundException(`Integration ${integrationId} not found`);
    }

    return integration;
  }

  /**
   * Récupère les credentials décryptés
   */
  private getCredentials(integration: any): { consumerKey: string; consumerSecret: string } {
    return {
      consumerKey: this.decryptToken(integration.config.consumerKey),
      consumerSecret: this.decryptToken(integration.config.consumerSecret),
    };
  }

  /**
   * Génère un secret de webhook
   */
  private generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Chiffre un token avec AES-256-GCM
   * SEC-06: Chiffrement des credentials WooCommerce
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
      this.logger.warn('Decrypting legacy Base64 token - consider migrating');
      return Buffer.from(encryptedToken, 'base64').toString('utf8');
    }
  }
}


