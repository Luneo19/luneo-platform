import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

/**
 * Types de plans disponibles
 * Synchronisé avec l'enum SubscriptionPlan dans Prisma
 */
export enum PlanType {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional', 
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise'
}

/**
 * Types d'add-ons disponibles
 */
export interface ActiveAddon {
  type: string;       // ex: 'extra_designs', 'extra_storage', etc.
  quantity: number;    // nombre d'unités achetées
  stripePriceId?: string;
}

/**
 * Bonus par add-on (ce que chaque unité ajoute aux limites)
 */
const ADDON_BONUSES: Record<string, Partial<PlanLimits>> = {
  extra_designs:      { designsPerMonth: 100 },     // +100 designs par unité
  extra_storage:      { storageGB: 10 },             // +10 GB par unité
  extra_team_members: { teamMembers: 5 },            // +5 membres par unité
  extra_api_calls:    {},                             // géré par usage metering
  extra_renders_3d:   {},                             // géré par usage metering
};

export interface PlanLimits {
  designsPerMonth: number;
  teamMembers: number;
  storageGB: number;
  apiAccess: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  customExport: boolean;
  whiteLabel: boolean;
  arEnabled: boolean;
  maxProducts: number;
}

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
   * Limites par plan d'abonnement
   */
  private readonly planLimits: Record<PlanType, PlanLimits> = {
    [PlanType.FREE]: {
      designsPerMonth: 5,
      teamMembers: 1,
      storageGB: 0.5,
      apiAccess: false,
      advancedAnalytics: false,
      prioritySupport: false,
      customExport: false,
      whiteLabel: false,
      arEnabled: false,
      maxProducts: 2,
    },
    [PlanType.STARTER]: {
      designsPerMonth: 50,
      teamMembers: 3,
      storageGB: 5,
      apiAccess: false,
      advancedAnalytics: false,
      prioritySupport: false,
      customExport: false,
      whiteLabel: false,
      arEnabled: false,
      maxProducts: 10,
    },
    [PlanType.PROFESSIONAL]: {
      designsPerMonth: 200,
      teamMembers: 10,
      storageGB: 25,
      apiAccess: true,
      advancedAnalytics: false,
      prioritySupport: true,
      customExport: false,
      whiteLabel: true,
      arEnabled: true,
      maxProducts: 50,
    },
    [PlanType.BUSINESS]: {
      designsPerMonth: 1000,
      teamMembers: 50,
      storageGB: 100,
      apiAccess: true,
      advancedAnalytics: true,
      prioritySupport: true,
      customExport: true,
      whiteLabel: true,
      arEnabled: true,
      maxProducts: 500,
    },
    [PlanType.ENTERPRISE]: {
      designsPerMonth: -1, // Illimité
      teamMembers: -1, // Illimité
      storageGB: -1, // Illimité
      apiAccess: true,
      advancedAnalytics: true,
      prioritySupport: true,
      customExport: true,
      whiteLabel: true,
      arEnabled: true,
      maxProducts: -1, // Illimité
    },
  };

  /**
   * Informations détaillées des plans (pour l'UI)
   */
  private readonly planInfo: Record<PlanType, PlanInfo> = {
    [PlanType.FREE]: {
      name: 'Free',
      price: 0,
      yearlyPrice: 0,
      description: 'Découvrez Luneo gratuitement',
      commissionPercent: 15,
      features: ['5 designs/mois', '2 produits', 'Support email'],
    },
    [PlanType.STARTER]: {
      name: 'Starter',
      price: 19,
      yearlyPrice: 190,
      description: 'Parfait pour démarrer',
      commissionPercent: 12,
      features: ['50 designs/mois', '10 produits', '3 membres', 'Support prioritaire'],
    },
    [PlanType.PROFESSIONAL]: {
      name: 'Professional',
      price: 49,
      yearlyPrice: 490,
      description: 'Pour les créateurs professionnels',
      commissionPercent: 10,
      features: ['200 designs/mois', '50 produits', '10 membres', 'API access', 'AR enabled', 'White label'],
    },
    [PlanType.BUSINESS]: {
      name: 'Business',
      price: 99,
      yearlyPrice: 990,
      description: 'Pour les équipes en croissance',
      commissionPercent: 7,
      features: ['1000 designs/mois', '500 produits', '50 membres', 'Analytics avancés', 'Export personnalisé'],
    },
    [PlanType.ENTERPRISE]: {
      name: 'Enterprise',
      price: 299,
      yearlyPrice: 2990,
      description: 'Solutions sur mesure',
      commissionPercent: 5,
      features: ['Illimité', 'Support dédié', 'SLA garanti', 'Formation', 'Intégration personnalisée'],
    },
  };

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

      const limitsData = brand.limits as Record<string, any>;
      return Array.isArray(limitsData.activeAddons) ? limitsData.activeAddons : [];
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
              if (typeof value === 'number' && typeof (baseLimits as any)[key] === 'number') {
                // Ne pas ajouter de bonus si la limite est déjà illimitée (-1)
                if ((baseLimits as any)[key] !== -1) {
                  (baseLimits as any)[key] += value * (addon.quantity || 1);
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
          subscriptionPlan: subscriptionPlanMapping[newPlan] as any,
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
    subscriptionItems: Array<{ price: { id: string; product?: any }; quantity: number }>,
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

      const currentLimits = (brand?.limits as Record<string, any>) || {};

      await this.prisma.brand.update({
        where: { id: brandId },
        data: {
          limits: {
            ...currentLimits,
            activeAddons: activeAddons.map(a => ({ ...a })),
            addonsUpdatedAt: new Date().toISOString(),
          } as any,
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
