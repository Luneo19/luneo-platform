import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Req,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { BillingService } from './billing.service';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Obtenir la liste des plans de facturation' })
  @ApiResponse({ status: 200, description: 'Liste des plans retournée' })
  async getBillingPlans() {
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
  @ApiOperation({ summary: 'Obtenir l\'abonnement du shop' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiResponse({ status: 200, description: 'Abonnement retourné' })
  async getSubscription(@Query('shop') shop: string) {
    try {
      if (!shop) {
        throw new HttpException('Le paramètre shop est requis', HttpStatus.BAD_REQUEST);
      }

      const subscription = await this.billingService.getSubscription(shop);
      
      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de l\'abonnement:', error);
      throw new HttpException(
        'Erreur lors de la récupération de l\'abonnement',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('subscription')
  @ApiOperation({ summary: 'Créer un nouvel abonnement' })
  @ApiResponse({ status: 201, description: 'Abonnement créé avec succès' })
  async createSubscription(@Body() body: any, @Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      const subscription = await this.billingService.createSubscription(shop, body);
      
      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la création de l\'abonnement:', error);
      throw new HttpException(
        'Erreur lors de la création de l\'abonnement',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('subscription')
  @ApiOperation({ summary: 'Mettre à jour l\'abonnement' })
  @ApiResponse({ status: 200, description: 'Abonnement mis à jour avec succès' })
  async updateSubscription(@Body() body: any, @Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      const subscription = await this.billingService.updateSubscription(shop, body);
      
      return {
        success: true,
        data: subscription,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour de l\'abonnement:', error);
      throw new HttpException(
        'Erreur lors de la mise à jour de l\'abonnement',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('subscription')
  @ApiOperation({ summary: 'Annuler l\'abonnement' })
  @ApiResponse({ status: 200, description: 'Abonnement annulé avec succès' })
  async cancelSubscription(@Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      await this.billingService.cancelSubscription(shop);
      
      return {
        success: true,
        message: 'Abonnement annulé avec succès',
      };
    } catch (error) {
      this.logger.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      throw new HttpException(
        'Erreur lors de l\'annulation de l\'abonnement',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('usage')
  @ApiOperation({ summary: 'Enregistrer l\'utilisation du service' })
  @ApiResponse({ status: 200, description: 'Utilisation enregistrée avec succès' })
  async recordUsage(@Body() body: any, @Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      const usage = await this.billingService.recordUsage(shop, body);
      
      return {
        success: true,
        data: usage,
      };
    } catch (error) {
      this.logger.error('Erreur lors de l\'enregistrement de l\'utilisation:', error);
      throw new HttpException(
        'Erreur lors de l\'enregistrement de l\'utilisation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('usage')
  @ApiOperation({ summary: 'Obtenir l\'utilisation du service' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiQuery({ name: 'period', description: 'Période d\'utilisation (month, year)' })
  @ApiResponse({ status: 200, description: 'Utilisation retournée' })
  async getUsage(@Query('shop') shop: string, @Query('period') period: string = 'month') {
    try {
      if (!shop) {
        throw new HttpException('Le paramètre shop est requis', HttpStatus.BAD_REQUEST);
      }

      const usage = await this.billingService.getUsage(shop, period);
      
      return {
        success: true,
        data: usage,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la récupération de l\'utilisation:', error);
      throw new HttpException(
        'Erreur lors de la récupération de l\'utilisation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('invoices')
  @ApiOperation({ summary: 'Obtenir la liste des factures' })
  @ApiQuery({ name: 'shop', description: 'Domaine du shop Shopify' })
  @ApiQuery({ name: 'limit', description: 'Nombre de factures à retourner' })
  @ApiResponse({ status: 200, description: 'Liste des factures retournée' })
  async getInvoices(@Query('shop') shop: string, @Query('limit') limit: string = '10') {
    try {
      if (!shop) {
        throw new HttpException('Le paramètre shop est requis', HttpStatus.BAD_REQUEST);
      }

      const invoices = await this.billingService.getInvoices(shop, parseInt(limit));
      
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
  async getInvoice(@Query('shop') shop: string, @Query('id') id: string) {
    try {
      if (!shop) {
        throw new HttpException('Le paramètre shop est requis', HttpStatus.BAD_REQUEST);
      }

      if (!id) {
        throw new HttpException('L\'ID de la facture est requis', HttpStatus.BAD_REQUEST);
      }

      const invoice = await this.billingService.getInvoice(shop, id);
      
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
  async createCharge(@Body() body: any, @Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      const charge = await this.billingService.createCharge(shop, body);
      
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
  async getCharge(@Query('shop') shop: string, @Query('id') id: string) {
    try {
      if (!shop) {
        throw new HttpException('Le paramètre shop est requis', HttpStatus.BAD_REQUEST);
      }

      if (!id) {
        throw new HttpException('L\'ID de la charge est requis', HttpStatus.BAD_REQUEST);
      }

      const charge = await this.billingService.getCharge(shop, id);
      
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
  async handleBillingWebhook(@Body() body: any, @Req() req: Request) {
    try {
      const shop = req.headers['x-shopify-shop-domain'] as string;
      const topic = req.headers['x-shopify-topic'] as string;
      
      if (!shop) {
        throw new HttpException('Shop non spécifié', HttpStatus.BAD_REQUEST);
      }

      await this.billingService.handleBillingWebhook(shop, topic, body);
      
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



