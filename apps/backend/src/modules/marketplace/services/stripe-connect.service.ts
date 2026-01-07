import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';

@Injectable()
export class StripeConnectService {
  private readonly logger = new Logger(StripeConnectService.name);
  private stripeInstance: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
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
      throw new Error(`Artisan ${artisanId} not found or Stripe account not set up`);
    }

    // Récupérer les work orders
    const workOrders = await this.prisma.workOrder.findMany({
      where: {
        id: { in: workOrderIds },
        artisanId,
        payoutStatus: 'pending',
      },
    });

    if (workOrders.length === 0) {
      throw new Error('No pending work orders found');
    }

    // Calculer le montant total
    const totalAmountCents = workOrders.reduce(
      (sum, wo) => sum + (wo.payoutAmountCents || 0),
      0,
    );

    const feesCents = Math.round(totalAmountCents * 0.02); // 2% fees
    const netAmountCents = totalAmountCents - feesCents;

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
        status: 'pending',
      },
    });

    try {
      // Créer le transfer Stripe
      const stripe = await this.getStripe();
      const transfer = await stripe.transfers.create({
        amount: netAmountCents,
        currency: 'eur',
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
          status: 'processing',
        },
      });

      // Mettre à jour les work orders
      await this.prisma.workOrder.updateMany({
        where: { id: { in: workOrderIds } },
        data: {
          payoutStatus: 'processing',
          payoutId: payout.id,
        },
      });

      this.logger.log(`Payout ${payout.id} created for artisan ${artisanId}, transfer: ${transfer.id}`);

      return { payout, transfer };
    } catch (error) {
      // Marquer le payout comme failed
      await this.prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'failed',
          failureReason: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Traite les payouts automatiquement (scheduler)
   */
  async processScheduledPayouts() {
    const artisans = await this.prisma.artisan.findMany({
      where: {
        status: 'active',
        stripeAccountId: { not: null },
      },
    });

    for (const artisan of artisans) {
      try {
        // Récupérer les work orders en attente de payout
        const pendingWorkOrders = await this.prisma.workOrder.findMany({
          where: {
            artisanId: artisan.id,
            payoutStatus: 'pending',
            status: 'completed',
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
    // TODO: Implémenter logique de schedule (daily, weekly, etc.)
    // Pour l'instant, weekly par défaut
    return true;
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
    let status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled' = 'processing';

    if (transfer.reversed) {
      status = 'failed';
    } else if (transfer.amount_reversed > 0) {
      status = 'failed';
    } else {
      status = 'paid';
    }

    await this.prisma.payout.update({
      where: { id: payout.id },
      data: {
        status,
        paidAt: status === 'paid' ? new Date() : null,
        failureReason: status === 'failed' ? 'Transfer reversed' : null,
      },
    });

    // Mettre à jour les work orders
    if (status === 'paid') {
      await this.prisma.workOrder.updateMany({
        where: { payoutId: payout.id },
        data: {
          payoutStatus: 'paid',
        },
      });
    }
  }
}
































