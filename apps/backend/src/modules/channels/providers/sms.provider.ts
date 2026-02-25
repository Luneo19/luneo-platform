import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  ChannelProviderInterface,
  ChannelMessage,
  IncomingMessage,
} from './channel-provider.interface';

const TWILIO_API_BASE = 'https://api.twilio.com';

@Injectable()
export class SmsProvider implements ChannelProviderInterface {
  readonly channelType = 'SMS';
  private readonly logger = new Logger(SmsProvider.name);

  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly phoneNumber: string;

  constructor(private readonly config: ConfigService) {
    this.accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID', '');
    this.authToken = this.config.get<string>('TWILIO_AUTH_TOKEN', '');
    this.phoneNumber = this.config.get<string>('TWILIO_PHONE_NUMBER', '');
  }

  async sendMessage(
    channelConfig: Record<string, unknown>,
    recipientId: string,
    content: string,
  ): Promise<ChannelMessage> {
    const sid = (channelConfig.accountSid as string) || this.accountSid;
    const token = (channelConfig.authToken as string) || this.authToken;
    const from = (channelConfig.phoneNumber as string) || this.phoneNumber;

    const url = `${TWILIO_API_BASE}/2010-04-01/Accounts/${sid}/Messages.json`;
    const credentials = Buffer.from(`${sid}:${token}`).toString('base64');

    const body = new URLSearchParams({
      To: recipientId,
      From: from,
      Body: content,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Twilio send failed (${response.status}): ${errorBody}`);
      throw new Error(`Twilio API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      sid?: string;
      status?: string;
    };

    const messageId = data.sid ?? 'unknown';
    this.logger.log(`SMS envoyé via Twilio: ${messageId}`);

    return { messageId, status: data.status ?? 'queued' };
  }

  async handleIncoming(payload: unknown): Promise<IncomingMessage> {
    const body = payload as Record<string, string>;

    const from = body.From;
    const content = body.Body;

    if (!from) {
      throw new Error('Invalid Twilio webhook payload: missing From');
    }

    return {
      senderId: from,
      content: content ?? '',
      metadata: {
        messageSid: body.MessageSid,
        accountSid: body.AccountSid,
        to: body.To,
        numMedia: body.NumMedia,
        fromCity: body.FromCity,
        fromState: body.FromState,
        fromCountry: body.FromCountry,
      },
    };
  }

  verifyWebhook(payload: unknown, signature?: string): boolean {
    if (!signature || !this.authToken) {
      return false;
    }

    // Twilio signature validation
    // The signature is computed from the full webhook URL + sorted POST params
    const body = payload as Record<string, unknown>;
    const webhookUrl = (body._webhookUrl as string) ?? '';

    const sortedParams = Object.keys(body)
      .filter((k) => k !== '_webhookUrl')
      .sort()
      .reduce((acc, key) => acc + key + String(body[key] ?? ''), '');

    const data = webhookUrl + sortedParams;
    const computed = createHmac('sha1', this.authToken)
      .update(data)
      .digest('base64');

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
    return !!(this.accountSid && this.authToken && this.phoneNumber);
  }
}
