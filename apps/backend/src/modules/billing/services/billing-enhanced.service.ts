// @ts-nocheck
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StripeClientService } from './stripe-client.service';
import type Stripe from 'stripe';
import { SubscriptionPlan } from '@prisma/client';

@Injectable()
export class BillingEnhancedService {
  private readonly logger = new Logger(BillingEnhancedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly stripeClient: StripeClientService,
  ) {}

  /**
   * Creates Stripe checkout session with optional coupon support.
   */
  async createCheckoutSession(
    brandId: string,
    planId: string,
    couponCode?: string,
  ): Promise<{ sessionId: string; url: string }> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        id: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        users: { take: 1, select: { id: true, email: true } },
      },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    if (brand.stripeSubscriptionId && brand.subscriptionStatus === 'ACTIVE') {
      throw new BadRequestException('Brand already has an active subscription');
    }

    const stripe = await this.stripeClient.getStripe();
    const priceId = this.getPriceIdForPlan(planId);
    if (!priceId) {
      throw new BadRequestException(`Invalid plan: ${planId}`);
    }

    const customerId = brand.stripeCustomerId ?? undefined;
    const userEmail = brand.users[0]?.email ?? undefined;
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: this.configService.get<string>('app.frontendUrl', 'http://localhost:3000') + '/dashboard/billing?success=1',
      cancel_url: this.configService.get<string>('app.frontendUrl', 'http://localhost:3000') + '/dashboard/billing?cancel=1',
      metadata: { brandId, planId },
      ...(customerId && { customer: customerId }),
      ...(!customerId && userEmail && { customer_email: userEmail }),
    };

    if (couponCode) {
      const coupon = await this.applyCoupon(brandId, couponCode);
      if (coupon?.couponId) {
        sessionParams.discounts =
          coupon.couponId.startsWith('promo_')
            ? [{ promotion_code: coupon.couponId }]
            : [{ coupon: coupon.couponId }];
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session.url) {
      throw new InternalServerErrorException('Failed to create checkout URL');
    }
    return { sessionId: session.id, url: session.url };
  }

  /**
   * Handles plan upgrade with proration.
   */
  async handleUpgrade(brandId: string, newPlanId: string): Promise<void> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { stripeSubscriptionId: true, subscriptionPlan: true },
    });
    if (!brand?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription to upgrade');
    }

    const stripe = await this.stripeClient.getStripe();
    const newPriceId = this.getPriceIdForPlan(newPlanId);
    if (!newPriceId) {
      throw new BadRequestException(`Invalid plan: ${newPlanId}`);
    }

    const subscription = await stripe.subscriptions.retrieve(brand.stripeSubscriptionId);
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) {
      throw new InternalServerErrorException('Subscription has no items');
    }

    await stripe.subscriptions.update(brand.stripeSubscriptionId, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'create_prorations',
    });

    await this.prisma.brand.update({
      where: { id: brandId },
      data: { plan: newPlanId, subscriptionPlan: newPlanId.toUpperCase() as SubscriptionPlan },
    });
    this.logger.log(`Upgraded brand ${brandId} to plan ${newPlanId}`);
  }

  /**
   * Handles plan downgrade; effective at period end.
   */
  async handleDowngrade(brandId: string, newPlanId: string): Promise<void> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { stripeSubscriptionId: true },
    });
    if (!brand?.stripeSubscriptionId) {
      throw new BadRequestException('No active subscription to downgrade');
    }

    const stripe = await this.stripeClient.getStripe();
    const newPriceId = this.getPriceIdForPlan(newPlanId);
    if (!newPriceId) {
      throw new BadRequestException(`Invalid plan: ${newPlanId}`);
    }

    const subscription = await stripe.subscriptions.retrieve(brand.stripeSubscriptionId);
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) {
      throw new InternalServerErrorException('Subscription has no items');
    }

    await stripe.subscriptions.update(brand.stripeSubscriptionId, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'none',
    });

    await this.prisma.brand.update({
      where: { id: brandId },
      data: { plan: newPlanId, subscriptionPlan: newPlanId.toUpperCase() as SubscriptionPlan },
    });
    this.logger.log(`Scheduled downgrade for brand ${brandId} to ${newPlanId} at period end`);
  }

  /**
   * Validates and applies a coupon to the brand (returns coupon ID for checkout or existing subscription).
   */
  async applyCoupon(brandId: string, couponCode: string): Promise<{ couponId: string; valid: boolean } | null> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const stripe = await this.stripeClient.getStripe();
    const coupons = await stripe.coupons.list({ limit: 100 });
    const promo = coupons.data.find(
      (c) => c.name?.toLowerCase() === couponCode.toLowerCase() || c.id === couponCode,
    );
    if (!promo || (promo.valid !== undefined && !promo.valid)) {
      this.logger.warn(`Coupon not found or invalid: ${couponCode}`);
      return null;
    }

    const promoList = await stripe.promotionCodes.list({ coupon: promo.id, active: true, limit: 10 });
    const code = promoList.data.find(
      (pc) => pc.code?.toLowerCase() === couponCode.toLowerCase(),
    ) ?? promoList.data[0];
    const couponId = code?.id ?? promo.id;
    return { couponId, valid: true };
  }

  /**
   * Handles dunning: failed payment retry logic (3 attempts over 7 days).
   */
  async handleDunning(subscriptionId: string): Promise<{ action: 'retry' | 'cancel' | 'none'; nextRetryAt?: Date }> {
    const stripe = await this.stripeClient.getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.status !== 'past_due') {
      return { action: 'none' };
    }

    const brand = await this.prisma.brand.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
      select: { id: true, gracePeriodEndsAt: true },
    });
    if (!brand) {
      return { action: 'none' };
    }

    const maxAttempts = 3;
    const windowDays = 7;
    const invoices = await stripe.invoices.list({
      subscription: subscriptionId,
      status: 'open',
      limit: 5,
    });
    const failedCount = invoices.data.filter((i) => i.attempt_count && i.attempt_count > 0).length;
    const firstAttempt = invoices.data[0]?.created
      ? new Date((invoices.data[0].created as number) * 1000)
      : new Date();
    const windowEnd = new Date(firstAttempt);
    windowEnd.setDate(windowEnd.getDate() + windowDays);

    if (failedCount >= maxAttempts || new Date() > windowEnd) {
      await stripe.subscriptions.cancel(subscriptionId);
      await this.prisma.brand.update({
        where: { id: brand.id },
        data: { subscriptionStatus: 'CANCELED', gracePeriodEndsAt: null },
      });
      this.logger.log(`Dunning: canceled subscription ${subscriptionId} after ${failedCount} attempts`);
      return { action: 'cancel' };
    }

    try {
      await stripe.invoices.pay(invoices.data[0]?.id ?? '');
      return { action: 'none' };
    } catch {
      const nextRetry = new Date();
      nextRetry.setDate(nextRetry.getDate() + 1);
      return { action: 'retry', nextRetryAt: nextRetry };
    }
  }

  private getPriceIdForPlan(planId: string): string | null {
    const key = planId.toLowerCase();
    const map: Record<string, string> = {
      starter: this.configService.get<string>('stripe.priceStarterMonthly') ?? '',
      professional: this.configService.get<string>('stripe.priceProMonthly') ?? '',
      business: this.configService.get<string>('stripe.priceBusinessMonthly') ?? '',
      enterprise: this.configService.get<string>('stripe.priceEnterpriseMonthly') ?? '',
    };
    return map[key] || null;
  }
}
