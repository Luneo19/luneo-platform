// @ts-nocheck
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PaymentStatus, UserRole } from '@/common/compat/v1-enums';
import { PrismaService } from '@/libs/prisma/prisma.service';

export type RevenueOverview = {
  mrr: number;
  arr: number;
  growthRate: number;
  churnRevenue: number;
  expansionRevenue: number;
};

export type UpsellOpportunity = {
  id: string;
  customerId: string;
  customerName: string;
  currentPlan: string;
  usagePercent: number;
  potentialMrr: number;
  confidence: 'high' | 'medium' | 'low';
};

export type LeadScore = {
  id: string;
  userId: string;
  email: string;
  score: number;
  source: string;
  lastActivity: string;
  status: 'hot' | 'warm' | 'cold';
};

export type ExperimentVariant = { id: string; name: string; config?: Record<string, unknown>; weight: number };

export type CreateExperimentDto = {
  name: string;
  description: string;
  type: string;
  variants: ExperimentVariant[];
  targetAudience?: Record<string, unknown>;
};

export type UpdateExperimentDto = {
  name?: string;
  description?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  variants?: ExperimentVariant[];
  targetAudience?: Record<string, unknown>;
};

const PLAN_PRICES: Record<string, number> = {
  FREE: 0,
  STARTER: 29,
  PROFESSIONAL: 79,
  BUSINESS: 149,
  ENTERPRISE: 299,
};

@Injectable()
export class RevenueService {
  private readonly logger = new Logger(RevenueService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getRevenueOverview(): Promise<RevenueOverview> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [currentRevenue, previousRevenue] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          paymentStatus: PaymentStatus.SUCCEEDED,
          deletedAt: null,
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { totalCents: true },
      }),
      this.prisma.order.aggregate({
        where: {
          paymentStatus: PaymentStatus.SUCCEEDED,
          deletedAt: null,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
        _sum: { totalCents: true },
      }),
    ]);

    const mrr = (currentRevenue._sum.totalCents || 0) / 100;
    const previousMrr = (previousRevenue._sum.totalCents || 0) / 100;
    const growthRate = previousMrr > 0 ? (mrr - previousMrr) / previousMrr : 0;
    const expansionRevenue = Math.max(0, mrr - previousMrr);
    const churnRevenue = Math.max(0, previousMrr - mrr);

    return {
      mrr,
      arr: mrr * 12,
      growthRate: Math.round(growthRate * 1000) / 1000,
      churnRevenue: Math.round(churnRevenue * 100) / 100,
      expansionRevenue: Math.round(expansionRevenue * 100) / 100,
    };
  }

  async getUpsellOpportunities(limit = 10): Promise<UpsellOpportunity[]> {
    const brands = await this.prisma.brand.findMany({
      where: {
        deletedAt: null,
        maxMonthlyGenerations: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        monthlyGenerations: true,
        maxMonthlyGenerations: true,
        users: { take: 1, select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { monthlyGenerations: 'desc' },
      take: limit,
    });

    return brands
      .filter((b) => b.maxMonthlyGenerations > 0)
      .map((brand) => {
        const usage = Math.round(
          (brand.monthlyGenerations / brand.maxMonthlyGenerations) * 100,
        );
        const currentPrice =
          PLAN_PRICES[brand.subscriptionPlan?.toString() ?? 'FREE'] ?? 0;
        const nextPlanPrice =
          usage >= 90
            ? currentPrice < 149
              ? 149
              : 299
            : currentPrice < 79
              ? 79
              : 149;
        const potentialMrr = Math.max(0, nextPlanPrice - currentPrice);
        const customerName =
          brand.name ||
          brand.users[0]?.email ||
          [brand.users[0]?.firstName, brand.users[0]?.lastName]
            .filter(Boolean)
            .join(' ') ||
          'Unknown';
        return {
          id: brand.id,
          customerId: brand.users[0]?.id ?? brand.id,
          customerName,
          currentPlan: brand.subscriptionPlan?.toString() ?? 'FREE',
          usagePercent: usage,
          potentialMrr,
          confidence:
            usage >= 90 ? 'high' : usage >= 70 ? 'medium' : ('low' as const),
        };
      });
  }

  async getLeadScores(limit = 10): Promise<LeadScore[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await this.prisma.user.findMany({
      where: {
        role: { not: UserRole.PLATFORM_ADMIN },
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        lastLoginAt: true,
        brand: { select: { subscriptionPlan: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return recentUsers.map((user) => {
      const hasLoggedIn = !!user.lastLoginAt;
      const hasBrand = !!user.brand;
      const daysSinceSignup = Math.floor(
        (Date.now() - new Date(user.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      let score = 50;
      if (hasLoggedIn) score += 20;
      if (hasBrand) score += 15;
      if (daysSinceSignup <= 1) score += 15;

      const status: 'hot' | 'warm' | 'cold' =
        score >= 80 ? 'hot' : score >= 60 ? 'warm' : 'cold';

      const source =
        user.brand?.subscriptionPlan && user.brand.subscriptionPlan !== 'FREE'
          ? 'Referral'
          : hasLoggedIn && hasBrand
            ? 'Direct'
            : 'Organic';

      return {
        id: user.id,
        userId: user.id,
        email: user.email ?? '',
        score: Math.min(score, 100),
        source,
        lastActivity: (
          user.lastLoginAt
            ? new Date(user.lastLoginAt)
            : new Date(user.createdAt)
        ).toISOString(),
        status,
      };
    });
  }

  async getExperiments() {
    return this.prisma.experiment.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: { _count: { select: { assignments: true } } },
    });
  }

  async getExperiment(id: string) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id },
      include: { _count: { select: { assignments: true } } },
    });
    if (!experiment) {
      throw new NotFoundException('Experiment not found');
    }
    return experiment;
  }

  async createExperiment(data: CreateExperimentDto) {
    return this.prisma.experiment.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        variants: (data.variants ?? []) as object,
        targetAudience: data.targetAudience as object | undefined,
        status: 'draft',
      },
    });
  }

  async getVariantStats(experimentId: string, variantIds: string[]) {
    const experiment = await this.prisma.experiment.findUnique({
      where: { id: experimentId },
      include: { assignments: true },
    });
    if (!experiment) throw new NotFoundException('Experiment not found');

    const variants: Record<string, { visitors: number; conversions: number; revenue: number }> = {};
    const variantsConfig = Array.isArray(experiment.variants) ? (experiment.variants as { id: string; name: string }[]) : [];
    const targetIds = variantIds.length > 0 ? variantIds : variantsConfig.map((v) => v.id);

    for (const vid of targetIds) {
      const visitors = experiment.assignments.filter(
        (a) => a.variantId === vid,
      ).length;
      // Conversion and revenue tracking require analytics events;
      // for now return assignment count as visitors with zero conversions/revenue
      // until dedicated conversion tracking is implemented.
      variants[vid] = { visitors, conversions: 0, revenue: 0 };
    }

    return { variants, data: variants };
  }

  async updateExperiment(id: string, data: UpdateExperimentDto) {
    const existing = await this.prisma.experiment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Experiment not found');
    return this.prisma.experiment.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.variants !== undefined && { variants: data.variants as object }),
        ...(data.targetAudience !== undefined && { targetAudience: data.targetAudience as object }),
      },
    });
  }
}
