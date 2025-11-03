import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Créer une session de paiement Stripe' })
  @ApiResponse({ status: 200, description: 'Session créée avec succès' })
  async createCheckoutSession(
    @Body() body: { planId: string; email?: string }
  ) {
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
  async createCustomerPortalSession(@Request() req) {
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
  @ApiOperation({ summary: 'Webhook Stripe pour les événements de paiement' })
  async handleWebhook(@Body() body: any) {
    // Ici vous pouvez ajouter la logique pour traiter les webhooks Stripe
    console.log('Webhook Stripe reçu:', body);
    
    return { received: true };
  }
}
