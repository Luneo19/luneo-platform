import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PCE_QUEUES, PCE_EVENTS } from '../pce.constants';

interface WebhookJobPayload {
  webhookDeliveryId: string;
  webhookId: string;
  eventType: string;
  payload: Record<string, unknown>;
  platform?: string;
}

@Processor(PCE_QUEUES.WEBHOOKS)
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<WebhookJobPayload>): Promise<void> {
    const { name, data } = job;
    this.logger.log(`Processing webhook job: ${name} delivery=${data.webhookDeliveryId}`);

    try {
      this.eventEmitter.emit(PCE_EVENTS.WEBHOOK_RECEIVED, {
        webhookDeliveryId: data.webhookDeliveryId,
        eventType: data.eventType,
        platform: data.platform,
      });

      const platform = data.platform ?? 'unknown';
      const routed = await this.routeByPlatform(platform, data);

      await this.prisma.webhookDelivery.update({
        where: { id: data.webhookDeliveryId },
        data: {
          status: routed.success ? 'processed' : 'failed',
          responseCode: routed.statusCode,
          responseBody: routed.responseBody ?? undefined,
          lastAttemptAt: new Date(),
          attempts: { increment: 1 },
        },
      });

      if (routed.success) {
        this.eventEmitter.emit(PCE_EVENTS.WEBHOOK_PROCESSED, {
          webhookDeliveryId: data.webhookDeliveryId,
          eventType: data.eventType,
        });
      } else {
        this.eventEmitter.emit(PCE_EVENTS.WEBHOOK_FAILED, {
          webhookDeliveryId: data.webhookDeliveryId,
          eventType: data.eventType,
          error: routed.error,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook job failed: ${data.webhookDeliveryId} - ${message}`);
      try {
        await this.prisma.webhookDelivery.update({
          where: { id: data.webhookDeliveryId },
          data: {
            status: 'failed',
            responseBody: message,
            lastAttemptAt: new Date(),
            attempts: { increment: 1 },
          },
        });
      } catch {
        // ignore update errors
      }
      this.eventEmitter.emit(PCE_EVENTS.WEBHOOK_FAILED, {
        webhookDeliveryId: data.webhookDeliveryId,
        eventType: data.eventType,
        error: message,
      });
    }
  }

  private async routeByPlatform(
    platform: string,
    data: WebhookJobPayload,
  ): Promise<{ success: boolean; statusCode?: number; responseBody?: string; error?: string }> {
    switch (platform.toLowerCase()) {
      case 'shopify':
      case 'woocommerce':
      case 'magento':
        this.logger.debug(`Routing webhook ${data.eventType} to ${platform} handler`);
        return { success: true, statusCode: 200, responseBody: 'OK' };
      default:
        return { success: true, statusCode: 200, responseBody: 'OK' };
    }
  }
}
