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

  /** @Public: checkout can be started without auth (email in body) */
  @Public()
  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Créer une session de paiement Stripe avec support des add-ons' })
  @ApiResponse({ status: 200, description: 'Session créée avec succès' })
  @ApiResponse({ status: 400, description: 'Email invalide ou manquant' })
  async createCheckoutSession(
    @Body() body: {
      planId: string;
      email?: string;
      billingInterval?: 'monthly' | 'yearly';
      addOns?: Array<{ type: string; quantity: number }>;
    },
  ): Promise<{ success: boolean; url?: string; sessionId?: string; error?: string }> {
    try {
      // Validation de l'email - obligatoire pour les utilisateurs non connectés
      if (!body.email || !body.email.includes('@') || body.email.length < 5) {
        throw new BadRequestException('A valid email address is required');
      }

      // Normaliser l'email
      const userEmail = body.email.toLowerCase().trim();
      
      // Générer un userId temporaire unique basé sur timestamp + random
      // Ce userId sera remplacé par l'ID réel après création du compte via webhook Stripe
      const tempUserId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      this.logger.log(`Creating checkout session for guest user: ${userEmail}`);

      const result = await this.billingService.createCheckoutSession(
        body.planId,
        tempUserId,
        userEmail,
        {
          billingInterval: body.billingInterval || 'monthly',
          addOns: body.addOns,
        },
      );

      return result;
    } catch (error) {
      this.logger.error(`Checkout session creation failed: ${error.message}`);
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

  @UseGuards(JwtAuthGuard)
  @Post('change-plan')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Changer de plan d\'abonnement',
    description: `
      Change le plan d'abonnement de l'utilisateur.
      
      **Upgrades**: Appliqués immédiatement avec prorata (l'utilisateur est facturé pour la différence).
      **Downgrades**: Appliqués à la fin de la période de facturation courante (sauf si immediateChange=true).
      
      Le montant de prorata est calculé au prorata temporis en fonction du temps restant dans la période courante.
    `
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Plan changé avec succès',
    schema: {
      properties: {
        success: { type: 'boolean' },
        type: { type: 'string', enum: ['upgrade', 'downgrade', 'same'] },
        effectiveDate: { type: 'string', format: 'date-time' },
        prorationAmount: { type: 'number', description: 'Montant du prorata en centimes' },
        prorationAmountFormatted: { type: 'string', description: 'Montant formaté (ex: 12,50 €)' },
        message: { type: 'string' },
        subscriptionId: { type: 'string' },
        previousPlan: { type: 'string' },
        newPlan: { type: 'string' },
      }
    }
  })
  async changePlan(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Body() body: {
      planId: string;
      billingInterval?: 'monthly' | 'yearly';
      immediateChange?: boolean;
    }
  ) {
    if (!body.planId) {
      throw new BadRequestException('planId is required');
    }
    
    const validPlans = ['starter', 'professional', 'business', 'enterprise'];
    if (!validPlans.includes(body.planId.toLowerCase())) {
      throw new BadRequestException(`Invalid planId. Must be one of: ${validPlans.join(', ')}`);
    }

    return this.billingService.changePlan(req.user.id, body.planId.toLowerCase(), {
      billingInterval: body.billingInterval,
      immediateChange: body.immediateChange,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('preview-plan-change')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Prévisualiser un changement de plan',
    description: 'Affiche le montant du prorata et les détails du changement avant de l\'appliquer.'
  })
  @ApiQuery({ name: 'planId', required: true, type: String, description: 'ID du nouveau plan' })
  @ApiQuery({ name: 'interval', required: false, enum: ['monthly', 'yearly'], description: 'Intervalle de facturation' })
  @ApiResponse({ 
    status: 200, 
    description: 'Prévisualisation du changement de plan',
    schema: {
      properties: {
        currentPlan: { type: 'string' },
        newPlan: { type: 'string' },
        type: { type: 'string', enum: ['upgrade', 'downgrade', 'same'] },
        currentPrice: { type: 'number', description: 'Prix actuel en centimes' },
        newPrice: { type: 'number', description: 'Nouveau prix en centimes' },
        prorationAmount: { type: 'number', description: 'Montant du prorata en centimes' },
        prorationAmountFormatted: { type: 'string' },
        effectiveDate: { type: 'string', format: 'date-time' },
        nextBillingDate: { type: 'string', format: 'date-time' },
        currency: { type: 'string' },
      }
    }
  })
  async previewPlanChange(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Query('planId') planId: string,
    @Query('interval') interval?: 'monthly' | 'yearly',
  ) {
    if (!planId) {
      throw new BadRequestException('planId query parameter is required');
    }
    
    return this.billingService.previewPlanChange(
      req.user.id,
      planId.toLowerCase(),
      interval || 'monthly'
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('downgrade-impact')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Vérifier l\'impact d\'un downgrade',
    description: `
      Analyse l'impact d'un downgrade sur les ressources et fonctionnalités de l'utilisateur.
      
      Retourne:
      - Les ressources qui dépasseraient les nouvelles limites (produits, membres d'équipe, etc.)
      - Les fonctionnalités qui seraient perdues
      - Des recommandations pour préparer le downgrade
    `
  })
  @ApiQuery({ name: 'planId', required: true, type: String, description: 'ID du nouveau plan cible' })
  @ApiResponse({ 
    status: 200, 
    description: 'Analyse d\'impact du downgrade',
    schema: {
      properties: {
        hasImpact: { type: 'boolean' },
        impactedResources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              current: { type: 'number' },
              newLimit: { type: 'number' },
              excess: { type: 'number' },
              action: { type: 'string', enum: ['archived', 'readonly', 'deleted_warning'] },
              description: { type: 'string' },
            }
          }
        },
        lostFeatures: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
      }
    }
  })
  async checkDowngradeImpact(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Query('planId') planId: string,
  ) {
    if (!planId) {
      throw new BadRequestException('planId query parameter is required');
    }
    
    return this.billingService.checkDowngradeImpact(req.user.id, planId.toLowerCase());
  }

  @UseGuards(JwtAuthGuard)
  @Get('scheduled-changes')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Voir les changements de plan programmés',
    description: 'Retourne les informations sur un downgrade ou une annulation programmée.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Changements programmés',
    schema: {
      properties: {
        hasScheduledChanges: { type: 'boolean' },
        scheduledChanges: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['downgrade', 'cancel'] },
            newPlan: { type: 'string' },
            effectiveDate: { type: 'string', format: 'date-time' },
            reason: { type: 'string' },
          }
        },
        currentPlan: { type: 'string' },
        currentStatus: { type: 'string' },
      }
    }
  })
  async getScheduledChanges(
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    return this.billingService.getScheduledPlanChanges(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel-downgrade')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Annuler un downgrade programmé',
    description: 'Annule un downgrade qui était programmé pour la fin de la période de facturation.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Downgrade annulé avec succès',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        currentPlan: { type: 'string' },
      }
    }
  })
  async cancelScheduledDowngrade(
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    return this.billingService.cancelScheduledDowngrade(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel-subscription')
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Annuler l\'abonnement',
    description: 'Annule l\'abonnement. Par défaut, l\'annulation prend effet à la fin de la période de facturation.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Abonnement annulé',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        cancelAt: { type: 'string', format: 'date-time' },
      }
    }
  })
  async cancelSubscription(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Body() body: { immediate?: boolean },
  ) {
    return this.billingService.cancelSubscription(req.user.id, body?.immediate || false);
  }

  /** @Public: Stripe webhook; verified by stripe-signature */
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
