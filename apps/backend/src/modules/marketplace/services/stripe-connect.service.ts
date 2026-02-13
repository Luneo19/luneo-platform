import { Injectable, Logger, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CurrencyUtils } from '@/config/currency.config';
import { NotificationDispatcherService } from '@/modules/notifications/notification-dispatcher.service';
import type Stripe from 'stripe';

@Injectable()
export class StripeConnectService {
  private readonly logger = new Logger(StripeConnectService.name);
  private stripeInstance: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Optional() private readonly notificationDispatcher?: NotificationDispatcherService,
  ) {}

  /**
   * Lazy load Stripe
   */
  private async getStripe(): Promise<Stripe> {
    if (!this.stripeInstance) {
      const stripeModule = await import('stripe');
      this.stripeInstance = new stripeModule.default(
        this.configService.get<string>('stripe.secretKey')!,
        { apiVersion: '2023-10-16' },
      );
    }
    return this.stripeInstance;
  }

  /**
   * Crée un payout pour un artisan
   */
  async createPayout(artisanId: string, workOrderIds: string[]) {
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: artisanId },
    });

    if (!artisan || !artisan.stripeAccountId) {
      throw new NotFoundException(`Artisan ${artisanId} not found or Stripe account not set up`);
    }

    // Récupérer les work orders
    const workOrders = await this.prisma.workOrder.findMany({
      where: {
        id: { in: workOrderIds },
        artisanId,
        payoutStatus: 'PENDING',
      },
    });

    if (workOrders.length === 0) {
      throw new NotFoundException('No pending work orders found');
    }

    // Calculer le montant total
    const totalAmountCents = workOrders.reduce(
      (sum, wo) => sum + (wo.payoutAmountCents || 0),
      0,
    );

    // Frais Stripe Connect configurables (par défaut 2%)
    const connectFeesPercent = this.configService.get<number>('marketplace.connectFeesPercent') || 2;
    const feesCents = Math.round(totalAmountCents * (connectFeesPercent / 100));
    const netAmountCents = totalAmountCents - feesCents;

    // Validation : montant minimum de payout
    const minPayoutCents = this.configService.get<number>('marketplace.minPayoutCents') || 1000;
    if (netAmountCents < minPayoutCents) {
      throw new NotFoundException(
        `Net payout amount (${netAmountCents} cents) is below the minimum (${minPayoutCents} cents). Work orders will accumulate until threshold is reached.`
      );
    }

    // Créer le payout dans la DB
    const payout = await this.prisma.payout.create({
      data: {
        artisanId,
        amountCents: totalAmountCents,
        feesCents,
        netAmountCents,
        workOrderIds,
        periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 derniers jours
        periodEnd: new Date(),
        status: 'PENDING',
      },
    });

    try {
      // Créer le transfer Stripe
      const stripe = await this.getStripe();
      const transfer = await stripe.transfers.create({
        amount: netAmountCents,
        currency: CurrencyUtils.getStripeCurrency(),
        destination: artisan.stripeAccountId,
        metadata: {
          payoutId: payout.id,
          workOrderIds: workOrderIds.join(','),
        },
      });

      // Mettre à jour le payout
      await this.prisma.payout.update({
        where: { id: payout.id },
        data: {
          stripeTransferId: transfer.id,
          status: 'PROCESSING',
        },
      });

      // Mettre à jour les work orders
      await this.prisma.workOrder.updateMany({
        where: { id: { in: workOrderIds } },
        data: {
          payoutStatus: 'PROCESSING',
          payoutId: payout.id,
        },
      });

      this.logger.log(`Payout ${payout.id} created for artisan ${artisanId}, transfer: ${transfer.id}`);

      return { payout, transfer };
    } catch (error) {
      // Marquer le payout comme failed
      // Sanitiser le message d'erreur pour ne pas exposer de détails Stripe internes
      const sanitizedReason = error instanceof Error 
        ? (error.message.includes('Stripe') ? 'Payment processing error' : error.message)
        : 'Unknown error';
      
      await this.prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'FAILED',
          failureReason: sanitizedReason,
        },
      });

      this.logger.error(`Payout ${payout.id} failed for artisan ${artisanId}:`, error);
      throw error;
    }
  }

  /**
   * Traite les payouts automatiquement (scheduler)
   */
  async processScheduledPayouts() {
    const artisans = await this.prisma.artisan.findMany({
      where: {
        stripeAccountStatus: 'active',
        stripeAccountId: { not: null },
      },
    });

    for (const artisan of artisans) {
      try {
        // Récupérer les work orders en attente de payout
        const pendingWorkOrders = await this.prisma.workOrder.findMany({
          where: {
            artisanId: artisan.id,
            payoutStatus: 'PENDING',
            status: 'COMPLETED',
          },
        });

        if (pendingWorkOrders.length === 0) {
          continue;
        }

        // Vérifier le schedule
        const shouldPayout = this.shouldPayout(artisan.payoutSchedule, artisan.id);

        if (shouldPayout) {
          const workOrderIds = pendingWorkOrders.map((wo) => wo.id);
          await this.createPayout(artisan.id, workOrderIds);
        }
      } catch (error) {
        this.logger.error(`Failed to process payout for artisan ${artisan.id}:`, error);
      }
    }
  }

  /**
   * Détermine si un payout doit être effectué selon le schedule
   */
  private shouldPayout(schedule: string, artisanId: string): boolean {
    // Implémenter logique de schedule (daily, weekly, monthly, etc.)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayOfMonth = now.getDate();
    const hour = now.getHours();

    switch (schedule.toLowerCase()) {
      case 'daily':
        // Payout quotidien à 2h du matin
        return hour === 2;
      
      case 'weekly':
        // Payout hebdomadaire le lundi à 2h du matin
        return dayOfWeek === 1 && hour === 2;
      
      case 'bi-weekly':
        // Payout bi-hebdomadaire le 1er et 15 de chaque mois à 2h du matin
        return (dayOfMonth === 1 || dayOfMonth === 15) && hour === 2;
      
      case 'monthly':
        // Payout mensuel le 1er de chaque mois à 2h du matin
        return dayOfMonth === 1 && hour === 2;
      
      case 'manual':
        // Payout manuel uniquement
        return false;
      
      default:
        // Par défaut: weekly le lundi
        this.logger.warn(`Unknown schedule '${schedule}', defaulting to weekly`);
        return dayOfWeek === 1 && hour === 2;
    }
  }

  /**
   * Crée un compte Stripe Connect pour un seller (marketplace seller)
   */
  async createSellerConnectAccount(
    userId: string,
    userEmail: string,
    options: {
      country?: string;
      businessType?: 'individual' | 'company';
      businessName?: string;
      firstName?: string;
      lastName?: string;
    },
  ): Promise<{ accountId: string; onboardingUrl: string; isExisting: boolean }> {
    const stripe = await this.getStripe();
    const frontendUrl = this.configService.get<string>('app.frontendUrl') || process.env.FRONTEND_URL || 'http://localhost:3000';

    // Vérifier si l'utilisateur a déjà un compte Connect (via Artisan)
    const existingArtisan = await this.prisma.artisan.findUnique({
      where: { userId },
    });

    if (existingArtisan?.stripeAccountId) {
      // Retourner le lien d'onboarding existant
      const accountLink = await stripe.accountLinks.create({
        account: existingArtisan.stripeAccountId,
        refresh_url: `${frontendUrl}/dashboard/seller?refresh=true`,
        return_url: `${frontendUrl}/dashboard/seller?success=true`,
        type: 'account_onboarding',
      });

      return {
        accountId: existingArtisan.stripeAccountId,
        onboardingUrl: accountLink.url,
        isExisting: true,
      };
    }

    // Créer un nouveau compte Connect
    const account = await stripe.accounts.create({
      type: 'express',
      country: options.country || 'FR',
      email: userEmail,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        userId,
        businessType: options.businessType || 'individual',
      },
    });

    // Créer ou mettre à jour l'artisan (on utilise Artisan comme modèle pour seller)
    if (existingArtisan) {
      await this.prisma.artisan.update({
        where: { userId },
        data: {
          stripeAccountId: account.id,
          stripeAccountStatus: 'pending',
          email: userEmail,
          businessName: options.businessName || existingArtisan.businessName,
        },
      });
    } else {
      await this.prisma.artisan.create({
        data: {
          userId,
          businessName: options.businessName || 'My Business',
          stripeAccountId: account.id,
          stripeAccountStatus: 'pending',
          email: userEmail,
          address: options.country ? { country: options.country } : undefined,
        },
      });
    }

    // Créer le lien d'onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${frontendUrl}/dashboard/seller?refresh=true`,
      return_url: `${frontendUrl}/dashboard/seller?success=true`,
      type: 'account_onboarding',
    });

    this.logger.log('Stripe Connect account created for seller', {
      userId,
      accountId: account.id,
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
      isExisting: false,
    };
  }

  /**
   * Récupère le statut du compte Connect d'un seller
   */
  async getSellerConnectStatus(userId: string): Promise<{
    hasAccount: boolean;
    accountId?: string;
    status?: string;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
    requirements?: Stripe.Account.Requirements;
    commissionRate?: number;
    createdAt?: Date;
  }> {
    const artisan = await this.prisma.artisan.findUnique({
      where: { userId },
    });

    if (!artisan?.stripeAccountId) {
      return { hasAccount: false };
    }

    // Récupérer le statut depuis Stripe
    const stripe = await this.getStripe();
    const account = await stripe.accounts.retrieve(artisan.stripeAccountId);

    // Mettre à jour le statut local si nécessaire
    const newStatus = account.charges_enabled && account.payouts_enabled ? 'active' : 'pending';
    if (artisan.stripeAccountStatus !== newStatus) {
      await this.prisma.artisan.update({
        where: { id: artisan.id },
        data: { stripeAccountStatus: newStatus },
      });
    }

    return {
      hasAccount: true,
      accountId: artisan.stripeAccountId || undefined,
      status: newStatus,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements as Stripe.Account.Requirements,
      createdAt: artisan.createdAt,
    };
  }

  /**
   * Process a single marketplace purchase payout: create Stripe Transfer to seller's connected account.
   * Called by the marketplace payout scheduler for purchases where payoutScheduledAt < now and payoutStatus = PENDING.
   */
  async processMarketplacePurchasePayout(purchaseId: string): Promise<{ success: boolean; error?: string }> {
    const purchase = await this.prisma.marketplacePurchase.findUnique({
      where: { id: purchaseId },
      include: {
        item: { include: { seller: { include: { users: { select: { id: true } } } } } },
      },
    });

    if (!purchase || purchase.payoutStatus !== 'PENDING') {
      return { success: false, error: 'Purchase not found or not pending payout' };
    }

    const sellerId = purchase.item.sellerId;
    const artisan = await this.prisma.artisan.findFirst({
      where: {
        user: { brandId: sellerId },
        stripeAccountId: { not: null },
        stripeAccountStatus: 'active',
      },
    });

    if (!artisan?.stripeAccountId) {
      this.logger.warn(`No active Stripe Connect account for seller brand ${sellerId}, purchase ${purchaseId}`);
      await this.prisma.marketplacePurchase.update({
        where: { id: purchaseId },
        data: { payoutStatus: 'FAILED' },
      });
      return { success: false, error: 'Seller has no active Stripe Connect account' };
    }

    const platformFeePercent = this.configService.get<number>('marketplace.platformFeePercent') ?? 10;
    const priceAmount = Number(purchase.price);
    const amountCents = Math.round(priceAmount * 100);
    const feeCents = Math.round(amountCents * (platformFeePercent / 100));
    const netAmountCents = amountCents - feeCents;

    if (netAmountCents < 1) {
      await this.prisma.marketplacePurchase.update({
        where: { id: purchaseId },
        data: { payoutStatus: 'COMPLETED', paidOutAt: new Date() },
      });
      this.logger.log(`Purchase ${purchaseId}: net amount below 1 cent, marked completed without transfer`);
      const sellerUserId = purchase.item.seller.users?.[0]?.id;
      if (sellerUserId) {
        this.notificationDispatcher?.dispatchPayoutCompleted({
          purchaseId,
          sellerUserId,
          brandId: sellerId,
          amountCents: netAmountCents,
        }).catch((err) => this.logger.warn('Non-critical error dispatching payout completed', err instanceof Error ? err.message : String(err)));
      }
      return { success: true };
    }

    const currency = (purchase.currency || 'CHF').toLowerCase();
    const stripeCurrency = ['chf', 'eur', 'usd', 'gbp'].includes(currency) ? currency : 'chf';

    try {
      const stripe = await this.getStripe();
      await stripe.transfers.create({
        amount: netAmountCents,
        currency: stripeCurrency,
        destination: artisan.stripeAccountId,
        metadata: {
          marketplacePurchaseId: purchaseId,
          sellerBrandId: sellerId,
        },
      });

      await this.prisma.marketplacePurchase.update({
        where: { id: purchaseId },
        data: {
          payoutStatus: 'COMPLETED',
          paidOutAt: new Date(),
        },
      });

      this.logger.log(`Marketplace purchase ${purchaseId} payout completed, transfer to ${artisan.stripeAccountId}`);
      const sellerUserId = purchase.item.seller.users?.[0]?.id;
      if (sellerUserId) {
        this.notificationDispatcher?.dispatchPayoutCompleted({
          purchaseId,
          sellerUserId,
          brandId: sellerId,
          amountCents: netAmountCents,
        }).catch((err) => this.logger.warn('Non-critical error dispatching payout completed', err instanceof Error ? err.message : String(err)));
      }
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Marketplace purchase payout failed for ${purchaseId}: ${message}`);
      await this.prisma.marketplacePurchase.update({
        where: { id: purchaseId },
        data: { payoutStatus: 'FAILED' },
      });
      return { success: false, error: message };
    }
  }

  /**
   * Webhook Stripe pour les transfers
   */
  async handleTransferWebhook(event: Stripe.TransferUpdatedEvent) {
    const transfer = event.data.object;

    // Trouver le payout correspondant
    const payout = await this.prisma.payout.findFirst({
      where: { stripeTransferId: transfer.id },
    });

    if (!payout) {
      this.logger.warn(`Payout not found for transfer ${transfer.id}`);
      return;
    }

    // Mettre à jour le statut
    let status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' = 'PROCESSING';

    if (transfer.reversed) {
      status = 'FAILED';
    } else if (transfer.amount_reversed > 0) {
      status = 'FAILED';
    } else {
      status = 'COMPLETED';
    }

    await this.prisma.payout.update({
      where: { id: payout.id },
      data: {
        status,
        paidAt: status === 'COMPLETED' ? new Date() : null,
        failureReason: status === 'FAILED' ? 'Transfer reversed' : null,
      },
    });

    // Mettre à jour les work orders
    if (status === 'COMPLETED') {
      await this.prisma.workOrder.updateMany({
        where: { payoutId: payout.id },
        data: {
          payoutStatus: 'PAID',
        },
      });
    }
  }
}

































