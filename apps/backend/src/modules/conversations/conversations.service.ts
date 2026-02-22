// @ts-nocheck
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ConversationStatus, Prisma } from '@prisma/client';
import { CurrentUser } from '@/common/types/user.types';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private prisma: PrismaOptimizedService,
    private cache: SmartCacheService,
  ) {}

  async getInbox(query: ConversationQueryDto, user: CurrentUser) {
    const { status, agentId, search, cursor, limit = 20 } = query;
    const orgId = user.organizationId;

    if (!orgId) {
      throw new BadRequestException('Organisation requise');
    }

    const where: Prisma.ConversationWhereInput = {
      organizationId: orgId,
      deletedAt: null,
      ...(status && { status }),
      ...(agentId && { agentId }),
      ...(search && {
        OR: [
          { visitorName: { contains: search, mode: 'insensitive' as const } },
          { visitorEmail: { contains: search, mode: 'insensitive' as const } },
          { summary: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const take = limit + 1;

    const conversations = await this.prisma.conversation.findMany({
      where,
      take,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: { updatedAt: 'desc' },
      include: {
        agent: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
    });

    const hasMore = conversations.length > limit;
    const items = hasMore ? conversations.slice(0, limit) : conversations;
    const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  async getById(id: string, user: CurrentUser) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
      include: {
        agent: { select: { id: true, name: true, status: true } },
        channel: { select: { id: true, type: true, status: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            contentType: true,
            attachments: true,
            tokensIn: true,
            tokensOut: true,
            confidence: true,
            sourcesUsed: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} introuvable`);
    }

    return conversation;
  }

  async create(dto: CreateConversationDto, user: CurrentUser) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }

    const agent = await this.prisma.agent.findFirst({
      where: { id: dto.agentId, organizationId: user.organizationId },
    });

    if (!agent) {
      throw new NotFoundException(`Agent ${dto.agentId} introuvable`);
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        organizationId: user.organizationId,
        agentId: dto.agentId,
        channelId: dto.channelId,
        channelType: dto.channelType,
        visitorId: dto.visitorId,
        visitorEmail: dto.visitorEmail,
        visitorName: dto.visitorName,
        language: dto.language,
        tags: dto.tags ?? [],
        status: ConversationStatus.ACTIVE,
      },
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    await this.cache.invalidate(`conversations:${user.organizationId}`, 'brand');
    this.logger.log(`Conversation ${conversation.id} créée pour org ${user.organizationId}`);

    return conversation;
  }

  async update(id: string, dto: UpdateConversationDto, user: CurrentUser) {
    const conversation = await this.ensureConversationAccess(id, user);

    const updated = await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.agentId && { agentId: dto.agentId }),
        ...(dto.summary !== undefined && { summary: dto.summary }),
        ...(dto.sentiment !== undefined && { sentiment: dto.sentiment }),
        ...(dto.satisfactionRating !== undefined && { satisfactionRating: dto.satisfactionRating }),
        ...(dto.tags && { tags: dto.tags }),
      },
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    await this.cache.invalidate(`conversations:${user.organizationId}`, 'brand');
    return updated;
  }

  async addMessage(conversationId: string, dto: AddMessageDto, user: CurrentUser) {
    const conversation = await this.ensureConversationAccess(conversationId, user);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: dto.role,
          content: dto.content,
          contentType: dto.contentType ?? 'text',
          attachments: dto.attachments ?? undefined,
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { messageCount: { increment: 1 } },
      }),
    ]);

    await this.cache.invalidate(`conversations:${user.organizationId}`, 'brand');
    return message;
  }

  async escalate(id: string, user: CurrentUser) {
    const conversation = await this.ensureConversationAccess(id, user);

    if (conversation.status === ConversationStatus.ESCALATED) {
      throw new BadRequestException('Conversation déjà escaladée');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: ConversationStatus.ESCALATED,
        escalatedAt: new Date(),
      },
    });

    await this.cache.invalidate(`conversations:${user.organizationId}`, 'brand');
    this.logger.log(`Conversation ${id} escaladée`);

    return updated;
  }

  async resolve(id: string, user: CurrentUser) {
    const conversation = await this.ensureConversationAccess(id, user);

    if (conversation.status === ConversationStatus.RESOLVED) {
      throw new BadRequestException('Conversation déjà résolue');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        status: ConversationStatus.RESOLVED,
        resolvedAt: new Date(),
        resolvedBy: 'HUMAN',
      },
    });

    await this.cache.invalidate(`conversations:${user.organizationId}`, 'brand');
    this.logger.log(`Conversation ${id} résolue`);

    return updated;
  }

  async getStats(user: CurrentUser) {
    if (!user.organizationId) {
      throw new BadRequestException('Organisation requise');
    }

    const cacheKey = `conversation-stats:${user.organizationId}`;

    return this.cache.getOrSet(cacheKey, async () => {
      const [total, active, escalated, resolved, avgSatisfaction] =
        await Promise.all([
          this.prisma.conversation.count({
            where: { organizationId: user.organizationId, deletedAt: null },
          }),
          this.prisma.conversation.count({
            where: { organizationId: user.organizationId, status: ConversationStatus.ACTIVE, deletedAt: null },
          }),
          this.prisma.conversation.count({
            where: { organizationId: user.organizationId, status: ConversationStatus.ESCALATED, deletedAt: null },
          }),
          this.prisma.conversation.count({
            where: { organizationId: user.organizationId, status: ConversationStatus.RESOLVED, deletedAt: null },
          }),
          this.prisma.conversation.aggregate({
            where: { organizationId: user.organizationId, satisfactionRating: { not: null }, deletedAt: null },
            _avg: { satisfactionRating: true },
          }),
        ]);

      return {
        total,
        active,
        escalated,
        resolved,
        avgSatisfaction: avgSatisfaction._avg.satisfactionRating ?? null,
      };
    }, 300);
  }

  private async ensureConversationAccess(id: string, user: CurrentUser) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation ${id} introuvable`);
    }

    return conversation;
  }
}
