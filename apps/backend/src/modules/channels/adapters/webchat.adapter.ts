import { Injectable } from '@nestjs/common';
import { ChannelAdapterInterface, UnifiedDeliveryResult, UnifiedIncomingMessage, UnifiedOutgoingMessage } from '../channel.interface';

@Injectable()
export class WebchatAdapter implements ChannelAdapterInterface {
  readonly type = 'webchat' as const;

  async normalizeIncoming(rawPayload: unknown): Promise<UnifiedIncomingMessage> {
    const payload = (rawPayload as Record<string, unknown>) ?? {};
    return {
      content: String(payload.content ?? ''),
      contentType: (payload.contentType as 'text' | 'image' | 'file' | 'audio' | 'quick_reply') ?? 'text',
      channelType: 'webchat',
      senderId: String(payload.senderId ?? payload.visitorId ?? 'visitor'),
      senderName: payload.senderName ? String(payload.senderName) : undefined,
      senderEmail: payload.senderEmail ? String(payload.senderEmail) : undefined,
      channelConversationId: payload.channelConversationId ? String(payload.channelConversationId) : undefined,
      timestamp: String(payload.timestamp ?? new Date().toISOString()),
      metadata: payload.metadata as Record<string, unknown> | undefined,
      attachments: (payload.attachments as Array<Record<string, unknown>> | undefined) ?? [],
    };
  }

  async formatOutgoing(message: UnifiedOutgoingMessage): Promise<Record<string, unknown>> {
    return {
      content: message.content,
      contentType: message.contentType,
      metadata: message.metadata ?? {},
    };
  }

  async sendMessage(
    _channelConfig: Record<string, unknown>,
    _recipientId: string,
    _message: UnifiedOutgoingMessage,
  ): Promise<UnifiedDeliveryResult> {
    return {
      messageId: `webchat-${Date.now()}`,
      status: 'sent',
      provider: 'internal',
    };
  }

  verifyWebhook(): boolean {
    return true;
  }
}
