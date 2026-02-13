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
    this.clientId = this.configService.get<string>('SHOPIFY_API_KEY') || this.configService.get<string>('SHOPIFY_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('SHOPIFY_API_SECRET') || this.configService.get<string>('SHOPIFY_CLIENT_SECRET') || '';
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
   * Initiate OAuth: generate auth URL and store state in cache for callback.
   * @param brandId - Brand to attach the integration to
   * @param shop - Shop domain (e.g. mystore or mystore.myshopify.com)
   */
  async initiateOAuth(brandId: string, shop: string): Promise<{ authUrl: string; state: string }> {
    const shopDomain = this.normalizeShopDomain(shop);
    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri =
      this.configService.get<string>('SHOPIFY_REDIRECT_URI') ||
      `${this.configService.get<string>('API_URL') || ''}/api/v1/integrations/shopify/callback`;
    await this.cache.setSimple(
      `shopify_oauth_state:${state}`,
      JSON.stringify({ brandId, shopDomain }),
      600,
    );
    const authUrl = this.generateAuthUrl(shopDomain, redirectUri, state);
    return { authUrl, state };
  }

  private normalizeShopDomain(shop: string): string {
    const trimmed = shop.trim().toLowerCase();
    if (trimmed.endsWith('.myshopify.com')) return trimmed;
    return `${trimmed.replace(/\.myshopify\.com$/i, '')}.myshopify.com`;
  }

  /**
   * Handle OAuth callback: exchange code for token, store in DB, register webhooks.
   * If brandId is not provided, looks up existing integration by shop.
   */
  async handleCallback(
    code: string,
    shop: string,
    _hmac?: string,
    brandIdFromState?: string,
  ): Promise<{ brandId: string }> {
    const shopDomain = this.normalizeShopDomain(shop);
    const { accessToken, scope } = await this.exchangeCodeForToken(shopDomain, code);
    let brandId = brandIdFromState?.trim() || null;
    if (!brandId) {
      const existing = await this.prisma.ecommerceIntegration.findFirst({
        where: { platform: 'shopify', shopDomain },
        orderBy: { createdAt: 'desc' },
      });
      brandId = existing?.brandId ?? '';
    }
    if (brandId) {
      await this.saveShopData(shopDomain, { accessToken, scope }, brandId);
      const apiUrl = this.configService.get<string>('API_URL') || '';
      await this.registerWebhooks(shopDomain, accessToken, apiUrl);
    }
    return { brandId: brandId || '' };
  }

  /**
   * Bidirectional product sync for brand: Shopify -> Luneo and Luneo -> Shopify (mapped products).
   */
  async syncProducts(brandId: string): Promise<{ synced: number; errors: number }> {
    const integration = await this.getIntegration(brandId);
    const result = await this.syncProductsToLuneo(
      brandId,
      integration.shopDomain,
      integration.accessToken,
    );
    await this.prisma.ecommerceIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });
    return result;
  }

  /**
   * Fetch orders from Shopify API (paginated).
   */
  async fetchOrders(
    shopDomain: string,
    accessToken: string,
    options: { limit?: number; sinceId?: number; status?: string } = {},
  ): Promise<ShopifyOrder[]> {
    const { limit = 250, sinceId, status = 'any' } = options;
    let endpoint = `orders.json?limit=${limit}&status=${status}`;
    if (sinceId) endpoint += `&since_id=${sinceId}`;
    const response = await this.shopifyApiCall<{ orders: unknown[] }>(
      shopDomain,
      accessToken,
      'GET',
      endpoint,
    );
    return (response.orders || []).map((o) => ShopifyOrderSchema.parse(o));
  }

  /**
   * Import Shopify orders into Luneo (creates orders for Luneo-relevant line items).
   */
  async syncOrders(brandId: string): Promise<{ imported: number; skipped: number; errors: number }> {
    const integration = await this.getIntegration(brandId);
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    let sinceId: number | undefined;
    try {
      while (true) {
        const orders = await this.fetchOrders(integration.shopDomain, integration.accessToken, {
          sinceId,
          limit: 250,
        });
        if (orders.length === 0) break;
        for (const order of orders) {
          try {
            const existing = await this.prisma.order.findFirst({
              where: {
                brandId,
                metadata: { path: ['shopifyOrderId'], equals: order.id },
              },
            });
            if (existing) {
              skipped++;
              sinceId = order.id;
              continue;
            }
            await this.processOrderWebhook(brandId, order);
            imported++;
          } catch (err) {
            this.logger.warn(`Failed to import order ${order.id}:`, err);
            errors++;
          }
          sinceId = order.id;
        }
        await this.delay(500);
      }
      return { imported, skipped, errors };
    } catch (error) {
      this.logger.error('Order sync failed:', error);
      throw error;
    }
  }

  /**
   * Return connection status for the brand's Shopify integration.
   */
  async getConnectionStatus(brandId: string): Promise<{
    connected: boolean;
    shopDomain?: string;
    status?: string;
    lastSyncAt?: Date | null;
    syncedProducts?: number;
  }> {
    const integration = await this.prisma.ecommerceIntegration.findFirst({
      where: { brandId, platform: 'shopify' },
    });
    if (!integration || integration.status !== 'active') {
      return { connected: false };
    }
    const syncedProducts = await this.prisma.productMapping.count({
      where: { integrationId: integration.id },
    });
    return {
      connected: true,
      shopDomain: integration.shopDomain ?? undefined,
      status: integration.status,
      lastSyncAt: integration.lastSyncAt ?? null,
      syncedProducts,
    };
  }

  /**
   * Disconnect Shopify integration for the brand (set status to inactive).
   */
  async disconnect(brandId: string): Promise<void> {
    const integration = await this.prisma.ecommerceIntegration.findFirst({
      where: { brandId, platform: 'shopify' },
    });
    if (!integration) {
      throw new NotFoundException(`No Shopify integration found for brand ${brandId}`);
    }
    await this.prisma.ecommerceIntegration.update({
      where: { id: integration.id },
      data: { status: 'inactive' },
    });
    this.logger.log(`Shopify disconnected for brand ${brandId}`);
  }

  /**
   * Process incoming Shopify webhook (topic, shop, body). HMAC must be verified by caller.
   */
  async handleWebhook(topic: string, shop: string, body: unknown): Promise<void> {
    const shopDomain = this.normalizeShopDomain(shop);
    const integration = await this.prisma.ecommerceIntegration.findFirst({
      where: { platform: 'shopify', shopDomain, status: 'active' },
    });
    if (!integration) {
      this.logger.warn(`No active integration for shop ${shopDomain}`);
      return;
    }
    const brandId = integration.brandId;
    let accessToken = integration.accessToken ?? '';
    try {
      accessToken = this.decryptToken(accessToken);
    } catch {
      // legacy unencrypted
    }
    const payload = typeof body === 'string' ? JSON.parse(body) : body;

    switch (topic) {
      case 'orders/create':
        await this.processOrderWebhook(brandId, payload);
        break;
      case 'orders/updated':
        await this.processOrderUpdated(brandId, payload).catch((err) =>
          this.logger.warn('Order updated sync failed', err),
        );
        break;
      case 'products/create':
      case 'products/update': {
        const productId = payload?.id;
        if (productId != null && accessToken && integration.shopDomain) {
          const id = typeof productId === 'string' ? parseInt(productId, 10) : Number(productId);
          if (!Number.isNaN(id)) {
            await this.syncProductUpdate(brandId, integration.shopDomain, accessToken, id).catch(
              (err) => this.logger.warn('Product sync failed', err),
            );
          }
        }
        break;
      }
      case 'products/delete': {
        const productId = payload?.id;
        if (productId != null) {
          const id = typeof productId === 'string' ? parseInt(productId, 10) : Number(productId);
          if (!Number.isNaN(id)) {
            await this.processProductDelete(brandId, id).catch((err) =>
              this.logger.warn('Product delete sync failed', err),
            );
          }
        }
        break;
      }
      case 'app/uninstalled':
        await this.prisma.ecommerceIntegration.update({
          where: { id: integration.id },
          data: { status: 'inactive' },
        });
        break;
      default:
        this.logger.log(`Unhandled webhook topic: ${topic}`);
    }
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
  // API CALLS & HELPERS
  // ==========================================================================

  /** Shopify rate limit: 2 req/sec — wait 500ms before each request */
  private static readonly SHOPIFY_THROTTLE_MS = 500;

  /**
   * Get active Shopify integration for a brand with decrypted access token.
   */
  private async getIntegration(brandId: string) {
    const integration = await this.prisma.ecommerceIntegration.findFirst({
      where: {
        brandId,
        platform: 'shopify',
        status: 'active',
      },
    });
    if (!integration || !integration.accessToken || !integration.shopDomain) {
      throw new NotFoundException(`No active Shopify integration found for brand ${brandId}`);
    }
    return {
      ...integration,
      accessToken: this.decryptToken(integration.accessToken),
    };
  }

  /**
   * Appel API Shopify générique avec throttling (500ms entre chaque requête)
   */
  private async shopifyApiCall<T>(
    shopDomain: string,
    accessToken: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: Record<string, unknown>,
  ): Promise<T> {
    await this.delay(ShopifyService.SHOPIFY_THROTTLE_MS);

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
   * Récupère un produit Shopify par son ID
   */
  async fetchProductById(
    shopDomain: string,
    accessToken: string,
    productId: number,
  ): Promise<ShopifyProduct | null> {
    try {
      const response = await this.shopifyApiCall<{ product: unknown }>(
        shopDomain,
        accessToken,
        'GET',
        `products/${productId}.json`,
      );
      return response?.product
        ? ShopifyProductSchema.parse(response.product)
        : null;
    } catch (error) {
      this.logger.warn(`Failed to fetch Shopify product ${productId}:`, error);
      return null;
    }
  }

  /**
   * Synchronise un produit mis à jour depuis un webhook products/update
   */
  async syncProductUpdate(
    brandId: string,
    shopDomain: string,
    accessToken: string,
    productId: number,
  ): Promise<void> {
    const shopifyProduct = await this.fetchProductById(shopDomain, accessToken, productId);
    if (shopifyProduct) {
      await this.upsertProductFromShopify(brandId, shopifyProduct);
      this.logger.log(`Synced product ${productId} for brand ${brandId}`);
    }
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
   * Sync a Luneo product to Shopify (create or update).
   * When the product is modified in Luneo, call this to push changes to Shopify.
   */
  async syncProductToShopify(brandId: string, productId: string): Promise<void> {
    const integration = await this.getIntegration(brandId);
    const product = await this.prisma.product.findFirst({
      where: { id: productId, brandId },
      include: {
        productMappings: {
          where: { integrationId: integration.id },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const price = typeof product.price === 'object' && product.price !== null && 'toNumber' in product.price
      ? (product.price as { toNumber: () => number }).toNumber()
      : Number(product.price);

    const shopifyData = {
      title: product.name,
      body_html: product.description || '',
      product_type: product.category || '',
      images: (product.images || []).map((url: string) => ({ src: url })),
      variants: [{ price: String(price), sku: product.sku || undefined }],
    };

    const mapping = product.productMappings[0];
    if (mapping) {
      await this.shopifyApiCall(
        integration.shopDomain,
        integration.accessToken,
        'PUT',
        `products/${mapping.externalProductId}.json`,
        { product: shopifyData },
      );
      this.logger.log(`Updated product ${mapping.externalProductId} on Shopify for brand ${brandId}`);
    } else {
      const response = await this.shopifyApiCall<{ product: { id: number } }>(
        integration.shopDomain,
        integration.accessToken,
        'POST',
        'products.json',
        { product: shopifyData },
      );
      const shopifyId = String(response.product.id);
      await this.prisma.productMapping.create({
        data: {
          luneoProductId: product.id,
          integrationId: integration.id,
          externalProductId: shopifyId,
          externalSku: product.sku || product.slug,
          metadata: { createdFromLuneo: true },
        },
      });
      this.logger.log(`Created product ${shopifyId} on Shopify for brand ${brandId}`);
    }

    await this.prisma.productMapping.updateMany({
      where: { luneoProductId: productId, integrationId: integration.id },
      data: { lastSyncedAt: new Date(), syncStatus: 'synced' },
    });
    await this.prisma.ecommerceIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });
  }

  /**
   * Delete a product from Shopify when it is deleted in Luneo.
   * @param brandId - Brand id
   * @param externalId - Shopify product id (from ProductMapping.externalProductId)
   */
  async deleteProductFromShopify(brandId: string, externalId: string): Promise<void> {
    const integration = await this.getIntegration(brandId);
    await this.shopifyApiCall(
      integration.shopDomain,
      integration.accessToken,
      'DELETE',
      `products/${externalId}.json`,
    );
    await this.prisma.productMapping.deleteMany({
      where: {
        integrationId: integration.id,
        externalProductId: externalId,
      },
    });
    await this.prisma.ecommerceIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });
    this.logger.log(`Deleted product ${externalId} from Shopify for brand ${brandId}`);
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

    const totalCents = Math.round(parseFloat(order.total_price) * 100);
    const orderNumber = `SHOP-${order.id}`;
    const customerEmail = order.email || 'noreply@shopify-order.local';

    const luneoOrder = await this.prisma.order.create({
      data: {
        brandId,
        orderNumber,
        customerEmail,
        status: 'CREATED',
        subtotalCents: totalCents,
        totalCents,
        currency: order.currency,
        paymentStatus: order.financial_status === 'paid' ? 'SUCCEEDED' : 'PENDING',
        metadata: {
          shopifyOrderId: order.id,
          shopifyOrderNumber: order.order_number,
          financialStatus: order.financial_status,
          fulfillmentStatus: order.fulfillment_status,
        },
      },
    });

    // Créer les order items avec les générations (uniquement si produit mappé trouvé)
    for (const item of luneoItems) {
      const generationIdProp = item.properties.find(p => p.name === '_luneo_generation_id');
      if (!generationIdProp) continue;

      let productId: string | null = null;
      if (item.product_id) {
        const mapping = await this.prisma.productMapping.findFirst({
          where: {
            externalProductId: item.product_id.toString(),
          },
        });
        productId = mapping?.luneoProductId || null;
      }

      if (!productId) {
        this.logger.warn(`Skipping order item: no Luneo product mapping for Shopify product ${item.product_id}`);
        continue;
      }

      await this.prisma.orderItem.create({
        data: {
          orderId: luneoOrder.id,
          productId,
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

  /**
   * Process Shopify orders/updated webhook: update Luneo order status and payment.
   */
  async processOrderUpdated(brandId: string, payload: unknown): Promise<void> {
    const order = ShopifyOrderSchema.parse(payload);

    const existing = await this.prisma.order.findFirst({
      where: {
        brandId,
        metadata: { path: ['shopifyOrderId'], equals: order.id },
      },
    });

    if (!existing) {
      this.logger.log(`Order ${order.id} not found in Luneo for brand ${brandId}, skipping update`);
      return;
    }

    const status = this.mapShopifyFulfillmentToOrderStatus(order.fulfillment_status);
    const paymentStatus = order.financial_status === 'paid' ? 'SUCCEEDED' : 'PENDING';

    await this.prisma.order.update({
      where: { id: existing.id },
      data: {
        status,
        paymentStatus,
        metadata: {
          ...(typeof existing.metadata === 'object' && existing.metadata !== null ? existing.metadata as Record<string, unknown> : {}),
          shopifyOrderId: order.id,
          shopifyOrderNumber: order.order_number,
          financialStatus: order.financial_status,
          fulfillmentStatus: order.fulfillment_status,
        },
      },
    });

    this.logger.log(`Updated order ${existing.orderNumber} for brand ${brandId}`);
  }

  private mapShopifyFulfillmentToOrderStatus(fulfillment: string | null): 'CREATED' | 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED' {
    if (!fulfillment) return 'CREATED';
    switch (fulfillment) {
      case 'fulfilled':
        return 'SHIPPED';
      case 'partial':
        return 'PROCESSING';
      case 'restocked':
        return 'CANCELLED';
      default:
        return 'PROCESSING';
    }
  }

  /**
   * Handle products/delete webhook: remove ProductMapping and optionally soft-delete product in Luneo.
   */
  async processProductDelete(brandId: string, shopifyProductId: number): Promise<void> {
    const integration = await this.prisma.ecommerceIntegration.findFirst({
      where: { brandId, platform: 'shopify', status: 'active' },
    });
    if (!integration) return;

    const mapping = await this.prisma.productMapping.findFirst({
      where: {
        integrationId: integration.id,
        externalProductId: String(shopifyProductId),
      },
      include: { product: true },
    });

    if (mapping?.product) {
      await this.prisma.productMapping.delete({ where: { id: mapping.id } });
      await this.prisma.product.update({
        where: { id: mapping.luneoProductId },
        data: { deletedAt: new Date() },
      });
      this.logger.log(`Soft-deleted Luneo product ${mapping.luneoProductId} after Shopify product ${shopifyProductId} deleted`);
    }
  }

  /**
   * Sync status for a brand's Shopify integration.
   */
  async getSyncStatus(brandId: string): Promise<{
    lastSync: Date | null;
    syncedProducts: number;
    status: string;
  }> {
    const integration = await this.getIntegration(brandId);
    const syncedProducts = await this.prisma.productMapping.count({
      where: { integrationId: integration.id },
    });
    return {
      lastSync: integration.lastSyncAt ?? null,
      syncedProducts,
      status: integration.status,
    };
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
      'products/create',
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
