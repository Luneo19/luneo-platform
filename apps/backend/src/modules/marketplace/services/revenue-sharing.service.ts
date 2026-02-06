/**
 * @fileoverview Service de revenue sharing pour créateurs
 * @module RevenueSharingService
 *
 * Conforme au plan PHASE 7 - Marketplace & Communauté - Revenue sharing
 *
 * FONCTIONNALITÉS:
 * - Calcul du revenue sharing sur les achats de templates
 * - Gestion des payouts créateurs
 * - Intégration Stripe Connect
 * - Historique des transactions
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation robuste
 * - ✅ Logging structuré
 * - ✅ SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
 */

import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrencyUtils } from '@/config/currency.config';
import { ConfigService } from '@nestjs/config';

// ============================================================================
// TYPES STRICTS
// ============================================================================

/**
 * Données d'achat de template
 */
export interface PurchaseTemplateData {
  templateId: string;
  buyerId: string;
  priceCents: number;
  stripePaymentIntentId?: string;
}

/**
 * Résultat d'achat
 */
export interface PurchaseResult {
  purchaseId: string;
  templateId: string;
  buyerId: string;
  creatorId: string;
  priceCents: number;
  platformFeeCents: number;
  creatorRevenueCents: number;
  paymentStatus: string;
}

/**
 * Données de création de payout
 */
export interface CreatePayoutData {
  creatorId: string;
  periodStart: Date;
  periodEnd: Date;
}

/**
 * Payout créateur
 */
export interface CreatorPayout {
  id: string;
  creatorId: string;
  totalRevenueCents: number;
  platformFeeCents: number;
  netAmountCents: number;
  stripeTransferId?: string;
  stripePayoutId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  failureReason?: string;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  processedAt?: Date;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class RevenueSharingService {
  private readonly logger = new Logger(RevenueSharingService.name);
  private readonly platformFeePercent = 30; // 30% pour la plateforme, 70% pour le créateur

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Traite un achat de template
   * Conforme au plan PHASE 7 - Revenue sharing
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
   */
  async purchaseTemplate(data: PurchaseTemplateData): Promise<PurchaseResult> {
    // ✅ Validation
    if (!data.templateId || typeof data.templateId !== 'string' || data.templateId.trim().length === 0) {
      throw new BadRequestException('Template ID is required');
    }

    if (!data.buyerId || typeof data.buyerId !== 'string' || data.buyerId.trim().length === 0) {
      throw new BadRequestException('Buyer ID is required');
    }

    if (!data.priceCents || data.priceCents <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    const cleanTemplateId = data.templateId.trim();
    const cleanBuyerId = data.buyerId.trim();

    try {
      // ✅ Récupérer le template avec Prisma
      const template = await this.prisma.marketplaceTemplate.findUnique({
        where: { id: cleanTemplateId },
        select: {
          id: true,
          creatorId: true,
          priceCents: true,
          isFree: true,
          revenueSharePercent: true,
        },
      });

      if (!template) {
        throw new NotFoundException(`Template ${data.templateId} not found`);
      }

      // ✅ Si le template est gratuit, pas de revenue sharing
      if (template.isFree || template.priceCents === 0) {
        // Créer quand même un enregistrement pour tracking
        const purchase = await this.prisma.templatePurchase.create({
          data: {
            templateId: cleanTemplateId,
            buyerId: cleanBuyerId,
            creatorId: template.creatorId,
            priceCents: 0,
            platformFeeCents: 0,
            creatorRevenueCents: 0,
            paymentStatus: 'succeeded',
          },
        });

        // ✅ Incrémenter les downloads
        await this.prisma.marketplaceTemplate.update({
          where: { id: cleanTemplateId },
          data: { downloads: { increment: 1 } },
        });

        return {
          purchaseId: purchase.id,
          templateId: cleanTemplateId,
          buyerId: cleanBuyerId,
          creatorId: template.creatorId,
          priceCents: 0,
          platformFeeCents: 0,
          creatorRevenueCents: 0,
          paymentStatus: 'succeeded',
        };
      }

      // ✅ Calculer le revenue sharing
      const platformFeeCents = Math.round(data.priceCents * (this.platformFeePercent / 100));
      const creatorRevenueCents = data.priceCents - platformFeeCents;

      // ✅ Créer l'enregistrement d'achat
      const purchase = await this.prisma.templatePurchase.create({
        data: {
          templateId: cleanTemplateId,
          buyerId: cleanBuyerId,
          creatorId: template.creatorId,
          priceCents: data.priceCents,
          platformFeeCents,
          creatorRevenueCents,
          stripePaymentIntentId: data.stripePaymentIntentId || null,
          paymentStatus: 'pending',
        },
      });

      // ✅ Mettre à jour les stats du template
      await this.prisma.marketplaceTemplate.update({
        where: { id: cleanTemplateId },
        data: {
          downloads: { increment: 1 },
          totalRevenueCents: { increment: data.priceCents },
        },
      });

      this.logger.log(
        `Template purchase created: ${data.templateId} by ${data.buyerId}, revenue: ${creatorRevenueCents} cents`,
      );

      return {
        purchaseId: purchase.id,
        templateId: cleanTemplateId,
        buyerId: cleanBuyerId,
        creatorId: template.creatorId,
        priceCents: data.priceCents,
        platformFeeCents,
        creatorRevenueCents,
        paymentStatus: 'pending',
      };
    } catch (error) {
      this.logger.error(
        `Failed to process template purchase: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Confirme un achat (après paiement Stripe réussi)
   * SEC-11: Utilise méthodes Prisma au lieu de $executeRawUnsafe
   */
  async confirmPurchase(purchaseId: string, stripePaymentIntentId: string): Promise<void> {
    // ✅ Validation
    if (!purchaseId || typeof purchaseId !== 'string' || purchaseId.trim().length === 0) {
      throw new BadRequestException('Purchase ID is required');
    }

    try {
      // ✅ Mettre à jour le statut de l'achat
      await this.prisma.templatePurchase.update({
        where: { id: purchaseId.trim() },
        data: {
          stripePaymentIntentId,
          paymentStatus: 'succeeded',
        },
      });

      this.logger.log(`Purchase ${purchaseId} confirmed`);
    } catch (error) {
      this.logger.error(
        `Failed to confirm purchase: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Crée un payout pour un créateur
   * Conforme au plan PHASE 7 - Revenue sharing
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
   */
  async createPayout(data: CreatePayoutData): Promise<CreatorPayout> {
    // ✅ Validation
    if (!data.creatorId || typeof data.creatorId !== 'string' || data.creatorId.trim().length === 0) {
      throw new BadRequestException('Creator ID is required');
    }

    if (!data.periodStart || !(data.periodStart instanceof Date)) {
      throw new BadRequestException('Valid period start date is required');
    }

    if (!data.periodEnd || !(data.periodEnd instanceof Date)) {
      throw new BadRequestException('Valid period end date is required');
    }

    if (data.periodStart >= data.periodEnd) {
      throw new BadRequestException('Period start must be before period end');
    }

    const cleanCreatorId = data.creatorId.trim();

    try {
      // ✅ Calculer le revenue total pour la période avec Prisma aggregate
      const revenueResult = await this.prisma.templatePurchase.aggregate({
        where: {
          creatorId: cleanCreatorId,
          paymentStatus: 'succeeded',
          createdAt: {
            gte: data.periodStart,
            lt: data.periodEnd,
          },
        },
        _sum: {
          priceCents: true,
          platformFeeCents: true,
          creatorRevenueCents: true,
        },
      });

      const totalRevenueCents = revenueResult._sum.priceCents || 0;
      const platformFeeCents = revenueResult._sum.platformFeeCents || 0;
      const netAmountCents = revenueResult._sum.creatorRevenueCents || 0;

      if (netAmountCents <= 0) {
        throw new BadRequestException('No revenue to payout for this period');
      }

      // ✅ Créer le payout
      const payout = await this.prisma.creatorPayout.create({
        data: {
          creatorId: cleanCreatorId,
          totalRevenueCents,
          platformFeeCents,
          netAmountCents,
          status: 'pending',
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
        },
      });

      this.logger.log(
        `Payout created for creator ${data.creatorId}: ${netAmountCents} cents`,
      );

      return payout as CreatorPayout;
    } catch (error) {
      this.logger.error(
        `Failed to create payout: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Traite un payout via Stripe Connect
   * SEC-11: Utilise méthodes Prisma au lieu de $queryRawUnsafe
   */
  async processPayout(payoutId: string, stripeConnectAccountId: string): Promise<CreatorPayout> {
    // ✅ Validation
    if (!payoutId || typeof payoutId !== 'string' || payoutId.trim().length === 0) {
      throw new BadRequestException('Payout ID is required');
    }

    if (!stripeConnectAccountId || typeof stripeConnectAccountId !== 'string' || stripeConnectAccountId.trim().length === 0) {
      throw new BadRequestException('Stripe Connect account ID is required');
    }

    const cleanPayoutId = payoutId.trim();

    try {
      // ✅ Récupérer le payout
      const payout = await this.prisma.creatorPayout.findUnique({
        where: { id: cleanPayoutId },
      });

      if (!payout) {
        throw new NotFoundException(`Payout ${payoutId} not found`);
      }

      if (payout.status !== 'pending') {
        throw new BadRequestException(`Payout ${payoutId} is not in pending status`);
      }

      // ✅ Créer le transfer Stripe
      const stripeSecretKey = this.configService.get<string>('stripe.secretKey');
      if (!stripeSecretKey) {
        throw new InternalServerErrorException('Stripe secret key not configured');
      }

      const stripeModule = await import('stripe');
      const stripe = new stripeModule.default(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });

      const transfer = await stripe.transfers.create({
        amount: payout.netAmountCents,
        currency: CurrencyUtils.getStripeCurrency(),
        destination: stripeConnectAccountId,
        metadata: {
          payoutId: payout.id,
          creatorId: payout.creatorId,
          periodStart: payout.periodStart.toISOString(),
          periodEnd: payout.periodEnd.toISOString(),
        },
      });

      // ✅ Mettre à jour le payout
      const updatedPayout = await this.prisma.creatorPayout.update({
        where: { id: cleanPayoutId },
        data: {
          stripeTransferId: transfer.id,
          status: 'processing',
        },
      });

      this.logger.log(`Payout ${payoutId} processed via Stripe transfer ${transfer.id}`);

      return updatedPayout as CreatorPayout;
    } catch (error) {
      // ✅ Marquer le payout comme failed en cas d'erreur
      await this.prisma.creatorPayout.update({
        where: { id: cleanPayoutId },
        data: {
          status: 'failed',
          failureReason: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      this.logger.error(
        `Failed to process payout: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}
