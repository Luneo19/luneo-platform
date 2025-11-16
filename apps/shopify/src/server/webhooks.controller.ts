import {
  Body,
  Controller,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  ShopifyCustomer,
  ShopifyInventoryLevel,
  ShopifyOrder,
  ShopifyProduct,
} from './types/shopify.types';
import { WebhooksService } from './webhooks.service';
import { HmacGuard } from './guards/hmac.guard';

type SuccessResponse = { success: true; message: string };

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(HmacGuard)
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  private extractShopDomain(shopDomain?: string): string {
    if (!shopDomain) {
      throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
    }
    return shopDomain;
  }

  private buildSuccessResponse(message = 'Webhook traité avec succès'): SuccessResponse {
    return { success: true, message };
  }

  private handleError(context: string, error: unknown): never {
    this.logger.error(context, error);
    throw new HttpException('Erreur lors du traitement du webhook', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @Post('app/uninstalled')
  @ApiOperation({ summary: "Webhook de désinstallation de l'application" })
  @ApiHeader({ name: 'X-Shopify-Topic', description: 'Topic du webhook' })
  @ApiHeader({ name: 'X-Shopify-Hmac-Sha256', description: 'HMAC de validation' })
  @ApiHeader({ name: 'X-Shopify-Shop-Domain', description: 'Domaine du shop' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async appUninstalled(
    @Body() body: Record<string, unknown>,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<SuccessResponse> {
    try {
      const domain = this.extractShopDomain(shopDomain);
      this.logger.log(`Webhook app/uninstalled reçu pour le shop: ${domain}`);
      await this.webhooksService.handleAppUninstalled(domain, body);
      return this.buildSuccessResponse();
    } catch (error) {
      return this.handleError('Erreur lors du traitement du webhook app/uninstalled:', error);
    }
  }

  @Post('orders/create')
  @ApiOperation({ summary: 'Webhook de création de commande' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async orderCreated(
    @Body() body: ShopifyOrder,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<SuccessResponse> {
    try {
      const domain = this.extractShopDomain(shopDomain);
      this.logger.log(`Webhook orders/create reçu pour le shop: ${domain}`);
      await this.webhooksService.handleOrderCreated(domain, body);
      return this.buildSuccessResponse();
    } catch (error) {
      return this.handleError('Erreur lors du traitement du webhook orders/create:', error);
    }
  }

  @Post('orders/updated')
  @ApiOperation({ summary: 'Webhook de mise à jour de commande' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async orderUpdated(
    @Body() body: ShopifyOrder,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<SuccessResponse> {
    try {
      const domain = this.extractShopDomain(shopDomain);
      this.logger.log(`Webhook orders/updated reçu pour le shop: ${domain}`);
      await this.webhooksService.handleOrderUpdated(domain, body);
      return this.buildSuccessResponse();
    } catch (error) {
      return this.handleError('Erreur lors du traitement du webhook orders/updated:', error);
    }
  }

  @Post('orders/paid')
  @ApiOperation({ summary: 'Webhook de paiement de commande' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async orderPaid(
    @Body() body: ShopifyOrder,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<SuccessResponse> {
    try {
      const domain = this.extractShopDomain(shopDomain);
      this.logger.log(`Webhook orders/paid reçu pour le shop: ${domain}`);
      await this.webhooksService.handleOrderPaid(domain, body);
      return this.buildSuccessResponse();
    } catch (error) {
      return this.handleError('Erreur lors du traitement du webhook orders/paid:', error);
    }
  }

  @Post('orders/cancelled')
  @ApiOperation({ summary: "Webhook d'annulation de commande" })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async orderCancelled(
    @Body() body: ShopifyOrder,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<SuccessResponse> {
    try {
      const domain = this.extractShopDomain(shopDomain);
      this.logger.log(`Webhook orders/cancelled reçu pour le shop: ${domain}`);
      await this.webhooksService.handleOrderCancelled(domain, body);
      return this.buildSuccessResponse();
    } catch (error) {
      return this.handleError('Erreur lors du traitement du webhook orders/cancelled:', error);
    }
  }

  @Post('orders/fulfilled')
  @ApiOperation({ summary: 'Webhook de livraison de commande' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async orderFulfilled(
    @Body() body: ShopifyOrder,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<SuccessResponse> {
    try {
      const domain = this.extractShopDomain(shopDomain);
      this.logger.log(`Webhook orders/fulfilled reçu pour le shop: ${domain}`);
      await this.webhooksService.handleOrderFulfilled(domain, body);
      return this.buildSuccessResponse();
    } catch (error) {
      return this.handleError('Erreur lors du traitement du webhook orders/fulfilled:', error);
    }
  }

  @Post('products/create')
  @ApiOperation({ summary: 'Webhook de création de produit' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async productCreated(
    @Body() body: ShopifyProduct,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<SuccessResponse> {
    try {
      const domain = this.extractShopDomain(shopDomain);
      this.logger.log(`Webhook products/create reçu pour le shop: ${domain}`);
      await this.webhooksService.handleProductCreated(domain, body);
      return this.buildSuccessResponse();
    } catch (error) {
      return this.handleError('Erreur lors du traitement du webhook products/create:', error);
    }
  }

  @Post('products/update')
  @ApiOperation({ summary: 'Webhook de mise à jour de produit' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async productUpdated(
    @Body() body: ShopifyProduct,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<SuccessResponse> {
    try {
      const domain = this.extractShopDomain(shopDomain);
      this.logger.log(`Webhook products/update reçu pour le shop: ${domain}`);
      await this.webhooksService.handleProductUpdated(domain, body);
      return this.buildSuccessResponse();
    } catch (error) {
      return this.handleError('Erreur lors du traitement du webhook products/update:', error);
    }
  }

  @Post('products/delete')
  @ApiOperation({ summary: 'Webhook de suppression de produit' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async productDeleted(
    @Body() body: ShopifyProduct,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<SuccessResponse> {
    try {
      const domain = this.extractShopDomain(shopDomain);
      this.logger.log(`Webhook products/delete reçu pour le shop: ${domain}`);
      await this.webhooksService.handleProductDeleted(domain, body);
      return this.buildSuccessResponse();
    } catch (error) {
      return this.handleError('Erreur lors du traitement du webhook products/delete:', error);
    }
  }

  @Post('customers/create')
  @ApiOperation({ summary: 'Webhook de création de client' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async customerCreated(
    @Body() body: ShopifyCustomer,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<SuccessResponse> {
    try {
      const domain = this.extractShopDomain(shopDomain);
      this.logger.log(`Webhook customers/create reçu pour le shop: ${domain}`);
      await this.webhooksService.handleCustomerCreated(domain, body);
      return this.buildSuccessResponse();
    } catch (error) {
      return this.handleError('Erreur lors du traitement du webhook customers/create:', error);
    }
  }

  @Post('customers/update')
  @ApiOperation({ summary: 'Webhook de mise à jour de client' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async customerUpdated(
    @Body() body: ShopifyCustomer,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<SuccessResponse> {
    try {
      const domain = this.extractShopDomain(shopDomain);
      this.logger.log(`Webhook customers/update reçu pour le shop: ${domain}`);
      await this.webhooksService.handleCustomerUpdated(domain, body);
      return this.buildSuccessResponse();
    } catch (error) {
      return this.handleError('Erreur lors du traitement du webhook customers/update:', error);
    }
  }

  @Post('customers/delete')
  @ApiOperation({ summary: 'Webhook de suppression de client' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async customerDeleted(
    @Body() body: ShopifyCustomer,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<SuccessResponse> {
    try {
      const domain = this.extractShopDomain(shopDomain);
      this.logger.log(`Webhook customers/delete reçu pour le shop: ${domain}`);
      await this.webhooksService.handleCustomerDeleted(domain, body);
      return this.buildSuccessResponse();
    } catch (error) {
      return this.handleError('Erreur lors du traitement du webhook customers/delete:', error);
    }
  }

  @Post('inventory_levels/update')
  @ApiOperation({ summary: 'Webhook de mise à jour des niveaux de stock' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async inventoryLevelsUpdated(
    @Body() body: ShopifyInventoryLevel,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<SuccessResponse> {
    try {
      const domain = this.extractShopDomain(shopDomain);
      this.logger.log(`Webhook inventory_levels/update reçu pour le shop: ${domain}`);
      await this.webhooksService.handleInventoryLevelsUpdated(domain, body);
      return this.buildSuccessResponse();
    } catch (error) {
      return this.handleError('Erreur lors du traitement du webhook inventory_levels/update:', error);
    }
  }
}
