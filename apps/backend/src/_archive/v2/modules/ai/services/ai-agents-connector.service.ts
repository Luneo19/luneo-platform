/**
 * Module 7 - AI Agents connector.
 * Connects Nova (customer chatbot) to Prometheus (admin ticketing).
 * Routes customer messages, returns conversation history, escalates to human.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { TicketSource } from '@prisma/client';

const ESCALATION_CONFIDENCE_THRESHOLD = 0.6;

export interface RouteCustomerQueryResult {
  handledBy: 'nova' | 'prometheus';
  confidence: number;
  response?: string;
  ticketId?: string;
  escalated: boolean;
}

export interface ConversationMessageDto {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

@Injectable()
export class AiAgentsConnectorService {
  private readonly logger = new Logger(AiAgentsConnectorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Routes a customer message to Nova or escalates to Prometheus when confidence < 0.6.
   */
  async routeCustomerQuery(
    sessionId: string,
    message: string,
  ): Promise<RouteCustomerQueryResult> {
    if (!sessionId?.trim() || !message?.trim()) {
      throw new BadRequestException('sessionId and message are required');
    }

    const conversation = await this.prisma.agentConversation.findFirst({
      where: { sessionId, agentType: 'nova' },
      orderBy: { createdAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      this.logger.warn(`No Nova conversation found for session ${sessionId}`);
      const escalated = await this.escalateToHuman(sessionId, 'New session – no conversation context');
      return {
        handledBy: 'prometheus',
        confidence: 0,
        ticketId: escalated?.id,
        escalated: true,
      };
    }

    const confidence = this.computeConfidence(message, conversation.id);
    if (confidence < ESCALATION_CONFIDENCE_THRESHOLD) {
      const ticket = await this.escalateToHuman(
        sessionId,
        `Low confidence (${confidence.toFixed(2)}) for: ${message.slice(0, 200)}`,
      );
      return {
        handledBy: 'prometheus',
        confidence,
        ticketId: ticket?.id,
        escalated: true,
      };
    }

    await this.prisma.agentMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      },
    });

    const reply = `Thank you for your message. We're here to help. (Nova response for session ${sessionId})`;
    await this.prisma.agentMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: reply,
      },
    });

    return {
      handledBy: 'nova',
      confidence,
      response: reply,
      escalated: false,
    };
  }

  /**
   * Returns conversation messages for the given session (Nova conversation).
   */
  async getConversationHistory(sessionId: string): Promise<ConversationMessageDto[]> {
    if (!sessionId?.trim()) {
      throw new BadRequestException('sessionId is required');
    }

    const conversation = await this.prisma.agentConversation.findFirst({
      where: { sessionId, agentType: 'nova' },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return [];
    }

    return conversation.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }));
  }

  /**
   * Escalates the session to human support by creating a Ticket (Prometheus).
   */
  async escalateToHuman(
    sessionId: string,
    reason: string,
  ): Promise<{ id: string; ticketNumber: string } | null> {
    if (!sessionId?.trim() || !reason?.trim()) {
      throw new BadRequestException('sessionId and reason are required');
    }

    const conversation = await this.prisma.agentConversation.findFirst({
      where: { sessionId, agentType: 'nova' },
      orderBy: { createdAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });

    const userId = conversation?.userId ?? undefined;
    const brandId = conversation?.brandId ?? undefined;
    const subject = `[Nova escalation] Session ${sessionId.slice(0, 8)}`;
    const description = [
      `Escalation reason: ${reason}`,
      conversation
        ? `Last messages:\n${conversation.messages.map((m) => `[${m.role}] ${m.content}`).join('\n')}`
        : 'No conversation history.',
    ].join('\n\n');

    const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`;

    const ticket = await this.prisma.ticket.create({
      data: {
        ticketNumber,
        subject,
        description,
        userId: userId ?? (await this.getOrCreateSystemUser()),
        source: TicketSource.CHAT,
        brandId: brandId ?? null,
        metadata: { sessionId, reason, fromNova: true },
      },
    });

    this.logger.log(`Escalated session ${sessionId} to Prometheus ticket ${ticket.ticketNumber}`);

    if (conversation) {
      await this.prisma.conversationEvent.create({
        data: {
          conversationId: conversation.id,
          type: 'escalation',
          data: { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, reason },
        },
      });
    }

    return { id: ticket.id, ticketNumber: ticket.ticketNumber };
  }

  private computeConfidence(_message: string, _conversationId: string): number {
    return 0.85;
  }

  private async getOrCreateSystemUser(): Promise<string> {
    const sys = await this.prisma.user.findFirst({
      where: { email: { contains: 'system', mode: 'insensitive' } },
      select: { id: true },
    });
    if (sys) return sys.id;
    const first = await this.prisma.user.findFirst({ select: { id: true } });
    if (first) return first.id;
    throw new NotFoundException('No user found for ticket assignment');
  }
}
