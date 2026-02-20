import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChurnRisk } from '@prisma/client';
import { ORION_DEFAULTS, HADES_PLAN_PRICES, ATHENA_THRESHOLDS, OrionAgentActionData } from '../../orion.constants';

export interface ChurnPrediction {
  userId: string;
  email: string;
  name: string;
  brandName: string | null;
  churnRiskScore: number;
  churnRisk: ChurnRisk;
  factors: string[];
  recommendedActions: string[];
}

@Injectable()
export class HadesService {
  private readonly logger = new Logger(HadesService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async runChurnPrediction() {
    this.logger.debug('Hades: Running churn prediction');

    const atRisk = await this.prisma.customerHealthScore.findMany({
      where: {
        churnRisk: { in: [ChurnRisk.HIGH, ChurnRisk.CRITICAL] },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            lastLoginAt: true,
            brand: {
              select: {
                name: true,
                subscriptionPlan: true,
                subscriptionStatus: true,
              },
            },
          },
        },
      },
    });

    for (const score of atRisk) {
      const factors = this.identifyChurnFactors(score);
      const actions = this.recommendRetentionActions(score, factors);

      await this.prisma.orionAgentAction.create({
        data: {
          agentType: 'hades',
          actionType: 'retention_recommendation',
          title: `Retention: ${score.user.email}`,
          description: `Risque: ${score.churnRisk}, Score: ${score.churnRiskScore}`,
          priority: score.churnRisk === ChurnRisk.CRITICAL ? 'critical' : 'high',
          data: JSON.parse(JSON.stringify({
            userId: score.userId,
            factors,
            recommendedActions: actions,
            churnRiskScore: score.churnRiskScore,
          })),
        },
      });
    }

    this.logger.log(
      `Hades: Identified ${atRisk.length} at-risk customers`,
    );
  }

  async getAtRiskCustomers(limit: number = ORION_DEFAULTS.LIST_LIMIT): Promise<ChurnPrediction[]> {
    const scores = await this.prisma.customerHealthScore.findMany({
      where: {
        churnRisk: { in: [ChurnRisk.HIGH, ChurnRisk.CRITICAL] },
      },
      orderBy: { churnRiskScore: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            brand: { select: { name: true } },
          },
        },
      },
    });

    return scores.map((s) => ({
      userId: s.userId,
      email: s.user.email,
      name: `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim(),
      brandName: s.user.brand?.name || null,
      churnRiskScore: s.churnRiskScore,
      churnRisk: s.churnRisk,
      factors: this.identifyChurnFactors(s),
      recommendedActions: this.recommendRetentionActions(
        s,
        this.identifyChurnFactors(s),
      ),
    }));
  }

  async getWinBackCandidates(limit: number = ORION_DEFAULTS.LIST_LIMIT) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.prisma.brand.findMany({
      where: {
        subscriptionStatus: 'CANCELED',
        updatedAt: { gte: thirtyDaysAgo },
      },
      include: {
        users: {
          select: { id: true, email: true, firstName: true },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async getMRRAtRisk() {
    const atRisk = await this.prisma.customerHealthScore.findMany({
      where: {
        churnRisk: { in: [ChurnRisk.HIGH, ChurnRisk.CRITICAL] },
      },
      include: {
        user: {
          select: {
            brand: { select: { subscriptionPlan: true } },
          },
        },
      },
    });

    const planPrices = HADES_PLAN_PRICES;

    let totalMRRAtRisk = 0;
    for (const score of atRisk) {
      const plan = score.user.brand?.subscriptionPlan || 'FREE';
      totalMRRAtRisk += planPrices[plan] || 0;
    }

    return {
      mrrAtRisk: totalMRRAtRisk,
      customersAtRisk: atRisk.length,
      breakdown: {
        critical: atRisk.filter((s) => s.churnRisk === ChurnRisk.CRITICAL).length,
        high: atRisk.filter((s) => s.churnRisk === ChurnRisk.HIGH).length,
      },
    };
  }

  async getRetentionActions(limit: number = ORION_DEFAULTS.LIST_LIMIT) {
    return this.prisma.orionAgentAction.findMany({
      where: {
        agentType: 'hades',
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getDashboard() {
    const [atRisk, winBack, mrr, actions] = await Promise.all([
      this.getAtRiskCustomers(10),
      this.getWinBackCandidates(5),
      this.getMRRAtRisk(),
      this.getRetentionActions(10),
    ]);

    return { atRisk, winBack, mrr, actions };
  }

  private identifyChurnFactors(score: { engagementScore: number; satisfactionScore: number; financialScore: number; adoptionScore: number; supportScore: number; lastActivityAt?: Date | null; churnRisk?: ChurnRisk }): string[] {
    const factors: string[] = [];
    const T = ATHENA_THRESHOLDS;

    if (score.engagementScore < T.ENGAGEMENT_LOW) factors.push('Engagement très faible');
    if (score.satisfactionScore < T.SATISFACTION_LOW) factors.push('Satisfaction basse');
    if (score.financialScore < T.FINANCIAL_LOW) factors.push('Plan basique');
    if (score.adoptionScore < T.ADOPTION_LOW) factors.push('Faible adoption produit');
    if (score.supportScore < T.SUPPORT_LOW) factors.push('Problèmes support fréquents');

    const daysSinceActivity = score.lastActivityAt
      ? (Date.now() - new Date(score.lastActivityAt).getTime()) /
        (1000 * 60 * 60 * 24)
      : 999;
    if (daysSinceActivity > T.INACTIVE_DAYS) factors.push(`Inactif depuis ${T.INACTIVE_DAYS}+ jours`);

    return factors;
  }

  private recommendRetentionActions(
    score: { churnRisk?: ChurnRisk },
    factors: string[],
  ): string[] {
    const actions: string[] = [];

    if (factors.includes('Engagement très faible')) {
      actions.push('Envoyer email de re-engagement personnalisé');
    }
    if (factors.includes('Satisfaction basse')) {
      actions.push('Appel proactif du customer success');
    }
    if (factors.includes('Plan basique')) {
      actions.push('Proposer upgrade avec discount');
    }
    if (factors.includes('Faible adoption produit')) {
      actions.push('Session de formation produit');
    }
    if (factors.includes('Inactif depuis 14+ jours')) {
      actions.push('Notification push de rappel');
    }

    if (score.churnRisk === ChurnRisk.CRITICAL) {
      actions.push('Intervention manager urgente');
    }

    return actions;
  }
}
