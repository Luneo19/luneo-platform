import { Injectable, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { normalizePlanTier, getPlanConfig, isUnlimited } from '@/libs/plans';

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

    const tier = normalizePlanTier(org.plan);
    const config = getPlanConfig(tier);
    const limits = config.limits;

    switch (metric) {
      case 'agents': {
        const current = org._count.agents;
        const limit = org.agentsLimit ?? limits.agentsLimit;
        if (!isUnlimited(limit) && current + increment > limit) {
          throw new ForbiddenException(
            `Limite d'agents atteinte (${current}/${limit}). Passez au plan supérieur pour créer plus d'agents.`,
          );
        }
        break;
      }
      case 'conversations': {
        const current = org.conversationsUsed ?? 0;
        const limit = org.conversationsLimit ?? limits.conversationsPerMonth;
        if (!isUnlimited(limit) && current + increment > limit) {
          throw new ForbiddenException(
            `Limite de conversations atteinte (${current}/${limit} ce mois). Passez au plan supérieur.`,
          );
        }
        break;
      }
      case 'documents': {
        const limit = limits.documentsLimit;
        if (!isUnlimited(limit)) {
          const docCount = await this.prisma.knowledgeSource.count({
            where: {
              knowledgeBase: { organizationId },
              deletedAt: null,
            },
          });
          if (docCount + increment > limit) {
            throw new ForbiddenException(
              `Limite de documents atteinte (${docCount}/${limit}). Passez au plan supérieur.`,
            );
          }
        }
        break;
      }
      case 'team_members': {
        const current = org._count.members;
        const limit = org.teamMembersLimit ?? limits.teamMembers;
        if (!isUnlimited(limit) && current + increment > limit) {
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

    const tier = normalizePlanTier(org.plan);
    const config = getPlanConfig(tier);

    return {
      plan: org.plan,
      agents: { used: org._count.agents, limit: org.agentsLimit ?? config.limits.agentsLimit },
      conversations: {
        used: org.conversationsUsed ?? 0,
        limit: org.conversationsLimit ?? config.limits.conversationsPerMonth,
      },
      teamMembers: { used: org._count.members, limit: org.teamMembersLimit ?? config.limits.teamMembers },
      documents: { used: org.knowledgeSourcesUsed ?? 0, limit: config.limits.documentsLimit },
    };
  }
}
