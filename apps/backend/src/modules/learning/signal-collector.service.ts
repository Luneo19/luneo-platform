import { Injectable } from '@nestjs/common';
import { LearningSignalType, Prisma } from '@prisma/client';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';

@Injectable()
export class SignalCollectorService {
  constructor(private readonly prisma: PrismaOptimizedService) {}

  async collect(input: {
    organizationId: string;
    conversationId: string;
    signalType: LearningSignalType;
    messageId?: string;
    data?: Record<string, unknown>;
  }) {
    return this.prisma.learningSignal.create({
      data: {
        organizationId: input.organizationId,
        conversationId: input.conversationId,
        messageId: input.messageId,
        signalType: input.signalType,
        data: input.data as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
