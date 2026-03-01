export interface ChannelMessage {
  messageId: string;
  status: string;
}

export interface IncomingMessage {
  senderId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelProviderInterface {
  readonly channelType: string;

  sendMessage(
    channelConfig: Record<string, unknown>,
    recipientId: string,
    content: string,
  ): Promise<ChannelMessage>;

  handleIncoming(payload: unknown): Promise<IncomingMessage>;

  verifyWebhook(payload: unknown, signature?: string): boolean;

  isConfigured(): boolean;
}
