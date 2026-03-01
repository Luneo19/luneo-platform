import { Injectable } from '@nestjs/common';
import { ChannelAdapterInterface, UnifiedDeliveryResult, UnifiedIncomingMessage, UnifiedOutgoingMessage } from '../channel.interface';
import { EmailOutboundService } from '../email/email-outbound.service';

@Injectable()
export class EmailAdapter implements ChannelAdapterInterface {
  readonly type = 'email' as const;

  constructor(private readonly emailOutboundService: EmailOutboundService) {}

  async normalizeIncoming(rawPayload: unknown): Promise<UnifiedIncomingMessage> {
    const payload = (rawPayload as Record<string, unknown>) ?? {};
    return {
      content: String(payload.content ?? ''),
      contentType: 'text',
      channelType: 'email',
      senderId: String(payload.senderId ?? payload.from ?? 'unknown'),
      senderEmail: payload.from ? String(payload.from) : undefined,
      timestamp: String(payload.timestamp ?? new Date().toISOString()),
      metadata: payload,
    };
  }

  async formatOutgoing(message: UnifiedOutgoingMessage): Promise<Record<string, unknown>> {
    return {
      subject: (message.metadata?.subject as string | undefined) ?? 'Luneo message',
      body: message.content,
    };
  }

  async sendMessage(
    channelConfig: Record<string, unknown>,
    recipientId: string,
    message: UnifiedOutgoingMessage,
  ): Promise<UnifiedDeliveryResult> {
    await this.emailOutboundService.sendReply({
      to: recipientId,
      from: (channelConfig.from as string) ?? 'noreply@luneo.app',
      subject: (message.metadata?.subject as string | undefined) ?? 'Message',
      body: message.content,
      agentName: (message.metadata?.agentName as string | undefined) ?? undefined,
    });
    return {
      messageId: `email-${Date.now()}`,
      status: 'queued',
      provider: 'sendgrid',
    };
  }

  verifyWebhook(): boolean {
    return true;
  }
}
