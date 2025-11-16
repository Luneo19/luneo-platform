import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PLAN_DEFINITIONS,
  type PlanDefinition,
  type PlanTier,
} from '@luneo/billing-plans';
import { PrismaService } from '../../libs/prisma/prisma.service';

export enum PlanType {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
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
}

export interface PlanUpgradeOptions {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status?: string | null;
  currentPeriodEnd?: Date | null;
}

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);

  private readonly planLimitCache = new Map<PlanType, PlanLimits>();

  constructor(private prisma: PrismaService) {}

  private isPlanType(value: string | null | undefined): value is PlanType {
    return Object.values(PlanType).includes(value as PlanType);
  }

  private normalizePlan(plan: string | PlanType | null | undefined): PlanType {
    if (!plan) {
      return PlanType.STARTER;
    }
    const normalized = plan.toString().toLowerCase() as PlanType;
    return this.isPlanType(normalized) ? normalized : PlanType.STARTER;
  }

  async getUserPlan(userId: string): Promise<PlanType> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { stripePlan: true },
    });

    return this.normalizePlan(user?.stripePlan ?? PlanType.STARTER);
  }

  async getUserLimits(userId: string): Promise<PlanLimits> {
    const plan = await this.getUserPlan(userId);
    return this.getPlanLimitsInternal(plan);
  }

  async checkDesignLimit(userId: string): Promise<{ canCreate: boolean; remaining: number }> {
    const limits = await this.getUserLimits(userId);

    if (limits.designsPerMonth === -1) {
      return { canCreate: true, remaining: -1 };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const designsThisMonth = await this.prisma.design.count({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    const remaining = Math.max(0, limits.designsPerMonth - designsThisMonth);
    const canCreate = remaining > 0;

    return { canCreate, remaining };
  }

  async checkTeamLimit(userId: string): Promise<{ canInvite: boolean; remaining: number }> {
    const limits = await this.getUserLimits(userId);

    if (limits.teamMembers === -1) {
      return { canInvite: true, remaining: -1 };
    }

    const teamMembers = await this.prisma.user.count({
      where: {
        id: userId,
      },
    });

    const remaining = Math.max(0, limits.teamMembers - teamMembers);
    const canInvite = remaining > 0;

    return { canInvite, remaining };
  }

  async hasFeature(userId: string, feature: keyof PlanLimits): Promise<boolean> {
    const limits = await this.getUserLimits(userId);
    const value = limits[feature];
    return typeof value === 'boolean' ? value : Boolean(value);
  }

  getPlanInfo(plan: PlanType): { name: string; price: number; description: string } {
    const definition = PLAN_DEFINITIONS[plan as PlanTier];
    return {
      name: definition.name,
      price: definition.basePriceCents / 100,
      description: definition.headline ?? definition.name,
    };
  }

  async upgradeUserPlan(userId: string, plan: PlanType | string, options?: PlanUpgradeOptions): Promise<void> {
    const normalized = this.normalizePlan(plan);
    await this.applyPlan(userId, normalized, options);
    this.logger.log(`Plan for user ${userId} upgraded to ${normalized}`);
  }

  async downgradeUserPlan(userId: string, options?: PlanUpgradeOptions): Promise<void> {
    await this.applyPlan(userId, PlanType.STARTER, options);
    this.logger.log(`Plan for user ${userId} downgraded to starter`);
  }

  private async applyPlan(userId: string, plan: PlanType, options?: PlanUpgradeOptions): Promise<void> {
    const updateData: Prisma.UserUpdateInput = {
      stripePlan: plan,
    };

    if (options) {
      if (options.stripeCustomerId !== undefined) {
        updateData.stripeCustomerId = options.stripeCustomerId ?? null;
      }
      if (options.stripeSubscriptionId !== undefined) {
        updateData.stripeSubscriptionId = options.stripeSubscriptionId ?? null;
      }
      if (options.status !== undefined) {
        updateData.stripeStatus = options.status ?? null;
      }
      if (options.currentPeriodEnd !== undefined) {
        updateData.stripeCurrentPeriodEnd = options.currentPeriodEnd ?? null;
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    await this.ensureUserQuota(userId, plan);
  }

  private async ensureUserQuota(userId: string, plan: PlanType): Promise<void> {
    const limits = this.getPlanLimitsInternal(plan);
    const monthlyLimit = limits.designsPerMonth === -1 ? 100_000 : limits.designsPerMonth;
    const costLimitCents = this.getCostLimitForPlan(plan);

    await this.prisma.userQuota.upsert({
      where: { userId },
      update: {
        monthlyLimit,
        costLimitCents,
      },
      create: {
        userId,
        monthlyLimit,
        costLimitCents,
      },
    });
  }

  private getPlanLimitsInternal(plan: PlanType): PlanLimits {
    if (this.planLimitCache.has(plan)) {
      return this.planLimitCache.get(plan)!;
    }

    const definition = PLAN_DEFINITIONS[plan as PlanTier];
    const limits: PlanLimits = {
      designsPerMonth: definition.limits?.designsPerMonth ?? -1,
      teamMembers: definition.limits?.teamMembers ?? -1,
      storageGB: definition.limits?.storageGb ?? -1,
      apiAccess: this.planHasFeature(definition, ['api.access']),
      advancedAnalytics: this.planHasFeature(definition, ['analytics.advanced', 'analytics.custom']),
      prioritySupport: this.planHasFeature(definition, [
        'support.priority',
        'support.dedicated',
        'support.white_glove',
      ]),
      customExport: plan === PlanType.BUSINESS || plan === PlanType.ENTERPRISE,
      whiteLabel: this.planHasFeature(definition, ['branding.custom', 'branding.full']),
    };

    this.planLimitCache.set(plan, limits);
    return limits;
  }

  private planHasFeature(plan: PlanDefinition, featureIds: string[]): boolean {
    return plan.features.some((feature) => feature.enabled && featureIds.includes(feature.id));
  }

  private getCostLimitForPlan(plan: PlanType): number {
    const definition = PLAN_DEFINITIONS[plan as PlanTier];
    if (!definition) {
      return 0;
    }

    // Autoriser jusqu'à 5x le prix de base par défaut
    const multiplier = plan === PlanType.ENTERPRISE ? 10 : plan === PlanType.BUSINESS ? 7 : 5;
    return definition.basePriceCents * multiplier;
  }
}
