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
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';

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

    try {
      // ✅ Récupérer le template
      const templates = await this.prisma.$queryRawUnsafe<Array<{
        id: string;
        creatorId: string;
        priceCents: number;
        isFree: boolean;
        revenueSharePercent: number;
      }>>(
        `SELECT "id", "creatorId", "priceCents", "isFree", "revenueSharePercent" 
         FROM "MarketplaceTemplate" WHERE "id" = $1 LIMIT 1`,
        data.templateId.trim(),
      );

      if (!templates || templates.length === 0) {
        throw new NotFoundException(`Template ${data.templateId} not found`);
      }

      const template = templates[0];

      // ✅ Si le template est gratuit, pas de revenue sharing
      if (template.isFree || template.priceCents === 0) {
        // Créer quand même un enregistrement pour tracking
        const purchase = await this.prisma.$executeRaw`
          INSERT INTO "TemplatePurchase" (
            "id", "templateId", "buyerId", "creatorId",
            "priceCents", "platformFeeCents", "creatorRevenueCents",
            "paymentStatus", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text,
            ${data.templateId.trim()},
            ${data.buyerId.trim()},
            ${template.creatorId},
            0, 0, 0,
            'succeeded',
            NOW(), NOW()
          )
          RETURNING *
        `;

        // ✅ Incrémenter les downloads
        await this.prisma.$executeRawUnsafe(
          `UPDATE "MarketplaceTemplate" SET "downloads" = "downloads" + 1 WHERE "id" = $1`,
          data.templateId.trim(),
        );

        return {
          purchaseId: (purchase as any).id,
          templateId: data.templateId.trim(),
          buyerId: data.buyerId.trim(),
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
      const purchase = await this.prisma.$executeRaw`
        INSERT INTO "TemplatePurchase" (
          "id", "templateId", "buyerId", "creatorId",
          "priceCents", "platformFeeCents", "creatorRevenueCents",
          "stripePaymentIntentId", "paymentStatus",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${data.templateId.trim()},
          ${data.buyerId.trim()},
          ${template.creatorId},
          ${data.priceCents},
          ${platformFeeCents},
          ${creatorRevenueCents},
          ${data.stripePaymentIntentId || null},
          'pending',
          NOW(), NOW()
        )
        RETURNING *
      `;

      // ✅ Mettre à jour les stats du template
      await this.prisma.$executeRawUnsafe(
        `UPDATE "MarketplaceTemplate" SET
          "downloads" = "downloads" + 1,
          "totalRevenueCents" = "totalRevenueCents" + $1
        WHERE "id" = $2`,
        data.priceCents,
        data.templateId.trim(),
      );

      this.logger.log(
        `Template purchase created: ${data.templateId} by ${data.buyerId}, revenue: ${creatorRevenueCents} cents`,
      );

      return {
        purchaseId: (purchase as any).id,
        templateId: data.templateId.trim(),
        buyerId: data.buyerId.trim(),
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
   */
  async confirmPurchase(purchaseId: string, stripePaymentIntentId: string): Promise<void> {
    // ✅ Validation
    if (!purchaseId || typeof purchaseId !== 'string' || purchaseId.trim().length === 0) {
      throw new BadRequestException('Purchase ID is required');
    }

    try {
      // ✅ Mettre à jour le statut de l'achat
      await this.prisma.$executeRawUnsafe(
        `UPDATE "TemplatePurchase" SET
          "stripePaymentIntentId" = $1,
          "paymentStatus" = 'succeeded',
          "updatedAt" = NOW()
        WHERE "id" = $2`,
        stripePaymentIntentId,
        purchaseId.trim(),
      );

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

    try {
      // ✅ Calculer le revenue total pour la période
      const revenueResult = await this.prisma.$queryRawUnsafe<Array<{
        totalRevenueCents: number;
        platformFeeCents: number;
        netAmountCents: number;
      }>>(
        `SELECT
          COALESCE(SUM("priceCents"), 0)::int as "totalRevenueCents",
          COALESCE(SUM("platformFeeCents"), 0)::int as "platformFeeCents",
          COALESCE(SUM("creatorRevenueCents"), 0)::int as "netAmountCents"
        FROM "TemplatePurchase"
        WHERE "creatorId" = $1
          AND "paymentStatus" = 'succeeded'
          AND "createdAt" >= $2
          AND "createdAt" < $3`,
        data.creatorId.trim(),
        data.periodStart,
        data.periodEnd,
      );

      if (!revenueResult || revenueResult.length === 0) {
        throw new NotFoundException('No revenue found for this period');
      }

      const revenue = revenueResult[0];

      if (revenue.netAmountCents <= 0) {
        throw new BadRequestException('No revenue to payout for this period');
      }

      // ✅ Créer le payout
      const payout = await this.prisma.$executeRaw`
        INSERT INTO "CreatorPayout" (
          "id", "creatorId",
          "totalRevenueCents", "platformFeeCents", "netAmountCents",
          "status", "periodStart", "periodEnd",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text,
          ${data.creatorId.trim()},
          ${revenue.totalRevenueCents},
          ${revenue.platformFeeCents},
          ${revenue.netAmountCents},
          'pending',
          ${data.periodStart},
          ${data.periodEnd},
          NOW(), NOW()
        )
        RETURNING *
      `;

      this.logger.log(
        `Payout created for creator ${data.creatorId}: ${revenue.netAmountCents} cents`,
      );

      // ✅ Récupérer le payout créé
      const payouts = await this.prisma.$queryRawUnsafe<CreatorPayout[]>(
        `SELECT * FROM "CreatorPayout" WHERE "id" = $1 LIMIT 1`,
        (payout as any).id,
      );

      if (!payouts || payouts.length === 0) {
        throw new Error('Failed to retrieve created payout');
      }

      return payouts[0];
    } catch (error) {
      this.logger.error(
        `Failed to create payout: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  /**
   * Traite un payout via Stripe Connect
   */
  async processPayout(payoutId: string, stripeConnectAccountId: string): Promise<CreatorPayout> {
    // ✅ Validation
    if (!payoutId || typeof payoutId !== 'string' || payoutId.trim().length === 0) {
      throw new BadRequestException('Payout ID is required');
    }

    if (!stripeConnectAccountId || typeof stripeConnectAccountId !== 'string' || stripeConnectAccountId.trim().length === 0) {
      throw new BadRequestException('Stripe Connect account ID is required');
    }

    try {
      // ✅ Récupérer le payout
      const payouts = await this.prisma.$queryRawUnsafe<CreatorPayout[]>(
        `SELECT * FROM "CreatorPayout" WHERE "id" = $1 LIMIT 1`,
        payoutId.trim(),
      );

      if (!payouts || payouts.length === 0) {
        throw new NotFoundException(`Payout ${payoutId} not found`);
      }

      const payout = payouts[0];

      if (payout.status !== 'pending') {
        throw new BadRequestException(`Payout ${payoutId} is not in pending status`);
      }

      // ✅ Créer le transfer Stripe
      const stripeSecretKey = this.configService.get<string>('stripe.secretKey');
      if (!stripeSecretKey) {
        throw new Error('Stripe secret key not configured');
      }

      const stripeModule = await import('stripe');
      const stripe = new stripeModule.default(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });

      const transfer = await stripe.transfers.create({
        amount: payout.netAmountCents,
        currency: 'eur',
        destination: stripeConnectAccountId,
        metadata: {
          payoutId: payout.id,
          creatorId: payout.creatorId,
          periodStart: payout.periodStart.toISOString(),
          periodEnd: payout.periodEnd.toISOString(),
        },
      });

      // ✅ Mettre à jour le payout
      await this.prisma.$executeRawUnsafe(
        `UPDATE "CreatorPayout" SET
          "stripeTransferId" = $1,
          "status" = 'processing',
          "updatedAt" = NOW()
        WHERE "id" = $2`,
        transfer.id,
        payoutId.trim(),
      );

      this.logger.log(`Payout ${payoutId} processed via Stripe transfer ${transfer.id}`);

      // ✅ Récupérer le payout mis à jour
      const updatedPayouts = await this.prisma.$queryRawUnsafe<CreatorPayout[]>(
        `SELECT * FROM "CreatorPayout" WHERE "id" = $1 LIMIT 1`,
        payoutId.trim(),
      );

      if (!updatedPayouts || updatedPayouts.length === 0) {
        throw new Error('Failed to retrieve updated payout');
      }

      return updatedPayouts[0];
    } catch (error) {
      // ✅ Marquer le payout comme failed en cas d'erreur
      await this.prisma.$executeRawUnsafe(
        `UPDATE "CreatorPayout" SET
          "status" = 'failed',
          "failureReason" = $1,
          "updatedAt" = NOW()
        WHERE "id" = $2`,
        error instanceof Error ? error.message : 'Unknown error',
        payoutId.trim(),
      );

      this.logger.error(
        `Failed to process payout: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }
}
