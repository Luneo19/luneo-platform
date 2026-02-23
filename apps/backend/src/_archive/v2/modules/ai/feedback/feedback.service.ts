import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface CreateFeedbackDto {
  generationId: string;
  userId: string;
  rating: number; // 1-5
  feedback?: string;
  issues?: string[];
  wasRegenerated?: boolean;
  isUseful?: boolean;
}

export interface FeedbackSummary {
  averageRating: number;
  totalFeedback: number;
  issueBreakdown: Record<string, number>;
  satisfactionRate: number;
}

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFeedbackDto) {
    return this.prisma.aIGenerationFeedback.upsert({
      where: {
        generationId_userId: {
          generationId: dto.generationId,
          userId: dto.userId,
        },
      },
      update: {
        rating: dto.rating,
        feedback: dto.feedback,
        issues: dto.issues ?? [],
        wasRegenerated: dto.wasRegenerated ?? false,
        isUseful: dto.isUseful,
      },
      create: {
        generationId: dto.generationId,
        userId: dto.userId,
        rating: dto.rating,
        feedback: dto.feedback,
        issues: dto.issues ?? [],
        wasRegenerated: dto.wasRegenerated ?? false,
        isUseful: dto.isUseful,
      },
    });
  }

  async getByGeneration(generationId: string) {
    return this.prisma.aIGenerationFeedback.findMany({
      where: { generationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getByUser(userId: string, limit = 20, offset = 0) {
    return this.prisma.aIGenerationFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getSummary(
    _brandId?: string,
    period?: { from: Date; to: Date },
  ): Promise<FeedbackSummary> {
    const where: { createdAt?: { gte: Date; lte: Date } } = {};
    if (period) {
      where.createdAt = { gte: period.from, lte: period.to };
    }

    const feedbacks = await this.prisma.aIGenerationFeedback.findMany({
      where,
    });

    if (feedbacks.length === 0) {
      return {
        averageRating: 0,
        totalFeedback: 0,
        issueBreakdown: {},
        satisfactionRate: 0,
      };
    }

    const totalRating = feedbacks.reduce((sum, f) => sum + f.rating, 0);
    const issueBreakdown: Record<string, number> = {};
    feedbacks.forEach((f) => {
      f.issues.forEach((issue) => {
        issueBreakdown[issue] = (issueBreakdown[issue] ?? 0) + 1;
      });
    });

    const usefulCount = feedbacks.filter((f) => f.isUseful === true).length;

    return {
      averageRating: totalRating / feedbacks.length,
      totalFeedback: feedbacks.length,
      issueBreakdown,
      satisfactionRate: (usefulCount / feedbacks.length) * 100,
    };
  }

  async delete(id: string, userId: string) {
    const feedback = await this.prisma.aIGenerationFeedback.findFirst({
      where: { id, userId },
    });
    if (!feedback) throw new NotFoundException('Feedback not found');
    return this.prisma.aIGenerationFeedback.delete({ where: { id } });
  }
}
