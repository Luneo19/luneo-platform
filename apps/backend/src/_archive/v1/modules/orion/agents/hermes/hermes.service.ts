// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class HermesService {
  private readonly logger = new Logger(HermesService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkInactiveUsers() {
    this.logger.debug('Hermes: Checking inactive users for re-engagement');

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const inactiveUsers = await this.prisma.user.findMany({
      where: {
        isActive: true,
        lastLoginAt: { lte: fourteenDaysAgo },
        role: { not: 'PLATFORM_ADMIN' as never },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastLoginAt: true,
      },
      take: 50,
    });

    for (const user of inactiveUsers) {
      await this.createEngagementAction(
        user.id,
        're_engagement',
        `Utilisateur inactif depuis ${Math.floor((Date.now() - (user.lastLoginAt?.getTime() || 0)) / (1000 * 60 * 60 * 24))} jours`,
        { email: user.email, firstName: user.firstName },
      );
    }

    this.logger.log(
      `Hermes: Found ${inactiveUsers.length} inactive users for re-engagement`,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async checkTrialEngagement() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const trialing = await this.prisma.brand.findMany({
      where: {
        subscriptionStatus: 'TRIALING',
        trialEndsAt: { lte: threeDaysFromNow, gte: new Date() },
      },
      include: {
        users: {
          select: { id: true, email: true, firstName: true },
          take: 1,
        },
      },
    });

    for (const brand of trialing) {
      const owner = brand.users[0];
      if (owner) {
        await this.createEngagementAction(
          owner.id,
          'trial_ending',
          `Trial de ${brand.name} expire bientôt`,
          {
            brandId: brand.id,
            brandName: brand.name,
            trialEndsAt: brand.trialEndsAt,
          },
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkMilestones() {
    const milestoneThresholds = [
      { count: 10, label: '10 designs' },
      { count: 50, label: '50 designs' },
      { count: 100, label: '100 designs' },
      { count: 500, label: '500 designs' },
      { count: 1000, label: '1K designs' },
    ];

    for (const milestone of milestoneThresholds) {
      const users = await this.prisma.user.findMany({
        where: {
          isActive: true,
          designs: { some: {} },
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          _count: { select: { designs: true } },
        },
      });

      for (const user of users) {
        if (user._count.designs === milestone.count) {
          await this.createEngagementAction(
            user.id,
            'milestone',
            `${user.firstName || user.email} a atteint ${milestone.label}!`,
            { milestone: milestone.label, count: milestone.count },
          );
        }
      }
    }
  }

  async getPendingCommunications() {
    return this.prisma.orionAgentAction.findMany({
      where: {
        agentType: 'hermes',
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getRecentCampaigns(limit = 10) {
    return this.prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getDashboard() {
    const [pending, campaigns, stats] = await Promise.all([
      this.getPendingCommunications(),
      this.getRecentCampaigns(),
      this.getEngagementStats(),
    ]);

    return { pending, campaigns, stats };
  }

  async getEngagementStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeUsers, totalUsers, engagementActions] = await Promise.all([
      this.prisma.user.count({
        where: {
          lastLoginAt: { gte: thirtyDaysAgo },
          isActive: true,
        },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.orionAgentAction.count({
        where: {
          agentType: 'hermes',
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    return {
      activeUsers,
      totalUsers,
      engagementRate:
        totalUsers > 0
          ? Math.round((activeUsers / totalUsers) * 100)
          : 0,
      actionsThisMonth: engagementActions,
    };
  }

  private async createEngagementAction(
    userId: string,
    type: string,
    description: string,
    data: Record<string, unknown>,
  ) {
    await this.prisma.orionAgentAction.create({
      data: {
        agentType: 'hermes',
        actionType: type,
        title: `${type}: ${userId}`,
        description,
        data: { userId, ...data } as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
