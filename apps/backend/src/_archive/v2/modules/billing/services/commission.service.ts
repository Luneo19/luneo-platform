import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PLAN_CONFIGS, normalizePlanTier } from '@/libs/plans/plan-config';

export interface DiscountResult {
  discountId?: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
}

/**
 * ★★★ SERVICE - COMMISSION CALCULATION ★★★
 * Service pour calculer les commissions Luneo sur chaque commande
 * 
 * @description
 * SOURCE DE VÉRITÉ: libs/plans/plan-config.ts -> pricing.commissionPercent
 * Les taux de commission varient selon le plan d'abonnement :
 * - FREE: 10% (plan gratuit)
 * - STARTER: 5% (plan de démarrage)
 * - PROFESSIONAL: 3% (plan standard)
 * - BUSINESS: 2% (plan business)
 * - ENTERPRISE: 1% (négociable, grands comptes)
 * 
 * Commission minimum: 1€ par commande
 * Commission maximum: 10% (protection utilisateur)
 * 
 * @remarks
 * Ces taux sont compétitifs par rapport au marché :
 * - Stripe: ~2.9% + 0.25€ (paiement uniquement)
 * - Etsy: 6.5% + frais paiement
 * - Shopify: 0-2% selon plan
 * - Amazon: 8-15% selon catégorie
 * 
 * Luneo inclut: personnalisation IA, AR, hébergement, CDN, support
 */
@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  /**
   * Commission minimum en centimes (1€)
   * Garantit une commission minimale par commande
   */
  private readonly MIN_COMMISSION_CENTS = 100;

  /**
   * Commission maximum en pourcentage (10%)
   * Protection pour éviter de faire fuir les clients
   */
  private readonly MAX_COMMISSION_PERCENT = 10;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get commission percent for a plan tier from plan-config.ts (SINGLE SOURCE OF TRUTH)
   */
  private getCommissionPercentForPlan(planId: string): number {
    const tier = normalizePlanTier(planId);
    return PLAN_CONFIGS[tier].pricing.commissionPercent;
  }

  /**
   * Calculate commission for an order
   * @param amount - Montant en euros ou centimes selon le contexte
   * @param commissionRate - Taux de commission (0.1 = 10%)
   */
  calculateCommission(
    amount: number,
    commissionRate: number = 0.1,
  ): { commissionAmount: number; netAmount: number } {
    // Limiter le taux de commission au maximum autorisé
    const effectiveRate = Math.min(commissionRate, this.MAX_COMMISSION_PERCENT / 100);
    const commissionAmount = Math.round(amount * effectiveRate);
    const netAmount = amount - commissionAmount;

    return {
      commissionAmount,
      netAmount,
    };
  }

  /**
   * Calculate commission in cents avec application du minimum
   * @param amountCents - Montant de la commande en centimes
   * @param commissionPercent - Pourcentage de commission (10 = 10%)
   * @returns Commission en centimes (avec minimum garanti)
   */
  calculateCommissionCents(
    amountCents: number,
    commissionPercent: number = 10,
  ): number {
    // Limiter au taux maximum
    const effectivePercent = Math.min(commissionPercent, this.MAX_COMMISSION_PERCENT);
    const calculatedCommission = Math.round(amountCents * (effectivePercent / 100));
    
    // Appliquer le minimum seulement si le montant de commande est suffisant
    // (évite de prendre 1€ sur une commande de 2€)
    if (amountCents >= this.MIN_COMMISSION_CENTS * 2) {
      return Math.max(calculatedCommission, this.MIN_COMMISSION_CENTS);
    }
    
    return calculatedCommission;
  }

  /**
   * Get commission rate for a brand based on their subscription plan
   * @param brandId - ID de la marque
   * @returns Taux de commission (0.1 = 10%)
   * 
   * @example
   * const rate = await commissionService.getCommissionRate('brand123');
   * // rate = 0.10 pour un plan PROFESSIONAL
   */
  async getCommissionRate(brandId: string): Promise<number> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: {
          subscriptionPlan: true,
          plan: true,
          subscriptionStatus: true,
        },
      });

      if (!brand) {
        this.logger.warn(`Brand not found: ${brandId}, using default commission rate`);
        return this.getCommissionPercentForPlan('starter') / 100;
      }

      // Vérifier si l'abonnement est actif
      const isActiveSubscription = !brand.subscriptionStatus || 
        brand.subscriptionStatus === 'ACTIVE' || 
        brand.subscriptionStatus === 'TRIALING';

      // Si l'abonnement n'est pas actif, appliquer le taux FREE
      if (!isActiveSubscription) {
        this.logger.debug(`Brand ${brandId} subscription not active, using FREE rate`);
        return this.getCommissionPercentForPlan('free') / 100;
      }

      // Résoudre le plan effectif (subscriptionPlan prioritaire)
      const planId = brand.subscriptionPlan || brand.plan || 'starter';
      const commissionPercent = this.getCommissionPercentForPlan(planId);
      
      this.logger.debug(`Commission rate for brand ${brandId} (plan: ${planId}): ${commissionPercent}%`);
      
      return commissionPercent / 100;
    } catch (error) {
      this.logger.error(`Error getting commission rate for brand ${brandId}:`, error);
      return this.getCommissionPercentForPlan('starter') / 100;
    }
  }

  /**
   * Get commission percent for a brand based on their subscription plan
   * @param brandId - ID de la marque
   * @returns Pourcentage de commission (10 = 10%)
   * 
   * @example
   * const percent = await commissionService.getCommissionPercent('brand123');
   * // percent = 10 pour un plan PROFESSIONAL
   */
  async getCommissionPercent(brandId: string): Promise<number> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: {
          subscriptionPlan: true,
          plan: true,
          subscriptionStatus: true,
        },
      });

      if (!brand) {
        this.logger.warn(`Brand not found: ${brandId}, using default commission percent`);
        return this.getCommissionPercentForPlan('starter');
      }

      // Vérifier si l'abonnement est actif
      const isActiveSubscription = !brand.subscriptionStatus || 
        brand.subscriptionStatus === 'ACTIVE' || 
        brand.subscriptionStatus === 'TRIALING';

      if (!isActiveSubscription) {
        this.logger.debug(`Brand ${brandId} subscription not active, using FREE rate`);
        return this.getCommissionPercentForPlan('free');
      }

      const planId = brand.subscriptionPlan || brand.plan || 'starter';
      const commissionPercent = this.getCommissionPercentForPlan(planId);
      
      this.logger.debug(`Commission percent for brand ${brandId} (plan: ${planId}): ${commissionPercent}%`);
      
      return commissionPercent;
    } catch (error) {
      this.logger.error(`Error getting commission percent for brand ${brandId}:`, error);
      return this.getCommissionPercentForPlan('starter');
    }
  }

  /**
   * Get commission rates for all plans (for display in UI)
   * @returns Object with plan names and their commission percentages
   */
  getCommissionRates(): Record<string, number> {
    const rates: Record<string, number> = {};
    for (const [tier, config] of Object.entries(PLAN_CONFIGS)) {
      rates[tier.toUpperCase()] = config.pricing.commissionPercent;
    }
    return rates;
  }

  /**
   * Calculate net amount after commission for a brand
   * @param brandId - ID de la marque
   * @param amountCents - Montant brut en centimes
   * @returns Object with commission and net amount
   */
  async calculateNetAmount(
    brandId: string,
    amountCents: number,
  ): Promise<{
    grossAmountCents: number;
    commissionPercent: number;
    commissionCents: number;
    netAmountCents: number;
  }> {
    const commissionPercent = await this.getCommissionPercent(brandId);
    const commissionCents = this.calculateCommissionCents(amountCents, commissionPercent);
    const netAmountCents = amountCents - commissionCents;

    return {
      grossAmountCents: amountCents,
      commissionPercent,
      commissionCents,
      netAmountCents,
    };
  }
}
