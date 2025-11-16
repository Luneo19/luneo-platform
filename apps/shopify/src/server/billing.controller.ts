import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { BillingService, Subscription, Usage, Invoice, Charge, BillingPlan } from './billing.service';

interface CreateSubscriptionDto {
  plan_id: string;
  trial_days?: number;
}

interface UpdateSubscriptionDto {
  plan_id?: string;
  status?: Subscription['status'];
}

interface RecordUsageDto {
  ai_generations?: number;
  ar_views?: number;
  widget_embeds?: number;
  storage_used_gb?: number;
}

interface CreateChargeDto {
  name: string;
  price: number;
  currency: string;
  return_url: string;
}

interface ShopifyWebhookHeaders {
  shop: string;
  topic: string;
}

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  private extractShopDomain(shopDomain?: string): string {
    if (!shopDomain) {
      throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
    }
    return shopDomain;
  }

  private extractWebhookHeaders(shopDomain?: string, topic?: string): ShopifyWebhookHeaders {
    if (!topic) {
      throw new HttpException('Topic Shopify non spécifié', HttpStatus.BAD_REQUEST);
    }

    return {
      shop: this.extractShopDomain(shopDomain),
      topic,
    };
  }

  @Get('plans')
  @ApiOperation({ summary: 'Obtenir la liste des plans de facturation' })
  @ApiResponse({ status: 200, description: 'Liste des plans retournée' })
  async getBillingPlans(): Promise<{ success: true; data: BillingPlan[] }> {
    try {
      const plans = await this.billingService.getBillingPlans();

      return {
        success: true,
        data: plans,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des plans:', error);
      throw new HttpException(
        'Erreur lors de la récupération des plans',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('subscription')
  @ApiOperation({ summary: "Obtenir l'abonnement du shop" })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiResponse({ status: 200, description: 'Abonnement retourné' })
  async getSubscription(@Query('shop') shop: string): Promise<{ success: true; data: Subscription | null }> {
    try {
      const subscription = await this.billingService.getSubscription(this.extractShopDomain(shop));

      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la récupération de l'abonnement:", error);
      throw new HttpException(
        "Erreur lors de la récupération de l'abonnement",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('subscription')
  @ApiOperation({ summary: 'Créer un nouvel abonnement' })
  @ApiResponse({ status: 201, description: 'Abonnement créé avec succès' })
  async createSubscription(
    @Body() body: CreateSubscriptionDto,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<{ success: true; data: Subscription }> {
    try {
      const subscription = await this.billingService.createSubscription(this.extractShopDomain(shopDomain), body);

      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la création de l'abonnement:", error);
      throw new HttpException(
        "Erreur lors de la création de l'abonnement",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('subscription')
  @ApiOperation({ summary: "Mettre à jour l'abonnement" })
  @ApiResponse({ status: 200, description: 'Abonnement mis à jour avec succès' })
  async updateSubscription(
    @Body() body: UpdateSubscriptionDto,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<{ success: true; data: Subscription }> {
    try {
      const subscription = await this.billingService.updateSubscription(this.extractShopDomain(shopDomain), body);

      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la mise à jour de l'abonnement:", error);
      throw new HttpException(
        "Erreur lors de la mise à jour de l'abonnement",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('subscription')
  @ApiOperation({ summary: "Annuler l'abonnement" })
  @ApiResponse({ status: 200, description: 'Abonnement annulé avec succès' })
  async cancelSubscription(
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<{ success: true; message: string }> {
    try {
      await this.billingService.cancelSubscription(this.extractShopDomain(shopDomain));

      return {
        success: true,
        message: 'Abonnement annulé avec succès',
      };
    } catch (error) {
      this.logger.error("Erreur lors de l'annulation de l'abonnement:", error);
      throw new HttpException(
        "Erreur lors de l'annulation de l'abonnement",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('usage')
  @ApiOperation({ summary: "Enregistrer l'utilisation du service" })
  @ApiResponse({ status: 200, description: 'Utilisation enregistrée avec succès' })
  async recordUsage(
    @Body() body: RecordUsageDto,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<{ success: true; data: Usage }> {
    try {
      const usage = await this.billingService.recordUsage(this.extractShopDomain(shopDomain), body);

      return {
        success: true,
        data: usage,
      };
    } catch (error) {
      this.logger.error("Erreur lors de l'enregistrement de l'utilisation:", error);
      throw new HttpException(
        "Erreur lors de l'enregistrement de l'utilisation",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('usage')
  @ApiOperation({ summary: "Obtenir l'utilisation du service" })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiQuery({ name: 'period', description: "Période d'utilisation (month, year)" })
  @ApiResponse({ status: 200, description: 'Utilisation retournée' })
  async getUsage(
    @Query('shop') shop: string,
    @Query('period') period: string = 'month',
  ): Promise<{ success: true; data: Usage[] }> {
    try {
      const usage = await this.billingService.getUsage(this.extractShopDomain(shop), period);

      return {
        success: true,
        data: usage,
      };
    } catch (error) {
      this.logger.error("Erreur lors de la récupération de l'utilisation:", error);
      throw new HttpException(
        "Erreur lors de la récupération de l'utilisation",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Obtenir la liste des factures' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiQuery({ name: 'limit', description: 'Nombre de factures à retourner' })
  @ApiResponse({ status: 200, description: 'Liste des factures retournée' })
  async getInvoices(
    @Query('shop') shop: string,
    @Query('limit') limit = '10',
  ): Promise<{ success: true; data: Invoice[] }> {
    try {
      const parsedLimit = Number.parseInt(limit, 10);
      const invoices = await this.billingService.getInvoices(
        this.extractShopDomain(shop),
        Number.isNaN(parsedLimit) ? 10 : parsedLimit,
      );

      return {
        success: true,
        data: invoices,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération des factures:', error);
      throw new HttpException(
        'Erreur lors de la récupération des factures',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('invoice/:id')
  @ApiOperation({ summary: 'Obtenir une facture spécifique' })
  @ApiResponse({ status: 200, description: 'Facture retournée' })
  async getInvoice(
    @Query('shop') shop: string,
    @Query('id') id: string,
  ): Promise<{ success: true; data: Invoice | null }> {
    try {
      if (!id) {
        throw new HttpException("L'ID de la facture est requis", HttpStatus.BAD_REQUEST);
      }

      const invoice = await this.billingService.getInvoice(this.extractShopDomain(shop), id);

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la facture:', error);
      throw new HttpException(
        'Erreur lors de la récupération de la facture',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('charge')
  @ApiOperation({ summary: 'Créer une charge Shopify' })
  @ApiResponse({ status: 201, description: 'Charge créée avec succès' })
  async createCharge(
    @Body() body: CreateChargeDto,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
  ): Promise<{ success: true; data: Charge }> {
    try {
      const charge = await this.billingService.createCharge(this.extractShopDomain(shopDomain), body);

      return {
        success: true,
        data: charge,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la création de la charge:', error);
      throw new HttpException(
        'Erreur lors de la création de la charge',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('charge/:id')
  @ApiOperation({ summary: 'Obtenir une charge spécifique' })
  @ApiResponse({ status: 200, description: 'Charge retournée' })
  async getCharge(
    @Query('shop') shop: string,
    @Query('id') id: string,
  ): Promise<{ success: true; data: Charge | null }> {
    try {
      if (!id) {
        throw new HttpException("L'ID de la charge est requis", HttpStatus.BAD_REQUEST);
      }

      const charge = await this.billingService.getCharge(this.extractShopDomain(shop), id);

      return {
        success: true,
        data: charge,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de la charge:', error);
      throw new HttpException(
        'Erreur lors de la récupération de la charge',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook de facturation Shopify' })
  @ApiResponse({ status: 200, description: 'Webhook traité avec succès' })
  async handleBillingWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-shopify-shop-domain') shopDomain?: string,
    @Headers('x-shopify-topic') topic?: string,
  ): Promise<{ success: true; message: string }> {
    try {
      const headers = this.extractWebhookHeaders(shopDomain, topic);
      await this.billingService.handleBillingWebhook(headers.shop, headers.topic, body);

      return {
        success: true,
        message: 'Webhook de facturation traité avec succès',
      };
    } catch (error) {
      this.logger.error('Erreur lors du traitement du webhook de facturation:', error);
      throw new HttpException(
        'Erreur lors du traitement du webhook de facturation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
