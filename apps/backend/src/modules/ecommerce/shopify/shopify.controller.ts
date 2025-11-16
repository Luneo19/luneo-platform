import {
  Controller,
  Get,
  Post,
  Query,
  Headers,
  Res,
  BadRequestException,
  UnauthorizedException,
  Logger,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ShopifyService } from './shopify.service';

@Controller('shopify')
export class ShopifyController {
  private readonly logger = new Logger(ShopifyController.name);

  constructor(private readonly shopifyService: ShopifyService) {}

  /**
   * GET /api/shopify/install
   * Redirects to Shopify OAuth install URL
   */
  @Get('install')
  async install(
    @Query('shop') shop: string,
    @Query('brandId') brandId: string,
    @Res() res: Response,
  ) {
    if (!shop || !brandId) {
      throw new BadRequestException('shop and brandId query parameters are required');
    }

    try {
      const installUrl = this.shopifyService.generateInstallUrl(shop, brandId);
      return res.redirect(installUrl);
    } catch (error) {
      this.logger.error(`Error generating install URL: ${error}`);
      throw new BadRequestException('Failed to generate install URL');
    }
  }

  /**
   * GET /api/shopify/callback
   * Handles OAuth callback from Shopify
   */
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('shop') shop: string,
    @Query('state') state: string,
    @Query('brandId') brandId: string,
    @Res() res: Response,
  ) {
    if (!code || !shop || !state) {
      throw new BadRequestException('Missing required OAuth parameters');
    }

    if (!brandId) {
      throw new BadRequestException('brandId is required');
    }

    try {
      // Validate nonce (CSRF protection)
      const isValidNonce = await this.shopifyService.validateNonce(shop, brandId, state);
      if (!isValidNonce) {
        throw new UnauthorizedException('Invalid state parameter');
      }

      // Exchange code for access token
      const tokenResponse = await this.shopifyService.exchangeCodeForToken(shop, code);
      
      // Parse scopes
      const scopes = tokenResponse.scope ? tokenResponse.scope.split(',') : [];

      // Validate required scopes
      const requiredScopes = ['read_products', 'write_products'];
      const hasRequiredScopes = this.shopifyService.validateScopes(scopes, requiredScopes);
      
      if (!hasRequiredScopes) {
        throw new BadRequestException('Insufficient scopes granted');
      }

      // Store installation
      await this.shopifyService.storeInstallation(
        shop,
        tokenResponse.access_token,
        scopes,
        brandId,
      );

      // Enable webhooks
      await this.shopifyService.enableWebhooks(shop);

      // Redirect to success page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/dashboard/integrations?shopify=success&shop=${shop}`);
    } catch (error) {
      this.logger.error(`Error in OAuth callback: ${error}`);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/dashboard/integrations?shopify=error&message=${encodeURIComponent(error.message)}`);
    }
  }

  /**
   * POST /api/shopify/webhooks/products
   * Handles Shopify product webhooks with HMAC verification
   */
  @Post('webhooks/products')
  @HttpCode(HttpStatus.OK)
  async handleProductWebhook(
    @Req() req: Request,
    @Headers('x-shopify-shop-domain') shopDomain: string,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Headers('x-shopify-topic') topic: string,
  ) {
    if (!shopDomain || !hmac) {
      throw new BadRequestException('Missing required webhook headers');
    }

    try {
      // Get raw body as Buffer (set by bodyParser.raw middleware)
      const rawBody = (req.body as Buffer)?.toString('utf8') || '';
      
      if (!rawBody) {
        throw new BadRequestException('Empty webhook payload');
      }
      
      // Get webhook secret
      const webhookSecret = await this.shopifyService.getWebhookSecret(shopDomain);
      
      if (!webhookSecret) {
        this.logger.warn(`Webhook secret not found for shop: ${shopDomain}`);
        // In production, always require secret
        if (process.env.NODE_ENV === 'production') {
          throw new UnauthorizedException('Webhook secret not configured');
        }
      } else {
        // Verify HMAC
        const isValid = this.shopifyService.verifyWebhookHmac(rawBody, hmac, webhookSecret);
        
        if (!isValid) {
          throw new UnauthorizedException('Invalid webhook signature');
        }
      }

      // Parse payload
      const payload = JSON.parse(rawBody);

      // Process webhook (add replay protection, process product update, etc.)
      this.logger.log(`Received webhook from ${shopDomain}: ${topic}`);
      
      // TODO: Add replay protection using nonce/timestamp
      // TODO: Process product update
      // TODO: Queue job for async processing

      return { success: true, message: 'Webhook processed' };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error}`);
      throw error instanceof BadRequestException || error instanceof UnauthorizedException
        ? error
        : new BadRequestException('Failed to process webhook');
    }
  }
}
