import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { PLAN_LIMITS } from './plan-limits.config';
import { UsageType } from '@prisma/client';
import { getPlanConfig, normalizePlanTier } from '@/libs/plans/plan-config';

export type QuotaMetric = 'agents' | 'conversations' | 'documents' | 'team_members' | 'messages_ai';

@Injectable()
export class QuotasService {
  private readonly logger = new Logger(QuotasService.name);
  private readonly proConversationOverageCap = Number(process.env.REVENUE_PRO_OVERAGE_CONVERSATIONS_CAP ?? 1000);
  private readonly businessConversationOverageCap = Number(process.env.REVENUE_BUSINESS_OVERAGE_CONVERSATIONS_CAP ?? 5000);
  private readonly enterpriseConversationOverageCap = Number(process.env.REVENUE_ENTERPRISE_OVERAGE_CONVERSATIONS_CAP ?? 20000);

  constructor(private readonly prisma: PrismaOptimizedService) {}

  async enforceQuota(organizationId: string, metric: QuotaMetric, increment: number = 1): Promise<void> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        plan: true,
        agentsUsed: true,
        agentsLimit: true,
        conversationsUsed: true,
        conversationsLimit: true,
        knowledgeSourcesUsed: true,
        knowledgeSourcesLimit: true,
        teamMembersUsed: true,
        teamMembersLimit: true,
        _count: {
          select: {
            agents: true,
            members: true,
          },
        },
      },
    });

    if (!org) throw new ForbiddenException('Organization not found');

    const limits = PLAN_LIMITS[String(org.plan).toUpperCase()] ?? PLAN_LIMITS.FREE;

    switch (metric) {
      case 'agents': {
        const current = org._count.agents;
        const limit = org.agentsLimit ?? limits.maxAgents;
        if (!this.isUnlimited(limit) && current + increment > limit) {
          throw new ForbiddenException(
            `Limite d'agents atteinte (${current}/${limit}). Passez au plan supérieur pour créer plus d'agents.`,
          );
        }
        break;
      }
      case 'conversations': {
        const current = org.conversationsUsed ?? 0;
        const limit = org.conversationsLimit ?? limits.maxMessagesPerMonth;
        if (!this.isUnlimited(limit) && current + increment > limit) {
          const hardBlock = String(org.plan).toUpperCase() === 'FREE';
          if (!hardBlock) {
            const cap = this.getConversationOverageCap(String(org.plan).toUpperCase());
            const projectedUsage = current + increment;
            if (projectedUsage <= limit + cap) {
              this.logger.warn(
                `Conversation overage allowed for org ${organizationId} (plan=${org.plan}, usage=${projectedUsage}, baseLimit=${limit}, cap=${cap})`,
              );
              break;
            }
          }
          throw new ForbiddenException(
            `Limite de conversations atteinte (${current}/${limit} ce mois). Passez au plan supérieur.`,
          );
        }
        break;
      }
      case 'documents': {
        const limit = limits.maxSourcesPerKb;
        if (!this.isUnlimited(limit)) {
          const bases = await this.prisma.knowledgeBase.findMany({
            where: { organizationId, deletedAt: null },
            select: { sourcesCount: true },
          });
          const current = bases.reduce((max, base) => Math.max(max, base.sourcesCount ?? 0), 0);
          if (current + increment > limit) {
            throw new ForbiddenException(
              `Limite de sources par base atteinte (${current}/${limit}). Passez au plan supérieur.`,
            );
          }
        }
        break;
      }
      case 'team_members': {
        const current = org._count.members;
        const limit = org.teamMembersLimit ?? limits.maxTeamMembers;
        if (!this.isUnlimited(limit) && current + increment > limit) {
          throw new ForbiddenException(
            `Limite de membres atteinte (${current}/${limit}). Passez au plan supérieur.`,
          );
        }
        break;
      }
      case 'messages_ai': {
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const aggregate = await this.prisma.usageRecord.aggregate({
          where: {
            organizationId,
            type: UsageType.MESSAGE,
            createdAt: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
          _sum: {
            quantity: true,
          },
        });
        const current = aggregate._sum.quantity ?? 0;
        const limit = this.getMessagesAiLimit(String(org.plan));
        if (this.isUnlimited(limit)) {
          break;
        }

        const projectedUsage = current + increment;
        const hardBlock = String(org.plan).toUpperCase() === 'FREE';
        if (hardBlock && projectedUsage > limit) {
          throw new ForbiddenException(
            `Limite de messages IA atteinte (${current}/${limit} ce mois).`,
          );
        }

        if (!hardBlock && projectedUsage > limit) {
          const cap = this.getMessagesAiOverageCap(String(org.plan).toUpperCase());
          if (projectedUsage > limit + cap) {
            throw new ForbiddenException(
              `Cap de sécurité des messages IA atteint (${projectedUsage}/${limit + cap}). Veuillez mettre à niveau votre plan.`,
            );
          }
          this.logger.warn(
            `AI message overage allowed for org ${organizationId} (plan=${org.plan}, usage=${projectedUsage}, baseLimit=${limit}, cap=${cap})`,
          );
        }
        break;
      }
    }

    this.logger.debug(`Quota check passed: ${metric} for org ${organizationId}`);
  }

  async getUsageSummary(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        plan: true,
        agentsUsed: true,
        agentsLimit: true,
        conversationsUsed: true,
        conversationsLimit: true,
        knowledgeSourcesUsed: true,
        knowledgeSourcesLimit: true,
        teamMembersUsed: true,
        teamMembersLimit: true,
        _count: { select: { agents: true, members: true } },
      },
    });

    if (!org) return null;

    const limits = PLAN_LIMITS[String(org.plan).toUpperCase()] ?? PLAN_LIMITS.FREE;
    const bases = await this.prisma.knowledgeBase.findMany({
      where: { organizationId, deletedAt: null },
      select: { sourcesCount: true },
    });
    const sourcesPerKbUsed = bases.reduce((max, base) => Math.max(max, base.sourcesCount ?? 0), 0);

    return {
      plan: org.plan,
      agents: { used: org._count.agents, limit: org.agentsLimit ?? limits.maxAgents },
      conversations: {
        used: org.conversationsUsed ?? 0,
        limit: org.conversationsLimit ?? limits.maxMessagesPerMonth,
      },
      teamMembers: { used: org._count.members, limit: org.teamMembersLimit ?? limits.maxTeamMembers },
      documents: { used: sourcesPerKbUsed, limit: limits.maxSourcesPerKb },
    };
  }

  private isUnlimited(limit: number): boolean {
    return limit < 0;
  }

  private getConversationOverageCap(plan: string): number {
    switch (plan) {
      case 'PRO':
        return this.proConversationOverageCap;
      case 'BUSINESS':
        return this.businessConversationOverageCap;
      case 'ENTERPRISE':
        return this.enterpriseConversationOverageCap;
      default:
        return 0;
    }
  }

  private getMessagesAiOverageCap(plan: string): number {
    switch (plan) {
      case 'PRO':
        return Number(process.env.REVENUE_PRO_OVERAGE_MESSAGES_CAP ?? 10000);
      case 'BUSINESS':
        return Number(process.env.REVENUE_BUSINESS_OVERAGE_MESSAGES_CAP ?? 50000);
      case 'ENTERPRISE':
        return Number(process.env.REVENUE_ENTERPRISE_OVERAGE_MESSAGES_CAP ?? 200000);
      default:
        return 0;
    }
  }

  private getMessagesAiLimit(plan: string): number {
    const tier = normalizePlanTier(plan);
    const config = getPlanConfig(tier);
    const quota = config.quotas.find((item) => item.metric === 'messages_ai');
    return quota?.limit ?? 0;
  }
}
