import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../libs/prisma/prisma.service';

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
   * Get plan limits for a user
   */
  async getUserLimits(userId: string): Promise<PlanLimits> {
    const plan = await this.getUserPlan(userId);
    return this.planLimits[plan];
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
}
