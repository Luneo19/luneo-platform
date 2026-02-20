import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AIResponseStatus } from '@prisma/client';

@Injectable()
export class FeedbackLoopService {
  private readonly logger = new Logger(FeedbackLoopService.name);

  constructor(private readonly prisma: PrismaService) {}

  async collectRejectedResponses(limit = 100) {
    return this.prisma.aITicketResponse.findMany({
      where: { status: AIResponseStatus.REJECTED },
      orderBy: { reviewedAt: 'desc' },
      take: limit,
      include: {
        ticket: {
          select: {
            subject: true,
            description: true,
            category: true,
            priority: true,
          },
        },
      },
    });
  }

  async createTrainingExample(data: {
    ticketId?: string;
    input: string;
    expectedOutput: string;
    actualOutput?: string;
    rating?: number;
    category?: string;
    tags?: string[];
    createdById?: string;
  }) {
    return this.prisma.aITrainingExample.create({
      data: {
        ticketId: data.ticketId,
        input: data.input,
        expectedOutput: data.expectedOutput,
        actualOutput: data.actualOutput,
        rating: data.rating,
        category: data.category,
        tags: data.tags || [],
        createdById: data.createdById,
      },
    });
  }

  async getTrainingData(filters?: {
    category?: string;
    isApproved?: boolean;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 50 } = filters || {};

    const where: Record<string, unknown> = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.isApproved !== undefined) where.isApproved = filters.isApproved;

    const [items, total] = await Promise.all([
      this.prisma.aITrainingExample.findMany({
        where: where as never,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.aITrainingExample.count({ where: where as never }),
    ]);

    return { items, total, page, limit };
  }

  async approveTrainingExample(id: string) {
    return this.prisma.aITrainingExample.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  async getRejectionPatterns() {
    const rejected = await this.prisma.aITicketResponse.findMany({
      where: { status: AIResponseStatus.REJECTED },
      select: {
        reviewNotes: true,
        confidenceScore: true,
        modelUsed: true,
        ticket: { select: { category: true, priority: true } },
      },
      orderBy: { reviewedAt: 'desc' },
      take: 200,
    });

    const categoryBreakdown: Record<string, number> = {};
    const avgConfidenceByCategory: Record<string, { sum: number; count: number }> = {};

    for (const r of rejected) {
      const cat = r.ticket.category;
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;

      if (!avgConfidenceByCategory[cat]) {
        avgConfidenceByCategory[cat] = { sum: 0, count: 0 };
      }
      avgConfidenceByCategory[cat].sum += r.confidenceScore;
      avgConfidenceByCategory[cat].count++;
    }

    return {
      totalRejected: rejected.length,
      byCategory: categoryBreakdown,
      avgConfidenceByCategory: Object.fromEntries(
        Object.entries(avgConfidenceByCategory).map(([k, v]) => [
          k,
          Math.round(v.sum / v.count),
        ]),
      ),
      recentNotes: rejected
        .filter((r) => r.reviewNotes)
        .slice(0, 20)
        .map((r) => r.reviewNotes),
    };
  }

  async getStats() {
    const [total, approved, pending, patterns] = await Promise.all([
      this.prisma.aITrainingExample.count(),
      this.prisma.aITrainingExample.count({ where: { isApproved: true } }),
      this.prisma.aITrainingExample.count({ where: { isApproved: false } }),
      this.getRejectionPatterns(),
    ]);

    return {
      trainingExamples: { total, approved, pending },
      rejectionPatterns: patterns,
    };
  }
}
