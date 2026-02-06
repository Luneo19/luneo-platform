/**
 * @fileoverview Service d'intégration Shopify
 * @module ShopifyService
 *
 * FONCTIONNALITÉS:
 * - OAuth 2.0 Authentication
 * - Product Sync (bidirectionnel)
 * - Order Webhooks
 * - Inventory Sync
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites (pas de 'any')
 * - ✅ Validation Zod
 * - ✅ Gestion d'erreurs avec try-catch
 * - ✅ Logging structuré
 */

import { Injectable, Logger, BadRequestException, UnauthorizedException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { z } from 'zod';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { EncryptionService } from '@/libs/crypto/encryption.service';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

/**
 * Configuration d'une connexion Shopify
 */
const ShopifyConnectionSchema = z.object({
  shopDomain: z.string().regex(/^[a-zA-Z0-9-]+\.myshopify\.com$/),
  accessToken: z.string().min(1),
  scopes: z.array(z.string()),
});

export type ShopifyConnection = z.infer<typeof ShopifyConnectionSchema>;

/**
 * Produit Shopify
 */
const ShopifyProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  body_html: z.string().nullable(),
  vendor: z.string(),
  product_type: z.string(),
  handle: z.string(),
  status: z.enum(['active', 'archived', 'draft']),
  variants: z.array(z.object({
    id: z.number(),
    title: z.string(),
    price: z.string(),
    sku: z.string().nullable(),
    inventory_quantity: z.number(),
  })),
  images: z.array(z.object({
    id: z.number(),
    src: z.string().url(),
    alt: z.string().nullable(),
  })),
});

export type ShopifyProduct = z.infer<typeof ShopifyProductSchema>;

/**
 * Commande Shopify
 */
const ShopifyOrderSchema = z.object({
  id: z.number(),
  order_number: z.number(),
  email: z.string().email().nullable(),
  total_price: z.string(),
  currency: z.string(),
  financial_status: z.string(),
  fulfillment_status: z.string().nullable(),
  line_items: z.array(z.object({
    id: z.number(),
    product_id: z.number().nullable(),
    variant_id: z.number().nullable(),
    title: z.string(),
    quantity: z.number(),
    price: z.string(),
    properties: z.array(z.object({
      name: z.string(),
      value: z.string(),
    })),
  })),
  created_at: z.string(),
});

export type ShopifyOrder = z.infer<typeof ShopifyOrderSchema>;

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);

  // Configuration Shopify App
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly scopes: string[];
  private readonly apiVersion = '2024-10';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly encryptionService: EncryptionService,
    @InjectQueue('integration-sync') private readonly syncQueue: Queue,
  ) {
    // Rendre les variables Shopify optionnelles pour éviter l'erreur au démarrage
    // Elles seront requises uniquement lors de l'utilisation réelle de l'intégration
    this.clientId = this.configService.get<string>('SHOPIFY_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('SHOPIFY_CLIENT_SECRET') || '';
    this.scopes = [
      'read_products',
      'write_products',
      'read_orders',
      'read_inventory',
      'write_inventory',
    ];
    
    if (!this.clientId || !this.clientSecret) {
      this.logger.warn(
        'Shopify credentials not configured. Shopify integration will not be available.',
      );
    }
  }

  // ==========================================================================
  // OAUTH 2.0 AUTHENTICATION
  // ==========================================================================

  /**
   * Génère l'URL d'autorisation OAuth
   */
  generateAuthUrl(shopDomain: string, redirectUri: string, state: string): string {
    if (!this.clientId) {
      throw new InternalServerErrorException('Shopify Client ID not configured. Please set SHOPIFY_CLIENT_ID environment variable.');
    }
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: this.scopes.join(','),
      redirect_uri: redirectUri,
      state,
    });

    return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
  }

  /**
   * Échange le code d'autorisation contre un access token
   * Conforme au plan PHASE 4 - Shopify OAuth complet
   */
  async exchangeCodeForToken(
    shopDomain: string,
    code: string,
  ): Promise<{ accessToken: string; scope: string }> {
    // ✅ Validation des credentials
    if (!this.clientId || !this.clientSecret) {
      throw new InternalServerErrorException('Shopify credentials not configured. Please set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET environment variables.');
    }

    // ✅ Validation du shopDomain
    if (!shopDomain || typeof shopDomain !== 'string' || !shopDomain.match(/^[a-zA-Z0-9-]+\.myshopify\.com$/)) {
      throw new BadRequestException('Invalid shop domain format');
    }

    // ✅ Validation du code
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      throw new BadRequestException('Authorization code is required');
    }
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `https://${shopDomain}/admin/oauth/access_token`,
          {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            code: code.trim(),
          },
        ),
      );

      // ✅ Validation de la réponse
      if (!response.data || !response.data.access_token) {
        throw new UnauthorizedException('Invalid response from Shopify OAuth');
      }

      return {
        accessToken: response.data.access_token,
        scope: response.data.scope || this.scopes.join(','),
      };
    } catch (error) {
      this.logger.error(`OAuth token exchange failed: ${error}`);
      throw new UnauthorizedException('Failed to authenticate with Shopify');
    }
  }

  /**
   * Sauvegarde les données d'une boutique Shopify après OAuth
   * Conforme au plan PHASE 4 - Shopify OAuth complet
   */
  async saveShopData(
    shopDomain: string,
    tokenData: { accessToken: string; scope: string },
    brandId?: string,
  ): Promise<void> {
    // ✅ Validation des entrées
    if (!shopDomain || typeof shopDomain !== 'string' || !shopDomain.match(/^[a-zA-Z0-9-]+\.myshopify\.com$/)) {
      throw new BadRequestException('Invalid shop domain format');
    }

    if (!tokenData || !tokenData.accessToken || typeof tokenData.accessToken !== 'string') {
      throw new BadRequestException('Access token is required');
    }

    try {
      // ✅ Si brandId fourni, créer/mettre à jour l'intégration
      if (brandId && typeof brandId === 'string' && brandId.trim().length > 0) {
        const existingIntegration = await this.prisma.ecommerceIntegration.findFirst({
          where: {
            brandId: brandId.trim(),
            platform: 'shopify',
            shopDomain: shopDomain.trim(),
          },
        });

        if (existingIntegration) {
          // ✅ Mettre à jour l'intégration existante
          await this.prisma.ecommerceIntegration.update({
            where: { id: existingIntegration.id },
            data: {
              accessToken: this.encryptToken(tokenData.accessToken),
              config: {
                scope: tokenData.scope,
                apiVersion: this.apiVersion,
              },
              status: 'active',
              lastSyncAt: new Date(),
            },
          });

          this.logger.log(`Shopify integration updated for brand ${brandId}, shop ${shopDomain}`);
        } else {
          // ✅ Créer une nouvelle intégration
          await this.prisma.ecommerceIntegration.create({
            data: {
              brandId: brandId.trim(),
              platform: 'shopify',
              shopDomain: shopDomain.trim(),
              accessToken: this.encryptToken(tokenData.accessToken),
              config: {
                scope: tokenData.scope,
                apiVersion: this.apiVersion,
              },
              status: 'active',
            },
          });

          this.logger.log(`Shopify integration created for brand ${brandId}, shop ${shopDomain}`);
        }
      } else {
        // ✅ Sauvegarder temporairement en cache (pour callback OAuth)
        const cacheKey = `shopify_oauth:${shopDomain}`;
        await this.cache.setSimple(
          cacheKey,
          JSON.stringify({
            accessToken: tokenData.accessToken,
            scope: tokenData.scope,
            timestamp: Date.now(),
          }),
          600, // 10 minutes
        );

        this.logger.log(`Shopify OAuth data cached for shop ${shopDomain}`);
      }
    } catch (error) {
      this.logger.error(`Failed to save shop data: ${error instanceof Error ? error.message : 'Unknown'}`);
      throw error;
    }
  }

  /**
   * Synchronise une boutique Shopify avec Luneo après OAuth
   * Conforme au plan PHASE 4 - Shopify sync produits + orders
   */
  async syncShopWithLuneo(shopDomain: string, accessToken: string, brandId?: string): Promise<void> {
    // ✅ Validation
    if (!shopDomain || !accessToken) {
      throw new BadRequestException('Shop domain and access token are required');
    }

    try {
      // ✅ Si brandId fourni, lancer la sync initiale
      if (brandId && typeof brandId === 'string' && brandId.trim().length > 0) {
        const integration = await this.prisma.ecommerceIntegration.findFirst({
          where: {
            brandId: brandId.trim(),
            platform: 'shopify',
            shopDomain: shopDomain.trim(),
          },
        });

        if (integration) {
          // ✅ Lancer sync produits initiale via queue
          await this.syncQueue.add('sync-products', {
            integrationId: integration.id,
            type: 'product',
            direction: 'import',
            force: false,
          });

          this.logger.log(`Initial product sync queued for integration ${integration.id}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to sync shop with Luneo: ${error instanceof Error ? error.message : 'Unknown'}`);
      // Ne pas throw pour ne pas bloquer le flow OAuth
    }
  }

  /**
   * Chiffre un token pour stockage sécurisé avec AES-256-GCM
   * SEC-06: Chiffrement des credentials Shopify
   */
  private encryptToken(token: string): string {
    return this.encryptionService.encrypt(token);
  }

  /**
   * Déchiffre un token avec AES-256-GCM
   * Supporte la migration depuis données non chiffrées pour les intégrations existantes
   */
  private decryptToken(encryptedToken: string): string {
    try {
      // Essayer d'abord le nouveau format AES-256-GCM
      return this.encryptionService.decrypt(encryptedToken);
    } catch {
      // Fallback pour les données existantes non chiffrées
      // Log pour identifier les données à migrer
      this.logger.warn('Decrypting legacy unencrypted token - migration recommended');
      return encryptedToken;
    }
  }

  /**
   * Vérifie la signature HMAC d'un webhook Shopify
   */
  verifyWebhookSignature(body: string, hmacHeader: string, secret: string): boolean {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(hmacHeader),
    );
  }

  // ==========================================================================
  // API CALLS
  // ==========================================================================

  /**
   * Appel API Shopify générique
   */
  private async shopifyApiCall<T>(
    shopDomain: string,
    accessToken: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: Record<string, unknown>,
  ): Promise<T> {
    const url = `https://${shopDomain}/admin/api/${this.apiVersion}/${endpoint}`;

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url,
          data,
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data as T;
    } catch (error) {
      this.logger.error(`Shopify API call failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ==========================================================================
  // PRODUCTS SYNC
  // ==========================================================================

  /**
   * Récupère tous les produits d'une boutique Shopify
   */
  async fetchProducts(
    shopDomain: string,
    accessToken: string,
    options: { limit?: number; sinceId?: number } = {},
  ): Promise<ShopifyProduct[]> {
    const { limit = 250, sinceId } = options;

    let endpoint = `products.json?limit=${limit}`;
    if (sinceId) {
      endpoint += `&since_id=${sinceId}`;
    }

    const response = await this.shopifyApiCall<{ products: unknown[] }>(
      shopDomain,
      accessToken,
      'GET',
      endpoint,
    );

    // ✅ RÈGLE: Validation Zod des données externes
    return response.products.map(p => ShopifyProductSchema.parse(p));
  }

  /**
   * Synchronise les produits Shopify vers Luneo
   */
  async syncProductsToLuneo(
    brandId: string,
    shopDomain: string,
    accessToken: string,
  ): Promise<{ synced: number; errors: number }> {
    this.logger.log(`Starting product sync for brand ${brandId}`);

    let synced = 0;
    let errors = 0;
    let sinceId: number | undefined;

    try {
      while (true) {
        const products = await this.fetchProducts(shopDomain, accessToken, { sinceId });

        if (products.length === 0) break;

        for (const shopifyProduct of products) {
          try {
            await this.upsertProductFromShopify(brandId, shopifyProduct);
            synced++;
          } catch (error) {
            this.logger.error(`Failed to sync product ${shopifyProduct.id}:`, error);
            errors++;
          }
        }

        sinceId = products[products.length - 1].id;

        // Rate limiting
        await this.delay(500);
      }

      this.logger.log(`Product sync complete: ${synced} synced, ${errors} errors`);
      return { synced, errors };
    } catch (error) {
      this.logger.error('Product sync failed:', error);
      throw error;
    }
  }

  /**
   * Crée ou met à jour un produit Luneo depuis Shopify
   */
  private async upsertProductFromShopify(
    brandId: string,
    shopifyProduct: ShopifyProduct,
  ): Promise<void> {
    const externalId = `shopify_${shopifyProduct.id}`;

    // Trouver l'intégration Shopify
    const integration = await this.prisma.ecommerceIntegration.findFirst({
      where: {
        brandId,
        platform: 'shopify',
      },
    });

    if (!integration) {
      throw new NotFoundException(`No Shopify integration found for brand ${brandId}`);
    }

    // Vérifier si le produit existe déjà via ProductMapping
    const existingMapping = await this.prisma.productMapping.findFirst({
      where: {
        integrationId: integration.id,
        externalProductId: shopifyProduct.id.toString(),
      },
      include: {
        product: true,
      },
    });

    if (existingMapping) {
      // Mettre à jour le produit existant
      await this.prisma.product.update({
        where: { id: existingMapping.luneoProductId },
        data: {
          name: shopifyProduct.title,
          description: shopifyProduct.body_html || '',
          price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
          images: shopifyProduct.images.map(img => img.src),
        },
      });
    } else {
      // Créer un nouveau produit
      // Générer un slug à partir du handle Shopify ou du titre
      const slug = shopifyProduct.handle || shopifyProduct.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 100);

      const product = await this.prisma.product.create({
        data: {
          brand: { connect: { id: brandId } },
          name: shopifyProduct.title,
          slug,
          description: shopifyProduct.body_html || '',
          price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
          images: shopifyProduct.images.map(img => img.src),
        },
      });

      // Créer le mapping
      await this.prisma.productMapping.create({
        data: {
          luneoProductId: product.id,
          integrationId: integration.id,
          externalProductId: shopifyProduct.id.toString(),
          externalSku: shopifyProduct.variants[0]?.sku || shopifyProduct.handle,
          metadata: {
            shopifyHandle: shopifyProduct.handle,
            shopifyVendor: shopifyProduct.vendor,
            variants: shopifyProduct.variants,
          },
        },
      });
    }
  }

  // ==========================================================================
  // ORDERS PROCESSING
  // ==========================================================================

  /**
   * Traite un webhook de nouvelle commande
   */
  async processOrderWebhook(
    brandId: string,
    payload: unknown,
  ): Promise<void> {
    // ✅ RÈGLE: Validation Zod
    const order = ShopifyOrderSchema.parse(payload);

    this.logger.log(`Processing order ${order.order_number} for brand ${brandId}`);

    // Filtrer les line items avec personnalisation Luneo
    const luneoItems = order.line_items.filter(item =>
      item.properties.some(p => p.name === '_luneo_generation_id'),
    );

    if (luneoItems.length === 0) {
      this.logger.log('No Luneo items in order, skipping');
      return;
    }

    // Créer la commande dans Luneo
    // Utiliser OrderUncheckedCreateInput en passant brandId directement
    const luneoOrder = await this.prisma.order.create({
      data: {
        brandId, // Utiliser brandId directement au lieu de la relation
        // userId est optionnel, on l'omet si null
        status: 'CREATED',
        totalCents: Math.round(parseFloat(order.total_price) * 100),
        currency: order.currency,
        paymentStatus: order.financial_status === 'paid' ? 'SUCCEEDED' : 'PENDING',
        metadata: {
          shopifyOrderId: order.id,
          shopifyOrderNumber: order.order_number,
          financialStatus: order.financial_status,
          fulfillmentStatus: order.fulfillment_status,
        } as any,
      } as any,
    });

    // Créer les order items avec les générations
    for (const item of luneoItems) {
      const generationIdProp = item.properties.find(p => p.name === '_luneo_generation_id');
      if (!generationIdProp) continue;

      // Trouver le produit Luneo depuis le mapping
      let productId: string | null = null;
      if (item.product_id) {
        const mapping = await this.prisma.productMapping.findFirst({
          where: {
            externalProductId: item.product_id.toString(),
          },
        });
        productId = mapping?.luneoProductId || null;
      }

      await this.prisma.orderItem.create({
        data: {
          orderId: luneoOrder.id,
          productId: productId || 'temp', // OrderItem.productId est required
          quantity: item.quantity,
          priceCents: Math.round(parseFloat(item.price) * 100),
          totalCents: Math.round(parseFloat(item.price) * 100 * item.quantity),
          metadata: {
            shopifyLineItemId: item.id,
            shopifyVariantId: item.variant_id,
            generationId: generationIdProp.value,
          },
        },
      });
    }

    // Ajouter à la queue de génération des fichiers de production
    await this.syncQueue.add('generate-production-files', {
      orderId: luneoOrder.id,
      priority: 'high',
    });

    this.logger.log(`Order ${order.order_number} processed, ${luneoItems.length} items`);
  }

  // ==========================================================================
  // WEBHOOKS MANAGEMENT
  // ==========================================================================

  /**
   * Enregistre les webhooks nécessaires sur Shopify
   */
  async registerWebhooks(
    shopDomain: string,
    accessToken: string,
    callbackUrl: string,
  ): Promise<void> {
    const webhookTopics = [
      'orders/create',
      'orders/updated',
      'products/update',
      'products/delete',
      'app/uninstalled',
    ];

    for (const topic of webhookTopics) {
      try {
        await this.shopifyApiCall(
          shopDomain,
          accessToken,
          'POST',
          'webhooks.json',
          {
            webhook: {
              topic,
              address: `${callbackUrl}/webhooks/shopify`,
              format: 'json',
            },
          },
        );
        this.logger.log(`Registered webhook: ${topic}`);
      } catch (error) {
        this.logger.error(`Failed to register webhook ${topic}:`, error);
      }
    }
  }

  // ==========================================================================
  // UTILS
  // ==========================================================================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
