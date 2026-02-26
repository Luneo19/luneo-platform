import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { BillingService } from '@/modules/billing/billing.service';
import { BuyCreditsDto } from './dto/buy-credits.dto';

type CreditPack = {
  id: string;
  name: string;
  credits: number;
  price: number;
  priceCents: number;
  stripePriceId?: string;
  badge?: string;
  savings?: number;
  isFeatured?: boolean;
};

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  private getConfiguredPacks(): CreditPack[] {
    const packs: CreditPack[] = [
      {
        id: 'pack_100',
        name: 'Pack 100',
        credits: 100,
        price: 19,
        priceCents: 1900,
        stripePriceId: process.env.STRIPE_CREDITS_PACK_100_PRICE_ID || undefined,
        savings: 0,
      },
      {
        id: 'pack_500',
        name: 'Pack 500',
        credits: 500,
        price: 79,
        priceCents: 7900,
        stripePriceId: process.env.STRIPE_CREDITS_PACK_500_PRICE_ID || undefined,
        badge: 'Best Value',
        savings: 16,
        isFeatured: true,
      },
      {
        id: 'pack_1000',
        name: 'Pack 1000',
        credits: 1000,
        price: 139,
        priceCents: 13900,
        stripePriceId: process.env.STRIPE_CREDITS_PACK_1000_PRICE_ID || undefined,
        savings: 26,
      },
    ];

    return packs.sort((a, b) => a.credits - b.credits);
  }

  private async getUserOrganization(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        memberships: {
          where: { isActive: true },
          select: {
            organization: {
              select: {
                id: true,
                name: true,
                stripeCustomerId: true,
                conversationsLimit: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    const organization = user?.memberships?.[0]?.organization;
    if (!user || !organization) {
      throw new NotFoundException('No active organization found for this user');
    }

    return { user, organization };
  }

  private async sumPurchasedCredits(userId: string, stripeCustomerId?: string | null): Promise<number> {
    if (!stripeCustomerId) return 0;
    try {
      const stripe = await this.billingService.getStripe();
      const sessions = await stripe.checkout.sessions.list({
        customer: stripeCustomerId,
        limit: 100,
      });
      return sessions.data
        .filter((session) => session.metadata?.kind === 'credits_pack' && session.payment_status === 'paid')
        .reduce((total, session) => total + Number(session.metadata?.credits || 0), 0);
    } catch (error) {
      this.logger.warn('Unable to compute purchased credits from Stripe history', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  async getBalance(userId: string) {
    const { organization } = await this.getUserOrganization(userId);
    const subscription = (await this.billingService.getSubscription(userId)) as {
      limits?: { aiGenerationsPerMonth?: number };
      currentUsage?: { aiGenerations?: number };
      usage?: { aiGenerations?: number };
    };

    const includedLimit = Number(subscription?.limits?.aiGenerationsPerMonth || 0);
    const used = Number(subscription?.currentUsage?.aiGenerations ?? subscription?.usage?.aiGenerations ?? 0);
    const purchased = await this.sumPurchasedCredits(userId, organization.stripeCustomerId);
    const balance = Math.max(includedLimit + purchased - used, 0);

    return {
      balance,
      purchased,
      used,
      limit: includedLimit + purchased,
      planIncluded: includedLimit,
    };
  }

  async getUsage(userId: string) {
    const subscription = (await this.billingService.getSubscription(userId)) as {
      currentUsage?: { aiGenerations?: number; conversations?: number; aiTokens?: number };
      usage?: { aiGenerations?: number; conversations?: number; aiTokens?: number };
    };
    const usage = subscription.currentUsage || subscription.usage || {};
    return {
      conversations: Number(usage.conversations || usage.aiGenerations || 0),
      messages: Number(usage.aiGenerations || 0),
      tokens: Number(usage.aiTokens || 0),
      period: 'monthly',
    };
  }

  async getPacks() {
    return {
      packs: this.getConfiguredPacks(),
    };
  }

  async buyCredits(userId: string, dto: BuyCreditsDto) {
    const { user, organization } = await this.getUserOrganization(userId);
    const packs = this.getConfiguredPacks();
    const pack =
      (dto.packId ? packs.find((candidate) => candidate.id === dto.packId) : undefined) ||
      (dto.packSize ? packs.find((candidate) => candidate.credits === dto.packSize) : undefined);

    if (!pack) {
      throw new BadRequestException('Unknown credit pack. Provide a valid packId or packSize.');
    }

    try {
      const stripe = await this.billingService.getStripe();
      let customerId = organization.stripeCustomerId || undefined;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            organizationId: organization.id,
            userId: user.id,
          },
        });
        customerId = customer.id;
        await this.prisma.organization.update({
          where: { id: organization.id },
          data: { stripeCustomerId: customer.id },
        });
      }

      const frontendUrl =
        this.configService.get<string>('app.frontendUrl') ||
        this.configService.get<string>('app.url') ||
        'https://luneo.app';

      const lineItem = pack.stripePriceId
        ? { price: pack.stripePriceId, quantity: 1 }
        : {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `${pack.name} (${pack.credits} credits)`,
              },
              unit_amount: pack.priceCents,
            },
            quantity: 1,
          };

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        line_items: [lineItem],
        success_url: `${frontendUrl}/dashboard/billing/addons?credits=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/dashboard/billing/addons?credits=cancel`,
        metadata: {
          kind: 'credits_pack',
          packId: pack.id,
          credits: String(pack.credits),
          userId: user.id,
          organizationId: organization.id,
        },
      });

      return {
        success: true,
        url: session.url ?? undefined,
        sessionId: session.id,
        pack,
      };
    } catch (error) {
      this.logger.error('Credit pack checkout creation failed', error instanceof Error ? error.stack : String(error), {
        userId,
        packId: pack.id,
      });
      throw new InternalServerErrorException('Unable to create credit checkout session');
    }
  }

  async getTransactions(userId: string, limit: number, offset: number) {
    const { organization } = await this.getUserOrganization(userId);

    if (!organization.stripeCustomerId) {
      return {
        transactions: [],
        pagination: { limit, offset, total: 0 },
      };
    }

    try {
      const stripe = await this.billingService.getStripe();
      const requested = Math.min(Math.max(limit + offset, 1), 100);
      const sessions = await stripe.checkout.sessions.list({
        customer: organization.stripeCustomerId,
        limit: requested,
      });

      const creditSessions = sessions.data
        .filter((session) => session.metadata?.kind === 'credits_pack')
        .map((session) => ({
          id: session.id,
          sessionId: session.id,
          packId: session.metadata?.packId || null,
          credits: Number(session.metadata?.credits || 0),
          amountCents: Number(session.amount_total || 0),
          currency: (session.currency || 'eur').toUpperCase(),
          status: session.payment_status,
          createdAt: new Date(session.created * 1000).toISOString(),
        }));

      const paginated = creditSessions.slice(offset, offset + limit);

      return {
        transactions: paginated,
        pagination: {
          limit,
          offset,
          total: creditSessions.length,
        },
      };
    } catch (error) {
      this.logger.error('Unable to fetch credit transactions', error instanceof Error ? error.stack : String(error), {
        userId,
      });
      throw new InternalServerErrorException('Unable to retrieve credit transactions');
    }
  }
}
