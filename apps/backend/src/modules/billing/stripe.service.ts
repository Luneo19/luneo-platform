import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeClientService } from './services/stripe-client.service';

export type Plan = 'starter' | 'professional' | 'business' | 'enterprise';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly stripeClient: StripeClientService,
  ) {}

  async createCustomer(orgId: string, email: string, name: string): Promise<string> {
    const stripe = await this.stripeClient.getStripe();
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { organizationId: orgId },
    });
    return customer.id;
  }

  async createCheckoutSession(
    orgId: string,
    plan: Plan,
    billingInterval: 'monthly' | 'yearly',
    returnUrl: string,
    customerEmail?: string,
  ): Promise<string> {
    const stripe = await this.stripeClient.getStripe();
    const priceId = this.getPriceId(plan, billingInterval);
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl}?success=true`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: { organizationId: orgId, plan },
      subscription_data: { metadata: { organizationId: orgId, plan } },
    };
    if (customerEmail) {
      sessionParams.customer_email = customerEmail;
    }
    const session = await stripe.checkout.sessions.create(sessionParams);
    return session.url!;
  }

  async createPortalSession(stripeCustomerId: string, returnUrl: string): Promise<string> {
    const stripe = await this.stripeClient.getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });
    return session.url;
  }

  async handleWebhookEvent(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
    if (!webhookSecret) {
      this.logger.error('Stripe webhook secret not configured');
      throw new BadRequestException('Webhook secret not configured');
    }
    const stripe = await this.stripeClient.getStripe();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    this.logger.log(`Stripe webhook event received: ${event.type}`);
  }

  private getPriceId(plan: Plan, interval: 'monthly' | 'yearly'): string {
    const planToConfigKey: Record<Plan, { monthly: string; yearly: string }> = {
      starter: { monthly: 'stripe.priceStarterMonthly', yearly: 'stripe.priceStarterYearly' },
      professional: { monthly: 'stripe.priceProMonthly', yearly: 'stripe.priceProYearly' },
      business: { monthly: 'stripe.priceBusinessMonthly', yearly: 'stripe.priceBusinessYearly' },
      enterprise: { monthly: 'stripe.priceEnterpriseMonthly', yearly: 'stripe.priceEnterpriseYearly' },
    };
    const key = planToConfigKey[plan]?.[interval] ?? `stripe.price${plan.charAt(0).toUpperCase() + plan.slice(1)}${interval === 'monthly' ? 'Monthly' : 'Yearly'}`;
    return this.configService.get<string>(key) || '';
  }
}
