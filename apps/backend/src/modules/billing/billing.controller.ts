import { CurrentUser } from '@/common/types/user.types';
import { BadRequestException, Body, Controller, Get, Headers, HttpCode, HttpStatus, Logger, Post, RawBodyRequest, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
