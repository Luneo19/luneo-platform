import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { BudgetService } from '@/libs/budgets/budget.service';

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private budgetService: BudgetService,
  ) {}

  async estimateCost(prompt: string, options: any): Promise<number> {
    // Simple cost estimation based on prompt length and options
    const baseCost = 0.01; // 1 cent per character
    const promptCost = prompt.length * baseCost;
    const optionsCost = options.highRes ? 0.05 : 0.02; // High-res costs more
    
    return Math.round((promptCost + optionsCost) * 100); // Return in cents
  }

  async checkUserQuota(userId: string, estimatedCost: number): Promise<boolean> {
    const quota = await this.prisma.userQuota.findUnique({
      where: { userId },
    });

    if (!quota) {
      return false;
    }

    // Check if user has enough quota
    return quota.monthlyUsed < quota.monthlyLimit && 
           quota.costUsedCents + estimatedCost <= quota.costLimitCents;
  }

  async updateUserQuota(userId: string, cost: number): Promise<void> {
    await this.prisma.userQuota.update({
      where: { userId },
      data: {
        monthlyUsed: {
          increment: 1,
        },
        costUsedCents: {
          increment: cost,
        },
      },
    });
  }

  async recordAICost(brandId: string, provider: string, model: string, cost: number, metadata: any): Promise<void> {
    // Enregistrer le coût dans AICost (pour analytics)
    await this.prisma.aICost.create({
      data: {
        brandId,
        provider,
        model,
        costCents: cost,
        tokens: metadata.tokens,
        duration: metadata.duration,
      },
    });

    // Appliquer le budget (hard limit)
    await this.budgetService.enforceBudget(brandId, cost);
  }

  /**
   * Vérifie le budget avant génération (avec exception si dépassé)
   */
  async checkBudgetOrThrow(brandId: string, estimatedCost: number): Promise<void> {
    const hasBudget = await this.budgetService.checkBudget(brandId, estimatedCost);
    if (!hasBudget) {
      const budget = await this.budgetService.getBudget(brandId);
      throw new BadRequestException(
        `Budget exceeded: ${budget.usedCents + estimatedCost} > ${budget.limitCents} cents. ` +
        `Please upgrade your plan or wait for monthly reset.`,
      );
    }
  }

  /**
   * Récupère le quota et les statistiques d'usage IA de l'utilisateur
   */
  async getUserQuota(userId: string): Promise<{
    quota: {
      monthlyLimit: number;
      monthlyUsed: number;
      costLimitCents: number;
      costUsedCents: number;
      percentageUsed: number;
      resetAt: Date | null;
    };
    stats: {
      totalGenerations: number;
      generationsThisMonth: number;
      totalCostCents: number;
      costThisMonth: number;
    };
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Récupérer le quota utilisateur
    const quota = await this.prisma.userQuota.findUnique({
      where: { userId },
    });

    // Récupérer les générations de l'utilisateur
    const [allGenerations, monthlyGenerations] = await Promise.all([
      this.prisma.aIGeneration.count({
        where: { userId },
      }),
      this.prisma.aIGeneration.aggregate({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
        _count: true,
        _sum: {
          costCents: true,
        },
      }),
    ]);

    // Totaux
    const allTimeAggregate = await this.prisma.aIGeneration.aggregate({
      where: { userId },
      _sum: {
        costCents: true,
      },
    });

    // Valeurs par défaut si pas de quota configuré
    const defaultQuota = {
      monthlyLimit: 50,
      monthlyUsed: 0,
      costLimitCents: 5000, // 50€
      costUsedCents: 0,
      resetAt: null,
    };

    const userQuota = quota || defaultQuota;
    const percentageUsed = userQuota.monthlyLimit > 0 
      ? Math.round((userQuota.monthlyUsed / userQuota.monthlyLimit) * 100) 
      : 0;

    return {
      quota: {
        monthlyLimit: userQuota.monthlyLimit,
        monthlyUsed: userQuota.monthlyUsed,
        costLimitCents: userQuota.costLimitCents,
        costUsedCents: userQuota.costUsedCents,
        percentageUsed,
        resetAt: quota?.resetAt || null,
      },
      stats: {
        totalGenerations: allGenerations,
        generationsThisMonth: monthlyGenerations._count,
        totalCostCents: allTimeAggregate._sum.costCents || 0,
        costThisMonth: monthlyGenerations._sum.costCents || 0,
      },
    };
  }
}
