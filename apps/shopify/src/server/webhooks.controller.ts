import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';
import { HmacGuard } from './guards/hmac.guard';
import { UseGuards } from '@nestjs/common';

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(HmacGuard)
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('app/uninstalled')
  @ApiOperation({ summary: 'Webhook d\'désinstallation de l\'application' })
  @ApiHeader({ name: 'X-Shopify-Topic', description: 'Topic du webhook' })
  @ApiHeader({ name: 'X-Shopify-Hmac-Sha256', description: 'HMAC de validation' })
  @ApiHeader({ name: 'X-Shopify-Shop-Domain', description: 'Domaine du shop' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  @ApiResponse({ status: 401, description: 'HMAC invalide' })
  async appUninstalled(
    @Body() body: any,
    @Headers('x-shopify-shop-domain') shopDomain: string,
    @Headers('x-shopify-topic') topic: string,
    @Headers('x-shopify-hmac-sha256') hmac: string,
  ) {
    try {
      this.logger.log(`Webhook app/uninstalled reçu pour le shop: ${shopDomain}`);
      
      await this.webhooksService.handleAppUninstalled(shopDomain, body);
      
      return { success: true, message: 'Webhook traité avec succès' };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook app/uninstalled:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('orders/create')
  @ApiOperation({ summary: 'Webhook de création de commande' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async orderCreated(
    @Body() body: any,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    try {
      this.logger.log(`Webhook orders/create reçu pour le shop: ${shopDomain}`);
      
      await this.webhooksService.handleOrderCreated(shopDomain, body);
      
      return { success: true, message: 'Webhook traité avec succès' };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook orders/create:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('orders/updated')
  @ApiOperation({ summary: 'Webhook de mise à jour de commande' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async orderUpdated(
    @Body() body: any,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    try {
      this.logger.log(`Webhook orders/updated reçu pour le shop: ${shopDomain}`);
      
      await this.webhooksService.handleOrderUpdated(shopDomain, body);
      
      return { success: true, message: 'Webhook traité avec succès' };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook orders/updated:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('orders/paid')
  @ApiOperation({ summary: 'Webhook de paiement de commande' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async orderPaid(
    @Body() body: any,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    try {
      this.logger.log(`Webhook orders/paid reçu pour le shop: ${shopDomain}`);
      
      await this.webhooksService.handleOrderPaid(shopDomain, body);
      
      return { success: true, message: 'Webhook traité avec succès' };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook orders/paid:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('orders/cancelled')
  @ApiOperation({ summary: 'Webhook d\'annulation de commande' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async orderCancelled(
    @Body() body: any,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    try {
      this.logger.log(`Webhook orders/cancelled reçu pour le shop: ${shopDomain}`);
      
      await this.webhooksService.handleOrderCancelled(shopDomain, body);
      
      return { success: true, message: 'Webhook traité avec succès' };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook orders/cancelled:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('orders/fulfilled')
  @ApiOperation({ summary: 'Webhook de livraison de commande' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async orderFulfilled(
    @Body() body: any,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    try {
      this.logger.log(`Webhook orders/fulfilled reçu pour le shop: ${shopDomain}`);
      
      await this.webhooksService.handleOrderFulfilled(shopDomain, body);
      
      return { success: true, message: 'Webhook traité avec succès' };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook orders/fulfilled:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('products/create')
  @ApiOperation({ summary: 'Webhook de création de produit' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async productCreated(
    @Body() body: any,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    try {
      this.logger.log(`Webhook products/create reçu pour le shop: ${shopDomain}`);
      
      await this.webhooksService.handleProductCreated(shopDomain, body);
      
      return { success: true, message: 'Webhook traité avec succès' };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook products/create:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('products/update')
  @ApiOperation({ summary: 'Webhook de mise à jour de produit' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async productUpdated(
    @Body() body: any,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    try {
      this.logger.log(`Webhook products/update reçu pour le shop: ${shopDomain}`);
      
      await this.webhooksService.handleProductUpdated(shopDomain, body);
      
      return { success: true, message: 'Webhook traité avec succès' };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook products/update:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('products/delete')
  @ApiOperation({ summary: 'Webhook de suppression de produit' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async productDeleted(
    @Body() body: any,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    try {
      this.logger.log(`Webhook products/delete reçu pour le shop: ${shopDomain}`);
      
      await this.webhooksService.handleProductDeleted(shopDomain, body);
      
      return { success: true, message: 'Webhook traité avec succès' };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook products/delete:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('customers/create')
  @ApiOperation({ summary: 'Webhook de création de client' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async customerCreated(
    @Body() body: any,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    try {
      this.logger.log(`Webhook customers/create reçu pour le shop: ${shopDomain}`);
      
      await this.webhooksService.handleCustomerCreated(shopDomain, body);
      
      return { success: true, message: 'Webhook traité avec succès' };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook customers/create:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('customers/update')
  @ApiOperation({ summary: 'Webhook de mise à jour de client' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async customerUpdated(
    @Body() body: any,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    try {
      this.logger.log(`Webhook customers/update reçu pour le shop: ${shopDomain}`);
      
      await this.webhooksService.handleCustomerUpdated(shopDomain, body);
      
      return { success: true, message: 'Webhook traité avec succès' };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook customers/update:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('customers/delete')
  @ApiOperation({ summary: 'Webhook de suppression de client' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async customerDeleted(
    @Body() body: any,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    try {
      this.logger.log(`Webhook customers/delete reçu pour le shop: ${shopDomain}`);
      
      await this.webhooksService.handleCustomerDeleted(shopDomain, body);
      
      return { success: true, message: 'Webhook traité avec succès' };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook customers/delete:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('inventory_levels/update')
  @ApiOperation({ summary: 'Webhook de mise à jour des niveaux de stock' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async inventoryLevelsUpdated(
    @Body() body: any,
    @Headers('x-shopify-shop-domain') shopDomain: string,
  ) {
    try {
      this.logger.log(`Webhook inventory_levels/update reçu pour le shop: ${shopDomain}`);
      
      await this.webhooksService.handleInventoryLevelsUpdated(shopDomain, body);
      
      return { success: true, message: 'Webhook traité avec succès' };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook inventory_levels/update:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}



