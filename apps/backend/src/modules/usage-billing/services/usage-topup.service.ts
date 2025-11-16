import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import Stripe from 'stripe';
import { PLAN_DEFINITIONS, type UsageMetricType } from '@luneo/billing-plans';

interface CreateTopUpSessionInput {
  brandId: string;
  metric: UsageMetricType;
  units: number;
  userId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

@Injectable()
export class UsageTopUpService {
  private readonly logger = new Logger(UsageTopUpService.name);
  private readonly stripe: Stripe;
  private readonly successUrl: string;
  private readonly cancelUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });

    this.successUrl =
      this.configService.get<string>('STRIPE_TOPUP_SUCCESS_URL') ??
      this.configService.get<string>('STRIPE_SUCCESS_URL') ??
      `${this.configService.get<string>('FRONTEND_URL')}/billing?topup=success`;

    this.cancelUrl =
      this.configService.get<string>('STRIPE_TOPUP_CANCEL_URL') ??
      this.configService.get<string>('STRIPE_CANCEL_URL') ??
      `${this.configService.get<string>('FRONTEND_URL')}/billing?topup=cancel`;
  }

  async createTopUpSession(input: CreateTopUpSessionInput) {
    if (input.units <= 0) {
      throw new BadRequestException('Units must be greater than zero');
    }

    const plan = await this.resolveCurrentPlan(input.brandId);
    const quota = plan.quotas.find((item) => item.metric === input.metric);
    if (!quota || quota.overage !== 'charge' || !quota.overageRate) {
      throw new BadRequestException('Top-up not available for this metric');
    }

    const totalPriceCents = quota.overageRate * input.units;
    if (totalPriceCents < 100) {
      throw new BadRequestException('Montant minimum de 1€ requis');
    }

    const periodKey = this.buildPeriodKey();

    const topUp = await this.prisma.usageTopUp.create({
      data: {
        brandId: input.brandId,
        metric: input.metric,
        units: input.units,
        unitPriceCents: quota.overageRate,
        totalPriceCents,
        periodKey,
        status: 'pending',
        notes: `Top-up ${input.metric} ${periodKey}`,
      },
    });

    const { successUrl, cancelUrl } = this.buildRedirectUrls(input, topUp.id);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: totalPriceCents,
            product_data: {
              name: `Crédits ${input.metric}`,
              description: `${input.units} unités supplémentaires`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        topupId: topUp.id,
        brandId: input.brandId,
        metric: input.metric,
        units: input.units.toString(),
        userId: input.userId ?? '',
      },
    });

    await this.prisma.usageTopUp.update({
      where: { id: topUp.id },
      data: {
        stripeCheckoutId: session.id,
      },
    });

    return {
      checkoutUrl: session.url,
      topupId: topUp.id,
      totalPriceCents,
    };
  }

  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const topupId = session.metadata?.topupId;
    if (!topupId) {
      return;
    }

    const topUp = await this.prisma.usageTopUp.findUnique({
      where: { id: topupId },
    });
    if (!topUp) {
      this.logger.warn(`Top-up ${topupId} not found for Stripe checkout ${session.id}`);
      return;
    }

    if (topUp.status === 'completed') {
      return;
    }

    await this.prisma.usageTopUp.update({
      where: { id: topupId },
      data: {
        status: 'completed',
        stripePaymentId: session.payment_intent?.toString(),
        updatedAt: new Date(),
      },
    });
  }

  private buildRedirectUrls(input: CreateTopUpSessionInput, topupId: string) {
    const successTarget = input.successUrl ?? this.successUrl;
    const cancelTarget = input.cancelUrl ?? this.cancelUrl;

    const successUrl = this.appendQueryParams(successTarget, {
      topup_id: topupId,
      session_id: '{CHECKOUT_SESSION_ID}',
    });

    const cancelUrl = this.appendQueryParams(cancelTarget, {
      topup_id: topupId,
    });

    return { successUrl, cancelUrl };
  }

  private appendQueryParams(baseUrl: string, params: Record<string, string>) {
    try {
      const url = new URL(baseUrl);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
      return url.toString();
    } catch {
      const separator = baseUrl.includes('?') ? '&' : '?';
      const query = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      return `${baseUrl}${separator}${query}`;
    }
  }

  async markTopUpFailed(checkoutId: string, reason?: string): Promise<void> {
    await this.prisma.usageTopUp.updateMany({
      where: { stripeCheckoutId: checkoutId, status: 'pending' },
      data: {
        status: 'failed',
        notes: reason,
      },
    });
  }

  async getActiveCredits(
    brandId: string,
    metric: UsageMetricType,
    periodKey: string,
  ): Promise<number> {
    const result = await this.prisma.usageTopUp.aggregate({
      where: {
        brandId,
        metric,
        periodKey,
        status: 'completed',
      },
      _sum: {
        units: true,
      },
    });

    return result._sum.units ?? 0;
  }

  async listTopUps(brandId: string) {
    return this.prisma.usageTopUp.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  private async resolveCurrentPlan(brandId: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { plan: true },
    });
    const planId = (brand?.plan ?? 'starter') as keyof typeof PLAN_DEFINITIONS;
    return PLAN_DEFINITIONS[planId] ?? PLAN_DEFINITIONS.starter;
  }

  private buildPeriodKey(date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}

