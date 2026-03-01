export type UnifiedContentType =
  | 'text'
  | 'image'
  | 'file'
  | 'audio'
  | 'quick_reply';

export type UnifiedChannelType =
  | 'webchat'
  | 'whatsapp'
  | 'instagram'
  | 'email'
  | 'sms'
  | 'voice';

export interface UnifiedIncomingMessage {
  content: string;
  contentType: UnifiedContentType;
  channelType: UnifiedChannelType;
  senderId: string;
  senderName?: string;
  senderPhone?: string;
  senderEmail?: string;
  channelConversationId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  attachments?: Array<Record<string, unknown>>;
}

export interface UnifiedOutgoingMessage {
  content: string;
  contentType: UnifiedContentType;
  metadata?: Record<string, unknown>;
}

export interface UnifiedDeliveryResult {
  messageId: string;
  status: 'queued' | 'sent' | 'failed';
  provider?: string;
  error?: string;
}

export interface ChannelAdapterInterface {
  readonly type: UnifiedChannelType;
  normalizeIncoming(rawPayload: unknown): Promise<UnifiedIncomingMessage>;
  formatOutgoing(message: UnifiedOutgoingMessage): Promise<Record<string, unknown>>;
  sendMessage(
    channelConfig: Record<string, unknown>,
    recipientId: string,
    message: UnifiedOutgoingMessage,
  ): Promise<UnifiedDeliveryResult>;
  verifyWebhook(headers: Record<string, string | undefined>, body: unknown): boolean;
}
