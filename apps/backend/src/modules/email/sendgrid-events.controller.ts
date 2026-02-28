import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { verify } from 'crypto';
import { Throttle } from '@nestjs/throttler';

type SendGridEvent = Record<string, unknown>;

@ApiTags('Email')
@Controller('webhooks/sendgrid')
export class SendGridEventsController {
  private readonly logger = new Logger(SendGridEventsController.name);
  private static readonly SENDGRID_EVENTS_KEY = 'admin:email:sendgrid:events';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('events')
  @Throttle({ default: { limit: 300, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive SendGrid Event Webhook events' })
  async ingestEvents(
    @Req() req: Request & { body?: Buffer | unknown },
    @Body() body: unknown,
    @Headers('x-twilio-email-event-webhook-signature') signatureHeader?: string,
    @Headers('x-twilio-email-event-webhook-timestamp') timestampHeader?: string,
  ) {
    this.verifySendGridSignature(req, signatureHeader, timestampHeader);

    let parsedBody: unknown = body;
    if (Buffer.isBuffer(body)) {
      try {
        parsedBody = JSON.parse(body.toString('utf8'));
      } catch {
        throw new BadRequestException('Invalid JSON payload for SendGrid events');
      }
    }
    const events = Array.isArray(parsedBody) ? parsedBody : [parsedBody];
    const now = new Date().toISOString();

    const normalized = events.map((event) => {
      const payload = (event ?? {}) as SendGridEvent;
      const eventName = String(payload.event || 'unknown');
      const email = String(payload.email || '');
      return {
        id: String(payload.sg_event_id || payload.sg_message_id || `${eventName}:${email}:${Date.now()}`),
        channel: 'email',
        type: eventName,
        status: ['bounce', 'dropped', 'spamreport'].includes(eventName) ? 'failed' : 'sent',
        subject: payload.subject ? String(payload.subject) : null,
        target: email || 'unknown',
        trackingId: payload.sg_message_id ? String(payload.sg_message_id) : null,
        createdAt: payload.timestamp ? new Date(Number(payload.timestamp) * 1000).toISOString() : now,
        payload,
      };
    });

    const currentFlag = await this.prisma.featureFlag.findUnique({
      where: { key: SendGridEventsController.SENDGRID_EVENTS_KEY },
      select: { rules: true },
    });
    const currentRules = (currentFlag?.rules as Record<string, unknown> | null) ?? {};
    const currentItems = Array.isArray(currentRules.items) ? (currentRules.items as Record<string, unknown>[]) : [];
    const merged = [...normalized, ...currentItems].slice(0, 1000);

    await this.prisma.featureFlag.upsert({
      where: { key: SendGridEventsController.SENDGRID_EVENTS_KEY },
      create: {
        key: SendGridEventsController.SENDGRID_EVENTS_KEY,
        name: 'SendGrid delivery events',
        description: 'Latest SendGrid event webhook payloads for admin observability',
        enabled: true,
        rules: { items: merged } as Prisma.InputJsonValue,
      },
      update: {
        enabled: true,
        rules: { items: merged } as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Stored ${normalized.length} SendGrid webhook events`);
    return { received: true, count: normalized.length };
  }

  private verifySendGridSignature(
    req: Request & { body?: Buffer | unknown },
    signatureHeader?: string,
    timestampHeader?: string,
  ): void {
    const publicKey = this.configService
      .get<string>('emailDomain.sendgridWebhookPublicKey')
      ?.trim();
    if (!publicKey) {
      return;
    }

    if (!signatureHeader || !timestampHeader) {
      throw new UnauthorizedException('Missing SendGrid signature headers');
    }

    const rawBody = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(JSON.stringify(req.body ?? {}), 'utf8');
    const payload = Buffer.concat([Buffer.from(timestampHeader, 'utf8'), rawBody]);
    const signature = Buffer.from(signatureHeader, 'base64');

    const pem = publicKey.includes('BEGIN PUBLIC KEY')
      ? publicKey
      : `-----BEGIN PUBLIC KEY-----\n${publicKey}\n-----END PUBLIC KEY-----`;
    const valid = verify(null, payload, pem, signature);
    if (!valid) {
      throw new UnauthorizedException('Invalid SendGrid webhook signature');
    }
  }
}
