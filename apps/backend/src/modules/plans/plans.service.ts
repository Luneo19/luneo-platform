import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../libs/prisma/prisma.service';
import { Logger } from '@nestjs/common';

export enum PlanType {
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
}

@Injectable()
export class PlansService {
  private readonly logger = new Logger(PlansService.name);
  private readonly planLimits: Record<PlanType, PlanLimits> = {
    [PlanType.STARTER]: {
      designsPerMonth: 10,
      teamMembers: 1,
      storageGB: 1,
      apiAccess: false,
      advancedAnalytics: false,
      prioritySupport: false,
      customExport: false,
      whiteLabel: false,
    },
    [PlanType.PROFESSIONAL]: {
      designsPerMonth: 100,
      teamMembers: 5,
      storageGB: 10,
      apiAccess: true,
      advancedAnalytics: false,
      prioritySupport: true,
      customExport: false,
      whiteLabel: true,
    },
    [PlanType.BUSINESS]: {
      designsPerMonth: 500,
      teamMembers: 15,
      storageGB: 50,
      apiAccess: true,
      advancedAnalytics: true,
      prioritySupport: true,
      customExport: true,
      whiteLabel: true,
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
    },
  };

  constructor(private prisma: PrismaService) {}

  async getUserPlan(userId: string): Promise<PlanType> {
    // Pour l'instant, on retourne un plan par défaut
    // Plus tard, on récupérera depuis la base de données ou Stripe
    return PlanType.STARTER;
  }

  async getUserLimits(userId: string): Promise<PlanLimits> {
    const plan = await this.getUserPlan(userId);
    return this.planLimits[plan];
  }

  async checkDesignLimit(userId: string): Promise<{ canCreate: boolean; remaining: number }> {
    const limits = await this.getUserLimits(userId);
    
    if (limits.designsPerMonth === -1) {
      return { canCreate: true, remaining: -1 }; // Illimité
    }

    // Compter les designs créés ce mois
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const designsThisMonth = await this.prisma.design.count({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    const remaining = Math.max(0, limits.designsPerMonth - designsThisMonth);
    const canCreate = remaining > 0;

    return { canCreate, remaining };
  }

  async checkTeamLimit(userId: string): Promise<{ canInvite: boolean; remaining: number }> {
    const limits = await this.getUserLimits(userId);
    
    if (limits.teamMembers === -1) {
      return { canInvite: true, remaining: -1 }; // Illimité
    }

    // Compter les membres de l'équipe
    const teamMembers = await this.prisma.user.count({
      where: {
        id: userId // Pour l'instant, on compte juste l'utilisateur principal
      }
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

  async upgradeUserPlan(userId: string, newPlan: PlanType): Promise<void> {
    // Pour l'instant, on ne fait rien car le champ plan n'existe pas
    // Plus tard, on mettra à jour via Stripe webhook
    this.logger.log(`Upgrade plan for user ${userId} to ${newPlan}`);
  }

  getPlanInfo(plan: PlanType): { name: string; price: number; description: string } {
    const planInfo = {
      [PlanType.STARTER]: { name: 'Starter', price: 0, description: 'Parfait pour découvrir Luneo' },
      [PlanType.PROFESSIONAL]: { name: 'Professional', price: 29, description: 'Pour les créateurs professionnels' },
      [PlanType.BUSINESS]: { name: 'Business', price: 59, description: 'Pour les équipes en croissance' },
      [PlanType.ENTERPRISE]: { name: 'Enterprise', price: 99, description: 'Pour les grandes équipes' },
    };

    return planInfo[plan];
  }
}
