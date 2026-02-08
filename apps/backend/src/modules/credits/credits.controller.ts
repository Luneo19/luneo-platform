import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AddCreditsDto } from './dto/add-credits.dto';
import { CheckCreditsDto } from './dto/check-credits.dto';
import { BuyCreditsDto } from './dto/buy-credits.dto';
import { CreateCreditPackDto } from './dto/create-credit-pack.dto';
import { UpdateCreditPackDto } from './dto/update-credit-pack.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '@/common/guards/roles.guard';
import { Prisma, UserRole } from '@prisma/client';
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
    private readonly prisma: PrismaService,
  ) {}

  private async getStripe(): Promise<Stripe> {
    if (!this.stripeInstance) {
      if (!this.stripeModule) {
        this.stripeModule = await import('stripe');
      }
      const secretKey = this.configService.get<string>('stripe.secretKey');
      if (!secretKey) {
        throw new BadRequestException('STRIPE_SECRET_KEY is not configured');
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
  async addCredits(@Body() dto: AddCreditsDto) {
    return this.creditsService.addCredits(
      dto.userId,
      dto.amount,
      dto.packId,
      dto.stripeSessionId,
      dto.stripePaymentId,
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
    @Query() query: PaginationQueryDto,
  ) {
    return this.creditsService.getTransactionHistory(
      req.user.id,
      query.limit ?? 50,
      query.offset ?? 0,
    );
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check if user has enough credits for endpoint' })
  @ApiResponse({ status: 200, description: 'Check completed' })
  async checkCredits(
    @Request() req: ExpressRequest & { user: CurrentUser },
    @Body() dto: CheckCreditsDto,
  ) {
    return this.creditsService.checkCredits(req.user.id, dto.endpoint, dto.amount);
  }

  @Post('buy')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe Checkout session to buy credits' })
  @ApiResponse({ status: 200, description: 'Checkout session created' })
  async buyCredits(
    @Body() dto: BuyCreditsDto,
    @Request() req: ExpressRequest & { user: CurrentUser },
  ) {
    const packs = await this.creditsService.getAvailablePacks();
    const pack = packs.find((p: any) => p.credits === dto.packSize);

    if (!pack) {
      throw new BadRequestException(`Pack with ${dto.packSize} credits not found`);
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
      priceId = packPrices[dto.packSize];
    }

    if (!priceId) {
      throw new BadRequestException(`Stripe Price ID not configured for pack ${dto.packSize}`);
    }

    // Create Stripe Checkout session
    const stripe = await this.getStripe();
    const frontendUrl = this.configService.get<string>('app.frontendUrl') || process.env.FRONTEND_URL || 'http://localhost:3000';
    
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
        packSize: dto.packSize.toString(),
        credits: dto.packSize.toString(),
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

  // ========================================
  // ADMIN - Credit packs CRUD (PLATFORM_ADMIN only)
  // ========================================

  @Get('admin/packs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'List all credit packs (admin)' })
  @ApiResponse({ status: 200, description: 'All packs retrieved' })
  async getAdminPacks() {
    return this.prisma.creditPack.findMany({
      orderBy: [{ credits: 'asc' }],
    });
  }

  @Post('admin/packs')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Create a credit pack' })
  @ApiResponse({ status: 201, description: 'Pack created' })
  async createPack(@Body() dto: CreateCreditPackDto) {
    return this.prisma.creditPack.create({
      data: {
        name: dto.name,
        credits: dto.credits,
        priceCents: dto.priceCents,
        stripePriceId: dto.stripePriceId ?? null,
        isActive: dto.isActive ?? true,
        isFeatured: dto.isFeatured ?? false,
        savings: dto.savings ?? null,
        badge: dto.badge ?? dto.description ?? null,
      },
    });
  }

  @Put('admin/packs/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Update a credit pack' })
  @ApiResponse({ status: 200, description: 'Pack updated' })
  async updatePack(@Param('id') id: string, @Body() dto: UpdateCreditPackDto) {
    const data: Prisma.CreditPackUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.credits !== undefined) data.credits = dto.credits;
    if (dto.priceCents !== undefined) data.priceCents = dto.priceCents;
    if (dto.stripePriceId !== undefined) data.stripePriceId = dto.stripePriceId;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured;
    if (dto.savings !== undefined) data.savings = dto.savings;
    if (dto.description !== undefined) data.badge = dto.description;
    return this.prisma.creditPack.update({
      where: { id },
      data,
    });
  }

  @Delete('admin/packs/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Delete a credit pack' })
  @ApiResponse({ status: 200, description: 'Pack deleted' })
  async deletePack(@Param('id') id: string) {
    return this.prisma.creditPack.delete({ where: { id } });
  }
}













