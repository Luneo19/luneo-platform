import { PrismaService } from '@/libs/prisma/prisma.service';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BrandOwnershipGuard } from '@/common/guards/brand-ownership.guard';
import {
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Logger,
    NotFoundException,
    BadRequestException,
    Param,
    Post,
    Put,
    Query,
    Res,
    UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { MagentoConnector } from '@/modules/ecommerce/connectors/magento/magento.connector';
import { ShopifyConnector } from '@/modules/ecommerce/connectors/shopify/shopify.connector';
import { WooCommerceConnector } from '@/modules/ecommerce/connectors/woocommerce/woocommerce.connector';
import { SyncOrdersDto, SyncProductsDto, UpdateIntegrationDto } from '@/modules/ecommerce/dto/shopify-webhook.dto';
import {
  ShopifyInstallDto,
  WooCommerceConnectDto,
  MagentoConnectDto,
  CreateProductMappingDto,
  QueueSyncJobDto,
  ScheduleRecurringSyncDto,
} from '@/modules/ecommerce/dto/ecommerce.dto';
import type {
    EcommerceIntegration,
    ProductMapping,
    ShopifyProduct,
    SyncOptions,
    SyncStats,
    WebhookHistory
} from '@/modules/ecommerce/interfaces/ecommerce.interface';
import { Prisma } from '@prisma/client';
import { OrderSyncService } from '@/modules/ecommerce/services/order-sync.service';
import { ProductSyncService } from '@/modules/ecommerce/services/product-sync.service';
import { WebhookHandlerService } from '@/modules/ecommerce/services/webhook-handler.service';
import { SyncEngineService } from '@/modules/ecommerce/services/sync-engine.service';

@ApiTags('E-commerce Integrations')
@Controller('ecommerce')
@UseGuards(JwtAuthGuard, BrandOwnershipGuard)
export class EcommerceController {
  private readonly logger = new Logger(EcommerceController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shopifyConnector: ShopifyConnector,
    private readonly woocommerceConnector: WooCommerceConnector,
    private readonly magentoConnector: MagentoConnector,
    private readonly productSyncService: ProductSyncService,
    private readonly orderSyncService: OrderSyncService,
    private readonly webhookHandlerService: WebhookHandlerService,
    private readonly syncEngine: SyncEngineService, // ✅ PHASE 4 - Sync Engine centralisé
  ) {}

  // ========================================
  // SHOPIFY
  // ========================================

  @Post('shopify/install')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Génère l\'URL d\'installation Shopify' })
  @ApiResponse({ status: 200, description: 'URL générée avec succès' })
  async shopifyInstall(
    @Body() body: ShopifyInstallDto,
  ): Promise<{ installUrl: string }> {
    const installUrl = this.shopifyConnector.generateInstallUrl(body.shop, body.brandId);
    return { installUrl };
  }

  @Get('shopify/callback')
  @Public()
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

      // Récupérer le brandId depuis le state parameter
      // Le state contient le brandId encodé lors de generateInstallUrl
      let brandId: string;
      try {
        // State can be: brandId directly, JSON encoded, or base64 encoded
        if (state.startsWith('{')) {
          const stateData = JSON.parse(state);
          brandId = stateData.brandId;
        } else if (state.includes(':')) {
          // Format: brandId:nonce
          brandId = state.split(':')[0];
        } else {
          // Try base64 decode
          try {
            const decoded = Buffer.from(state, 'base64').toString('utf-8');
            const stateData = JSON.parse(decoded);
            brandId = stateData.brandId;
          } catch {
            // State is the brandId directly
            brandId = state;
          }
        }
      } catch {
        brandId = state; // Fallback: state is the brandId directly
      }

      if (!brandId || brandId === 'undefined' || brandId === 'null') {
        throw new BadRequestException('Invalid brand ID in OAuth state');
      }

      // Sauvegarder l'intégration
      await this.shopifyConnector.saveIntegration(brandId, shop, accessToken);

      // Rediriger vers le dashboard avec succès
      res.redirect(`${process.env.FRONTEND_URL}/integrations?shopify=success&shop=${encodeURIComponent(shop)}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = 'shopify_connection_failed';
      this.logger.error('Shopify connection failed', { error: errorMessage });
      const frontendUrl = process.env.FRONTEND_URL ?? '';
      return res.redirect(`${frontendUrl}/dashboard/integrations?error=${errorCode}`);
    }
  }

  @Post('shopify/webhook')
  @Public()
  @Throttle({ default: { limit: 50, ttl: 60000 } })
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
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Synchronise les produits Shopify (import Shopify → Luneo)' })
  @ApiResponse({ status: 200, description: 'Synchronisation lancée' })
  async syncShopifyProducts(
    @Param('integrationId') integrationId: string,
  ) {
    return this.productSyncService.syncProducts({ integrationId });
  }

  @Put('shopify/:integrationId/products/:luneoProductId/sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Pousse la mise à jour d\'un produit Luneo vers Shopify (export)' })
  @ApiResponse({ status: 200, description: 'Produit poussé vers Shopify' })
  async pushShopifyProductUpdate(
    @Param('integrationId') integrationId: string,
    @Param('luneoProductId') luneoProductId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.productSyncService.syncProduct(integrationId, luneoProductId, 'export');
    return { success: true, message: 'Product pushed to Shopify' };
  }

  // ========================================
  // WOOCOMMERCE
  // ========================================

  @Post('woocommerce/connect')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Connecte une boutique WooCommerce' })
  @ApiResponse({ status: 201, description: 'Connexion réussie' })
  async woocommerceConnect(
    @Body() body: WooCommerceConnectDto,
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
  @Public()
  @Throttle({ default: { limit: 50, ttl: 60000 } })
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
  ): Promise<{ products: ShopifyProduct[]; total: number }> {
    const products = await this.woocommerceConnector.getProducts(integrationId, { per_page: perPage });
    return { products: products as unknown as ShopifyProduct[], total: products.length };
  }

  @Post('woocommerce/:integrationId/sync/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
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
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Connecte une boutique Magento' })
  @ApiResponse({ status: 201, description: 'Connexion réussie' })
  async magentoConnect(
    @Body() body: MagentoConnectDto,
  ): Promise<{ id: string; status: string; storeUrl: string }> {
    const result = await this.magentoConnector.connect(
      body.brandId,
      body.storeUrl,
      body.apiToken,
    );
    return {
      id: result.id ?? '',
      status: result.status ?? 'active',
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
  ): Promise<{ products: ShopifyProduct[]; total: number }> {
    const products = await this.magentoConnector.getProducts(integrationId, { pageSize });
    return { products: products as unknown as ShopifyProduct[], total: products.length };
  }

  @Post('magento/:integrationId/sync/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
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

  @Put('integrations/:integrationId/products/:luneoProductId/sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Pousse la mise à jour d\'un produit Luneo vers la plateforme (export)' })
  @ApiResponse({ status: 200, description: 'Produit poussé vers la plateforme' })
  async pushProductUpdate(
    @Param('integrationId') integrationId: string,
    @Param('luneoProductId') luneoProductId: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.productSyncService.syncProduct(integrationId, luneoProductId, 'export');
    return { success: true, message: 'Product pushed to platform' };
  }

  @Post('integrations/:integrationId/sync/products')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
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
  @Throttle({ default: { limit: 30, ttl: 60000 } })
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
  ) {
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
    const logs = await this.webhookHandlerService.getWebhookHistory(integrationId, limit);
    return logs.map((log) => ({
      id: log.id,
      integrationId,
      topic: log.event,
      status: (log.statusCode && log.statusCode >= 200 && log.statusCode < 300 ? 'success' : 'failed') as 'success' | 'failed' | 'pending',
      payload: (log.payload as Record<string, unknown>) ?? {},
      response: log.response ? (JSON.parse(log.response) as Record<string, unknown>) : undefined,
      error: log.error ?? undefined,
      processedAt: log.createdAt,
      createdAt: log.createdAt,
    }));
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
    return this.webhookHandlerService.getWebhookStats(integrationId, period) as unknown as Promise<SyncStats>;
  }

  @Post('webhooks/:webhookId/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
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
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Crée un mapping de produit' })
  @ApiResponse({ status: 201, description: 'Mapping créé' })
  async createProductMapping(
    @Param('integrationId') integrationId: string,
    @Body() body: CreateProductMappingDto,
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
  async listIntegrations(@Query('brandId') brandId?: string): Promise<EcommerceIntegration[]> {
    const where = brandId ? { brandId } : {};
    
    const integrations = await this.prisma.ecommerceIntegration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return integrations.map((i) => ({
      id: i.id,
      brandId: i.brandId,
      platform: i.platform as 'shopify' | 'woocommerce' | 'magento',
      shopDomain: i.shopDomain,
      accessToken: i.accessToken ?? undefined,
      refreshToken: i.refreshToken ?? undefined,
      config: (i.config as EcommerceIntegration['config']) ?? {},
      status: i.status as 'active' | 'inactive' | 'error' | 'pending',
      lastSyncAt: i.lastSyncAt ?? undefined,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));
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
    const config = integration.config as EcommerceIntegration['config'] | null;
    return {
      id: integration.id,
      brandId: integration.brandId,
      platform: integration.platform as 'shopify' | 'woocommerce' | 'magento',
      shopDomain: integration.shopDomain,
      accessToken: integration.accessToken || undefined,
      refreshToken: integration.refreshToken || undefined,
      config: config ?? {},
      status: integration.status as 'active' | 'inactive' | 'error' | 'pending',
      lastSyncAt: integration.lastSyncAt || undefined,
      createdAt: integration.createdAt,
      updatedAt: integration.updatedAt,
    };
  }

  @Put('integrations/:integrationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
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
        config: (body.config ?? {}) as Prisma.InputJsonValue,
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
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Supprime une intégration' })
  @ApiResponse({ status: 204, description: 'Intégration supprimée' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteIntegration(@Param('integrationId') integrationId: string): Promise<void> {
    await this.prisma.ecommerceIntegration.delete({
      where: { id: integrationId },
    });
  }

  // ========================================
  // SYNC ENGINE (PHASE 4 - Centraliser jobs BullMQ)
  // ========================================

  @Post('sync/queue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Ajoute un job de sync dans la queue BullMQ' })
  @ApiResponse({ status: 201, description: 'Job ajouté à la queue' })
  async queueSyncJob(
    @Body() body: QueueSyncJobDto,
  ): Promise<{ jobId: string; status: string }> {
    const jobId = await this.syncEngine.queueSyncJob({
      integrationId: body.integrationId,
      type: body.type,
      direction: body.direction,
      productIds: body.productIds,
      orderIds: body.orderIds,
      priority: body.priority,
      delay: body.delay,
    });

    return { jobId, status: 'queued' };
  }

  @Post('sync/schedule')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Programme un job de sync récurrent' })
  @ApiResponse({ status: 201, description: 'Job récurrent programmé' })
  async scheduleRecurringSync(
    @Body() body: ScheduleRecurringSyncDto,
  ): Promise<{ jobId: string; status: string }> {
    const jobId = await this.syncEngine.scheduleRecurringSync(
      body.integrationId,
      body.type,
      body.interval,
      {
        direction: body.direction,
      },
    );

    return { jobId, status: 'scheduled' };
  }

  @Get('sync/jobs/:jobId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtient le statut d\'un job de sync' })
  @ApiResponse({ status: 200, description: 'Statut du job' })
  async getJobStatus(@Param('jobId') jobId: string): Promise<Record<string, unknown>> {
    const status = await this.syncEngine.getJobStatus(jobId);
    if (!status) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }
    return status as unknown as Record<string, unknown>;
  }

  @Get('sync/integrations/:integrationId/jobs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtient les jobs d\'une intégration' })
  @ApiResponse({ status: 200, description: 'Liste des jobs' })
  async getIntegrationJobs(
    @Param('integrationId') integrationId: string,
    @Query('limit') limit?: number,
  ): Promise<Record<string, unknown>[]> {
    return this.syncEngine.getIntegrationJobs(integrationId, limit || 50) as unknown as Record<string, unknown>[];
  }

  @Post('sync/jobs/:jobId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Annule un job de sync' })
  @ApiResponse({ status: 200, description: 'Job annulé' })
  async cancelJob(@Param('jobId') jobId: string): Promise<{ status: string }> {
    await this.syncEngine.cancelJob(jobId);
    return { status: 'cancelled' };
  }

  @Post('sync/jobs/:jobId/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Réessaie un job échoué' })
  @ApiResponse({ status: 201, description: 'Job réessayé' })
  async retryJob(@Param('jobId') jobId: string): Promise<{ jobId: string; status: string }> {
    const newJobId = await this.syncEngine.retryJob(jobId);
    return { jobId: newJobId, status: 'retried' };
  }

  // ========================================
  // ANALYTICS
  // ========================================

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtient les analytics des intégrations' })
  @ApiResponse({ status: 200, description: 'Analytics récupérées' })
  async getAnalytics(
    @Query('brandId') brandId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{
    totalIntegrations: number;
    connectedIntegrations: number;
    totalSyncs: number;
    successRate: number;
    avgLatency: number;
    errorCount: number;
    byPlatform: Record<string, number>;
    byCategory: Record<string, number>;
    recentActivity: Array<{
      id: string;
      type: string;
      status: string;
      createdAt: Date;
    }>;
  }> {
    const where = brandId ? { brandId } : {};
    const dateFilter = startDate && endDate
      ? {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }
      : {};

    // Total integrations
    const totalIntegrations = await this.prisma.ecommerceIntegration.count({ where });

    // Connected integrations (status = 'active')
    const connectedIntegrations = await this.prisma.ecommerceIntegration.count({
      where: { ...where, status: 'active' },
    });

    // Get integration IDs for this brand
    const integrationIds = brandId
      ? (await this.prisma.ecommerceIntegration.findMany({
          where: { brandId },
          select: { id: true },
        })).map((i) => i.id)
      : (await this.prisma.ecommerceIntegration.findMany({
          select: { id: true },
        })).map((i) => i.id);

    // Sync logs
    const syncLogs = await this.prisma.syncLog.findMany({
      where: {
        integrationId: { in: integrationIds },
        ...dateFilter,
      },
      include: {
        integration: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const totalSyncs = syncLogs.length;
    const successfulSyncs = syncLogs.filter((log) => log.status === 'SUCCESS').length;
    const successRate = totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0;

    const durations = syncLogs.map((log) => log.duration).filter((d) => d > 0);
    const avgLatency = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    const errorCount = syncLogs.filter((log) => log.status === 'FAILED').length;

    // By platform
    const integrationsByPlatform = await this.prisma.ecommerceIntegration.groupBy({
      by: ['platform'],
      where,
      _count: true,
    });
    const byPlatform: Record<string, number> = {};
    for (const item of integrationsByPlatform) {
      byPlatform[item.platform] = item._count;
    }

    // By category (using sync type)
    const syncsByType = await this.prisma.syncLog.groupBy({
      by: ['type'],
      where: {
        integrationId: { in: integrationIds },
        ...dateFilter,
      },
      _count: true,
    });
    const byCategory: Record<string, number> = {};
    for (const item of syncsByType) {
      byCategory[item.type] = item._count;
    }

    // Recent activity (last 20 syncs)
    const recentActivity = syncLogs.slice(0, 20).map((log) => ({
      id: log.id,
      type: log.type,
      status: log.status,
      createdAt: log.createdAt,
    }));

    return {
      totalIntegrations,
      connectedIntegrations,
      totalSyncs,
      successRate: Math.round(successRate * 100) / 100,
      avgLatency: Math.round(avgLatency),
      errorCount,
      byPlatform,
      byCategory,
      recentActivity,
    };
  }
}
