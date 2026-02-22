// @ts-nocheck
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job } from 'bullmq';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { OutboxService } from './outbox.service';
import { WebhookEvent } from '@prisma/client';

/**
 * Worker qui publie les événements de l'outbox
 * 
 * Options de publication:
 * 1. EventEmitter (local, pour compatibilité)
 * 2. Webhooks (vers URLs configurées)
 * 3. Kafka/NATS (futur)
 */
@Processor('outbox-publisher')
export class OutboxPublisherWorker {
  private readonly logger = new Logger(OutboxPublisherWorker.name);

  constructor(
    private readonly outboxService: OutboxService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  @Process('publish-events')
  async publishEvents(_job: Job) {
    this.logger.debug('Processing outbox events...');

    const events = await this.outboxService.getPendingEvents(100);

    if (events.length === 0) {
      this.logger.debug('No pending events to publish');
      return { processed: 0 };
    }

    let successCount = 0;
    let failCount = 0;

    for (const event of events) {
      try {
        // Option 1: Publier via EventEmitter (pour compatibilité)
        this.eventEmitter.emit(event.eventType, event.payload);

        // Option 2: Publier via webhooks (si configuré)
        await this.publishToWebhooks(event);

        // Option 3: Publier via Kafka/NATS (futur)
        // await this.publishToMessageQueue(event);

        await this.outboxService.markAsPublished(event.id);
        successCount++;

        this.logger.debug(`Published event: ${event.eventType} (${event.id})`);
      } catch (error) {
        this.logger.error(`Failed to publish event ${event.id}:`, error);

        // Si trop de tentatives, marquer comme échoué définitivement
        if (event.attempts >= 5) {
          await this.outboxService.markAsFailed(event.id, error.message);
          failCount++;
        } else {
          // Sinon, réessayer plus tard
          await this.outboxService.retry(event.id);
        }
      }
    }

    this.logger.log(
      `Outbox processing complete: ${successCount} published, ${failCount} failed`,
    );

    return {
      processed: events.length,
      success: successCount,
      failed: failCount,
    };
  }

  /**
   * Publie un événement vers les webhooks brand-specific configurés pour ce type d'événement
   */
  private async publishToWebhooks(event: { eventType: string; payload: unknown }): Promise<void> {
    const eventEnum = this.toWebhookEventEnum(event.eventType);
    if (!eventEnum) return;

    const webhooks = await this.prisma.webhook.findMany({
      where: {
        isActive: true,
        events: { has: eventEnum },
      },
      select: { id: true, url: true, secret: true },
    });

    for (const webhook of webhooks) {
      try {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: event.eventType,
            payload: event.payload,
            timestamp: new Date().toISOString(),
          }),
        });
        if (!res.ok) {
          this.logger.warn(`Webhook ${webhook.id} returned ${res.status}`);
        }
      } catch (err) {
        this.logger.warn(`Webhook ${webhook.id} failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }
  }

  private toWebhookEventEnum(eventType: string): WebhookEvent | null {
    const normalized = eventType.toUpperCase().replace(/\./g, '_');
    if (Object.values(WebhookEvent).includes(normalized as WebhookEvent)) {
      return normalized as WebhookEvent;
    }
    return null;
  }
}

































