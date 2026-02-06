import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

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
 * Les taux de commission varient selon le plan d'abonnement :
 * - FREE/STARTER: 15% (compense le plan gratuit/basique)
 * - PROFESSIONAL: 10% (plan standard)
 * - BUSINESS: 7% (volume élevé)
 * - ENTERPRISE: 5% (négociable, grands comptes)
 * 
 * Commission minimum: 1€ par commande
 * Commission maximum: 20% (protection utilisateur)
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
   * Taux de commission par plan d'abonnement (en pourcentage)
   * Ces taux peuvent être ajustés selon la stratégie business
   */
  private readonly COMMISSION_RATES: Record<string, number> = {
    FREE: 15,          // 15% - Plan gratuit
    STARTER: 12,       // 12% - Plan de démarrage
    PROFESSIONAL: 10,  // 10% - Plan professionnel
    BUSINESS: 7,       // 7% - Plan business (volume)
    ENTERPRISE: 5,     // 5% - Enterprise (négociable)
  };

  /**
   * Commission minimum en centimes (1€)
   * Garantit une commission minimale par commande
   */
  private readonly MIN_COMMISSION_CENTS = 100;

  /**
   * Commission maximum en pourcentage (20%)
   * Protection pour éviter de faire fuir les clients
   */
  private readonly MAX_COMMISSION_PERCENT = 20;

  constructor(private readonly prisma: PrismaService) {}

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
          plan: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
        },
      });

      if (!brand) {
        this.logger.warn(`Brand not found: ${brandId}, using default commission rate`);
        return this.COMMISSION_RATES.STARTER / 100;
      }

      // Déterminer le plan effectif (utiliser subscriptionPlan en priorité, puis plan)
      const planName = (brand.subscriptionPlan || brand.plan || 'STARTER').toUpperCase();
      
      // Vérifier si l'abonnement est actif
      const isActiveSubscription = !brand.subscriptionStatus || 
        brand.subscriptionStatus === 'ACTIVE' || 
        brand.subscriptionStatus === 'TRIALING';

      // Si l'abonnement n'est pas actif, appliquer le taux FREE
      if (!isActiveSubscription) {
        this.logger.debug(`Brand ${brandId} subscription not active, using FREE rate`);
        return this.COMMISSION_RATES.FREE / 100;
      }

      // Récupérer le taux correspondant au plan
      const commissionPercent = this.COMMISSION_RATES[planName] ?? this.COMMISSION_RATES.STARTER;
      
      this.logger.debug(`Commission rate for brand ${brandId} (plan: ${planName}): ${commissionPercent}%`);
      
      return commissionPercent / 100;
    } catch (error) {
      this.logger.error(`Error getting commission rate for brand ${brandId}:`, error);
      // En cas d'erreur, retourner le taux par défaut
      return this.COMMISSION_RATES.STARTER / 100;
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
          plan: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
        },
      });

      if (!brand) {
        this.logger.warn(`Brand not found: ${brandId}, using default commission percent`);
        return this.COMMISSION_RATES.STARTER;
      }

      // Déterminer le plan effectif
      const planName = (brand.subscriptionPlan || brand.plan || 'STARTER').toUpperCase();
      
      // Vérifier si l'abonnement est actif
      const isActiveSubscription = !brand.subscriptionStatus || 
        brand.subscriptionStatus === 'ACTIVE' || 
        brand.subscriptionStatus === 'TRIALING';

      if (!isActiveSubscription) {
        this.logger.debug(`Brand ${brandId} subscription not active, using FREE rate`);
        return this.COMMISSION_RATES.FREE;
      }

      const commissionPercent = this.COMMISSION_RATES[planName] ?? this.COMMISSION_RATES.STARTER;
      
      this.logger.debug(`Commission percent for brand ${brandId} (plan: ${planName}): ${commissionPercent}%`);
      
      return commissionPercent;
    } catch (error) {
      this.logger.error(`Error getting commission percent for brand ${brandId}:`, error);
      return this.COMMISSION_RATES.STARTER;
    }
  }

  /**
   * Get commission rates for all plans (for display in UI)
   * @returns Object with plan names and their commission percentages
   */
  getCommissionRates(): Record<string, number> {
    return { ...this.COMMISSION_RATES };
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
