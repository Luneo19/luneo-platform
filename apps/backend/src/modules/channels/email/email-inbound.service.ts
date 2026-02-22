import { Injectable, Logger } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { EmailParserService, type ParsedEmail } from './email-parser.service';
import { EmailOutboundService } from './email-outbound.service';
import { ChannelType, ConversationStatus, MessageRole } from '@prisma/client';

@Injectable()
export class EmailInboundService {
  private readonly logger = new Logger(EmailInboundService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly emailParser: EmailParserService,
    private readonly emailOutbound: EmailOutboundService,
  ) {}

  async processInboundEmail(rawPayload: Record<string, unknown>): Promise<void> {
    const parsed = this.emailParser.parse(rawPayload);
    this.logger.log(`Processing inbound email from ${parsed.from} to ${parsed.to}`);

    const channel = await this.findChannelByEmail(parsed.to);
    if (!channel) {
      this.logger.warn(`No channel found for email: ${parsed.to}`);
      return;
    }

    const conversation = await this.findOrCreateConversation(channel.id, channel.agentId, parsed);

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.USER,
        content: parsed.body,
        metadata: {
          emailFrom: parsed.from,
          emailSubject: parsed.subject,
          emailMessageId: parsed.messageId,
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { messageCount: { increment: 1 }, lastMessageAt: new Date() },
    });

    // TODO: Integrate with OrchestratorService to generate AI response
    // For now, log that processing is complete
    this.logger.log(`Email processed for conversation ${conversation.id}`);
  }

  private async findChannelByEmail(toEmail: string) {
    const localPart = toEmail.split('@')[0];
    return this.prisma.channel.findFirst({
      where: {
        type: ChannelType.EMAIL,
        status: 'ACTIVE',
        OR: [
          { config: { path: ['email'], equals: toEmail } },
          { config: { path: ['localPart'], equals: localPart } },
        ],
      },
      include: { agent: { select: { id: true, organizationId: true } } },
    });
  }

  private async findOrCreateConversation(
    channelId: string,
    agentId: string,
    parsed: ParsedEmail,
  ) {
    if (parsed.inReplyTo) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          channelId,
          metadata: { path: ['emailThreadId'], equals: parsed.inReplyTo },
        },
      });
      if (existing) return existing;
    }

    return this.prisma.conversation.create({
      data: {
        agentId,
        channelId,
        channelType: ChannelType.EMAIL,
        status: ConversationStatus.ACTIVE,
        visitorId: parsed.from,
        visitorName: parsed.fromName,
        metadata: {
          emailThreadId: parsed.messageId,
          emailSubject: parsed.subject,
        },
      },
    });
  }
}
