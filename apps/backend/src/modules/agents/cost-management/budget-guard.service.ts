import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { CostTrackerService } from './cost-tracker.service';

export interface BudgetCheckResult {
  allowed: boolean;
  currentUsageCents: number;
  limitCents: number;
  remainingCents: number;
  usagePercent: number;
  warning?: string;
}

const PLAN_LIMITS_CENTS: Record<string, { daily: number; monthly: number }> = {
  FREE: { daily: 50, monthly: 500 },           // $0.50/day, $5/month
  STARTER: { daily: 500, monthly: 5000 },       // $5/day, $50/month
  PROFESSIONAL: { daily: 2000, monthly: 20000 }, // $20/day, $200/month
  BUSINESS: { daily: 5000, monthly: 50000 },    // $50/day, $500/month
  ENTERPRISE: { daily: 20000, monthly: 200000 }, // $200/day, $2000/month
};

@Injectable()
export class BudgetGuardService {
  private readonly logger = new Logger(BudgetGuardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly costTracker: CostTrackerService,
  ) {}

  async checkBudget(
    brandId: string,
    estimatedCostCents = 0,
  ): Promise<BudgetCheckResult> {
    const plan = await this.getBrandPlan(brandId);
    const limits = PLAN_LIMITS_CENTS[plan] || PLAN_LIMITS_CENTS['FREE'];

    const [dailyCost, monthlyCost] = await Promise.all([
      this.costTracker.getDailyCost(brandId),
      this.costTracker.getMonthlyCost(brandId),
    ]);

    // Check daily limit
    if (dailyCost + estimatedCostCents > limits.daily) {
      return {
        allowed: false,
        currentUsageCents: dailyCost,
        limitCents: limits.daily,
        remainingCents: Math.max(0, limits.daily - dailyCost),
        usagePercent: Math.round((dailyCost / limits.daily) * 100),
        warning: `Limite quotidienne atteinte (${(dailyCost / 100).toFixed(2)}$ / ${(limits.daily / 100).toFixed(2)}$)`,
      };
    }

    // Check monthly limit
    if (monthlyCost + estimatedCostCents > limits.monthly) {
      return {
        allowed: false,
        currentUsageCents: monthlyCost,
        limitCents: limits.monthly,
        remainingCents: Math.max(0, limits.monthly - monthlyCost),
        usagePercent: Math.round((monthlyCost / limits.monthly) * 100),
        warning: `Limite mensuelle atteinte (${(monthlyCost / 100).toFixed(2)}$ / ${(limits.monthly / 100).toFixed(2)}$)`,
      };
    }

    const usagePercent = Math.round((monthlyCost / limits.monthly) * 100);
    let warning: string | undefined;
    if (usagePercent >= 80) {
      warning = `Attention : ${usagePercent}% du budget mensuel utilisé`;
    }

    return {
      allowed: true,
      currentUsageCents: monthlyCost,
      limitCents: limits.monthly,
      remainingCents: limits.monthly - monthlyCost,
      usagePercent,
      warning,
    };
  }

  async enforceGuard(brandId: string, estimatedCostCents = 0): Promise<void> {
    const result = await this.checkBudget(brandId, estimatedCostCents);
    if (!result.allowed) {
      throw new ForbiddenException(result.warning || 'Budget limit exceeded');
    }
  }

  private async getBrandPlan(brandId: string): Promise<string> {
    try {
      const quota = await this.prisma.aIQuota.findFirst({
        where: { brandId },
      });
      const planId = quota?.planId || 'FREE';
      return planId.toUpperCase();
    } catch {
      return 'FREE';
    }
  }
}
