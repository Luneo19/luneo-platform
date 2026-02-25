import { CurrentUser } from '@/common/types/user.types';
import { BadRequestException, Body, Controller, Delete, Get, Headers, HttpException, InternalServerErrorException, Logger, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { BillingService } from './billing.service';
import { CreateCheckoutSessionDto, AddPaymentMethodDto, ChangePlanDto, CancelSubscriptionDto } from './dto/billing.dto';

@ApiTags('Billing')
@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Create a Stripe checkout session.
   * Supports both authenticated users (JWT) and guest users (email in body).
   * For authenticated users, the real userId is used in Stripe metadata,
   * ensuring the webhook can update the correct user/brand after payment.
   */
  // BILLING FIX: Removed @Public() - require authentication for checkout to prevent
  // guest_* userId issues where subscriptions cannot be linked to real users.
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Créer une session de paiement Stripe avec support des add-ons' })
  @ApiResponse({ status: 200, description: 'Session créée avec succès' })
  @ApiResponse({ status: 400, description: 'Email invalide ou manquant' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  async createCheckoutSession(
    @Body() body: CreateCheckoutSessionDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<{ success: boolean; url?: string; sessionId?: string; error?: string }> {
    try {
      // BILLING FIX: Always use authenticated user (no more guest checkout)
      const userId = req.user.id;
      const userEmail = (body.email || req.user.email || '').toLowerCase().trim();

      if (!userEmail || !userEmail.includes('@')) {
        throw new BadRequestException('A valid email address is required');
      }

      this.logger.log(`Creating checkout session for authenticated user: ${userId}`);

      const result = await this.billingService.createCheckoutSession(
        body.planId,
        userId,
        userEmail,
        {
          billingInterval: body.billingInterval || 'monthly',
          addOns: body.addOns,
          country: body.country,
          locale: acceptLanguage ?? body.country,
        },
      );

      return {
        success: result.success,
        url: result.url ?? undefined,
        sessionId: result.sessionId,
      };
    } catch (error: unknown) {
      this.logger.error('Checkout session creation failed', error instanceof Error ? error.stack : String(error));
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('An error occurred while creating the checkout session');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify-session')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier une session de checkout Stripe' })
  @ApiQuery({ name: 'session_id', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Session vérifiée' })
  async verifySession(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Query('session_id') sessionId: string,
  ) {
    if (!sessionId) {
      throw new BadRequestException('session_id is required');
    }
    return this.billingService.verifyCheckoutSession(req.user.id, sessionId);
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
  @Get('usage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Compat: usage agrégé pour dashboard billing frontend' })
  async getUsage(
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const subscription = (await this.billingService.getSubscription(req.user.id)) as unknown as {
      currentUsage?: Record<string, number>;
    };
    const usage = subscription.currentUsage || {};

    return {
      messagesAi: Number(usage.aiGenerations || 0),
      conversations: Number(usage.aiGenerations || 0),
      documentsIndexed: Number(usage.designs || 0),
      activeAgents: Number(usage.teamMembers || 0),
      storageBytes: Math.round(Number(usage.storageGB || 0) * 1024 * 1024 * 1024),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('limits')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Compat: limites agrégées pour dashboard billing frontend' })
  async getLimits(
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const subscription = (await this.billingService.getSubscription(req.user.id)) as unknown as {
      limits?: Record<string, number>;
    };
    const limits = subscription.limits || {};

    return {
      monthlyMessagesAi: Number(limits.aiGenerationsPerMonth || 0),
      monthlyConversations: Number(limits.conversationsPerMonth || 0),
      monthlyDocumentsIndexed: Number(limits.documentsLimit || 0),
      maxActiveAgents: Number(limits.agentsLimit || 0),
      storageBytes: Math.round(Number(limits.storageGB || 0) * 1024 * 1024 * 1024),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('invoices')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Récupérer les factures de l\'utilisateur' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Factures récupérées. Note: le champ amount est en centimes (ex: 4900 = 49.00 EUR)' })
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
  @Get('invoices/export/csv')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Exporter les factures au format CSV' })
  @ApiResponse({ status: 200, description: 'CSV généré avec succès' })
  async exportInvoicesCSV(
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const invoicesResult = await this.billingService.getInvoices(req.user.id, 1, 200);
    const invoices = invoicesResult.invoices || [];

    const header = 'Date,Numéro,Montant,Devise,Statut,PDF';
    const rows = invoices.map((inv) =>
      [
        inv.created ? new Date(inv.created * 1000).toISOString().split('T')[0] : '',
        inv.number || '',
        typeof inv.amount === 'number' ? (inv.amount / 100).toFixed(2) : '0.00',
        (inv.currency || 'EUR').toUpperCase(),
        inv.status || '',
        inv.invoicePdf || '',
      ].join(','),
    );

    const csv = [header, ...rows].join('\n');

    return {
      csv,
      filename: `factures-luneo-${new Date().toISOString().split('T')[0]}.csv`,
      contentType: 'text/csv',
    };
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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('payment-methods')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter une méthode de paiement' })
  @ApiResponse({ status: 200, description: 'Méthode de paiement ajoutée avec succès' })
  async addPaymentMethod(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Body() body: AddPaymentMethodDto
  ) {
    return this.billingService.addPaymentMethod(
      req.user.id,
      body.paymentMethodId,
      body.setAsDefault || false
    );
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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
    } catch (error: unknown) {
      this.logger.warn('Failed to create customer portal session', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        success: false,
        error: 'Unable to create customer portal session. Please try again later.',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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
    @Body() body: ChangePlanDto
  ) {
    if (!body.planId) {
      throw new BadRequestException('planId is required');
    }
    
    const validPlans = ['pro', 'business', 'enterprise'];
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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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
    @Body() body: CancelSubscriptionDto,
  ) {
    return this.billingService.cancelSubscription(req.user.id, body?.immediate || false);
  }

}
