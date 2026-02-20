import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AIResponseStatus, Prisma } from '@prisma/client';

interface ReviewQueueFilters {
  status?: AIResponseStatus;
  minConfidence?: number;
  maxConfidence?: number;
  page?: number;
  limit?: number;
}

interface ReviewDecision {
  responseId: string;
  approved: boolean;
  reviewerId: string;
  notes?: string;
  editedContent?: string;
}

@Injectable()
export class TicketReviewService {
  private readonly logger = new Logger(TicketReviewService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getReviewQueue(filters: ReviewQueueFilters = {}) {
    const {
      status = AIResponseStatus.PENDING,
      minConfidence,
      maxConfidence,
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.AITicketResponseWhereInput = { status };
    if (minConfidence !== undefined) {
      where.confidenceScore = { ...((where.confidenceScore as Record<string, unknown>) || {}), gte: minConfidence };
    }
    if (maxConfidence !== undefined) {
      where.confidenceScore = { ...((where.confidenceScore as Record<string, unknown>) || {}), lte: maxConfidence };
    }

    const [items, total] = await Promise.all([
      this.prisma.aITicketResponse.findMany({
        where,
        orderBy: [
          { confidenceScore: 'asc' },
          { createdAt: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
              priority: true,
              category: true,
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.aITicketResponse.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async processDecision(decision: ReviewDecision) {
    const response = await this.prisma.aITicketResponse.findUnique({
      where: { id: decision.responseId },
    });
    if (!response) throw new NotFoundException('AI response not found');

    const newStatus = decision.approved
      ? AIResponseStatus.APPROVED
      : AIResponseStatus.REJECTED;

    const updated = await this.prisma.aITicketResponse.update({
      where: { id: decision.responseId },
      data: {
        status: newStatus,
        reviewedById: decision.reviewerId,
        reviewedAt: new Date(),
        reviewNotes: decision.notes,
        ...(decision.editedContent
          ? { generatedContent: decision.editedContent }
          : {}),
      },
    });

    if (decision.approved) {
      await this.sendApprovedResponse(updated.ticketId, updated.generatedContent);
    }

    this.logger.log(
      `Review decision: ${newStatus} for response ${decision.responseId}`,
    );

    return updated;
  }

  async bulkApprove(responseIds: string[], reviewerId: string) {
    const results = await Promise.allSettled(
      responseIds.map((id) =>
        this.processDecision({
          responseId: id,
          approved: true,
          reviewerId,
        }),
      ),
    );

    const approved = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return { approved, failed, total: responseIds.length };
  }

  async getReviewStats() {
    const [pending, approvedToday, rejectedToday, avgConfidence] =
      await Promise.all([
        this.prisma.aITicketResponse.count({
          where: { status: AIResponseStatus.PENDING },
        }),
        this.prisma.aITicketResponse.count({
          where: {
            status: AIResponseStatus.APPROVED,
            reviewedAt: { gte: this.startOfDay() },
          },
        }),
        this.prisma.aITicketResponse.count({
          where: {
            status: AIResponseStatus.REJECTED,
            reviewedAt: { gte: this.startOfDay() },
          },
        }),
        this.prisma.aITicketResponse.aggregate({
          where: { status: AIResponseStatus.PENDING },
          _avg: { confidenceScore: true },
        }),
      ]);

    return {
      pending,
      approvedToday,
      rejectedToday,
      avgConfidence: Math.round(avgConfidence._avg.confidenceScore || 0),
      approvalRate:
        approvedToday + rejectedToday > 0
          ? Math.round(
              (approvedToday / (approvedToday + rejectedToday)) * 100,
            )
          : 0,
    };
  }

  async submitFeedback(
    responseId: string,
    rating: number,
    comment?: string,
  ) {
    return this.prisma.aITicketResponse.update({
      where: { id: responseId },
      data: {
        feedbackRating: rating,
        feedbackComment: comment,
      },
    });
  }

  private async sendApprovedResponse(ticketId: string, content: string) {
    await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        type: 'AGENT',
        content,
        isInternal: false,
      },
    });

    await this.prisma.aITicketResponse.updateMany({
      where: { ticketId, status: AIResponseStatus.APPROVED, sentAt: null },
      data: { status: AIResponseStatus.SENT, sentAt: new Date() },
    });
  }

  private startOfDay(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
