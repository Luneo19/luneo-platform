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
      monthlyPriceCents: 2900, // 29€
      yearlyPriceCents: 27840, // 278.40€ (20% de remise)
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
      monthlyPriceCents: 4900, // 49€
      yearlyPriceCents: 47040, // 470.40€ (20% de remise)
      features: [
        '200 designs/mois',
        'Customizer 2D/3D',
        '500 rendus 2D/mois',
        '50 rendus 3D/mois',
        'Export HD illimité',
        'Configurateur 3D',
        'Support prioritaire',
        '10 intégrations',
        'API accès complet',
        '10 membres d\'équipe',
        '50 GB stockage',
      ],
      limits: {
        ai_generations: 100,
        ar_sessions: 1000,
        storage_gb: 50,
        api_calls: 100000,
        team_members: 10,
        designs_per_month: 200,
        renders_2d: 500,
        renders_3d: 50,
      },
      addOns: ['ai_credits', 'ar_sessions', 'storage_gb', 'api_calls', 'team_members'],
    },
    business: {
      id: 'business',
      name: 'Business',
      description: 'Pour les équipes qui ont besoin de collaboration et de volume',
      monthlyPriceCents: 9900, // 99€
      yearlyPriceCents: 95040, // 950.40€ (20% de remise)
      features: [
        '500 designs/mois',
        'Virtual Try-On',
        'Multi-utilisateurs (25)',
        'Webhooks',
        'Marque blanche',
        'Support dédié',
        'Analytics avancées',
        '100 GB stockage',
      ],
      limits: {
        ai_generations: 500,
        ar_sessions: 10000,
        storage_gb: 100,
        api_calls: 1000000,
        team_members: 25,
        designs_per_month: 500,
        renders_2d: 2000,
        renders_3d: 200,
      },
      addOns: ['ai_credits', 'ar_sessions', 'storage_gb', 'api_calls', 'team_members'],
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Solution sur-mesure pour les grandes organisations',
      monthlyPriceCents: 0, // Sur demande
      yearlyPriceCents: 0,
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
        let unitPriceCents = addOn.basePriceCents;
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
      currency: 'EUR',
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
