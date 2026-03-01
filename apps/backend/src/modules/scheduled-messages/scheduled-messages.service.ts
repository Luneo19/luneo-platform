import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ScheduledMessageCreatedBy,
  ScheduledMessageStatus,
} from '@prisma/client';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { DistributedLockService } from '@/libs/redis/distributed-lock.service';
import { CurrentUser } from '@/common/types/user.types';
import { CreateScheduledMessageDto } from './dto/create-scheduled-message.dto';

@Injectable()
export class ScheduledMessagesService {
  private readonly logger = new Logger(ScheduledMessagesService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly distributedLock: DistributedLockService,
  ) {}

  async create(user: CurrentUser, dto: CreateScheduledMessageDto) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    if (!dto.conversationId) {
      throw new BadRequestException(
        'conversationId requis (contact-only non supporte pour le moment)',
      );
    }
    if (dto.contactId && !dto.conversationId) {
      throw new BadRequestException('contactId seul n est pas supporte');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('scheduledAt invalide');
    }
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('scheduledAt doit etre dans le futur');
    }

    if (dto.conversationId) {
      const exists = await this.prisma.conversation.findFirst({
        where: { id: dto.conversationId, organizationId: user.organizationId },
        select: { id: true },
      });
      if (!exists) throw new NotFoundException('Conversation introuvable');
    }
    return this.prisma.scheduledMessage.create({
      data: {
        organizationId: user.organizationId,
        conversationId: dto.conversationId,
        contactId: dto.contactId,
        channelType: dto.channelType,
        content: dto.content.trim(),
        scheduledAt,
        createdBy: dto.createdBy ?? ScheduledMessageCreatedBy.HUMAN,
        status: ScheduledMessageStatus.SCHEDULED,
      },
    });
  }

  async list(user: CurrentUser, limit = 50) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    return this.prisma.scheduledMessage.findMany({
      where: { organizationId: user.organizationId },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'desc' }],
      take: Math.max(1, Math.min(limit, 200)),
    });
  }

  async cancel(user: CurrentUser, id: string) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    const msg = await this.prisma.scheduledMessage.findFirst({
      where: { id, organizationId: user.organizationId },
      select: { id: true, status: true, sentAt: true, cancelledAt: true },
    });
    if (!msg) throw new NotFoundException('Message planifie introuvable');
    if (msg.status === ScheduledMessageStatus.SENT || msg.sentAt) {
      throw new BadRequestException('Message deja envoye');
    }

    return this.prisma.scheduledMessage.update({
      where: { id: msg.id },
      data: {
        status: ScheduledMessageStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  async processDueBatch(now = new Date(), take = 100) {
    const batchLockKey = 'scheduled-messages:process-due';
    const batchLockAcquired = await this.distributedLock.acquire(
      batchLockKey,
      55,
      false,
    );
    if (!batchLockAcquired) {
      this.logger.debug('Scheduled messages batch skipped: lock already held');
      return { scanned: 0, sent: 0, failed: 0 };
    }

    try {
      const due = await this.prisma.scheduledMessage.findMany({
        where: {
          status: ScheduledMessageStatus.SCHEDULED,
          scheduledAt: { lte: now },
          cancelledAt: null,
        },
        orderBy: { scheduledAt: 'asc' },
        take,
      });

      let sent = 0;
      let failed = 0;

      for (const item of due) {
        try {
          await this.processSingle(item.id);
          sent += 1;
        } catch {
          failed += 1;
        }
      }

      return { scanned: due.length, sent, failed };
    } finally {
      await this.distributedLock.release(batchLockKey);
    }
  }

  private async processSingle(id: string) {
    const itemLockKey = `scheduled-messages:item:${id}`;
    const itemLockAcquired = await this.distributedLock.acquire(
      itemLockKey,
      120,
      false,
    );
    if (!itemLockAcquired) {
      return;
    }

    try {
      const item = await this.prisma.scheduledMessage.findUnique({
        where: { id },
        include: { conversation: true },
      });
      if (!item) return;
      if (item.status !== ScheduledMessageStatus.SCHEDULED || item.cancelledAt) return;

      if (item.conversationId) {
        await this.prisma.$transaction(async (tx) => {
          await tx.message.create({
            data: {
              conversationId: item.conversationId!,
              role: 'ASSISTANT',
              content: item.content,
              contentType: 'text',
            },
          });

          await tx.conversation.update({
            where: { id: item.conversationId! },
            data: {
              messageCount: { increment: 1 },
              agentMessageCount: { increment: 1 },
              updatedAt: new Date(),
            },
          });

          await tx.scheduledMessage.update({
            where: { id: item.id },
            data: {
              status: ScheduledMessageStatus.SENT,
              sentAt: new Date(),
            },
          });
        });
      } else {
        await this.prisma.scheduledMessage.update({
          where: { id: item.id },
          data: {
            status: ScheduledMessageStatus.SENT,
            sentAt: new Date(),
          },
        });
      }
    } catch (error) {
      const scheduledMessage = await this.prisma.scheduledMessage.findUnique({
        where: { id },
        select: { id: true, organizationId: true, content: true },
      });
      if (!scheduledMessage) {
        throw error;
      }

      await this.prisma.scheduledMessage.update({
        where: { id: scheduledMessage.id },
        data: { status: ScheduledMessageStatus.FAILED },
      });
      await this.prisma.failedJob.create({
        data: {
          organizationId: scheduledMessage.organizationId,
          queue: 'scheduled_messages',
          jobId: scheduledMessage.id,
          data: {
            scheduledMessageId: scheduledMessage.id,
            content: scheduledMessage.content.slice(0, 500),
          } as Prisma.InputJsonValue,
          error: error instanceof Error ? error.message : String(error),
          attempts: 1,
        },
      });
      throw error;
    } finally {
      await this.distributedLock.release(itemLockKey);
    }
  }
}
