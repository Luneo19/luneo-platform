import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Logger,
  Headers,
  Req,
  BadRequestException,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Request as ExpressRequest } from 'express';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  @Public()
  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Créer une session de paiement Stripe' })
  @ApiResponse({ status: 200, description: 'Session créée avec succès' })
  async createCheckoutSession(@Body() body: { planId: string; email?: string; userId?: string }) {
    const userId = body.userId ?? 'anonymous';
    const userEmail = body.email || 'user@example.com';

    return this.billingService.createCheckoutSession(body.planId, userId, userEmail);
  }

  @UseGuards(JwtAuthGuard)
  @Get('customer-portal')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une session pour le portail client Stripe' })
  @ApiResponse({ status: 200, description: 'Session créée avec succès' })
  async createCustomerPortalSession(@Req() req: ExpressRequest) {
    const user = this.getAuthenticatedUser(req);
    return this.billingService.createCustomerPortalSession(user.id);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook Stripe pour les événements de paiement' })
  async handleWebhook(
    @Req() req: ExpressRequest,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: true }> {
    try {
      const payload = req.body as Buffer;
      await this.billingService.handleWebhook(payload, signature);
      return { received: true };
    } catch (error) {
      this.logger.error('Erreur traitement webhook Stripe', error as Error);
      throw new BadRequestException((error as Error).message ?? 'Stripe webhook error');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('tax-rate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculer la TVA pour un pays/zone donné' })
  @ApiResponse({ status: 200, description: 'Retourne le taux et montants TVA' })
  computeTax(
    @Query('subtotalCents') subtotalCents: string,
    @Query('country') country: string,
    @Query('region') region?: string,
  ) {
    const subtotal = Number.parseInt(subtotalCents ?? '0', 10);
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      throw new BadRequestException('Le sous-total doit être un entier positif (en centimes).');
    }

    if (!country) {
      throw new BadRequestException('Le pays est requis.');
    }

    return this.billingService.computeOrderTotals({
      subtotalCents: subtotal,
      countryCode: country,
      regionCode: region ?? undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard/revenue')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aggrégations financières (MRR, top clients, etc.)' })
  getRevenueDashboard(
    @Query('startAt') startAt?: string,
    @Query('endAt') endAt?: string,
    @Query('currency') currency?: string,
  ) {
    return this.billingService.getRevenueDashboard({
      startAt: startAt ? new Date(startAt) : undefined,
      endAt: endAt ? new Date(endAt) : undefined,
      currency: currency ?? undefined,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:orderId/invoice')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Générer une facture PDF pour une commande' })
  async generateInvoice(@Param('orderId') orderId: string) {
    return this.billingService.generateInvoice(orderId);
  }

  private getAuthenticatedUser(req: ExpressRequest) {
    if (!req.user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    return req.user;
  }
}
