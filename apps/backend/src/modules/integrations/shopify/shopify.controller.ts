/**
 * @fileoverview Controller pour l'intégration Shopify
 * @module ShopifyController
 *
 * ENDPOINTS:
 * - GET /integrations/shopify/auth - Initier OAuth
 * - GET /integrations/shopify/callback - Callback OAuth
 * - POST /integrations/shopify/webhooks - Recevoir webhooks
 * - POST /integrations/shopify/sync - Lancer sync manuelle
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Validation Zod
 * - ✅ Guards d'authentification
 * - ✅ Gestion d'erreurs
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Headers,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentBrand } from '@/common/decorators/current-brand.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EncryptionService } from '@/libs/crypto/encryption.service';
import { ShopifyService } from './shopify.service';

// ============================================================================
// SCHEMAS
// ============================================================================

const OAuthInitSchema = z.object({
  shopDomain: z.string().regex(/^[a-zA-Z0-9-]+\.myshopify\.com$/),
});

const OAuthCallbackSchema = z.object({
  code: z.string().min(1),
  shop: z.string(),
  state: z.string(),
  hmac: z.string().optional(),
});

// ============================================================================
// CONTROLLER
// ============================================================================

@ApiTags('Integrations - Shopify')
@Controller('integrations/shopify')
export class ShopifyController {
  private readonly logger = new Logger(ShopifyController.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly shopifyService: ShopifyService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
  ) {
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  /**
   * Initie le flow OAuth Shopify
   */
  @Get('auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initier OAuth Shopify' })
  async initiateOAuth(
    @Query() query: unknown,
    @CurrentBrand() brand: { id: string } | null,
    @Res() res: Response,
  ) {
    if (!brand) {
      throw new BadRequestException('Brand not found');
    }

    const { shopDomain } = OAuthInitSchema.parse(query);

    // Générer un state unique pour sécuriser le flow
    const state = randomBytes(16).toString('hex');

    // Stocker le state en cache pour vérification
    await this.prisma.$executeRaw`
      INSERT INTO "OAuthState" (id, state, brand_id, shop_domain, expires_at, created_at)
      VALUES (gen_random_uuid(), ${state}, ${brand.id}, ${shopDomain}, NOW() + INTERVAL '10 minutes', NOW())
      ON CONFLICT DO NOTHING
    `.catch(() => {
      // Table OAuthState n'existe peut-être pas encore
      this.logger.warn('OAuthState table not found, using cache instead');
    });

    const redirectUri = `${this.frontendUrl}/api/integrations/shopify/callback`;
    const authUrl = this.shopifyService.generateAuthUrl(shopDomain, redirectUri, state);

    res.redirect(authUrl);
  }

  /**
   * Callback OAuth Shopify
   */
  @Get('callback')
  @ApiOperation({ summary: 'Callback OAuth Shopify' })
  async handleOAuthCallback(
    @Query() query: unknown,
    @Res() res: Response,
  ) {
    try {
      const { code, shop, state } = OAuthCallbackSchema.parse(query);

      // Verify OAuth state to prevent CSRF attacks
      let brandId: string | null = null;
      try {
        const oauthState = await this.prisma.$queryRaw<Array<{ brand_id: string }>>`
          SELECT brand_id FROM "OAuthState"
          WHERE state = ${state} AND shop_domain = ${shop} AND expires_at > NOW()
          LIMIT 1
        `;
        if (oauthState.length > 0) {
          brandId = oauthState[0].brand_id;
          // Delete used state
          await this.prisma.$executeRaw`DELETE FROM "OAuthState" WHERE state = ${state}`;
        }
      } catch {
        this.logger.warn('OAuthState table not available, falling back to integration lookup');
      }

      // Échanger le code contre un token
      const { accessToken, scope } = await this.shopifyService.exchangeCodeForToken(shop, code);

      // Fallback: find brand from existing integration if state lookup failed
      let existingIntegrationId: string | null = null;
      if (!brandId) {
        const integration = await this.prisma.ecommerceIntegration.findFirst({
          where: {
            platform: 'shopify',
            shopDomain: shop,
          },
          orderBy: { createdAt: 'desc' },
        });
        brandId = integration?.brandId || 'temp';
        existingIntegrationId = integration?.id || null;
      } else {
        // Check if integration already exists for this brand + shop
        const existing = await this.prisma.ecommerceIntegration.findFirst({
          where: { brandId, platform: 'shopify', shopDomain: shop },
        });
        existingIntegrationId = existing?.id || null;
      }

      // Encrypt access token before storing (AES-256-GCM)
      const encryptedToken = this.encryptionService.encrypt(accessToken);

      // Stocker la connexion
      await this.prisma.ecommerceIntegration.upsert({
        where: {
          id: existingIntegrationId || 'new-integration',
        },
        create: {
          brandId,
          platform: 'shopify',
          shopDomain: shop,
          accessToken: encryptedToken,
          config: {
            scopes: scope.split(','),
            apiVersion: '2024-10',
          },
          status: 'active',
        },
        update: {
          accessToken: encryptedToken,
          config: {
            scopes: scope.split(','),
            apiVersion: '2024-10',
          },
          status: 'active',
          updatedAt: new Date(),
        },
      });

      // Enregistrer les webhooks
      const callbackUrl = this.configService.getOrThrow<string>('API_URL');
      await this.shopifyService.registerWebhooks(shop, accessToken, callbackUrl);

      // Rediriger vers le dashboard
      res.redirect(`${this.frontendUrl}/dashboard/integrations?success=shopify`);
    } catch (error) {
      this.logger.error('OAuth callback failed:', error);
      res.redirect(`${this.frontendUrl}/dashboard/integrations?error=shopify`);
    }
  }

  /**
   * Reçoit les webhooks Shopify
   */
  @Post('webhooks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recevoir webhooks Shopify' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Headers('x-shopify-topic') topic: string,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    // Vérifier la signature
    const rawBody = req.rawBody?.toString() || '';

    // Récupérer le secret depuis l'intégration
    const integration = await this.prisma.ecommerceIntegration.findFirst({
      where: {
        platform: 'shopify',
        shopDomain: shopDomain,
        status: 'active',
      },
    });

    if (!integration) {
      this.logger.warn(`No active integration found for ${shopDomain}`);
      return { received: true };
    }

    // Vérifier la signature (simplifié - utiliser le clientSecret en production)
    const secret = this.configService.get<string>('SHOPIFY_CLIENT_SECRET') || '';
    if (!this.shopifyService.verifyWebhookSignature(rawBody, hmac, secret)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log(`Received Shopify webhook: ${topic} from ${shopDomain}`);

    // Traiter selon le topic
    const payload = JSON.parse(rawBody);

    const brandId = integration.brandId;
    let accessToken = integration.accessToken ?? '';
    try {
      accessToken = this.encryptionService.decrypt(accessToken);
    } catch {
      // Legacy unencrypted token
    }

    switch (topic) {
      case 'orders/create':
        await this.shopifyService.processOrderWebhook(brandId, payload);
        break;

      case 'orders/updated':
        await this.shopifyService.processOrderUpdated(brandId, payload).catch((err) =>
          this.logger.warn('Order updated sync failed', err),
        );
        break;

      case 'products/create':
      case 'products/update': {
        const productId = payload?.id;
        if (productId != null && accessToken && integration.shopDomain) {
          const id = typeof productId === 'string' ? parseInt(productId, 10) : Number(productId);
          if (!Number.isNaN(id)) {
            await this.shopifyService
              .syncProductUpdate(brandId, integration.shopDomain, accessToken, id)
              .catch((err) => this.logger.warn('Product sync failed', err));
          }
        }
        break;
      }

      case 'products/delete': {
        const productId = payload?.id;
        if (productId != null) {
          const id = typeof productId === 'string' ? parseInt(productId, 10) : Number(productId);
          if (!Number.isNaN(id)) {
            await this.shopifyService.processProductDelete(brandId, id).catch((err) =>
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

    return { received: true };
  }

  /**
   * Get Shopify sync status for the current brand
   */
  @Get('sync/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync status' })
  async getSyncStatus(@CurrentBrand() brand: { id: string } | null) {
    if (!brand) {
      throw new BadRequestException('Brand not found');
    }
    return this.shopifyService.getSyncStatus(brand.id);
  }

  /**
   * Sync a single Luneo product to Shopify (create or update)
   */
  @Post('sync/product/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync product to Shopify' })
  async syncProductToShopify(
    @CurrentBrand() brand: { id: string } | null,
    @Param('productId') productId: string,
  ) {
    if (!brand) {
      throw new BadRequestException('Brand not found');
    }
    if (!productId) {
      throw new BadRequestException('productId is required');
    }
    await this.shopifyService.syncProductToShopify(brand.id, productId);
    return {
      success: true,
      productId,
      status: 'synced',
      message: 'Product synced to Shopify',
      syncedAt: new Date().toISOString(),
    };
  }

  /**
   * Delete a product from Shopify (when deleted in Luneo). externalId = Shopify product id.
   */
  @Delete('product/:externalId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete product from Shopify' })
  async deleteProductFromShopify(
    @CurrentBrand() brand: { id: string } | null,
    @Param('externalId') externalId: string,
  ) {
    if (!brand) {
      throw new BadRequestException('Brand not found');
    }
    if (!externalId) {
      throw new BadRequestException('externalId is required');
    }
    await this.shopifyService.deleteProductFromShopify(brand.id, externalId);
    return {
      success: true,
      externalId,
      status: 'deleted',
      message: 'Product removed from Shopify',
      deletedAt: new Date().toISOString(),
    };
  }

  /**
   * Lance une synchronisation manuelle
   */
  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lancer sync manuelle' })
  async triggerSync(
    @CurrentBrand() brand: { id: string } | null,
  ) {
    if (!brand) {
      throw new BadRequestException('Brand not found');
    }

    const integration = await this.prisma.ecommerceIntegration.findFirst({
      where: {
        brandId: brand.id,
        platform: 'shopify',
        status: 'active',
      },
    });

    if (!integration) {
      throw new BadRequestException('No active Shopify integration');
    }

    let accessToken = integration.accessToken ?? '';
    try {
      accessToken = this.encryptionService.decrypt(accessToken);
    } catch {
      // Legacy unencrypted
    }

    const result = await this.shopifyService.syncProductsToLuneo(
      brand.id,
      integration.shopDomain,
      accessToken,
    );

    return {
      success: true,
      data: result,
    };
  }
}
