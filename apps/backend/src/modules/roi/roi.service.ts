import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { CurrentUser } from '@/common/types/user.types';
import { ConversationStatus, ResolvedBy } from '@prisma/client';

@Injectable()
export class RoiService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async getOverview(user: CurrentUser) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const avgHumanTicketCostEur = 8.5;
    const avgMinutesSavedPerConversation = 9;

    const where = {
      organizationId: user.organizationId,
      createdAt: { gte: monthStart, lte: now },
      deletedAt: null,
    };

    const [totalConversations, resolvedByAi, avgSatisfaction, totalCostUsd] = await Promise.all([
      this.prisma.conversation.count({ where }),
      this.prisma.conversation.count({
        where: { ...where, status: ConversationStatus.RESOLVED, resolvedBy: ResolvedBy.AGENT },
      }),
      this.prisma.conversation.aggregate({
        where: { ...where, satisfactionRating: { not: null } },
        _avg: { satisfactionRating: true },
      }),
      this.prisma.conversation.aggregate({
        where,
        _sum: { totalCostUsd: true },
      }),
    ]);

    const supportSavingsEur = Number((resolvedByAi * avgHumanTicketCostEur).toFixed(2));
    const hoursSaved = Number(((resolvedByAi * avgMinutesSavedPerConversation) / 60).toFixed(1));
    const estimatedPlatformCostEur = Number(((totalCostUsd._sum.totalCostUsd ?? 0) * 0.92).toFixed(2));
    const roiNetEur = Number((supportSavingsEur - estimatedPlatformCostEur).toFixed(2));

    return {
      period: {
        from: monthStart.toISOString(),
        to: now.toISOString(),
      },
      metrics: {
        totalConversations,
        resolvedByAi,
        autoResolutionRate: totalConversations > 0 ? Number(((resolvedByAi / totalConversations) * 100).toFixed(2)) : 0,
        avgSatisfaction: avgSatisfaction._avg.satisfactionRating ?? null,
      },
      roi: {
        supportSavingsEur,
        estimatedPlatformCostEur,
        roiNetEur,
        hoursSaved,
      },
      assumptions: {
        avgHumanTicketCostEur,
        avgMinutesSavedPerConversation,
      },
    };
  }
}
