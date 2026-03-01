import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { PLAN_LIMITS, PlanLimits } from './plan-limits.config';

type QuotaResource =
  | 'agents'
  | 'messages'
  | 'messages_per_month'
  | 'conversations'
  | 'knowledge_bases'
  | 'sources_per_kb'
  | 'documents'
  | 'channels'
  | 'team_members'
  | 'file_upload_mb';

interface QuotaCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  percentage: number;
}

export class QuotaExceededException extends ForbiddenException {
  constructor(resource: string, current: number, limit: number) {
    super(`Quota exceeded for ${resource} (${current}/${limit})`);
  }
}

@Injectable()
export class QuotaEnforcementService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async checkQuota(organizationId: string, resource: string): Promise<QuotaCheckResult> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        plan: true,
        conversationsUsed: true,
      },
    });

    if (!org) {
      throw new ForbiddenException('Organization not found');
    }

    const limits = this.getPlanLimits(org.plan);
    const normalizedResource = this.normalizeResource(resource);
    const current = await this.getCurrentUsage(organizationId, normalizedResource, org.conversationsUsed);
    const limit = this.getResourceLimit(limits, normalizedResource);
    const allowed = this.isUnlimited(limit) || current < limit;
    const percentage = this.getUsagePercentage(current, limit);

    return {
      allowed,
      current,
      limit,
      percentage,
    };
  }

  async enforceQuota(organizationId: string, resource: string): Promise<void> {
    const result = await this.checkQuota(organizationId, resource);
    if (!result.allowed) {
      throw new QuotaExceededException(resource, result.current, result.limit);
    }
  }

  async getUsageSummary(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        plan: true,
      },
    });

    if (!org) {
      throw new ForbiddenException('Organization not found');
    }

    const [agents, messages, knowledgeBases, sourcesPerKb, channels, teamMembers, fileUploadMb] =
      await Promise.all([
        this.checkQuota(organizationId, 'agents'),
        this.checkQuota(organizationId, 'messages_per_month'),
        this.checkQuota(organizationId, 'knowledge_bases'),
        this.checkQuota(organizationId, 'sources_per_kb'),
        this.checkQuota(organizationId, 'channels'),
        this.checkQuota(organizationId, 'team_members'),
        this.checkQuota(organizationId, 'file_upload_mb'),
      ]);

    return {
      plan: org.plan,
      usage: {
        agents,
        messagesPerMonth: messages,
        knowledgeBases,
        sourcesPerKb,
        channels,
        teamMembers,
        fileUploadMb,
      },
      limits: this.getPlanLimits(org.plan),
    };
  }

  private getPlanLimits(plan: string): PlanLimits {
    const normalizedPlan = String(plan).toUpperCase();
    return PLAN_LIMITS[normalizedPlan] ?? PLAN_LIMITS.FREE;
  }

  private normalizeResource(resource: string): QuotaResource {
    const key = String(resource).toLowerCase();

    switch (key) {
      case 'agents':
        return 'agents';
      case 'messages':
      case 'messages_per_month':
      case 'conversations':
        return 'messages_per_month';
      case 'knowledge_bases':
      case 'knowledgebases':
        return 'knowledge_bases';
      case 'sources_per_kb':
      case 'sourcesperkb':
      case 'documents':
        return 'sources_per_kb';
      case 'channels':
        return 'channels';
      case 'team_members':
      case 'teammembers':
        return 'team_members';
      case 'file_upload_mb':
      case 'fileuploadmb':
        return 'file_upload_mb';
      default:
        throw new ForbiddenException(`Unknown quota resource: ${resource}`);
    }
  }

  private getResourceLimit(limits: PlanLimits, resource: QuotaResource): number {
    switch (resource) {
      case 'agents':
        return limits.maxAgents;
      case 'messages':
      case 'messages_per_month':
      case 'conversations':
        return limits.maxMessagesPerMonth;
      case 'knowledge_bases':
        return limits.maxKnowledgeBases;
      case 'sources_per_kb':
      case 'documents':
        return limits.maxSourcesPerKb;
      case 'channels':
        return limits.maxChannels;
      case 'team_members':
        return limits.maxTeamMembers;
      case 'file_upload_mb':
        return limits.maxFileUploadMb;
    }
  }

  private async getCurrentUsage(
    organizationId: string,
    resource: QuotaResource,
    conversationsUsed: number,
  ): Promise<number> {
    switch (resource) {
      case 'agents':
        return this.prisma.agent.count({
          where: { organizationId, deletedAt: null },
        });
      case 'messages':
      case 'messages_per_month':
      case 'conversations':
        return conversationsUsed ?? 0;
      case 'knowledge_bases':
        return this.prisma.knowledgeBase.count({
          where: { organizationId, deletedAt: null },
        });
      case 'sources_per_kb': {
        const bases = await this.prisma.knowledgeBase.findMany({
          where: { organizationId, deletedAt: null },
          select: { sourcesCount: true },
        });
        return bases.reduce((max, base) => Math.max(max, base.sourcesCount ?? 0), 0);
      }
      case 'documents':
        return this.prisma.knowledgeSource.count({
          where: {
            deletedAt: null,
            knowledgeBase: {
              organizationId,
              deletedAt: null,
            },
          },
        });
      case 'channels':
        return this.prisma.channel.count({
          where: {
            deletedAt: null,
            agent: {
              organizationId,
              deletedAt: null,
            },
          },
        });
      case 'team_members':
        return this.prisma.organizationMember.count({
          where: {
            organizationId,
            isActive: true,
          },
        });
      case 'file_upload_mb':
        return 0;
    }
  }

  private isUnlimited(limit: number): boolean {
    return limit < 0;
  }

  private getUsagePercentage(current: number, limit: number): number {
    if (this.isUnlimited(limit) || limit === 0) {
      return 0;
    }
    return Math.min(100, Math.round((current / limit) * 100));
  }
}
