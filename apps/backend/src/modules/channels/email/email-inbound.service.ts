import { Injectable, Logger } from '@nestjs/common';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { EmailParserService, type ParsedEmail } from './email-parser.service';
import { EmailOutboundService } from './email-outbound.service';
import { OrchestratorService } from '@/modules/orchestrator/orchestrator.service';
import { ChannelType, ConversationStatus, MessageRole } from '@prisma/client';

@Injectable()
export class EmailInboundService {
  private readonly logger = new Logger(EmailInboundService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly emailParser: EmailParserService,
    private readonly emailOutbound: EmailOutboundService,
    private readonly orchestratorService: OrchestratorService,
  ) {}

  async processInboundEmail(rawPayload: Record<string, unknown>): Promise<void> {
    const parsed = this.emailParser.parse(rawPayload);
    this.logger.log(`Processing inbound email from ${parsed.from} to ${parsed.to}`);

    const channel = await this.findChannelByEmail(parsed.to);
    if (!channel) {
      this.logger.warn(`No channel found for email: ${parsed.to}`);
      return;
    }

    const conversation = await this.findOrCreateConversation(
      channel.id,
      channel.agentId,
      channel.agent.organizationId,
      parsed,
    );

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.USER,
        content: parsed.body,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { messageCount: { increment: 1 }, userMessageCount: { increment: 1 } },
    });

    this.logger.log(`Email processed for conversation ${conversation.id}`);

    try {
      const aiResult = await this.orchestratorService.executeAgent(
        channel.agentId,
        conversation.id,
        parsed.textBody || parsed.body,
      );

      const fromAddress = channel.emailFromAddress || channel.emailForwardAddress || parsed.to;

      await this.emailOutbound.sendReply({
        to: parsed.from,
        from: fromAddress,
        subject: `Re: ${parsed.subject}`,
        body: aiResult.content,
        inReplyTo: parsed.messageId,
        references: parsed.references
          ? [...parsed.references, parsed.messageId]
          : [parsed.messageId],
        agentName: channel.agent.name,
      });

      this.logger.log(
        `AI response sent for conversation ${conversation.id} (${aiResult.tokensIn}+${aiResult.tokensOut} tokens)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to generate/send AI response for conversation ${conversation.id}: ${error}`,
      );
    }
  }

  private async findChannelByEmail(toEmail: string) {
    return this.prisma.channel.findFirst({
      where: {
        type: ChannelType.EMAIL,
        status: 'ACTIVE',
        OR: [
          { emailForwardAddress: toEmail },
          { emailFromAddress: toEmail },
        ],
      },
      include: { agent: { select: { id: true, organizationId: true, name: true } } },
    });
  }

  private async findOrCreateConversation(
    channelId: string,
    agentId: string,
    organizationId: string,
    parsed: ParsedEmail,
  ) {
    if (parsed.inReplyTo) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          channelId,
          visitorEmail: parsed.from,
          status: ConversationStatus.ACTIVE,
        },
      });
      if (existing) return existing;
    }

    return this.prisma.conversation.create({
      data: {
        agentId,
        organizationId,
        channelId,
        channelType: ChannelType.EMAIL,
        status: ConversationStatus.ACTIVE,
        visitorId: parsed.from,
        visitorEmail: parsed.from,
        visitorName: parsed.fromName,
        summary: parsed.subject,
      },
    });
  }
}
