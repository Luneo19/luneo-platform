import { Injectable } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

@Injectable()
export class WeeklyAnalyzerService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async generateWeeklySummary() {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [signals, gaps, feedbacks] = await Promise.all([
      this.prisma.learningSignal.count({ where: { createdAt: { gte: since } } }),
      this.prisma.knowledgeGap.count({ where: { updatedAt: { gte: since } } }),
      this.prisma.conversation.count({
        where: {
          satisfactionRatedAt: { gte: since },
          satisfactionRating: { not: null },
        },
      }),
    ]);

    return {
      period: { from: since.toISOString(), to: new Date().toISOString() },
      learningSignals: signals,
      updatedKnowledgeGaps: gaps,
      collectedFeedbacks: feedbacks,
    };
  }
}
