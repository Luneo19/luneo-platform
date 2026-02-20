/**
 * @fileoverview Service de gestion des plans de pricing granulaires avec add-ons
 * @module PricingPlansService
 *
 * Conforme au plan PHASE 6 - Pricing & Rentabilité IA - Plans granulaires + Add-ons
 *
 * FONCTIONNALITÉS:
 * - Définition des plans Starter/Pro/Business/Enterprise
 * - Gestion des add-ons (AI credits, AR sessions, storage)
 * - Calcul des prix avec add-ons
 * - Validation des limites par plan
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Validation robuste
 * - ✅ Structure modulaire
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CurrencyUtils } from '@/config/currency.config';
import { PLAN_CONFIGS } from '@/libs/plans/plan-config';
import { PlanTier } from '@/libs/plans/plan-config.types';

// ============================================================================
// TYPES STRICTS
// ============================================================================

/**
 * Type de plan
 */
export type PlanType = 'starter' | 'professional' | 'business' | 'enterprise';

/**
 * Type d'add-on
 */
export type AddOnType = 'ai_credits' | 'ar_sessions' | 'storage_gb' | 'api_calls' | 'team_members';

/**
 * Configuration d'un add-on
 */
export interface AddOnConfig {
  id: AddOnType;
  name: string;
  description: string;
  unit: string; // 'credits', 'sessions', 'gb', 'calls', 'members'
  basePriceCents: number; // Prix de base par unité
  bulkDiscounts?: Array<{ minQuantity: number; discountPercent: number }>; // Remises volume
  availableForPlans: PlanType[]; // Plans éligibles
}

/**
 * Configuration d'un plan
 */
export interface PlanConfig {
  id: PlanType;
  name: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number; // Prix annuel (avec remise)
  features: string[];
  limits: {
    ai_generations: number; // -1 = illimité
    ar_sessions: number;
    storage_gb: number;
    api_calls: number;
    team_members: number;
    designs_per_month: number;
    renders_2d: number;
    renders_3d: number;
  };
  addOns: AddOnType[]; // Add-ons disponibles
}

/**
 * Calcul de prix avec add-ons
 */
export interface PricingCalculation {
  planId: PlanType;
  planPriceCents: number;
  addOns: Array<{
    type: AddOnType;
    quantity: number;
    unitPriceCents: number;
    discountPercent: number;
    totalCents: number;
  }>;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  currency: string;
}

/**
 * Options de calcul de prix
 */
export interface PricingOptions {
  planId: PlanType;
  billingInterval: 'monthly' | 'yearly';
  addOns?: Array<{ type: AddOnType; quantity: number }>;
  applyDiscounts?: boolean;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class PricingPlansService {
  private readonly logger = new Logger(PricingPlansService.name);

  // ✅ Définition des plans (conforme au plan PHASE 6)
  private readonly plans: Record<PlanType, PlanConfig> = {
    starter: {
      id: 'starter',
      name: 'Starter',
      description: 'Parfait pour découvrir Luneo et tester toutes les fonctionnalités de base',
      monthlyPriceCents: PLAN_CONFIGS[PlanTier.STARTER].pricing.monthlyPrice * 100,
      yearlyPriceCents: PLAN_CONFIGS[PlanTier.STARTER].pricing.yearlyPrice * 100,
      features: [
        '50 designs/mois',
        'Customizer 2D',
        '100 rendus 2D/mois',
        '10 rendus 3D/mois',
        'Export PNG/PDF',
        'Support standard',
        '3 membres d\'équipe',
        '5 GB stockage',
      ],
      limits: {
        ai_generations: 20,
        ar_sessions: 100,
        storage_gb: 5,
        api_calls: 10000,
        team_members: 3,
        designs_per_month: 50,
        renders_2d: 100,
        renders_3d: 10,
      },
      addOns: ['ai_credits', 'ar_sessions', 'storage_gb'],
    },
    professional: {
      id: 'professional',
      name: 'Professional',
      description: 'Pour les créateurs et PME qui veulent passer à la vitesse supérieure',
      monthlyPriceCents: PLAN_CONFIGS[PlanTier.PROFESSIONAL].pricing.monthlyPrice * 100,
      yearlyPriceCents: PLAN_CONFIGS[PlanTier.PROFESSIONAL].pricing.yearlyPrice * 100,
      features: [
        `${PLAN_CONFIGS[PlanTier.PROFESSIONAL].limits.designsPerMonth} designs/mois`,
        'Customizer 2D/3D',
        `${PLAN_CONFIGS[PlanTier.PROFESSIONAL].quotas.find(q => q.metric === 'renders_2d')?.limit ?? 500} rendus 2D/mois`,
        `${PLAN_CONFIGS[PlanTier.PROFESSIONAL].quotas.find(q => q.metric === 'renders_3d')?.limit ?? 50} rendus 3D/mois`,
        'Export HD illimité',
        'Configurateur 3D',
        'Support prioritaire',
        'API accès complet',
        `${PLAN_CONFIGS[PlanTier.PROFESSIONAL].limits.teamMembers} membres d\'équipe`,
        `${PLAN_CONFIGS[PlanTier.PROFESSIONAL].limits.storageGB} GB stockage`,
      ],
      limits: {
        ai_generations: PLAN_CONFIGS[PlanTier.PROFESSIONAL].quotas.find(q => q.metric === 'ai_generations')?.limit ?? 100,
        ar_sessions: PLAN_CONFIGS[PlanTier.PROFESSIONAL].quotas.find(q => q.metric === 'virtual_tryons')?.limit ?? 1000,
        storage_gb: PLAN_CONFIGS[PlanTier.PROFESSIONAL].limits.storageGB,
        api_calls: PLAN_CONFIGS[PlanTier.PROFESSIONAL].quotas.find(q => q.metric === 'api_calls')?.limit ?? 50000,
        team_members: PLAN_CONFIGS[PlanTier.PROFESSIONAL].limits.teamMembers,
        designs_per_month: PLAN_CONFIGS[PlanTier.PROFESSIONAL].limits.designsPerMonth,
        renders_2d: PLAN_CONFIGS[PlanTier.PROFESSIONAL].quotas.find(q => q.metric === 'renders_2d')?.limit ?? 500,
        renders_3d: PLAN_CONFIGS[PlanTier.PROFESSIONAL].quotas.find(q => q.metric === 'renders_3d')?.limit ?? 50,
      },
      addOns: ['ai_credits', 'ar_sessions', 'storage_gb', 'api_calls', 'team_members'],
    },
    business: {
      id: 'business',
      name: 'Business',
      description: 'Pour les équipes qui ont besoin de collaboration et de volume',
      monthlyPriceCents: PLAN_CONFIGS[PlanTier.BUSINESS].pricing.monthlyPrice * 100,
      yearlyPriceCents: PLAN_CONFIGS[PlanTier.BUSINESS].pricing.yearlyPrice * 100,
      features: [
        `${PLAN_CONFIGS[PlanTier.BUSINESS].limits.designsPerMonth} designs/mois`,
        'Virtual Try-On',
        `Multi-utilisateurs (${PLAN_CONFIGS[PlanTier.BUSINESS].limits.teamMembers})`,
        'Webhooks',
        'Marque blanche',
        'Support dédié',
        'Analytics avancées',
        `${PLAN_CONFIGS[PlanTier.BUSINESS].limits.storageGB} GB stockage`,
      ],
      limits: {
        ai_generations: PLAN_CONFIGS[PlanTier.BUSINESS].quotas.find(q => q.metric === 'ai_generations')?.limit ?? 500,
        ar_sessions: PLAN_CONFIGS[PlanTier.BUSINESS].quotas.find(q => q.metric === 'virtual_tryons')?.limit ?? 10000,
        storage_gb: PLAN_CONFIGS[PlanTier.BUSINESS].limits.storageGB,
        api_calls: PLAN_CONFIGS[PlanTier.BUSINESS].quotas.find(q => q.metric === 'api_calls')?.limit ?? 200000,
        team_members: PLAN_CONFIGS[PlanTier.BUSINESS].limits.teamMembers,
        designs_per_month: PLAN_CONFIGS[PlanTier.BUSINESS].limits.designsPerMonth,
        renders_2d: PLAN_CONFIGS[PlanTier.BUSINESS].quotas.find(q => q.metric === 'renders_2d')?.limit ?? 2000,
        renders_3d: PLAN_CONFIGS[PlanTier.BUSINESS].quotas.find(q => q.metric === 'renders_3d')?.limit ?? 200,
      },
      addOns: ['ai_credits', 'ar_sessions', 'storage_gb', 'api_calls', 'team_members'],
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Solution sur-mesure pour les grandes organisations',
      monthlyPriceCents: PLAN_CONFIGS[PlanTier.ENTERPRISE].pricing.monthlyPrice * 100,
      yearlyPriceCents: PLAN_CONFIGS[PlanTier.ENTERPRISE].pricing.yearlyPrice * 100,
      features: [
        'Designs illimités',
        'Utilisateurs illimités',
        'SLA 99.9%',
        'Account Manager',
        'Formation personnalisée',
        'Déploiement on-premise',
        'Stockage illimité',
      ],
      limits: {
        ai_generations: -1, // Illimité
        ar_sessions: -1,
        storage_gb: -1,
        api_calls: -1,
        team_members: -1,
        designs_per_month: -1,
        renders_2d: -1,
        renders_3d: -1,
      },
      addOns: ['ai_credits', 'ar_sessions', 'storage_gb', 'api_calls', 'team_members'],
    },
  };

  // ✅ Définition des add-ons (conforme au plan PHASE 6)
  private readonly addOns: Record<AddOnType, AddOnConfig> = {
    ai_credits: {
      id: 'ai_credits',
      name: 'Crédits IA supplémentaires',
      description: 'Pack de crédits pour générations IA supplémentaires',
      unit: 'credits',
      basePriceCents: 19, // 0.19€ par crédit
      bulkDiscounts: [
        { minQuantity: 100, discountPercent: 5 }, // 5% de remise à partir de 100 crédits
        { minQuantity: 500, discountPercent: 10 }, // 10% de remise à partir de 500 crédits
        { minQuantity: 1000, discountPercent: 15 }, // 15% de remise à partir de 1000 crédits
      ],
      availableForPlans: ['starter', 'professional', 'business', 'enterprise'],
    },
    ar_sessions: {
      id: 'ar_sessions',
      name: 'Sessions AR supplémentaires',
      description: 'Pack de sessions AR pour Virtual Try-On',
      unit: 'sessions',
      basePriceCents: 10, // 0.10€ par session
      bulkDiscounts: [
        { minQuantity: 1000, discountPercent: 10 },
        { minQuantity: 5000, discountPercent: 15 },
        { minQuantity: 10000, discountPercent: 20 },
      ],
      availableForPlans: ['starter', 'professional', 'business', 'enterprise'],
    },
    storage_gb: {
      id: 'storage_gb',
      name: 'Stockage supplémentaire',
      description: 'Espace de stockage supplémentaire (par GB)',
      unit: 'gb',
      basePriceCents: 50, // 0.50€ par GB
      bulkDiscounts: [
        { minQuantity: 100, discountPercent: 10 }, // 10% de remise à partir de 100 GB
        { minQuantity: 500, discountPercent: 20 }, // 20% de remise à partir de 500 GB
      ],
      availableForPlans: ['starter', 'professional', 'business', 'enterprise'],
    },
    api_calls: {
      id: 'api_calls',
      name: 'Appels API supplémentaires',
      description: 'Pack d\'appels API supplémentaires (par 1000 appels)',
      unit: 'calls',
      basePriceCents: 10, // 0.10€ par 1000 appels
      bulkDiscounts: [
        { minQuantity: 10000, discountPercent: 10 },
        { minQuantity: 100000, discountPercent: 20 },
      ],
      availableForPlans: ['professional', 'business', 'enterprise'],
    },
    team_members: {
      id: 'team_members',
      name: 'Membres d\'équipe supplémentaires',
      description: 'Ajout de membres d\'équipe supplémentaires',
      unit: 'members',
      basePriceCents: 500, // 5€ par membre
      bulkDiscounts: [
        { minQuantity: 5, discountPercent: 10 },
        { minQuantity: 10, discountPercent: 15 },
      ],
      availableForPlans: ['professional', 'business', 'enterprise'],
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtient la configuration d'un plan
   */
  getPlan(planId: PlanType): PlanConfig {
    const plan = this.plans[planId];
    if (!plan) {
      throw new BadRequestException(`Plan ${planId} not found`);
    }
    return plan;
  }

  /**
   * Obtient tous les plans
   */
  getAllPlans(): PlanConfig[] {
    return Object.values(this.plans);
  }

  /**
   * Obtient la configuration d'un add-on
   */
  getAddOn(addOnId: AddOnType): AddOnConfig {
    const addOn = this.addOns[addOnId];
    if (!addOn) {
      throw new BadRequestException(`Add-on ${addOnId} not found`);
    }
    return addOn;
  }

  /**
   * Obtient tous les add-ons disponibles pour un plan
   */
  getAvailableAddOns(planId: PlanType): AddOnConfig[] {
    const plan = this.getPlan(planId);
    return plan.addOns.map((addOnId) => this.getAddOn(addOnId));
  }

  /**
   * Calcule le prix total avec add-ons
   * Conforme au plan PHASE 6 - Calcul de prix avec add-ons
   */
  calculatePricing(options: PricingOptions): PricingCalculation {
    // ✅ Validation
    if (!options.planId || !this.plans[options.planId]) {
      throw new BadRequestException(`Invalid plan ID: ${options.planId}`);
    }

    if (!options.billingInterval || !['monthly', 'yearly'].includes(options.billingInterval)) {
      throw new BadRequestException('Billing interval must be "monthly" or "yearly"');
    }

    const plan = this.getPlan(options.planId);
    const planPriceCents =
      options.billingInterval === 'yearly' ? plan.yearlyPriceCents : plan.monthlyPriceCents;

    // ✅ Calculer les add-ons
    const addOnCalculations: PricingCalculation['addOns'] = [];
    let subtotalCents = planPriceCents;

    if (options.addOns && options.addOns.length > 0) {
      for (const addOnRequest of options.addOns) {
        // ✅ Validation de l'add-on
        if (!addOnRequest.type || !this.addOns[addOnRequest.type]) {
          throw new BadRequestException(`Invalid add-on type: ${addOnRequest.type}`);
        }

        if (!addOnRequest.quantity || addOnRequest.quantity <= 0) {
          throw new BadRequestException(`Invalid add-on quantity: ${addOnRequest.quantity}`);
        }

        const addOn = this.getAddOn(addOnRequest.type);

        // ✅ Vérifier que l'add-on est disponible pour ce plan
        if (!addOn.availableForPlans.includes(options.planId)) {
          throw new BadRequestException(
            `Add-on ${addOnRequest.type} is not available for plan ${options.planId}`,
          );
        }

        // ✅ Calculer le prix avec remises volume
        const unitPriceCents = addOn.basePriceCents;
        let discountPercent = 0;

        if (options.applyDiscounts !== false && addOn.bulkDiscounts) {
          // Trouver la meilleure remise applicable
          for (const discount of addOn.bulkDiscounts.sort(
            (a, b) => b.minQuantity - a.minQuantity,
          )) {
            if (addOnRequest.quantity >= discount.minQuantity) {
              discountPercent = discount.discountPercent;
              break;
            }
          }
        }

        const totalCents = Math.round(
          addOnRequest.quantity * unitPriceCents * (1 - discountPercent / 100),
        );

        addOnCalculations.push({
          type: addOnRequest.type,
          quantity: addOnRequest.quantity,
          unitPriceCents,
          discountPercent,
          totalCents,
        });

        subtotalCents += totalCents;
      }
    }

    // ✅ Calculer le total (pour l'instant, pas de remise globale supplémentaire)
    const discountCents = 0;
    const totalCents = subtotalCents - discountCents;

    return {
      planId: options.planId,
      planPriceCents,
      addOns: addOnCalculations,
      subtotalCents,
      discountCents,
      totalCents,
      currency: CurrencyUtils.getDefaultCurrency(),
    };
  }

  /**
   * Valide les limites d'un plan
   */
  validatePlanLimits(planId: PlanType, usage: Partial<Record<keyof PlanConfig['limits'], number>>): {
    valid: boolean;
    exceeded: Array<{ metric: string; limit: number; usage: number }>;
  } {
    const plan = this.getPlan(planId);
    const exceeded: Array<{ metric: string; limit: number; usage: number }> = [];

    for (const [metric, limit] of Object.entries(plan.limits)) {
      if (limit === -1) continue; // Illimité

      const currentUsage = usage[metric as keyof PlanConfig['limits']];
      if (currentUsage !== undefined && currentUsage > limit) {
        exceeded.push({
          metric,
          limit,
          usage: currentUsage,
        });
      }
    }

    return {
      valid: exceeded.length === 0,
      exceeded,
    };
  }
}
