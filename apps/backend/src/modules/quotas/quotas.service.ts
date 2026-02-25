import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { PLAN_LIMITS } from './plan-limits.config';

export type QuotaMetric = 'agents' | 'conversations' | 'documents' | 'team_members';

@Injectable()
export class QuotasService {
  private readonly logger = new Logger(QuotasService.name);

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
}
