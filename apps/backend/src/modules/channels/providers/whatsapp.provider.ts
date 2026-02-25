import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import {
  ChannelProviderInterface,
  ChannelMessage,
  IncomingMessage,
} from './channel-provider.interface';

const GRAPH_API_BASE = 'https://graph.facebook.com/v18.0';

@Injectable()
export class WhatsAppProvider implements ChannelProviderInterface {
  readonly channelType = 'WHATSAPP';
  private readonly logger = new Logger(WhatsAppProvider.name);

  private readonly phoneId: string;
  private readonly accessToken: string;
  private readonly verifyToken: string;
  private readonly appSecret: string;

  constructor(private readonly config: ConfigService) {
    this.phoneId = this.config.get<string>('WHATSAPP_PHONE_ID', '');
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN', '');
    this.verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN', '');
    this.appSecret = this.config.get<string>('WHATSAPP_APP_SECRET', '');
  }

  async sendMessage(
    channelConfig: Record<string, unknown>,
    recipientId: string,
    content: string,
  ): Promise<ChannelMessage> {
    const phoneId = (channelConfig.phoneId as string) || this.phoneId;
    const token = (channelConfig.accessToken as string) || this.accessToken;

    const url = `${GRAPH_API_BASE}/${phoneId}/messages`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientId,
        type: 'text',
        text: { preview_url: false, body: content },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`WhatsApp send failed (${response.status}): ${errorBody}`);
      throw new Error(`WhatsApp API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      messages?: Array<{ id: string }>;
    };

    const messageId = data.messages?.[0]?.id ?? 'unknown';
    this.logger.log(`Message envoyé via WhatsApp: ${messageId}`);

    return { messageId, status: 'sent' };
  }

  async handleIncoming(payload: unknown): Promise<IncomingMessage> {
    const body = payload as Record<string, unknown>;
    const entry = body.entry as Array<Record<string, unknown>> | undefined;

    if (!entry?.length) {
      throw new Error('Invalid WhatsApp webhook payload: missing entry');
    }

    const changes = entry[0].changes as Array<Record<string, unknown>> | undefined;
    if (!changes?.length) {
      throw new Error('Invalid WhatsApp webhook payload: missing changes');
    }

    const value = changes[0].value as Record<string, unknown>;
    const messages = value.messages as Array<Record<string, unknown>> | undefined;

    if (!messages?.length) {
      throw new Error('Invalid WhatsApp webhook payload: missing messages');
    }

    const message = messages[0];
    const textObj = message.text as Record<string, unknown> | undefined;

    const contacts = value.contacts as Array<Record<string, unknown>> | undefined;
    const senderName = contacts?.[0]?.profile
      ? (contacts[0].profile as Record<string, unknown>).name
      : undefined;

    return {
      senderId: message.from as string,
      content: (textObj?.body as string) ?? '',
      metadata: {
        messageId: message.id,
        timestamp: message.timestamp,
        type: message.type,
        senderName,
        phoneNumberId: (value.metadata as Record<string, unknown>)
          ?.phone_number_id,
      },
    };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    const body = payload as Record<string, unknown>;

    // Webhook verification challenge (GET request from Meta)
    if (body['hub.mode'] === 'subscribe') {
      return body['hub.verify_token'] === this.verifyToken;
    }

    // Signature validation for incoming messages (POST)
    if (!signature || !this.appSecret) {
      return false;
    }

    const expectedSignature = createHmac('sha256', this.appSecret)
      .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }

  isConfigured(): boolean {
    return !!(this.phoneId && this.accessToken);
  }
}
