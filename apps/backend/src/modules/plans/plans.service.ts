import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SubscriptionPlan } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import {
  PLAN_CONFIGS,
  ADDON_BONUSES,
  normalizePlanTier,
  type FeatureLimits,
  type ActiveAddon,
  type PlanInfo as PlanInfoBase,
  PlanTier,
} from '@/libs/plans';

/**
 * Re-export PlanTier as PlanType for backward compatibility.
 * New code should import PlanTier from '@/libs/plans' directly.
 */
export const PlanType = PlanTier;
export type PlanType = PlanTier;

/**
 * Re-export FeatureLimits as PlanLimits for backward compatibility.
 */
export type PlanLimits = FeatureLimits;

/**
 * Re-export ActiveAddon for backward compatibility.
 */
export type { ActiveAddon };

/**
 * PlanInfo enrichi avec les champs de pricing pour l'UI.
 */
export interface PlanInfo {
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  commissionPercent: number;
  features: string[];
}

/**
 * ★★★ SERVICE - PLANS & SUBSCRIPTIONS ★★★
 * Service pour gérer les plans d'abonnement et leurs limites
 * 
 * @description
 * Gère la logique des plans avec lecture depuis la base de données.
 * Synchronisé avec Stripe pour les abonnements payants.
 */
@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);
  
  /**
   * Limites par plan d'abonnement.
   * Source: @/libs/plans/plan-config.ts (SINGLE SOURCE OF TRUTH)
   */
  private readonly planLimits: Record<PlanTier, PlanLimits> = Object.fromEntries(
    Object.values(PlanTier).map((tier) => [tier, PLAN_CONFIGS[tier].limits]),
  ) as Record<PlanTier, PlanLimits>;

  /**
   * Informations détaillées des plans (pour l'UI).
   * Source: @/libs/plans/plan-config.ts (SINGLE SOURCE OF TRUTH)
   */
  private readonly planInfo: Record<PlanTier, PlanInfo> = Object.fromEntries(
    Object.values(PlanTier).map((tier) => {
      const config = PLAN_CONFIGS[tier];
      return [
        tier,
        {
          name: config.info.name,
          price: config.pricing.monthlyPrice,
          yearlyPrice: config.pricing.yearlyPrice,
          description: config.info.description,
          commissionPercent: config.pricing.commissionPercent,
          features: config.info.features,
        },
      ];
    }),
  ) as Record<PlanTier, PlanInfo>;

  constructor(private prisma: PrismaService) {}

  /**
   * Get user's current plan from database
   * @param userId - ID de l'utilisateur
   * @returns Type de plan (FREE, STARTER, PROFESSIONAL, BUSINESS, ENTERPRISE)
   */
  async getUserPlan(userId: string): Promise<PlanType> {
    try {
      // Récupérer l'utilisateur avec sa brand
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          brand: {
            select: {
              plan: true,
              subscriptionPlan: true,
              subscriptionStatus: true,
            },
          },
        },
      });

      if (!user?.brand) {
        this.logger.debug(`User ${userId} has no brand, returning FREE plan`);
        return PlanType.FREE;
      }

      const { brand } = user;

      // Vérifier si l'abonnement est actif
      const isActive = !brand.subscriptionStatus || 
        brand.subscriptionStatus === 'ACTIVE' || 
        brand.subscriptionStatus === 'TRIALING';

      if (!isActive) {
        this.logger.debug(`User ${userId} subscription not active, returning FREE plan`);
        return PlanType.FREE;
      }

      // Déterminer le plan (subscriptionPlan a priorité sur plan)
      const planName = (brand.subscriptionPlan || brand.plan || 'FREE').toUpperCase();
      
      // Mapper vers PlanType
      const planMapping: Record<string, PlanType> = {
        'FREE': PlanType.FREE,
        'STARTER': PlanType.STARTER,
        'PROFESSIONAL': PlanType.PROFESSIONAL,
        'BUSINESS': PlanType.BUSINESS,
        'ENTERPRISE': PlanType.ENTERPRISE,
      };

      const plan = planMapping[planName] || PlanType.FREE;
      
      this.logger.debug(`User ${userId} plan: ${plan}`);
      return plan;
    } catch (error) {
      this.logger.error(`Error getting user plan for ${userId}:`, error);
      return PlanType.FREE;
    }
  }

  /**
   * Get active add-ons for a brand from Stripe subscription metadata
   * Reads from the brand's `limits` JSON field where add-ons are persisted by webhooks
   */
  async getActiveAddons(brandId: string): Promise<ActiveAddon[]> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { limits: true },
      });

      if (!brand?.limits || typeof brand.limits !== 'object') {
        return [];
      }

      const limitsData = brand.limits as Record<string, unknown> | null;
      return Array.isArray(limitsData?.activeAddons) ? (limitsData.activeAddons as ActiveAddon[]) : [];
    } catch (error) {
      this.logger.error(`Error getting active addons for brand ${brandId}:`, error);
      return [];
    }
  }

  /**
   * Get plan limits for a user, INCLUDING add-on bonuses
   * This is the single source of truth for effective limits
   */
  async getUserLimits(userId: string): Promise<PlanLimits> {
    const plan = await this.getUserPlan(userId);
    const baseLimits = { ...this.planLimits[plan] };

    // Si plan illimité, pas besoin de calculer les add-ons
    if (plan === PlanType.ENTERPRISE) {
      return baseLimits;
    }

    // Récupérer les add-ons actifs
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { brandId: true },
      });

      if (user?.brandId) {
        const addons = await this.getActiveAddons(user.brandId);
        
        for (const addon of addons) {
          const bonus = ADDON_BONUSES[addon.type];
          if (bonus) {
            for (const [key, value] of Object.entries(bonus)) {
              if (typeof value === 'number' && typeof (baseLimits as unknown as Record<string, number>)[key] === 'number') {
                // Ne pas ajouter de bonus si la limite est déjà illimitée (-1)
                if ((baseLimits as unknown as Record<string, number>)[key] !== -1) {
                  (baseLimits as unknown as Record<string, number>)[key] += value * (addon.quantity || 1);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error calculating addon bonuses for user ${userId}:`, error);
    }

    return baseLimits;
  }

  /**
   * Get plan limits by plan type
   */
  getPlanLimits(plan: PlanType): PlanLimits {
    return this.planLimits[plan] || this.planLimits[PlanType.FREE];
  }

  /**
   * Check if user can create more designs this month
   */
  async checkDesignLimit(userId: string): Promise<{ canCreate: boolean; remaining: number; limit: number }> {
    const limits = await this.getUserLimits(userId);
    
    if (limits.designsPerMonth === -1) {
      return { canCreate: true, remaining: -1, limit: -1 }; // Illimité
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const designsThisMonth = await this.prisma.design.count({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
    });

    const remaining = Math.max(0, limits.designsPerMonth - designsThisMonth);
    const canCreate = remaining > 0;

    return { canCreate, remaining, limit: limits.designsPerMonth };
  }

  /**
   * Check if user can invite more team members
   */
  async checkTeamLimit(userId: string): Promise<{ canInvite: boolean; remaining: number; limit: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { brandId: true },
    });

    if (!user?.brandId) {
      return { canInvite: false, remaining: 0, limit: 1 };
    }

    const limits = await this.getUserLimits(userId);
    
    if (limits.teamMembers === -1) {
      return { canInvite: true, remaining: -1, limit: -1 };
    }

    const teamCount = await this.prisma.user.count({
      where: { brandId: user.brandId },
    });

    const remaining = Math.max(0, limits.teamMembers - teamCount);
    const canInvite = remaining > 0;

    return { canInvite, remaining, limit: limits.teamMembers };
  }

  /**
   * Check if user can add more products
   */
  async checkProductLimit(userId: string): Promise<{ canCreate: boolean; remaining: number; limit: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { brandId: true },
    });

    if (!user?.brandId) {
      return { canCreate: false, remaining: 0, limit: 0 };
    }

    const limits = await this.getUserLimits(userId);
    
    if (limits.maxProducts === -1) {
      return { canCreate: true, remaining: -1, limit: -1 };
    }

    const productCount = await this.prisma.product.count({
      where: { brandId: user.brandId },
    });

    const remaining = Math.max(0, limits.maxProducts - productCount);
    const canCreate = remaining > 0;

    return { canCreate, remaining, limit: limits.maxProducts };
  }

  /**
   * Check if user has access to a specific feature
   */
  async hasFeature(userId: string, feature: keyof PlanLimits): Promise<boolean> {
    const limits = await this.getUserLimits(userId);
    const value = limits[feature];
    return typeof value === 'boolean' ? value : Boolean(value);
  }

  /**
   * Upgrade user plan (called by Stripe webhook)
   */
  async upgradeUserPlan(userId: string, newPlan: PlanType): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { brandId: true },
      });

      if (!user?.brandId) {
        this.logger.warn(`Cannot upgrade plan for user ${userId}: no brand`);
        return;
      }

      // Mapper vers l'enum Prisma
      const subscriptionPlanMapping: Record<PlanType, string> = {
        [PlanType.FREE]: 'FREE',
        [PlanType.STARTER]: 'STARTER',
        [PlanType.PROFESSIONAL]: 'PROFESSIONAL',
        [PlanType.BUSINESS]: 'BUSINESS',
        [PlanType.ENTERPRISE]: 'ENTERPRISE',
      };

      await this.prisma.brand.update({
        where: { id: user.brandId },
        data: {
          plan: newPlan,
          subscriptionPlan: subscriptionPlanMapping[newPlan] as SubscriptionPlan,
          subscriptionStatus: 'ACTIVE',
        },
      });

      this.logger.log(`Upgraded plan for user ${userId} to ${newPlan}`);
    } catch (error) {
      this.logger.error(`Error upgrading plan for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get plan information for display
   */
  getPlanInfo(plan: PlanType): PlanInfo {
    return this.planInfo[plan] || this.planInfo[PlanType.FREE];
  }

  /**
   * Get all plans information (for pricing page)
   */
  getAllPlansInfo(): Record<PlanType, PlanInfo> {
    return { ...this.planInfo };
  }

  /**
   * Get all plan limits
   */
  getAllPlanLimits(): Record<PlanType, PlanLimits> {
    return { ...this.planLimits };
  }

  // ========================================
  // ENFORCEMENT METHODS (bloquantes)
  // ========================================

  /**
   * Enforce design limit - throws if user cannot create
   * Call this BEFORE creating a design
   */
  async enforceDesignLimit(userId: string): Promise<void> {
    const result = await this.checkDesignLimit(userId);
    if (!result.canCreate) {
      throw new ForbiddenException(
        `Limite de designs atteinte (${result.limit}/mois). Passez à un plan supérieur ou ajoutez l'add-on "Extra Designs".`
      );
    }
  }

  /**
   * Enforce team limit - throws if user cannot invite
   * Call this BEFORE sending a team invitation
   */
  async enforceTeamLimit(userId: string): Promise<void> {
    const result = await this.checkTeamLimit(userId);
    if (!result.canInvite) {
      throw new ForbiddenException(
        `Limite de membres d'équipe atteinte (${result.limit}). Passez à un plan supérieur ou ajoutez l'add-on "Extra Team Members".`
      );
    }
  }

  /**
   * Enforce product limit - throws if user cannot create product
   * Call this BEFORE creating a product
   */
  async enforceProductLimit(userId: string): Promise<void> {
    const result = await this.checkProductLimit(userId);
    if (!result.canCreate) {
      throw new ForbiddenException(
        `Limite de produits atteinte (${result.limit}). Passez à un plan supérieur.`
      );
    }
  }

  // ========================================
  // ADD-ON PERSISTENCE (called by webhooks)
  // ========================================

  /**
   * Persist active add-ons to brand's limits field
   * Called by the Stripe webhook handler when subscription changes
   * 
   * @param brandId - ID de la marque
   * @param subscriptionItems - Items de la subscription Stripe
   * @param addonPriceIds - Map de Price ID Stripe -> type d'addon
   */
  async syncAddonsFromSubscription(
    brandId: string,
    subscriptionItems: Array<{ price: { id: string; product?: { id: string } }; quantity: number }>,
    addonPriceIds: Record<string, string>,
  ): Promise<void> {
    try {
      const activeAddons: ActiveAddon[] = [];

      for (const item of subscriptionItems) {
        const addonType = addonPriceIds[item.price.id];
        if (addonType) {
          activeAddons.push({
            type: addonType,
            quantity: item.quantity || 1,
            stripePriceId: item.price.id,
          });
        }
      }

      // Récupérer les limites existantes pour ne pas écraser d'autres données
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { limits: true },
      });

      const currentLimits = (brand?.limits as Record<string, unknown>) || {};

      await this.prisma.brand.update({
        where: { id: brandId },
        data: {
          limits: {
            ...currentLimits,
            activeAddons: activeAddons.map(a => ({ ...a })),
            addonsUpdatedAt: new Date().toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      this.logger.log(`Synced ${activeAddons.length} add-ons for brand ${brandId}`, {
        addons: activeAddons.map(a => `${a.type} x${a.quantity}`),
      });
    } catch (error) {
      this.logger.error(`Error syncing add-ons for brand ${brandId}:`, error);
    }
  }
}
