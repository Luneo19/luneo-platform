// @ts-nocheck
import { Injectable, NotFoundException } from '@nestjs/common';
import { ChurnRisk, GrowthPotential, AutomationRunStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';

const CHURN_RISK_LEVELS = [ChurnRisk.LOW, ChurnRisk.MEDIUM, ChurnRisk.HIGH, ChurnRisk.CRITICAL] as const;

@Injectable()
export class RetentionService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealthDashboard() {
    const scores = await this.prisma.customerHealthScore.findMany({
      select: { healthScore: true, churnRisk: true, lastActivityAt: true, updatedAt: true },
    });

    const total = scores.length;
    const avgHealth =
      total > 0 ? scores.reduce((s, r) => s + r.healthScore, 0) / total : 0;
    const distribution = CHURN_RISK_LEVELS.map((level) => ({
      level,
      count: scores.filter((r) => r.churnRisk === level).length,
    }));
    const atRisk = scores.filter(
      (r) => r.churnRisk === ChurnRisk.HIGH || r.churnRisk === ChurnRisk.CRITICAL,
    ).length;
    const atRiskPct = total > 0 ? (atRisk / total) * 100 : 0;

    // Trend: last 7 days of score updates (simplified: count by day from updatedAt)
    const now = new Date();
    const trendData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const count = scores.filter((r) => {
        const u = r.updatedAt ? new Date(r.updatedAt) : null;
        return u && u >= d && u < next;
      }).length;
      return { date: d.toISOString().slice(0, 10), count, avgScore: total > 0 ? avgHealth : 0 };
    });

    return {
      totalUsers: total,
      avgHealthScore: Math.round(avgHealth * 10) / 10,
      atRiskCount: atRisk,
      atRiskPercent: Math.round(atRiskPct * 10) / 10,
      distribution,
      trend: trendData,
    };
  }

  async getAtRiskCustomers(limit?: number) {
    const list = await this.prisma.customerHealthScore.findMany({
      where: { churnRisk: { in: [ChurnRisk.HIGH, ChurnRisk.CRITICAL] } },
      orderBy: { healthScore: 'asc' },
      take: limit ?? 100,
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, lastLoginAt: true },
        },
      },
    });
    return list.map((r) => ({
      id: r.id,
      userId: r.userId,
      healthScore: r.healthScore,
      churnRisk: r.churnRisk,
      lastActivityAt: r.lastActivityAt,
      user: r.user,
    }));
  }

  async getHealthScore(userId: string) {
    const score = await this.prisma.customerHealthScore.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true, lastLoginAt: true },
        },
      },
    });
    if (!score) throw new NotFoundException('Health score not found for user');
    return score;
  }

  async updateHealthScore(
    userId: string,
    data: {
      healthScore?: number;
      churnRisk?: ChurnRisk | string;
      activationScore?: number;
      engagementScore?: number;
      adoptionScore?: number;
      growthPotential?: GrowthPotential | string;
      lastActivityAt?: Date | null;
      signals?: unknown;
    },
  ) {
    return this.prisma.customerHealthScore.upsert({
      where: { userId },
      create: {
        userId,
        healthScore: data.healthScore ?? 50,
        churnRisk: (data.churnRisk as ChurnRisk) ?? ChurnRisk.LOW,
        activationScore: data.activationScore ?? 0,
        engagementScore: data.engagementScore ?? 0,
        adoptionScore: data.adoptionScore ?? 0,
        growthPotential: (data.growthPotential as GrowthPotential) ?? GrowthPotential.MEDIUM,
        lastActivityAt: data.lastActivityAt ?? null,
        signals: (data.signals as object) ?? [],
      },
      update: {
        ...(data.healthScore !== undefined && { healthScore: data.healthScore }),
        ...(data.churnRisk !== undefined && { churnRisk: data.churnRisk as ChurnRisk }),
        ...(data.activationScore !== undefined && { activationScore: data.activationScore }),
        ...(data.engagementScore !== undefined && { engagementScore: data.engagementScore }),
        ...(data.adoptionScore !== undefined && { adoptionScore: data.adoptionScore }),
        ...(data.growthPotential !== undefined && { growthPotential: data.growthPotential as GrowthPotential }),
        ...(data.lastActivityAt !== undefined && { lastActivityAt: data.lastActivityAt }),
        ...(data.signals !== undefined && { signals: data.signals as object }),
      },
    });
  }

  async calculateHealthScore(userId: string) {
    const [user, userWithBrand] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, lastLoginAt: true, createdAt: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { brand: { select: { stripeSubscriptionId: true, subscriptionPlan: true, plan: true, planExpiresAt: true } } },
      }),
    ]);
    if (!user) throw new NotFoundException('User not found');

    // Resolve subscription status from user's brand
    const now = new Date();
    const subscriptionActive =
      !!(userWithBrand?.brand?.stripeSubscriptionId) ||
      (userWithBrand?.brand?.planExpiresAt
        ? new Date(userWithBrand.brand.planExpiresAt) > now
        : false);

    const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
    const daysSinceLogin = lastLogin
      ? (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
      : 999;
    const daysSinceSignup =
      (now.getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);

    // Simple scoring: 0–100
    let score = 50;
    if (subscriptionActive) score += 20;
    if (daysSinceLogin <= 7) score += 20;
    else if (daysSinceLogin <= 30) score += 10;
    else if (daysSinceLogin > 90) score -= 30;
    else if (daysSinceLogin > 60) score -= 15;
    if (daysSinceSignup >= 30) score += 5;
    score = Math.max(0, Math.min(100, score));

    let churnRisk: ChurnRisk = ChurnRisk.LOW;
    if (score <= 25) churnRisk = ChurnRisk.CRITICAL;
    else if (score <= 45) churnRisk = ChurnRisk.HIGH;
    else if (score <= 65) churnRisk = ChurnRisk.MEDIUM;

    const activationScore = Math.min(100, Math.round(daysSinceSignup > 0 ? 100 / Math.log1p(daysSinceSignup) : 80));
    const engagementScore = daysSinceLogin <= 7 ? 90 : daysSinceLogin <= 30 ? 60 : daysSinceLogin <= 60 ? 30 : 10;
    const adoptionScore = subscriptionActive ? 70 : 40;
    const growthPotential: GrowthPotential = score >= 70 ? GrowthPotential.HIGH : score >= 50 ? GrowthPotential.MEDIUM : GrowthPotential.LOW;

    const updated = await this.prisma.customerHealthScore.upsert({
      where: { userId },
      create: {
        userId,
        healthScore: score,
        churnRisk,
        activationScore,
        engagementScore,
        adoptionScore,
        growthPotential,
        lastActivityAt: lastLogin,
        signals: [],
      },
      update: {
        healthScore: score,
        churnRisk,
        activationScore,
        engagementScore,
        adoptionScore,
        growthPotential,
        lastActivityAt: lastLogin,
        signals: [],
      },
    });
    return updated;
  }

  async getWinBackCampaigns() {
    const automations = await this.prisma.emailAutomation.findMany({
      where: {
        OR: [
          { trigger: { contains: 'win', mode: 'insensitive' } },
          { trigger: { contains: 'churn', mode: 'insensitive' } },
          { name: { contains: 'win-back', mode: 'insensitive' } },
          { name: { contains: 'win back', mode: 'insensitive' } },
        ],
      },
      include: {
        steps: { orderBy: { order: 'asc' } },
        _count: { select: { runs: true } },
      },
    });
    return automations.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      trigger: a.trigger,
      status: a.status,
      stepsCount: a.steps.length,
      runsCount: a._count.runs,
    }));
  }

  async triggerWinBack(userIds: string[]) {
    const winBackAutomations = await this.prisma.emailAutomation.findFirst({
      where: {
        status: 'active' as const,
        OR: [
          { trigger: { contains: 'win', mode: 'insensitive' as const } },
          { trigger: { contains: 'churn', mode: 'insensitive' as const } },
          { name: { contains: 'win-back', mode: 'insensitive' as const } },
        ],
      },
    });
    if (!winBackAutomations) {
      return { triggered: 0, message: 'No active win-back automation found' };
    }

    const customers = await this.prisma.customer.findMany({
      where: { userId: { in: userIds } },
      select: { id: true, userId: true },
    });
    const created = await Promise.all(
      customers.map((c) =>
        this.prisma.automationRun.create({
          data: {
            automationId: winBackAutomations.id,
            customerId: c.id,
            status: AutomationRunStatus.active,
            currentStep: 0,
          },
        }),
      ),
    );
    return { triggered: created.length, runIds: created.map((r) => r.id) };
  }
}
