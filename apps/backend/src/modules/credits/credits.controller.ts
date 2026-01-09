import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { CreditsService } from '@/libs/credits/credits.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/types/user.types';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from '@/modules/billing/billing.service';
import { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';

@ApiTags('Credits')
@ApiBearerAuth()
@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  private stripeInstance: Stripe | null = null;
  private stripeModule: typeof import('stripe') | null = null;

  constructor(
    private readonly creditsService: CreditsService,
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  private async getStripe(): Promise<Stripe> {
    if (!this.stripeInstance) {
      if (!this.stripeModule) {
        this.stripeModule = await import('stripe');
      }
      const secretKey = this.configService.get<string>('stripe.secretKey');
      if (!secretKey) {
        throw new Error('STRIPE_SECRET_KEY is not configured');
      }
      this.stripeInstance = new this.stripeModule.default(secretKey, {
        apiVersion: '2023-10-16',
      });
    }
    return this.stripeInstance;
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get user credit balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  async getBalance(@Request() req: ExpressRequest & { user: CurrentUser }) {
    return this.creditsService.getBalance(req.user.id);
  }

  @Post('add')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add credits to user account (admin/webhook)' })
  @ApiResponse({ status: 200, description: 'Credits added successfully' })
  async addCredits(
    @Body() body: {
      userId: string;
      amount: number;
      packId?: string;
      stripeSessionId?: string;
      stripePaymentId?: string;
    },
  ) {
    return this.creditsService.addCredits(
      body.userId,
      body.amount,
      body.packId,
      body.stripeSessionId,
      body.stripePaymentId,
    );
  }

  @Get('packs')
  @ApiOperation({ summary: 'Get available credit packs' })
  @ApiResponse({ status: 200, description: 'Packs retrieved successfully' })
  async getPacks() {
    return this.creditsService.getAvailablePacks();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get credit transaction history' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getTransactions(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.creditsService.getTransactionHistory(
      req.user.id,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if user has enough credits for endpoint' })
  @ApiResponse({ status: 200, description: 'Check completed' })
  async checkCredits(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Body() body: { endpoint: string; amount?: number },
  ) {
    return this.creditsService.checkCredits(req.user.id, body.endpoint, body.amount);
  }

  @Post('buy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe Checkout session to buy credits' })
  @ApiResponse({ status: 200, description: 'Checkout session created' })
  async buyCredits(
    @Body() body: { packSize: number },
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const packs = await this.creditsService.getAvailablePacks();
    const pack = packs.find((p: any) => p.credits === body.packSize);
    
    if (!pack) {
      throw new BadRequestException(`Pack with ${body.packSize} credits not found`);
    }

    // Get Stripe Price ID from pack or env vars
    let priceId = pack.stripePriceId || pack.stripe_price_id;
    
    if (!priceId) {
      // Fallback to env vars
      const packPrices: Record<number, string> = {
        100: this.configService.get<string>('stripe.priceCredits100') || '',
        500: this.configService.get<string>('stripe.priceCredits500') || '',
        1000: this.configService.get<string>('stripe.priceCredits1000') || '',
      };
      priceId = packPrices[body.packSize];
    }

    if (!priceId) {
      throw new BadRequestException(`Stripe Price ID not configured for pack ${body.packSize}`);
    }

    // Create Stripe Checkout session
    const stripe = await this.getStripe();
    const frontendUrl = this.configService.get<string>('app.frontendUrl') || 'https://luneo.app';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment
      success_url: `${frontendUrl}/dashboard?credits_purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/dashboard?credits_purchase=cancel`,
      client_reference_id: req.user.id,
      customer_email: req.user.email,
      metadata: {
        userId: req.user.id,
        packSize: body.packSize.toString(),
        credits: body.packSize.toString(),
        packId: pack.id,
        type: 'credits_purchase',
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    });

    return {
      success: true,
      url: session.url,
      sessionId: session.id,
      pack,
    };
  }
}













