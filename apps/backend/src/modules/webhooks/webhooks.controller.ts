import { Controller, Post, Body, Headers, HttpCode, HttpStatus, Logger, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { WebhooksService } from './webhooks.service';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import * as crypto from 'crypto';

// NOTE: The Stripe webhook is consolidated in BillingController at /api/v1/billing/webhook
// Only SendGrid and other non-Stripe webhooks remain here.

export interface SendGridWebhookEvent {
  email: string;
  timestamp: number;
  event: string;
  reason?: string;
  'smtp-id'?: string;
  sg_event_id?: string;
  sg_message_id?: string;
  response?: string;
  attempt?: string;
  useragent?: string;
  ip?: string;
  url?: string;
  category?: string[];
  unique_args?: Record<string, unknown>;
  marketing_campaign_id?: string;
  marketing_campaign_name?: string;
}

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('sendgrid')
  @HttpCode(HttpStatus.OK)
  async handleSendGridWebhook(
    @Body() events: SendGridWebhookEvent[],
    @Headers() headers: Record<string, string>
  ) {
    this.logger.log('Webhook SendGrid received', { eventCount: events.length });

    // Verify SendGrid Event Webhook signature if verification key is configured
    const verificationKey = this.configService.get<string>('SENDGRID_WEBHOOK_VERIFICATION_KEY');
    if (verificationKey) {
      const signature = headers['x-twilio-email-event-webhook-signature'];
      const timestamp = headers['x-twilio-email-event-webhook-timestamp'];

      if (!signature || !timestamp) {
        this.logger.warn('Missing SendGrid webhook signature or timestamp headers');
        throw new UnauthorizedException('Missing webhook signature');
      }

      try {
        // SendGrid uses ECDSA with P-256 curve for webhook signing
        // Payload to verify: timestamp + JSON body
        const payloadToVerify = timestamp + JSON.stringify(events);
        const verify = crypto.createVerify('sha256');
        verify.update(payloadToVerify);
        verify.end();

        const isValid = verify.verify(
          { key: verificationKey, dsaEncoding: 'ieee-p1363' },
          signature,
          'base64',
        );

        if (!isValid) {
          this.logger.warn('Invalid SendGrid webhook signature');
          throw new UnauthorizedException('Invalid webhook signature');
        }
      } catch (error) {
        if (error instanceof UnauthorizedException) throw error;
        this.logger.error('SendGrid webhook signature verification error', error);
        throw new UnauthorizedException('Webhook signature verification failed');
      }
    }

    try {
      const results = [];
      for (const event of events) {
        const result = await this.webhooksService.processSendGridEvent({
          email: event.email,
          event: event.event,
          timestamp: event.timestamp,
          reason: event.reason,
          'smtp-id': event['smtp-id'],
          sg_event_id: event.sg_event_id,
          sg_message_id: event.sg_message_id,
          response: event.response,
          attempt: event.attempt,
          useragent: event.useragent,
          ip: event.ip,
          url: event.url,
          category: event.category,
        });
        results.push(result);
      }

      return {
        status: 'success',
        message: 'Webhook processed',
        events_processed: events.length,
        results,
      };
    } catch (error) {
      this.logger.error('SendGrid webhook processing error:', error);
      throw error;
    }
  }
}