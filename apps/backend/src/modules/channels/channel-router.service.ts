import { Injectable, Logger } from '@nestjs/common';
import {
  ChannelProviderInterface,
  ChannelMessage,
  IncomingMessage,
  WhatsAppProvider,
  TelegramProvider,
  MessengerProvider,
  SmsProvider,
  SlackProvider,
} from './providers';

@Injectable()
export class ChannelRouterService {
  private readonly logger = new Logger(ChannelRouterService.name);
  private readonly providerMap: Map<string, ChannelProviderInterface>;

  constructor(
    private readonly whatsapp: WhatsAppProvider,
    private readonly telegram: TelegramProvider,
    private readonly messenger: MessengerProvider,
    private readonly sms: SmsProvider,
    private readonly slack: SlackProvider,
  ) {
    this.providerMap = new Map<string, ChannelProviderInterface>([
      [this.whatsapp.channelType, this.whatsapp],
      [this.telegram.channelType, this.telegram],
      [this.messenger.channelType, this.messenger],
      [this.sms.channelType, this.sms],
      [this.slack.channelType, this.slack],
    ]);
  }

  getProvider(channelType: string): ChannelProviderInterface | undefined {
    return this.providerMap.get(channelType.toUpperCase());
  }

  getConfiguredProviders(): string[] {
    return Array.from(this.providerMap.entries())
      .filter(([, provider]) => provider.isConfigured())
      .map(([type]) => type);
  }

  async routeOutgoing(
    channelType: string,
    channelConfig: Record<string, unknown>,
    recipientId: string,
    content: string,
  ): Promise<ChannelMessage> {
    const provider = this.resolveProvider(channelType);

    this.logger.log(
      `Routing outgoing message via ${channelType} to ${recipientId}`,
    );

    try {
      const result = await provider.sendMessage(
        channelConfig,
        recipientId,
        content,
      );

      this.logger.log(
        `Message sent via ${channelType}: ${result.messageId} (${result.status})`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to send message via ${channelType}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async routeIncoming(
    channelType: string,
    payload: unknown,
    signature?: string,
  ): Promise<IncomingMessage> {
    const provider = this.resolveProvider(channelType);

    if (!provider.verifyWebhook(payload, signature)) {
      this.logger.warn(`Webhook verification failed for ${channelType}`);
      throw new Error(`Webhook verification failed for ${channelType}`);
    }

    this.logger.log(`Routing incoming message from ${channelType}`);

    try {
      const message = await provider.handleIncoming(payload);

      this.logger.log(
        `Incoming message from ${channelType}, sender: ${message.senderId}`,
      );

      return message;
    } catch (error) {
      this.logger.error(
        `Failed to parse incoming ${channelType} message: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  verifyWebhook(
    channelType: string,
    payload: unknown,
    signature?: string,
  ): boolean {
    const provider = this.getProvider(channelType);
    if (!provider) {
      return false;
    }
    return provider.verifyWebhook(payload, signature);
  }

  private resolveProvider(channelType: string): ChannelProviderInterface {
    const provider = this.getProvider(channelType);

    if (!provider) {
      throw new Error(
        `No provider registered for channel type: ${channelType}`,
      );
    }

    if (!provider.isConfigured()) {
      this.logger.warn(
        `Provider for ${channelType} is registered but not fully configured`,
      );
    }

    return provider;
  }
}
