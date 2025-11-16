import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  Req,
  Res,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ShopifyConnector } from './connectors/shopify/shopify.connector';
import { WooCommerceConnector } from './connectors/woocommerce/woocommerce.connector';
import { MagentoConnector } from './connectors/magento/magento.connector';
import { ProductSyncService } from './services/product-sync.service';
import { OrderSyncService } from './services/order-sync.service';
import { WebhookHandlerService } from './services/webhook-handler.service';

@ApiTags('E-commerce Integrations')
@Controller('ecommerce')
export class EcommerceController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shopifyConnector: ShopifyConnector,
    private readonly woocommerceConnector: WooCommerceConnector,
    private readonly magentoConnector: MagentoConnector,
    private readonly productSyncService: ProductSyncService,
    private readonly orderSyncService: OrderSyncService,
    private readonly webhookHandlerService: WebhookHandlerService,
  ) {}

  // ========================================
  // SHOPIFY
  // ========================================

  @Post('shopify/install')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Génère l\'URL d\'installation Shopify' })
  @ApiResponse({ status: 200, description: 'URL générée avec succès' })
  async shopifyInstall(
    @Body() body: { shop: string; brandId: string },
  ): Promise<{ installUrl: string }> {
    const installUrl = this.shopifyConnector.generateInstallUrl(body.shop, body.brandId);
    return { installUrl };
  }

  @Get('shopify/callback')
  @ApiOperation({ summary: 'Callback OAuth Shopify' })
  @ApiResponse({ status: 302, description: 'Redirect après installation' })
  async shopifyCallback(
    @Query('shop') shop: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Échanger le code contre un token
      const accessToken = await this.shopifyConnector.exchangeCodeForToken(shop, code);

      // Récupérer le brandId depuis le state/session (simplification ici)
      const brandId = 'temp-brand-id'; // À récupérer depuis la session

      // Sauvegarder l'intégration
      await this.shopifyConnector.saveIntegration(brandId, shop, accessToken);

      // Rediriger vers le dashboard
      res.redirect(`${process.env.FRONTEND_URL}/integrations?shopify=success`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/integrations?shopify=error`);
    }
  }

  @Post('shopify/webhook')
  @ApiOperation({ summary: 'Reçoit les webhooks Shopify' })
  @ApiResponse({ status: 200, description: 'Webhook traité' })
  @HttpCode(HttpStatus.OK)
  async shopifyWebhook(
    @Headers('x-shopify-topic') topic: string,
    @Headers('x-shopify-shop-domain') shop: string,
    @Headers('x-shopify-hmac-sha256') hmac: string,
    @Body() payload: any,
  ): Promise<{ status: string }> {
    await this.webhookHandlerService.handleShopifyWebhook(topic, shop, payload, hmac);
    return { status: 'processed' };
  }

  @Get('shopify/:integrationId/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupère les produits Shopify' })
  @ApiResponse({ status: 200, description: 'Produits récupérés' })
  async getShopifyProducts(
    @Param('integrationId') integrationId: string,
    @Query('limit') limit?: number,
  ): Promise<any> {
    return this.shopifyConnector.getProducts(integrationId, { limit });
  }

  @Post('shopify/:integrationId/sync/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Synchronise les produits Shopify' })
  @ApiResponse({ status: 200, description: 'Synchronisation lancée' })
  async syncShopifyProducts(
    @Param('integrationId') integrationId: string,
  ): Promise<any> {
    return this.productSyncService.syncProducts({ integrationId });
  }

  // ========================================
  // WOOCOMMERCE
  // ========================================

  @Post('woocommerce/connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connecte une boutique WooCommerce' })
  @ApiResponse({ status: 201, description: 'Connexion réussie' })
  async woocommerceConnect(
    @Body() body: {
      brandId: string;
      siteUrl: string;
      consumerKey: string;
      consumerSecret: string;
    },
  ): Promise<any> {
    return this.woocommerceConnector.connect(
      body.brandId,
      body.siteUrl,
      body.consumerKey,
      body.consumerSecret,
    );
  }

  @Post('woocommerce/webhook')
  @ApiOperation({ summary: 'Reçoit les webhooks WooCommerce' })
  @ApiResponse({ status: 200, description: 'Webhook traité' })
  @HttpCode(HttpStatus.OK)
  async woocommerceWebhook(
    @Headers('x-wc-webhook-topic') topic: string,
    @Headers('x-wc-webhook-signature') signature: string,
    @Body() payload: any,
  ): Promise<{ status: string }> {
    await this.webhookHandlerService.handleWooCommerceWebhook(topic, payload, signature);
    return { status: 'processed' };
  }

  @Get('woocommerce/:integrationId/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupère les produits WooCommerce' })
  @ApiResponse({ status: 200, description: 'Produits récupérés' })
  async getWooCommerceProducts(
    @Param('integrationId') integrationId: string,
    @Query('per_page') perPage?: number,
  ): Promise<any> {
    return this.woocommerceConnector.getProducts(integrationId, { per_page: perPage });
  }

  @Post('woocommerce/:integrationId/sync/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Synchronise les produits WooCommerce' })
  @ApiResponse({ status: 200, description: 'Synchronisation lancée' })
  async syncWooCommerceProducts(
    @Param('integrationId') integrationId: string,
  ): Promise<any> {
    return this.productSyncService.syncProducts({ integrationId });
  }

  // ========================================
  // MAGENTO
  // ========================================

  @Post('magento/connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Connecte une boutique Magento' })
  @ApiResponse({ status: 201, description: 'Connexion réussie' })
  async magentoConnect(
    @Body() body: {
      brandId: string;
      storeUrl: string;
      apiToken: string;
    },
  ): Promise<any> {
    return this.magentoConnector.connect(
      body.brandId,
      body.storeUrl,
      body.apiToken,
    );
  }

  @Get('magento/:integrationId/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupère les produits Magento' })
  @ApiResponse({ status: 200, description: 'Produits récupérés' })
  async getMagentoProducts(
    @Param('integrationId') integrationId: string,
    @Query('pageSize') pageSize?: number,
  ): Promise<any> {
    return this.magentoConnector.getProducts(integrationId, { pageSize });
  }

  @Post('magento/:integrationId/sync/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Synchronise les produits Magento' })
  @ApiResponse({ status: 200, description: 'Synchronisation lancée' })
  async syncMagentoProducts(
    @Param('integrationId') integrationId: string,
  ): Promise<any> {
    return this.productSyncService.syncProducts({ integrationId });
  }

  // ========================================
  // SYNC MANAGEMENT
  // ========================================

  @Post('integrations/:integrationId/sync/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Synchronise les produits (toutes plateformes)' })
  @ApiResponse({ status: 200, description: 'Synchronisation lancée' })
  async syncProducts(
    @Param('integrationId') integrationId: string,
    @Body() body?: { productIds?: string[]; options?: any },
  ): Promise<any> {
    return this.productSyncService.syncProducts({
      integrationId,
      productIds: body?.productIds,
      options: body?.options,
    });
  }

  @Post('integrations/:integrationId/sync/orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Synchronise les commandes' })
  @ApiResponse({ status: 200, description: 'Synchronisation lancée' })
  async syncOrders(
    @Param('integrationId') integrationId: string,
    @Body() body?: { orderIds?: string[]; options?: any },
  ): Promise<any> {
    return this.orderSyncService.syncOrders({
      integrationId,
      orderIds: body?.orderIds,
      options: body?.options,
    });
  }

  @Get('integrations/:integrationId/sync/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtient les statistiques de synchronisation' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées' })
  async getSyncStats(
    @Param('integrationId') integrationId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
  ): Promise<any> {
    return this.productSyncService.getSyncStats(integrationId, period);
  }

  @Get('integrations/:integrationId/orders/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtient les statistiques des commandes' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées' })
  async getOrderStats(
    @Param('integrationId') integrationId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
  ): Promise<any> {
    return this.orderSyncService.getOrderStats(integrationId, period);
  }

  @Get('integrations/:integrationId/webhooks/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtient l\'historique des webhooks' })
  @ApiResponse({ status: 200, description: 'Historique récupéré' })
  async getWebhookHistory(
    @Param('integrationId') integrationId: string,
    @Query('limit') limit: number = 50,
  ): Promise<any> {
    return this.webhookHandlerService.getWebhookHistory(integrationId, limit);
  }

  @Get('integrations/:integrationId/webhooks/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtient les statistiques des webhooks' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées' })
  async getWebhookStats(
    @Param('integrationId') integrationId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
  ): Promise<any> {
    return this.webhookHandlerService.getWebhookStats(integrationId, period);
  }

  @Post('webhooks/:webhookId/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Réessaye un webhook échoué' })
  @ApiResponse({ status: 200, description: 'Webhook réessayé' })
  async retryWebhook(@Param('webhookId') webhookId: string): Promise<{ status: string }> {
    await this.webhookHandlerService.retryWebhook(webhookId);
    return { status: 'retried' };
  }

  // ========================================
  // PRODUCT MAPPING
  // ========================================

  @Get('integrations/:integrationId/mappings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtient les mappings de produits' })
  @ApiResponse({ status: 200, description: 'Mappings récupérés' })
  async getProductMappings(@Param('integrationId') integrationId: string): Promise<any> {
    const mappings = await this.prisma.productMapping.findMany({
      where: { integrationId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
          },
        },
      },
    });

    return mappings;
  }

  @Post('integrations/:integrationId/mappings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crée un mapping de produit' })
  @ApiResponse({ status: 201, description: 'Mapping créé' })
  async createProductMapping(
    @Param('integrationId') integrationId: string,
    @Body() body: {
      luneoProductId: string;
      externalProductId: string;
      externalSku: string;
    },
  ): Promise<any> {
    return this.prisma.productMapping.create({
      data: {
        integrationId,
        luneoProductId: body.luneoProductId,
        externalProductId: body.externalProductId,
        externalSku: body.externalSku,
        syncStatus: 'synced' as const,
        lastSyncedAt: new Date(),
      },
    });
  }

  // ========================================
  // INTEGRATION MANAGEMENT
  // ========================================

  @Get('integrations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste toutes les intégrations' })
  @ApiResponse({ status: 200, description: 'Intégrations récupérées' })
  async listIntegrations(@Query('brandId') brandId?: string): Promise<any> {
    const where = brandId ? { brandId } : {};
    
    return this.prisma.ecommerceIntegration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('integrations/:integrationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtient une intégration' })
  @ApiResponse({ status: 200, description: 'Intégration récupérée' })
  async getIntegration(@Param('integrationId') integrationId: string): Promise<any> {
    return this.prisma.ecommerceIntegration.findUnique({
      where: { id: integrationId },
    });
  }

  @Put('integrations/:integrationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Met à jour une intégration' })
  @ApiResponse({ status: 200, description: 'Intégration mise à jour' })
  async updateIntegration(
    @Param('integrationId') integrationId: string,
    @Body() body: { status?: string; config?: any },
  ): Promise<any> {
    return this.prisma.ecommerceIntegration.update({
      where: { id: integrationId },
      data: body,
    });
  }

  @Delete('integrations/:integrationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprime une intégration' })
  @ApiResponse({ status: 204, description: 'Intégration supprimée' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteIntegration(@Param('integrationId') integrationId: string): Promise<void> {
    await this.prisma.ecommerceIntegration.delete({
      where: { id: integrationId },
    });
  }
}
