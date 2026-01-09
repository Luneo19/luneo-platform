import { CurrentUser } from '@/common/types/user.types';
import { BadRequestException, Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Logger, Post, Query, RawBodyRequest, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import Stripe from 'stripe';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BillingService } from './billing.service';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Créer une session de paiement Stripe' })
  @ApiResponse({ status: 200, description: 'Session créée avec succès' })
  async createCheckoutSession(
    @Body() body: { planId: string; email?: string }
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Pour les utilisateurs non connectés, on utilise l'email fourni
      const userId = 'anonymous';
      const userEmail = body.email || 'user@example.com';

      const result = await this.billingService.createCheckoutSession(
        body.planId,
        userId,
        userEmail
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les informations d\'abonnement de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Informations d\'abonnement récupérées avec succès' })
  async getSubscription(
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.billingService.getSubscription(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('invoices')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les factures de l\'utilisateur' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Factures récupérées avec succès' })
  async getInvoices(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.billingService.getInvoices(req.user.id, pageNum, limitNum);
  }

  @UseGuards(JwtAuthGuard)
  @Get('payment-methods')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les méthodes de paiement de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Méthodes de paiement récupérées avec succès' })
  async getPaymentMethods(
    @Request() req: ExpressRequest & { user: CurrentUser }
  ) {
    return this.billingService.getPaymentMethods(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('payment-methods')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter une méthode de paiement' })
  @ApiResponse({ status: 200, description: 'Méthode de paiement ajoutée avec succès' })
  async addPaymentMethod(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Body() body: { paymentMethodId: string; setAsDefault?: boolean }
  ) {
    return this.billingService.addPaymentMethod(
      req.user.id,
      body.paymentMethodId,
      body.setAsDefault || false
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('payment-methods')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer une méthode de paiement' })
  @ApiResponse({ status: 200, description: 'Méthode de paiement supprimée avec succès' })
  async removePaymentMethod(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Query('id') paymentMethodId: string
  ) {
    if (!paymentMethodId) {
      throw new BadRequestException('Payment method ID is required');
    }
    return this.billingService.removePaymentMethod(req.user.id, paymentMethodId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('customer-portal')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une session pour le portail client Stripe' })
  @ApiResponse({ status: 200, description: 'Session créée avec succès' })
  async createCustomerPortalSession(
    @Request() req: ExpressRequest & { user: CurrentUser }
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const result = await this.billingService.createCustomerPortalSession(
        req.user.id
      );

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook Stripe pour les événements de paiement' })
  async handleWebhook(
    @Request() req: RawBodyRequest<ExpressRequest>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean; processed?: boolean }> {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature header');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET is not configured');
      throw new BadRequestException('Webhook secret not configured');
    }

    let event: Stripe.Event;

    try {
      const stripe = await this.billingService.getStripe();
      event = stripe.webhooks.constructEvent(
        req.rawBody as Buffer,
        signature,
        webhookSecret,
      );
    } catch (err: any) {
      this.logger.warn('Invalid Stripe webhook signature', { error: err.message });
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    this.logger.log('Stripe webhook received', {
      type: event.type,
      id: event.id,
    });

    try {
      const result = await this.billingService.handleStripeWebhook(event);
      
      return {
        received: true,
        processed: result.processed,
      };
    } catch (error) {
      this.logger.error('Error processing Stripe webhook', error, {
        eventType: event.type,
        eventId: event.id,
      });
      throw error;
    }
  }
}
