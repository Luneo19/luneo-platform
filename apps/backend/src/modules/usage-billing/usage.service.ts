import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { UsageType, Plan } from '@prisma/client';

// Plan limits configuration
const PLAN_LIMITS: Record<
  Plan,
  {
    conversations: number;
    agents: number;
    knowledgeSources: number;
    teamMembers: number;
    monthlyBudgetUsd: number | null;
  }
> = {
  FREE: {
    conversations: 50,
    agents: 1,
    knowledgeSources: 1,
    teamMembers: 1,
    monthlyBudgetUsd: null,
  },
  STARTER: {
    conversations: 500,
    agents: 3,
    knowledgeSources: 10,
    teamMembers: 5,
    monthlyBudgetUsd: null,
  },
  PRO: {
    conversations: 2000,
    agents: 10,
    knowledgeSources: -1,
    teamMembers: 20,
    monthlyBudgetUsd: null,
  },
  BUSINESS: {
    conversations: -1,
    agents: -1,
    knowledgeSources: -1,
    teamMembers: -1,
    monthlyBudgetUsd: null,
  },
  ENTERPRISE: {
    conversations: -1,
    agents: -1,
    knowledgeSources: -1,
    teamMembers: -1,
    monthlyBudgetUsd: null,
  },
};

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private readonly prisma: PrismaOptimizedService) {}

  async checkQuota(
    organizationId: string,
    resource:
      | 'conversations'
      | 'agents'
      | 'knowledgeSources'
      | 'teamMembers',
  ): Promise<{ allowed: boolean; used: number; limit: number; plan: Plan }> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new ForbiddenException('Organization not found');

    const limits = PLAN_LIMITS[org.plan];
    const limit = limits[resource];

    // -1 means unlimited
    if (limit === -1)
      return { allowed: true, used: 0, limit: -1, plan: org.plan };

    const usedMap = {
      conversations: org.conversationsUsed,
      agents: org.agentsUsed,
      knowledgeSources: org.knowledgeSourcesUsed,
      teamMembers: org.teamMembersUsed,
    };

    const used = usedMap[resource];
    return { allowed: used < limit, used, limit, plan: org.plan };
  }

  async enforceQuota(
    organizationId: string,
    resource:
      | 'conversations'
      | 'agents'
      | 'knowledgeSources'
      | 'teamMembers',
  ): Promise<void> {
    const quota = await this.checkQuota(organizationId, resource);
    if (!quota.allowed) {
      throw new ForbiddenException(
        `${resource} limit reached (${quota.used}/${quota.limit}) on ${quota.plan} plan. Please upgrade.`,
      );
    }
  }

  async recordUsage(
    organizationId: string,
    type: UsageType,
    quantity: number,
    metadata?: { agentId?: string; conversationId?: string },
  ): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    await this.prisma.usageRecord.create({
      data: {
        organizationId,
        type,
        quantity,
        agentId: metadata?.agentId,
        conversationId: metadata?.conversationId,
        periodStart,
        periodEnd,
      },
    });
  }

  async getUsageSummary(
    organizationId: string,
  ): Promise<Record<string, { used: number; limit: number }>> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new ForbiddenException('Organization not found');

    return {
      conversations: {
        used: org.conversationsUsed,
        limit: org.conversationsLimit,
      },
      agents: {
        used: org.agentsUsed,
        limit: org.agentsLimit,
      },
      knowledgeSources: {
        used: org.knowledgeSourcesUsed,
        limit: org.knowledgeSourcesLimit,
      },
      teamMembers: {
        used: org.teamMembersUsed,
        limit: org.teamMembersLimit,
      },
    };
  }

  async resetMonthlyUsage(organizationId: string): Promise<void> {
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { conversationsUsed: 0, currentMonthSpend: 0 },
    });
  }

  getPlanLimits(plan: Plan) {
    return PLAN_LIMITS[plan];
  }
}
