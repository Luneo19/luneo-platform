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
export class MessengerProvider implements ChannelProviderInterface {
  readonly channelType = 'FACEBOOK';
  private readonly logger = new Logger(MessengerProvider.name);

  private readonly pageToken: string;
  private readonly verifyToken: string;
  private readonly appSecret: string;

  constructor(private readonly config: ConfigService) {
    this.pageToken = this.config.get<string>('MESSENGER_PAGE_TOKEN', '');
    this.verifyToken = this.config.get<string>('MESSENGER_VERIFY_TOKEN', '');
    this.appSecret = this.config.get<string>('MESSENGER_APP_SECRET', '');
  }

  async sendMessage(
    channelConfig: Record<string, unknown>,
    recipientId: string,
    content: string,
  ): Promise<ChannelMessage> {
    const token = (channelConfig.pageToken as string) || this.pageToken;
    const url = `${GRAPH_API_BASE}/me/messages?access_token=${token}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: content },
        messaging_type: 'RESPONSE',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Messenger send failed (${response.status}): ${errorBody}`);
      throw new Error(`Messenger API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      message_id?: string;
      recipient_id?: string;
    };

    const messageId = data.message_id ?? 'unknown';
    this.logger.log(`Message envoyé via Messenger: ${messageId}`);

    return { messageId, status: 'sent' };
  }

  async handleIncoming(payload: unknown): Promise<IncomingMessage> {
    const body = payload as Record<string, unknown>;
    const entry = body.entry as Array<Record<string, unknown>> | undefined;

    if (!entry?.length) {
      throw new Error('Invalid Messenger webhook payload: missing entry');
    }

    const messaging = entry[0].messaging as
      | Array<Record<string, unknown>>
      | undefined;

    if (!messaging?.length) {
      throw new Error('Invalid Messenger webhook payload: missing messaging');
    }

    const event = messaging[0];
    const sender = event.sender as Record<string, unknown>;
    const message = event.message as Record<string, unknown> | undefined;
    const postback = event.postback as Record<string, unknown> | undefined;

    const content =
      (message?.text as string) ?? (postback?.title as string) ?? '';

    return {
      senderId: sender.id as string,
      content,
      metadata: {
        messageId: message?.mid,
        recipientId: (event.recipient as Record<string, unknown>)?.id,
        timestamp: event.timestamp,
        isPostback: !!postback,
        postbackPayload: postback?.payload,
      },
    };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    const body = payload as Record<string, unknown>;

    // Webhook verification challenge (GET from Meta)
    if (body['hub.mode'] === 'subscribe') {
      return body['hub.verify_token'] === this.verifyToken;
    }

    // X-Hub-Signature-256 validation for POST
    if (!signature || !this.appSecret) {
      return false;
    }

    const expectedSignature = createHmac('sha256', this.appSecret)
      .update(typeof payload === 'string' ? payload : JSON.stringify(payload))
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }

  isConfigured(): boolean {
    return !!(this.pageToken && this.appSecret);
  }
}
