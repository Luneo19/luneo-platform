import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EncryptionService } from '@/libs/encryption/encryption.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

export interface ShopifyOAuthResponse {
  access_token: string;
  scope: string;
  expires_in?: number;
}

export interface ShopifyWebhookPayload {
  id?: string;
  [key: string]: unknown;
}

@Injectable()
export class ShopifyService {
  private readonly logger = new Logger(ShopifyService.name);
  private readonly API_VERSION = '2024-10';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Generate Shopify OAuth install URL
   */
  generateInstallUrl(shopDomain: string, brandId: string): string {
    const apiKey = this.configService.get<string>('shopify.apiKey');
    const scopes = this.configService.get<string>('shopify.scopes') || 
      'read_products,write_products,read_orders,write_orders';
    const appUrl = this.configService.get<string>('app.url') || 'http://localhost:3000';
    
    if (!apiKey) {
      throw new BadRequestException('Shopify API key not configured');
    }

    // Validate shop domain format
    if (!this.isValidShopDomain(shopDomain)) {
      throw new BadRequestException('Invalid shop domain format');
    }

    const redirectUri = `${appUrl}/api/shopify/callback`;
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // Store nonce with brandId for validation (10 minutes TTL)
    this.cache.setSimple(`shopify_nonce:${shopDomain}:${brandId}`, nonce, 600);

    const installUrl = `https://${shopDomain}/admin/oauth/authorize?` +
      `client_id=${apiKey}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${nonce}`;

    return installUrl;
  }

  /**
   * Exchange OAuth code for access token
   */
  async exchangeCodeForToken(shopDomain: string, code: string): Promise<ShopifyOAuthResponse> {
    const apiKey = this.configService.get<string>('shopify.apiKey');
    const apiSecret = this.configService.get<string>('shopify.apiSecret');

    if (!apiKey || !apiSecret) {
      throw new BadRequestException('Shopify credentials not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<ShopifyOAuthResponse>(
          `https://${shopDomain}/admin/oauth/access_token`,
          {
            client_id: apiKey,
            client_secret: apiSecret,
            code,
          }
        )
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error exchanging code for token: ${error}`);
      throw new BadRequestException('Failed to obtain access token from Shopify');
    }
  }

  /**
   * Store Shopify installation
   */
  async storeInstallation(
    shopDomain: string,
    accessToken: string,
    scopes: string[],
    brandId: string,
    webhookSecret?: string,
  ): Promise<void> {
    // Encrypt tokens
    const encryptedAccessToken = this.encryptionService.encrypt(accessToken);
    const encryptedWebhookSecret = webhookSecret 
      ? this.encryptionService.encrypt(webhookSecret)
      : null;

    // Check if installation already exists
    const existing = await this.prisma.shopifyInstall.findUnique({
      where: { shopDomain },
    });

    if (existing) {
      // Update existing installation
      await this.prisma.shopifyInstall.update({
        where: { shopDomain },
        data: {
          accessToken: encryptedAccessToken,
          webhookSecret: encryptedWebhookSecret,
          scopes,
          status: 'active',
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new installation
      await this.prisma.shopifyInstall.create({
        data: {
          shopDomain,
          accessToken: encryptedAccessToken,
          webhookSecret: encryptedWebhookSecret,
          scopes,
          brandId,
          status: 'active',
        },
      });
    }

    this.logger.log(`Shopify installation stored for shop: ${shopDomain}`);
  }

  /**
   * Get decrypted access token for a shop
   */
  async getAccessToken(shopDomain: string): Promise<string> {
    const installation = await this.prisma.shopifyInstall.findUnique({
      where: { shopDomain },
    });

    if (!installation || installation.status !== 'active') {
      throw new NotFoundException(`Active Shopify installation not found for shop: ${shopDomain}`);
    }

    return this.encryptionService.decrypt(installation.accessToken);
  }

  /**
   * Get decrypted webhook secret for a shop
   */
  async getWebhookSecret(shopDomain: string): Promise<string | null> {
    const installation = await this.prisma.shopifyInstall.findUnique({
      where: { shopDomain },
    });

    if (!installation || !installation.webhookSecret) {
      return null;
    }

    return this.encryptionService.decrypt(installation.webhookSecret);
  }

  /**
   * Verify HMAC signature for webhook
   */
  verifyWebhookHmac(payload: string, hmac: string, secret: string): boolean {
    const calculatedHmac = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(calculatedHmac),
      Buffer.from(hmac)
    );
  }

  /**
   * Validate scopes before installation
   */
  validateScopes(requestedScopes: string[], requiredScopes: string[]): boolean {
    const requestedSet = new Set(requestedScopes);
    return requiredScopes.every(scope => requestedSet.has(scope));
  }

  /**
   * Enable webhooks for a shop
   */
  async enableWebhooks(shopDomain: string): Promise<void> {
    const accessToken = await this.getAccessToken(shopDomain);
    const appUrl = this.configService.get<string>('app.url') || 'http://localhost:3000';
    const webhookUrl = `${appUrl}/api/shopify/webhooks/products`;

    // Generate webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    try {
      // Register webhook with Shopify
      await firstValueFrom(
        this.httpService.post(
          `https://${shopDomain}/admin/api/${this.API_VERSION}/webhooks.json`,
          {
            webhook: {
              topic: 'products/update',
              address: webhookUrl,
              format: 'json',
            },
          },
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
            },
          }
        )
      );

      // Store encrypted webhook secret
      const installation = await this.prisma.shopifyInstall.findUnique({
        where: { shopDomain },
      });

      if (installation) {
        await this.prisma.shopifyInstall.update({
          where: { shopDomain },
          data: {
            webhookSecret: this.encryptionService.encrypt(webhookSecret),
          },
        });
      }

      this.logger.log(`Webhooks enabled for shop: ${shopDomain}`);
    } catch (error) {
      this.logger.error(`Error enabling webhooks: ${error}`);
      throw new BadRequestException('Failed to enable webhooks');
    }
  }

  /**
   * Validate shop domain format
   */
  private isValidShopDomain(shopDomain: string): boolean {
    // Shopify shop domains: myshop.myshopify.com or custom domain
    const shopifyPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
    return shopifyPattern.test(shopDomain);
  }

  /**
   * Validate nonce for CSRF protection
   */
  async validateNonce(shopDomain: string, brandId: string, nonce: string): Promise<boolean> {
    const storedNonce = await this.cache.getSimple(`shopify_nonce:${shopDomain}:${brandId}`);
    return storedNonce === nonce;
  }

  /**
   * Process webhook with replay protection and async job queuing
   */
  async processWebhook(shopDomain: string, topic: string, payload: ShopifyWebhookPayload): Promise<void> {
    // Replay protection: Check if webhook ID already processed
    if (payload.id) {
      const webhookKey = `shopify_webhook:${shopDomain}:${payload.id}`;
      const alreadyProcessed = await this.cache.getSimple(webhookKey);
      
      if (alreadyProcessed) {
        this.logger.warn(`Webhook ${payload.id} already processed for shop ${shopDomain}, skipping`);
        return;
      }

      // Mark as processed (24h expiry)
      await this.cache.setSimple(webhookKey, 'processed', 86400);
    }

    // Process product update based on topic
    if (topic === 'products/update' || topic === 'products/create') {
      await this.processProductWebhook(shopDomain, payload);
    } else {
      this.logger.log(`Unhandled webhook topic: ${topic} for shop ${shopDomain}`);
    }
  }

  /**
   * Process product webhook (can be extended to queue async jobs)
   */
  private async processProductWebhook(shopDomain: string, payload: ShopifyWebhookPayload): Promise<void> {
    this.logger.log(`Processing product webhook for shop ${shopDomain}`);
    
    // TODO: Queue async job for product sync if needed
    // Example: await this.queueService.add('product-sync', { shopDomain, productId: payload.id });
    
    // For now, just log the update
    this.logger.debug(`Product webhook payload: ${JSON.stringify(payload)}`);
  }
}
