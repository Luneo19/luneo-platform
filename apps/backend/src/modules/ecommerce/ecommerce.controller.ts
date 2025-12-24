import { PrismaService } from '@/libs/prisma/prisma.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Query,
    Res,
    UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { MagentoConnector } from './connectors/magento/magento.connector';
import { ShopifyConnector } from './connectors/shopify/shopify.connector';
import { WooCommerceConnector } from './connectors/woocommerce/woocommerce.connector';
import { SyncOrdersDto, SyncProductsDto, UpdateIntegrationDto } from './dto/shopify-webhook.dto';
import type {
    EcommerceIntegration,
    ProductMapping,
    ShopifyProduct,
    SyncOptions,
    SyncStats,
    WebhookHistory
} from './interfaces/ecommerce.interface';
import { OrderSyncService } from './services/order-sync.service';
import { ProductSyncService } from './services/product-sync.service';
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
    @Body() payload: Record<string, unknown>,
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
  ): Promise<{ products: ShopifyProduct[]; total: number }> {
    const products = await this.shopifyConnector.getProducts(integrationId, { limit });
    // getProducts retourne directement ShopifyProduct[]
    return {
      products,
      total: products.length,
    };
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
  ): Promise<{ id: string; status: string; shopUrl: string }> {
    const integration = await this.woocommerceConnector.connect(
      body.brandId,
      body.siteUrl,
      body.consumerKey,
      body.consumerSecret,
    );
    return {
      id: integration.id,
      status: integration.status,
      shopUrl: integration.shopDomain || body.siteUrl,
    };
  }

  @Post('woocommerce/webhook')
  @ApiOperation({ summary: 'Reçoit les webhooks WooCommerce' })
  @ApiResponse({ status: 200, description: 'Webhook traité' })
  @HttpCode(HttpStatus.OK)
  async woocommerceWebhook(
    @Headers('x-wc-webhook-topic') topic: string,
    @Headers('x-wc-webhook-signature') signature: string,
    @Body() payload: Record<string, unknown>,
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
  ): Promise<{ success: boolean; synced: number; errors?: string[] }> {
    const result = await this.productSyncService.syncProducts({ integrationId });
    return {
      success: result.status === 'success',
      synced: result.itemsProcessed,
      errors: result.errors?.map(e => e.message || String(e)),
    };
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
  ): Promise<{ id: string; status: string; storeUrl: string }> {
    const result = await this.magentoConnector.connect(
      body.brandId,
      body.storeUrl,
      body.apiToken,
    );
    // Adapter le résultat
    return {
      id: (result as any).id || '',
      status: (result as any).status || 'active',
      storeUrl: body.storeUrl,
    };
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
  ): Promise<{ success: boolean; synced: number; errors?: string[] }> {
    const result = await this.productSyncService.syncProducts({ integrationId });
    return {
      success: result.status === 'success',
      synced: result.itemsProcessed,
      errors: result.errors?.map(e => e.message || String(e)),
    };
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
    @Body() body?: SyncProductsDto,
  ): Promise<{ success: boolean; synced: number; errors?: string[] }> {
    const result = await this.productSyncService.syncProducts({
      integrationId,
      productIds: body?.productIds,
      options: body?.options ? {
        direction: body.options.direction || 'bidirectional',
        includeImages: body.options.includeImages ?? true,
        includeInventory: body.options.includeInventory ?? true,
        includeOrders: body.options.includeOrders ?? false,
        filterStatus: undefined,
        filterUpdatedSince: undefined,
        batchSize: undefined,
        dryRun: body.options.force === true ? false : undefined,
      } as SyncOptions : undefined,
    });
    return {
      success: result.status === 'success',
      synced: result.itemsProcessed,
      errors: result.errors?.map(e => e.message || String(e)),
    };
  }

  @Post('integrations/:integrationId/sync/orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Synchronise les commandes' })
  @ApiResponse({ status: 200, description: 'Synchronisation lancée' })
  async syncOrders(
    @Param('integrationId') integrationId: string,
    @Body() body?: SyncOrdersDto,
  ): Promise<{ success: boolean; synced: number; errors?: string[] }> {
    const result = await this.orderSyncService.syncOrders({
      integrationId,
      orderIds: body?.orderIds,
      options: body?.options ? {
        direction: body.options.direction || 'bidirectional',
        includeImages: body.options.includeImages ?? true,
        includeInventory: body.options.includeInventory ?? true,
        includeOrders: body.options.includeOrders ?? false,
        filterStatus: undefined,
        filterUpdatedSince: undefined,
        batchSize: undefined,
        dryRun: body.options.force === true ? false : undefined,
      } as SyncOptions : undefined,
    });
    return {
      success: result.status === 'success',
      synced: result.itemsProcessed,
      errors: result.errors?.map(e => e.message || String(e)),
    };
  }

  @Get('integrations/:integrationId/sync/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtient les statistiques de synchronisation' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées' })
  async getSyncStats(
    @Param('integrationId') integrationId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
  ): Promise<SyncStats> {
    const stats = await this.productSyncService.getSyncStats(integrationId, period);
    // Adapter ProductSyncService.SyncStats vers interface SyncStats
    return {
      period: stats.period,
      totalItems: stats.totalItemsProcessed,
      successful: stats.successfulSyncs,
      failed: stats.failedSyncs,
      averageDuration: stats.averageDuration,
      lastSyncAt: stats.lastSync?.createdAt,
      breakdown: {
        created: 0, // Non disponible dans ProductSyncService.SyncStats
        updated: 0,
        deleted: 0,
        skipped: 0,
      },
    };
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
  ): Promise<WebhookHistory[]> {
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
  ): Promise<SyncStats> {
    return this.webhookHandlerService.getWebhookStats(integrationId, period) as Promise<SyncStats>;
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
  async getProductMappings(@Param('integrationId') integrationId: string): Promise<ProductMapping[]> {
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

    return mappings as ProductMapping[];
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
  ): Promise<ProductMapping> {
    const mapping = await this.prisma.productMapping.create({
      data: {
        integrationId,
        luneoProductId: body.luneoProductId,
        externalProductId: body.externalProductId,
        externalSku: body.externalSku,
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
      },
    });
    return {
      id: mapping.id,
      integrationId: mapping.integrationId,
      luneoProductId: mapping.luneoProductId,
      externalProductId: mapping.externalProductId,
      externalSku: mapping.externalSku,
      syncStatus: mapping.syncStatus as 'synced' | 'pending' | 'failed' | 'conflict',
      lastSyncedAt: mapping.lastSyncedAt,
      metadata: mapping.metadata as Record<string, unknown> | undefined,
    };
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
  async getIntegration(@Param('integrationId') integrationId: string): Promise<EcommerceIntegration | null> {
    const integration = await this.prisma.ecommerceIntegration.findUnique({
      where: { id: integrationId },
    });
    if (!integration) return null;
    // Adapter Prisma EcommerceIntegration vers interface EcommerceIntegration
    return {
      id: integration.id,
      brandId: integration.brandId,
      platform: integration.platform as 'shopify' | 'woocommerce' | 'magento',
      shopDomain: integration.shopDomain,
      accessToken: integration.accessToken || undefined,
      refreshToken: integration.refreshToken || undefined,
      config: (integration.config as any) || {},
      status: integration.status as 'active' | 'inactive' | 'error' | 'pending',
      lastSyncAt: integration.lastSyncAt || undefined,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }

  @Put('integrations/:integrationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Met à jour une intégration' })
  @ApiResponse({ status: 200, description: 'Intégration mise à jour' })
  async updateIntegration(
    @Param('integrationId') integrationId: string,
    @Body() body: UpdateIntegrationDto,
  ): Promise<{ id: string; status: string; config: Record<string, unknown> }> {
    const updated = await this.prisma.ecommerceIntegration.update({
      where: { id: integrationId },
      data: {
        status: body.status,
        config: body.config as any, // Prisma JsonValue type
      },
    });
    return {
      id: updated.id,
      status: updated.status,
      config: updated.config as Record<string, unknown>,
    };
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
