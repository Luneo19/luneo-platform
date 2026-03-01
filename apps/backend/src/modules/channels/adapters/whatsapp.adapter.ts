import { Injectable } from '@nestjs/common';
import { ChannelAdapterInterface, UnifiedDeliveryResult, UnifiedIncomingMessage, UnifiedOutgoingMessage } from '../channel.interface';
import { WhatsAppProvider } from '../providers/whatsapp.provider';

@Injectable()
export class WhatsAppAdapter implements ChannelAdapterInterface {
  readonly type = 'whatsapp' as const;

  constructor(private readonly provider: WhatsAppProvider) {}

  async normalizeIncoming(rawPayload: unknown): Promise<UnifiedIncomingMessage> {
    const incoming = await this.provider.handleIncoming(rawPayload);
    return {
      content: incoming.content,
      contentType: 'text',
      channelType: 'whatsapp',
      senderId: incoming.senderId,
      senderName: (incoming.metadata?.senderName as string | undefined) ?? undefined,
      timestamp: new Date().toISOString(),
      metadata: incoming.metadata,
    };
  }

  async formatOutgoing(message: UnifiedOutgoingMessage): Promise<Record<string, unknown>> {
    return { type: message.contentType, content: message.content, metadata: message.metadata };
  }

  async sendMessage(
    channelConfig: Record<string, unknown>,
    recipientId: string,
    message: UnifiedOutgoingMessage,
  ): Promise<UnifiedDeliveryResult> {
    const result = await this.provider.sendMessage(channelConfig, recipientId, message.content);
    return { messageId: result.messageId, status: result.status as 'sent' };
  }

  verifyWebhook(headers: Record<string, string | undefined>, body: unknown): boolean {
    return this.provider.verifyWebhook(body, headers['x-hub-signature-256']);
  }
}
