import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WebhookStatus } from '@prisma/client';
import { createHmac, randomUUID } from 'crypto';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { QueuesService, JOB_TYPES } from '@/libs/queues';
import { CurrentUser } from '@/common/types/user.types';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaOptimizedService,
    private readonly queues: QueuesService,
  ) {}

  async listForOrganization(user: CurrentUser) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    return this.prisma.webhook.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createForOrganization(user: CurrentUser, dto: CreateWebhookDto) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    return this.prisma.webhook.create({
      data: {
        organizationId: user.organizationId,
        url: dto.url,
        events: dto.events,
        secret: dto.secret,
        customHeaders: dto.customHeaders as Prisma.InputJsonValue | undefined,
        maxRetries: dto.maxRetries ?? 3,
        status: WebhookStatus.ACTIVE,
      },
    });
  }

  async testWebhook(user: CurrentUser, webhookId: string) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, organizationId: user.organizationId },
    });
    if (!webhook) throw new NotFoundException('Webhook introuvable');

    await this.deliver(webhook.id, {
      event: 'webhook.test',
      payload: {
        ping: 'ok',
        triggeredAt: new Date().toISOString(),
      },
    });

    return { sent: true };
  }

  async dispatchEvent(
    organizationId: string,
    event: string,
    payload: Record<string, unknown>,
  ) {
    const targets = await this.prisma.webhook.findMany({
      where: {
        organizationId,
        status: WebhookStatus.ACTIVE,
        OR: [{ events: { has: event } }, { events: { has: '*' } }],
      },
      select: { id: true },
    });

    for (const target of targets) {
      await this.deliver(target.id, { event, payload });
    }
  }

  async listFailedJobs(user: CurrentUser, limit = 50) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    return this.prisma.failedJob.findMany({
      where: {
        organizationId: user.organizationId,
        queue: 'webhook_delivery',
        resolvedAt: null,
      },
      orderBy: { failedAt: 'desc' },
      take: Math.max(1, Math.min(limit, 200)),
    });
  }

  async replayFailedJob(user: CurrentUser, failedJobId: string) {
    if (!user.organizationId) throw new BadRequestException('Organisation requise');
    const failed = await this.prisma.failedJob.findFirst({
      where: {
        id: failedJobId,
        organizationId: user.organizationId,
        queue: 'webhook_delivery',
      },
    });
    if (!failed) throw new NotFoundException('Failed job introuvable');

    const data = (failed.data as Record<string, unknown> | null) ?? {};
    const webhookId = String(data.webhookId ?? '');
    const event = String(data.event ?? '');
    const payload = (data.payload as Record<string, unknown> | undefined) ?? {};
    if (!webhookId || !event) {
      throw new BadRequestException('Payload failed job invalide');
    }

    await this.deliver(webhookId, { event, payload }, failed.attempts);
    await this.prisma.failedJob.update({
      where: { id: failed.id },
      data: { retriedAt: new Date(), resolvedAt: new Date() },
    });

    return { replayed: true };
  }

  async retryFromDlq(input: {
    failedJobId: string;
    organizationId?: string;
    webhookId: string;
    event: string;
    payload: Record<string, unknown>;
    attempts: number;
  }) {
    await this.deliver(
      input.webhookId,
      { event: input.event, payload: input.payload },
      input.attempts,
      input.failedJobId,
    );
  }

  private async deliver(
    webhookId: string,
    body: { event: string; payload: Record<string, unknown> },
    attempts = 0,
    failedJobId?: string,
  ) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook || webhook.status !== WebhookStatus.ACTIVE) return;

    const startedAt = Date.now();
    const timestamp = new Date().toISOString();
    const signedPayload = JSON.stringify({
      event: body.event,
      timestamp,
      payload: body.payload,
    });
    const signature = createHmac('sha256', webhook.secret)
      .update(signedPayload)
      .digest('hex');

    let statusCode: number | undefined;
    let responseText: string | undefined;
    let errorText: string | undefined;
    let success = false;

    try {
      const customHeaders =
        (webhook.customHeaders as Record<string, string> | null) ?? {};
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-luneo-event': body.event,
          'x-luneo-signature': `sha256=${signature}`,
          'x-luneo-timestamp': timestamp,
          ...customHeaders,
        },
        body: signedPayload,
      });
      statusCode = response.status;
      responseText = await response.text();
      success = response.ok;
      if (!success) {
        errorText = `HTTP ${response.status}`;
      }
    } catch (error) {
      errorText = error instanceof Error ? error.message : String(error);
    }

    const latencyMs = Date.now() - startedAt;

    await this.prisma.webhookLog.create({
      data: {
        webhookId: webhook.id,
        event: body.event,
        payload: body.payload as Prisma.InputJsonValue,
        statusCode,
        response: responseText,
        latencyMs,
        success,
        error: errorText,
        retryCount: attempts,
      },
    });

    await this.prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        lastCalledAt: new Date(),
        lastStatusCode: statusCode,
        lastError: errorText,
        totalCalls: { increment: 1 },
        successfulCalls: success ? { increment: 1 } : undefined,
        consecutiveFailures: success ? 0 : { increment: 1 },
        status:
          !success && attempts + 1 >= webhook.maxRetries
            ? WebhookStatus.FAILED
            : undefined,
      },
    });

    if (success) {
      if (failedJobId) {
        await this.prisma.failedJob.update({
          where: { id: failedJobId },
          data: { resolvedAt: new Date(), retriedAt: new Date() },
        });
      }
      return;
    }

    const failedPayload = {
      webhookId: webhook.id,
      event: body.event,
      payload: body.payload,
      attempts: attempts + 1,
      reason: errorText,
    };

    const failedRecord = await this.prisma.failedJob.create({
      data: {
        organizationId: webhook.organizationId,
        queue: 'webhook_delivery',
        jobId: randomUUID(),
        data: failedPayload as Prisma.InputJsonValue,
        error: errorText ?? 'unknown',
        attempts: attempts + 1,
      },
    });

    if (attempts + 1 <= webhook.maxRetries) {
      await this.queues.addDLQJob(
        JOB_TYPES.DLQ.RETRY_FAILED,
        {
          queueType: 'webhook_delivery',
          failedJobId: failedRecord.id,
          organizationId: webhook.organizationId,
          webhookId: webhook.id,
          event: body.event,
          payload: body.payload,
          attempts: attempts + 1,
        },
        {
          attempts: 1,
          delay: Math.min(120_000, Math.pow(2, attempts + 1) * 1000),
          jobId: `webhook-retry:${failedRecord.id}:${attempts + 1}`,
        },
      );
    }

    this.logger.warn(
      `Webhook delivery failed webhook=${webhook.id} event=${body.event} attempt=${attempts + 1} error=${errorText}`,
    );
  }
}
