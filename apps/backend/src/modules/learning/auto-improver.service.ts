import { Injectable } from '@nestjs/common';
import { KnowledgeGapStatus, Prisma } from '@prisma/client';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

@Injectable()
export class AutoImproverService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async proposeTopImprovements(limit = 10) {
    const topGaps = await this.prisma.knowledgeGap.findMany({
      where: { status: KnowledgeGapStatus.DETECTED },
      orderBy: [{ frequency: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        organizationId: true,
        question: true,
        category: true,
        frequency: true,
      },
    });

    for (const gap of topGaps) {
      await this.prisma.notification.create({
        data: {
          organizationId: gap.organizationId,
          userId: null,
          type: 'LEARNING_IMPROVEMENT',
          title: 'Nouvelle opportunite d amelioration IA',
          body: `${gap.question.slice(0, 120)} (freq: ${gap.frequency})`,
          data: {
            knowledgeGapId: gap.id,
            category: gap.category,
            frequency: gap.frequency,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return { proposals: topGaps.length };
  }
}
