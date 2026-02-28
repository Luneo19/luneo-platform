import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { Job } from 'bullmq';
import { JOB_TYPES, QUEUE_NAMES } from '@/libs/queues';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { MemoryService } from './memory.service';

@Processor(QUEUE_NAMES.SUMMARIZATION)
export class MemoryProcessor {
  private readonly logger = new Logger(MemoryProcessor.name);

  constructor(
    private readonly memoryService: MemoryService,
    private readonly prisma: PrismaOptimizedService,
  ) {}

  @Process(JOB_TYPES.SUMMARIZATION.SUMMARIZE_CONVERSATION)
  async summarizeConversation(job: Job<{ conversationId: string }>) {
    this.logger.log(`Summarization job started for conversation=${job.data.conversationId}`);

    const convo = await this.prisma.conversation.findUnique({
      where: { id: job.data.conversationId },
      select: { id: true, organizationId: true },
    });
    if (!convo) return { skipped: true, reason: 'conversation_not_found' };

    await this.memoryService.summarizeConversation(
      {
        id: 'system',
        email: 'system@luneo.local',
        role: PlatformRole.ADMIN,
        organizationId: convo.organizationId,
      },
      convo.id,
    );

    return { ok: true };
  }
}
