import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { MemorySummarizerService } from './memory-summarizer.service';

export interface ConversationMemory {
  messages: Array<{
    role: string;
    content: string;
    createdAt: Date;
  }>;
  summary?: string;
  context: Record<string, unknown>;
  totalMessages: number;
}

@Injectable()
export class ConversationMemoryService {
  private readonly logger = new Logger(ConversationMemoryService.name);
  private readonly MAX_MESSAGES_IN_CONTEXT = 30;
  private readonly SUMMARIZE_THRESHOLD = 40;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly summarizer: MemorySummarizerService,
  ) {}

  async getConversationMemory(conversationId: string): Promise<ConversationMemory> {
    const cacheKey = `conv-memory:${conversationId}`;

    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const conversation = await this.prisma.agentConversation.findUnique({
          where: { id: conversationId },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        if (!conversation) {
          return { messages: [], context: {}, totalMessages: 0 };
        }

        const allMessages = conversation.messages.map((m) => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        }));

        let summary: string | undefined;
        let recentMessages = allMessages;

        // If too many messages, summarize older ones
        if (allMessages.length > this.SUMMARIZE_THRESHOLD) {
          const olderMessages = allMessages.slice(0, -this.MAX_MESSAGES_IN_CONTEXT);
          recentMessages = allMessages.slice(-this.MAX_MESSAGES_IN_CONTEXT);
          summary = await this.summarizer.summarize(
            olderMessages.map((m) => ({ role: m.role, content: m.content })),
          );
        } else if (allMessages.length > this.MAX_MESSAGES_IN_CONTEXT) {
          recentMessages = allMessages.slice(-this.MAX_MESSAGES_IN_CONTEXT);
        }

        return {
          messages: recentMessages,
          summary,
          context: (conversation.context || {}) as Record<string, unknown>,
          totalMessages: allMessages.length,
        };
      },
      120, // 2 minutes cache
    );
  }

  async addMessage(
    conversationId: string,
    role: string,
    content: string,
    metadata?: {
      intent?: string;
      tokenCount?: number;
      costCents?: number;
      latencyMs?: number;
      provider?: string;
      model?: string;
      toolCalls?: unknown;
    },
  ): Promise<string> {
    const message = await this.prisma.agentMessage.create({
      data: {
        conversationId,
        role,
        content,
        intent: metadata?.intent,
        tokenCount: metadata?.tokenCount || 0,
        costCents: metadata?.costCents || 0,
        latencyMs: metadata?.latencyMs || 0,
        provider: metadata?.provider,
        model: metadata?.model,
        toolCalls: metadata?.toolCalls as unknown as Prisma.InputJsonValue,
      },
    });

    // Update conversation counters
    await this.prisma.agentConversation.update({
      where: { id: conversationId },
      data: {
        messageCount: { increment: 1 },
        totalTokens: { increment: metadata?.tokenCount || 0 },
        totalCostCents: { increment: metadata?.costCents || 0 },
      },
    });

    // Invalidate cache
    await this.cache.invalidate(`conv-memory:${conversationId}`, 'cache');

    return message.id;
  }

  async updateContext(
    conversationId: string,
    updates: Record<string, unknown>,
  ): Promise<void> {
    const conversation = await this.prisma.agentConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) return;

    const currentContext = (conversation.context || {}) as Record<string, unknown>;
    await this.prisma.agentConversation.update({
      where: { id: conversationId },
      data: {
        context: { ...currentContext, ...updates } as unknown as Prisma.InputJsonValue,
      },
    });

    await this.cache.invalidate(`conv-memory:${conversationId}`, 'cache');
  }
}
