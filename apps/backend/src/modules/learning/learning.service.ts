import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { KnowledgeGapStatus, LearningSignalType, Prisma, VerticalInsightType } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { CreateLearningSignalDto } from './dto/create-learning-signal.dto';
import { LearningGapQueryDto } from './dto/learning-gap-query.dto';

@Injectable()
export class LearningService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  private normalizeQuestion(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 300);
  }

  async recordSignal(user: CurrentUser, dto: CreateLearningSignalDto) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: dto.conversationId, organizationId: user.organizationId },
      select: { id: true, organizationId: true },
    });
    if (!conversation) throw new NotFoundException('Conversation introuvable');

    const signal = await this.prisma.learningSignal.create({
      data: {
        organizationId: user.organizationId,
        conversationId: dto.conversationId,
        messageId: dto.messageId,
        signalType: dto.signalType,
        data: dto.data as Prisma.InputJsonValue | undefined,
      },
    });

    if (dto.signalType === LearningSignalType.KNOWLEDGE_GAP) {
      const question = String(dto.data?.question ?? '').trim();
      if (question.length > 0) {
        const normalizedQuestion = this.normalizeQuestion(question);

        const existing = await this.prisma.knowledgeGap.findFirst({
          where: { organizationId: user.organizationId, normalizedQuestion },
        });

        if (existing) {
          await this.prisma.knowledgeGap.update({
            where: { id: existing.id },
            data: {
              frequency: { increment: 1 },
              suggestedAnswer: (dto.data?.suggestedAnswer as string | undefined) ?? existing.suggestedAnswer ?? undefined,
              category: (dto.data?.category as string | undefined) ?? existing.category ?? undefined,
            },
          });
        } else {
          await this.prisma.knowledgeGap.create({
            data: {
              organizationId: user.organizationId,
              question,
              normalizedQuestion,
              category: dto.data?.category as string | undefined,
              suggestedAnswer: dto.data?.suggestedAnswer as string | undefined,
            },
          });
        }
      }
    }

    return signal;
  }

  async listGaps(user: CurrentUser, query: LearningGapQueryDto) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.KnowledgeGapWhereInput = {
      organizationId: user.organizationId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.knowledgeGap.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ frequency: 'desc' }, { updatedAt: 'desc' }],
      }),
      this.prisma.knowledgeGap.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveGap(user: CurrentUser, gapId: string) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');

    const gap = await this.prisma.knowledgeGap.findFirst({
      where: { id: gapId, organizationId: user.organizationId },
    });
    if (!gap) throw new NotFoundException('Knowledge gap introuvable');

    return this.prisma.knowledgeGap.update({
      where: { id: gap.id },
      data: {
        status: KnowledgeGapStatus.APPROVED,
        approvedBy: user.id,
      },
    });
  }

  async analyzeUnprocessedSignals(limit = 200) {
    const signals = await this.prisma.learningSignal.findMany({
      where: { processed: false },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: {
        id: true,
        organizationId: true,
        signalType: true,
        data: true,
      },
    });

    let processed = 0;
    for (const signal of signals) {
      if (signal.signalType === LearningSignalType.KNOWLEDGE_GAP) {
        const question = String((signal.data as Record<string, unknown> | null)?.question ?? '').trim();
        if (question) {
          const normalizedQuestion = this.normalizeQuestion(question);
          const existing = await this.prisma.knowledgeGap.findFirst({
            where: { organizationId: signal.organizationId, normalizedQuestion },
          });
          if (existing) {
            await this.prisma.knowledgeGap.update({
              where: { id: existing.id },
              data: { frequency: { increment: 1 } },
            });
          } else {
            await this.prisma.knowledgeGap.create({
              data: {
                organizationId: signal.organizationId,
                question,
                normalizedQuestion,
              },
            });
          }
        }
      }

      await this.prisma.learningSignal.update({
        where: { id: signal.id },
        data: { processed: true, processedAt: new Date() },
      });
      processed++;
    }

    return { scanned: signals.length, processed };
  }

  async aggregateVerticalInsights() {
    const organizations = await this.prisma.organization.findMany({
      where: { verticalTemplateId: { not: null }, status: 'ACTIVE' },
      select: { id: true, verticalTemplateId: true },
    });

    const byVertical = new Map<string, string[]>();
    for (const org of organizations) {
      const key = org.verticalTemplateId!;
      const list = byVertical.get(key) ?? [];
      list.push(org.id);
      byVertical.set(key, list);
    }

    const created: Array<{ verticalTemplateId: string; organizations: number; topGap?: string }> = [];
    for (const [verticalTemplateId, orgIds] of byVertical.entries()) {
      const topGap = await this.prisma.knowledgeGap.findFirst({
        where: { organizationId: { in: orgIds } },
        orderBy: { frequency: 'desc' },
        select: { question: true, frequency: true },
      });

      const payload = {
        organizations: orgIds.length,
        topGap: topGap?.question ?? null,
        frequency: topGap?.frequency ?? 0,
        generatedAt: new Date().toISOString(),
      };

      await this.prisma.verticalInsight.create({
        data: {
          verticalTemplateId,
          insightType: VerticalInsightType.COMMON_GAP,
          data: payload as Prisma.InputJsonValue,
        },
      });

      created.push({
        verticalTemplateId,
        organizations: orgIds.length,
        topGap: topGap?.question,
      });
    }

    return { verticals: created.length, created };
  }
}
