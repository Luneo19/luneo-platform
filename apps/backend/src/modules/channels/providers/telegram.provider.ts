import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac } from 'crypto';
import {
  ChannelProviderInterface,
  ChannelMessage,
  IncomingMessage,
} from './channel-provider.interface';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

@Injectable()
export class TelegramProvider implements ChannelProviderInterface {
  readonly channelType = 'TELEGRAM';
  private readonly logger = new Logger(TelegramProvider.name);

  private readonly botToken: string;
  private readonly secretToken: string;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN', '');
    this.secretToken = this.config.get<string>('TELEGRAM_SECRET_TOKEN', '');
  }

  async sendMessage(
    channelConfig: Record<string, unknown>,
    recipientId: string,
    content: string,
  ): Promise<ChannelMessage> {
    const token = (channelConfig.botToken as string) || this.botToken;
    const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: recipientId,
        text: content,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Telegram send failed (${response.status}): ${errorBody}`);
      throw new Error(`Telegram API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      ok: boolean;
      result?: { message_id: number };
    };

    if (!data.ok || !data.result) {
      throw new Error('Telegram API returned unsuccessful response');
    }

    const messageId = String(data.result.message_id);
    this.logger.log(`Message envoyé via Telegram: ${messageId}`);

    return { messageId, status: 'sent' };
  }

  async handleIncoming(payload: unknown): Promise<IncomingMessage> {
    const update = payload as Record<string, unknown>;
    const message = update.message as Record<string, unknown> | undefined;

    if (!message) {
      throw new Error('Invalid Telegram webhook payload: missing message');
    }

    const from = message.from as Record<string, unknown> | undefined;
    const chat = message.chat as Record<string, unknown> | undefined;

    return {
      senderId: String(from?.id ?? chat?.id ?? 'unknown'),
      content: (message.text as string) ?? '',
      metadata: {
        messageId: message.message_id,
        updateId: update.update_id,
        chatId: chat?.id,
        chatType: chat?.type,
        firstName: from?.first_name,
        lastName: from?.last_name,
        username: from?.username,
        date: message.date,
      },
    };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    if (!this.secretToken) {
      return true;
    }

    // Telegram uses X-Telegram-Bot-Api-Secret-Token header
    return signature === this.secretToken;
  }

  isConfigured(): boolean {
    return !!this.botToken;
  }
}
