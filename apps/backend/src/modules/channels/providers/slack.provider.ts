import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  ChannelProviderInterface,
  ChannelMessage,
  IncomingMessage,
} from './channel-provider.interface';

const SLACK_API_BASE = 'https://slack.com/api';

@Injectable()
export class SlackProvider implements ChannelProviderInterface {
  readonly channelType = 'SLACK';
  private readonly logger = new Logger(SlackProvider.name);

  private readonly botToken: string;
  private readonly signingSecret: string;

  constructor(private readonly config: ConfigService) {
    this.botToken = this.config.get<string>('SLACK_BOT_TOKEN', '');
    this.signingSecret = this.config.get<string>('SLACK_SIGNING_SECRET', '');
  }

  async sendMessage(
    channelConfig: Record<string, unknown>,
    recipientId: string,
    content: string,
  ): Promise<ChannelMessage> {
    const token = (channelConfig.botToken as string) || this.botToken;
    const url = `${SLACK_API_BASE}/chat.postMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        channel: recipientId,
        text: content,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Slack send failed (${response.status}): ${errorBody}`);
      throw new Error(`Slack API HTTP error: ${response.status}`);
    }

    const data = (await response.json()) as {
      ok: boolean;
      ts?: string;
      channel?: string;
      error?: string;
    };

    if (!data.ok) {
      this.logger.error(`Slack API error: ${data.error}`);
      throw new Error(`Slack API error: ${data.error}`);
    }

    const messageId = data.ts ?? 'unknown';
    this.logger.log(`Message envoyé via Slack: ${messageId}`);

    return { messageId, status: 'sent' };
  }

  async handleIncoming(payload: unknown): Promise<IncomingMessage> {
    const body = payload as Record<string, unknown>;

    // URL verification challenge
    if (body.type === 'url_verification') {
      return {
        senderId: '_system',
        content: '',
        metadata: { challenge: body.challenge, type: 'url_verification' },
      };
    }

    if (body.type !== 'event_callback') {
      throw new Error(`Unsupported Slack event type: ${body.type}`);
    }

    const event = body.event as Record<string, unknown>;

    if (!event || event.type !== 'message') {
      throw new Error(`Unsupported Slack event.type: ${event?.type}`);
    }

    // Ignore bot messages to prevent loops
    if (event.bot_id || event.subtype === 'bot_message') {
      return {
        senderId: (event.bot_id as string) ?? 'bot',
        content: '',
        metadata: { ignored: true, reason: 'bot_message' },
      };
    }

    return {
      senderId: event.user as string,
      content: (event.text as string) ?? '',
      metadata: {
        messageTs: event.ts,
        channelId: event.channel,
        channelType: event.channel_type,
        teamId: body.team_id,
        threadTs: event.thread_ts,
      },
    };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    if (!signature || !this.signingSecret) {
      return false;
    }

    const body = payload as Record<string, unknown>;
    const timestamp = body._slackTimestamp as string;

    if (!timestamp) {
      return false;
    }

    // Reject requests older than 5 minutes to prevent replay attacks
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - Number(timestamp)) > 300) {
      this.logger.warn('Slack webhook timestamp too old, possible replay attack');
      return false;
    }

    const rawBody =
      typeof body._slackRawBody === 'string'
        ? body._slackRawBody
        : JSON.stringify(payload);

    const sigBasestring = `v0:${timestamp}:${rawBody}`;
    const computed =
      'v0=' +
      createHmac('sha256', this.signingSecret)
        .update(sigBasestring)
        .digest('hex');

    try {
      return timingSafeEqual(
        Buffer.from(computed),
        Buffer.from(signature),
      );
    } catch {
      return false;
    }
  }

  isConfigured(): boolean {
    return !!(this.botToken && this.signingSecret);
  }
}
