import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ChurnRisk, GrowthPotential } from '@prisma/client';

export interface HealthScoreBreakdown {
  engagement: number;
  satisfaction: number;
  financial: number;
  adoption: number;
  support: number;
  overall: number;
}

interface ChurnRiskAssessment {
  score: number;
  risk: ChurnRisk;
  factors: Array<{ factor: string; weight: number; value: number }>;
  recommendations: string[];
}

@Injectable()
export class AthenaService {
  private readonly logger = new Logger(AthenaService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async updateHealthScores() {
    this.logger.debug('Athena: Updating customer health scores');

    const users = await this.prisma.user.findMany({
      where: { isActive: true, role: { not: 'PLATFORM_ADMIN' as any } },
      select: { id: true },
    });

    let updated = 0;
    for (const user of users) {
      try {
        await this.calculateHealthScore(user.id);
        updated++;
      } catch {
        // skip individual errors
      }
    }

    this.logger.log(`Athena: Updated ${updated}/${users.length} health scores`);
  }

  async calculateHealthScore(userId: string): Promise<HealthScoreBreakdown> {
    const [user, ticketStats, loginStats] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          createdAt: true,
          lastLoginAt: true,
          brand: { select: { subscriptionPlan: true, subscriptionStatus: true } },
          _count: { select: { designs: true, orders: true } },
        },
      }),
      this.prisma.ticket.aggregate({
        where: { userId },
        _count: true,
        _avg: { csatRating: true },
      }),
      this.prisma.auditLog.count({
        where: {
          userId,
          eventType: 'auth.login',
          timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const daysSinceLogin = user.lastLoginAt
      ? (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    const engagement = Math.min(
      100,
      Math.max(0, 100 - daysSinceLogin * 5) * 0.4 +
        Math.min(loginStats, 30) * 2,
    );

    const satisfaction =
      ticketStats._avg.csatRating !== null
        ? ticketStats._avg.csatRating * 20
        : 50;

    const planScores: Record<string, number> = {
      FREE: 20,
      STARTER: 40,
      PROFESSIONAL: 60,
      BUSINESS: 80,
      ENTERPRISE: 100,
    };
    const financial =
      planScores[user.brand?.subscriptionPlan || 'FREE'] || 20;

    const adoption = Math.min(
      100,
      (user._count.designs || 0) * 5 + (user._count.orders || 0) * 10,
    );

    const openTickets = await this.prisma.ticket.count({
      where: { userId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });
    const support = Math.max(0, 100 - openTickets * 15 - (ticketStats._count || 0) * 2);

    const overall = Math.round(
      engagement * 0.3 +
        satisfaction * 0.2 +
        financial * 0.2 +
        adoption * 0.2 +
        support * 0.1,
    );

    const churnRisk = this.assessChurnRisk(overall, daysSinceLogin, engagement);

    await this.prisma.customerHealthScore.upsert({
      where: { userId },
      update: {
        healthScore: overall,
        engagementScore: Math.round(engagement),
        satisfactionScore: Math.round(satisfaction),
        financialScore: Math.round(financial),
        adoptionScore: Math.round(adoption),
        supportScore: Math.round(support),
        churnRisk: churnRisk.risk,
        churnRiskScore: churnRisk.score,
        trend: this.calculateTrend(overall),
        lastActivityAt: user.lastLoginAt,
      },
      create: {
        userId,
        healthScore: overall,
        engagementScore: Math.round(engagement),
        satisfactionScore: Math.round(satisfaction),
        financialScore: Math.round(financial),
        adoptionScore: Math.round(adoption),
        supportScore: Math.round(support),
        churnRisk: churnRisk.risk,
        churnRiskScore: churnRisk.score,
        trend: this.calculateTrend(overall),
        lastActivityAt: user.lastLoginAt,
      },
    });

    return {
      engagement: Math.round(engagement),
      satisfaction: Math.round(satisfaction),
      financial: Math.round(financial),
      adoption: Math.round(adoption),
      support: Math.round(support),
      overall,
    };
  }

  async getCustomerHealth(userId: string) {
    return this.prisma.customerHealthScore.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            lastLoginAt: true,
            brand: { select: { name: true, subscriptionPlan: true } },
          },
        },
      },
    });
  }

  async getHealthDistribution() {
    const scores = await this.prisma.customerHealthScore.findMany({
      select: { healthScore: true, churnRisk: true },
    });

    const distribution = {
      healthy: scores.filter((s) => s.healthScore >= 70).length,
      atRisk: scores.filter(
        (s) => s.healthScore >= 40 && s.healthScore < 70,
      ).length,
      critical: scores.filter((s) => s.healthScore < 40).length,
    };

    const churnDistribution = {
      LOW: scores.filter((s) => s.churnRisk === ChurnRisk.LOW).length,
      MEDIUM: scores.filter((s) => s.churnRisk === ChurnRisk.MEDIUM).length,
      HIGH: scores.filter((s) => s.churnRisk === ChurnRisk.HIGH).length,
      CRITICAL: scores.filter((s) => s.churnRisk === ChurnRisk.CRITICAL).length,
    };

    return { distribution, churnDistribution, total: scores.length };
  }

  async generateInsights() {
    const distribution = await this.getHealthDistribution();

    const insights: Array<{
      type: string;
      title: string;
      description: string;
      severity: string;
    }> = [];

    if (distribution.distribution.critical > distribution.total * 0.1) {
      insights.push({
        type: 'health_warning',
        title: 'Taux élevé de clients critiques',
        description: `${distribution.distribution.critical} clients en zone critique (${Math.round((distribution.distribution.critical / distribution.total) * 100)}%)`,
        severity: 'warning',
      });
    }

    if (distribution.churnDistribution.CRITICAL > 5) {
      insights.push({
        type: 'churn_alert',
        title: 'Clients à risque critique de churn',
        description: `${distribution.churnDistribution.CRITICAL} clients à risque critique nécessitent une action immédiate`,
        severity: 'critical',
      });
    }

    for (const insight of insights) {
      await this.prisma.orionInsight.create({
        data: {
          agentType: 'athena',
          type: insight.type,
          title: insight.title,
          description: insight.description,
          severity: insight.severity,
        },
      });
    }

    return insights;
  }

  async getDashboard() {
    const [distribution, recentInsights, topAtRisk] = await Promise.all([
      this.getHealthDistribution(),
      this.prisma.orionInsight.findMany({
        where: { agentType: 'athena' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.customerHealthScore.findMany({
        where: { churnRisk: { in: [ChurnRisk.HIGH, ChurnRisk.CRITICAL] } },
        orderBy: { healthScore: 'asc' },
        take: 10,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              brand: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return { distribution, recentInsights, topAtRisk };
  }

  private assessChurnRisk(
    healthScore: number,
    daysSinceLogin: number,
    engagement: number,
  ): ChurnRiskAssessment {
    const factors = [
      { factor: 'health_score', weight: 0.3, value: 100 - healthScore },
      { factor: 'inactivity', weight: 0.3, value: Math.min(100, daysSinceLogin * 3) },
      { factor: 'low_engagement', weight: 0.4, value: 100 - engagement },
    ];

    const score = factors.reduce(
      (sum, f) => sum + f.weight * f.value,
      0,
    );

    let risk: ChurnRisk;
    if (score >= 75) risk = ChurnRisk.CRITICAL;
    else if (score >= 50) risk = ChurnRisk.HIGH;
    else if (score >= 25) risk = ChurnRisk.MEDIUM;
    else risk = ChurnRisk.LOW;

    const recommendations: string[] = [];
    if (daysSinceLogin > 14) recommendations.push('Envoyer email de re-engagement');
    if (healthScore < 40) recommendations.push('Contact proactif par le support');
    if (engagement < 30) recommendations.push('Proposer une session de découverte');

    return { score: Math.round(score), risk, factors, recommendations };
  }

  private calculateTrend(currentScore: number): string {
    if (currentScore >= 70) return 'stable';
    if (currentScore >= 40) return 'declining';
    return 'critical';
  }
}
