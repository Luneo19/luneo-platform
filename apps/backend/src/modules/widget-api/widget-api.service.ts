import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { OrchestratorService } from '@/modules/orchestrator/orchestrator.service';
import { QuotasService } from '@/modules/quotas/quotas.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class WidgetApiService {
  private readonly logger = new Logger(WidgetApiService.name);
  private readonly streamSubjects = new Map<string, Subject<unknown>>();

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly orchestratorService: OrchestratorService,
    private readonly quotasService: QuotasService,
  ) {}

  async getWidgetConfig(widgetId: string) {
    const channel = await this.prisma.channel.findFirst({
      where: { widgetId, deletedAt: null },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            avatar: true,
            greeting: true,
            status: true,
            tone: true,
          },
        },
      },
    });

    if (!channel || channel.deletedAt) {
      throw new NotFoundException('Widget not found');
    }
    if (channel.agent.status !== 'ACTIVE') {
      throw new BadRequestException('Agent is not active');
    }

    return {
      widgetId: channel.widgetId,
      agentName: channel.agent.name,
      agentAvatar: channel.agent.avatar,
      greeting: channel.agent.greeting || channel.widgetWelcomeMessage,
      color: channel.widgetColor,
      secondaryColor: channel.widgetSecondaryColor,
      position: channel.widgetPosition,
      size: channel.widgetSize,
      theme: channel.widgetTheme,
      placeholder: channel.widgetPlaceholder,
      brandName: channel.widgetBrandName,
      showOnMobile: channel.widgetShowOnMobile,
      showOnDesktop: channel.widgetShowOnDesktop,
      language: channel.widgetLanguage,
    };
  }

  async startConversation(
    dto: StartConversationDto,
    context: { origin: string; ip: string; userAgent: string },
  ) {
    const channel = await this.prisma.channel.findFirst({
      where: { widgetId: dto.widgetId, deletedAt: null },
      include: { agent: true },
    });

    if (!channel) {
      throw new NotFoundException('Widget not found');
    }

    await this.quotasService.enforceQuota(channel.agent.organizationId, 'conversations');

    // Validate origin against allowed domains
    const allowedOrigins = channel.widgetAllowedOrigins ?? [];
    if (allowedOrigins.length > 0 && context.origin) {
      const allowed = allowedOrigins.some((domain: string) => {
        if (domain.startsWith('*.')) {
          return context.origin.endsWith(domain.slice(1));
        }
        return context.origin.includes(domain);
      });
      if (!allowed) {
        throw new BadRequestException('Origin not allowed');
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        organizationId: channel.agent.organizationId,
        agentId: channel.agent.id,
        channelId: channel.id,
        channelType: 'WIDGET',
        visitorId: dto.visitorId || `visitor_${Date.now()}`,
        visitorEmail: dto.visitorEmail,
        visitorName: dto.visitorName,
        visitorIp: context.ip,
        visitorUserAgent: context.userAgent,
      },
    });

    // Send greeting as first message if exists
    const greeting = channel.agent.greeting || channel.widgetWelcomeMessage;
    if (greeting) {
      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: greeting,
        },
      });
    }

    // Increment conversation counters
    await this.prisma.organization.update({
      where: { id: channel.agent.organizationId },
      data: { conversationsUsed: { increment: 1 } },
    });
    await this.prisma.agent.update({
      where: { id: channel.agent.id },
      data: { totalConversations: { increment: 1 } },
    });
    await this.prisma.channel.update({
      where: { id: channel.id },
      data: { totalConversations: { increment: 1 } },
    });

    return {
      conversationId: conversation.id,
      greeting,
    };
  }

  async sendMessage(conversationId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { agent: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (conversation.status === 'CLOSED' || conversation.status === 'SPAM') {
      throw new BadRequestException('Conversation is closed');
    }

    // Save user message
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'USER',
        content: dto.content,
      },
    });

    // Update conversation counters
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        messageCount: { increment: 1 },
        userMessageCount: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    // Execute agent (RAG + LLM)
    try {
      const result = await this.orchestratorService.executeAgent(
        conversation.agentId,
        conversationId,
        dto.content,
      );

      const sources = (result.sources ?? []).map((s) => ({
        title: s.documentTitle,
        score: s.score,
      }));

      const responseMessage = {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: result.content,
        sources,
        createdAt: new Date().toISOString(),
      };

      this.emitToStream(conversationId, { type: 'message', message: responseMessage });

      return {
        message: responseMessage,
        usage: {
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        },
      };
    } catch (error) {
      this.logger.error(
        `Agent execution failed for conversation ${conversationId}`,
        error,
      );

      const fallback =
        conversation.agent.fallbackMessage ||
        'Désolé, je rencontre une difficulté technique. Veuillez réessayer.';

      await this.prisma.message.create({
        data: {
          conversationId,
          role: 'ASSISTANT',
          content: fallback,
        },
      });

      const responseMessage = {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: fallback,
        sources: [],
        createdAt: new Date().toISOString(),
      };

      this.emitToStream(conversationId, { type: 'message', message: responseMessage });

      return {
        message: responseMessage,
      };
    }
  }

  async getMessages(conversationId: string, after?: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const where: { conversationId: string; deletedAt: null; createdAt?: { gt: Date } } = {
      conversationId,
      deletedAt: null,
    };
    if (after) {
      where.createdAt = { gt: new Date(after) };
    }

    const messages = await this.prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: {
        id: true,
        role: true,
        content: true,
        contentType: true,
        sourcesUsed: true,
        createdAt: true,
      },
    });

    return { messages };
  }

  getStream(conversationId: string): Observable<MessageEvent> {
    if (!this.streamSubjects.has(conversationId)) {
      this.streamSubjects.set(conversationId, new Subject<unknown>());
    }
    const subject = this.streamSubjects.get(conversationId)!;

    return new Observable<MessageEvent>((observer) => {
      let subscription: { unsubscribe: () => void } | null = null;

      this.prisma.conversation
        .findUnique({ where: { id: conversationId } })
        .then((conv) => {
          if (!conv) {
            observer.error(new NotFoundException('Conversation not found'));
            return;
          }

          observer.next({
            data: JSON.stringify({ type: 'connected', conversationId }),
          } as MessageEvent);

          subscription = subject
            .pipe(
              map((event) => ({
                data: typeof event === 'string' ? event : JSON.stringify(event),
              })),
            )
            .subscribe({
              next: (ev) => observer.next(ev as MessageEvent),
              error: (err) => observer.error(err),
            });
        })
        .catch((err) => observer.error(err));

      return () => {
        subscription?.unsubscribe();
        this.streamSubjects.delete(conversationId);
      };
    });
  }

  private emitToStream(conversationId: string, event: unknown): void {
    const subject = this.streamSubjects.get(conversationId);
    if (subject) {
      subject.next(event);
    }
  }
}
